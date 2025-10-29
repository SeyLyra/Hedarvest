// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../interfaces/HederaTokenService.sol";
import "../interfaces/IHederaTokenService.sol";
import "../interfaces/HederaResponseCode.sol";
import "./InterestRateModel.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

abstract contract ReentrancyGuard {
    uint256 private _entered;
    modifier nonReentrant() {
        require(_entered == 0, "REENTRANCY");
        _entered = 1;
        _;
        _entered = 0;
    }
}

interface IPriceOracle {
    function getPrice(address token) external view returns (uint256 price, uint8 decimals);
}

contract LendingPool is HederaTokenService, ReentrancyGuard, Ownable {
    address public immutable underlyingToken; // HTS
    address public immutable collateralToken; // HTS

    mapping(address => uint256) public userCollateral;
    mapping(address => uint256) public userLPShares;    // LP shares (instead of LP tokens)
    mapping(address => uint256) public userDebtShares;  // Debt shares

    IPriceOracle public priceOracle;
    uint256 public loanToValue;            // e.g., 0.75e18
    uint256 public liquidationThreshold;   // e.g., 0.80e18
    uint256 public liquidationBonus;       // e.g., 0.05e18
    uint256 public closeFactor = 5e17;     // 50% cap per liquidation

    bool public paused;                    // Emergency pause flag

    uint256 public totalCash;
    uint256 public totalBorrowed;
    uint256 public totalReserves;

    uint256 public borrowIndex = 1e27;
    uint256 public liquidityIndex = 1e27;
    InterestRateModel public immutable interestRateModel;
    uint256 public reserveFactor;
    uint256 public lastInterestAccrualTime;

    uint256 public totalLPShares;  // Total LP shares issued

    // Token decimals (cached from HTS)
    uint8 public underlyingTokenDecimals;
    uint8 public collateralTokenDecimals;

    event Deposited(address indexed user, uint256 amount, uint256 sharesMinted);
    event Withdrawn(address indexed user, uint256 amount, uint256 sharesBurned);
    event Borrowed(address indexed user, uint256 amount, uint256 debtSharesMinted);
    event Repaid(address indexed user, uint256 amount, uint256 debtSharesBurned);
    event CollateralDeposited(address indexed user, uint256 amount);
    event CollateralWithdrawn(address indexed user, uint256 amount);
    event InterestAccrued(uint256 borrowIndexNew, uint256 liquidityIndexNew, uint256 timestamp);
    event Liquidated(address indexed borrower, address indexed liquidator, uint256 debtRepaid, uint256 collateralSeized);
    event Paused();
    event Unpaused();
    event PriceOracleUpdated(address indexed oldOracle, address indexed newOracle);
    event LoanToValueUpdated(uint256 oldLTV, uint256 newLTV);
    event CloseFactorUpdated(uint256 oldCloseFactor, uint256 newCloseFactor);

    constructor(
        address _underlyingToken,
        address _collateralToken,
        address _interestRateModel,
        uint256 _reserveFactor,
        address _priceOracle,
        uint256 _loanToValue,
        uint256 _liquidationThreshold,
        uint256 _liquidationBonus,
        address initialOwner
    ) {
        require(_underlyingToken != address(0), "UNDERLYING_ZERO");
        require(_collateralToken != address(0), "COLLATERAL_ZERO");
        require(_reserveFactor <= 5e17, "RESERVE_TOO_HIGH");
        require(_loanToValue <= 1e18, "INVALID_LTV");
        require(_liquidationThreshold > _loanToValue && _liquidationThreshold <= 1e18, "INVALID_LIQ_THRESHOLD");
        require(_liquidationBonus <= 2e17, "INVALID_LIQ_BONUS");

        underlyingToken = _underlyingToken;
        collateralToken = _collateralToken;
        interestRateModel = InterestRateModel(_interestRateModel);
        reserveFactor = _reserveFactor;
        priceOracle = IPriceOracle(_priceOracle);
        loanToValue = _loanToValue;
        liquidationThreshold = _liquidationThreshold;
        liquidationBonus = _liquidationBonus;
        lastInterestAccrualTime = block.timestamp;

        _transferOwnership(initialOwner);
    }

    modifier whenNotPaused() {
        require(!paused, "POOL_PAUSED");
        _;
    }

    function pause() external onlyOwner {
        require(!paused, "ALREADY_PAUSED");
        paused = true;
        emit Paused();
    }

    function unpause() external onlyOwner {
        require(paused, "NOT_PAUSED");
        paused = false;
        emit Unpaused();
    }

    function updateCloseFactor(uint256 newCloseFactor) external onlyOwner {
        require(newCloseFactor <= 1e18, "INVALID_CLOSE_FACTOR");
        uint256 oldCloseFactor = closeFactor;
        closeFactor = newCloseFactor;
        emit CloseFactorUpdated(oldCloseFactor, newCloseFactor);
    }

    // Initialize pool by associating with HTS tokens and fetching token decimals
    function initialize() external onlyOwner {
        // Self-associate pool with underlying and collateral tokens
        address[] memory tokensToAssociate = new address[](2);
        tokensToAssociate[0] = underlyingToken;
        tokensToAssociate[1] = collateralToken;

        int256 assocRes = HederaTokenService.associateTokens(address(this), tokensToAssociate);
        require(
            assocRes == HederaResponseCodes.SUCCESS || assocRes == HederaResponseCodes.TOKEN_ALREADY_ASSOCIATED_TO_ACCOUNT,
            "POOL_ASSOCIATION_FAILED"
        );

        // Fetch and cache token decimals
        int256 responseCode;
        IHederaTokenService.FungibleTokenInfo memory tokenInfo;

        (responseCode, tokenInfo) = HederaTokenService.getFungibleTokenInfo(underlyingToken);
        require(responseCode == HederaResponseCodes.SUCCESS, "UNDERLYING_TOKEN_INFO_FAILED");
        underlyingTokenDecimals = uint8(uint32(tokenInfo.decimals));

        (responseCode, tokenInfo) = HederaTokenService.getFungibleTokenInfo(collateralToken);
        require(responseCode == HederaResponseCodes.SUCCESS, "COLLATERAL_TOKEN_INFO_FAILED");
        collateralTokenDecimals = uint8(uint32(tokenInfo.decimals));
    }

    // Users must call this before interacting with the pool
    function associateTokens() external {
        address user = msg.sender;
        address[] memory tokens = new address[](2);
        tokens[0] = underlyingToken;
        tokens[1] = collateralToken;
        int256 rc = HederaTokenService.associateTokens(user, tokens);
        require(
            rc == HederaResponseCodes.SUCCESS || rc == HederaResponseCodes.TOKEN_ALREADY_ASSOCIATED_TO_ACCOUNT,
            "USER_ASSOCIATION_FAILED"
        );
    }

    function _ensureSelfAssociated(address token) internal {
        int256 rc = HederaTokenService.associateToken(address(this), token);
        if (rc != HederaResponseCodes.SUCCESS && rc != HederaResponseCodes.TOKEN_ALREADY_ASSOCIATED_TO_ACCOUNT) {
            revert(string(abi.encodePacked("POOL_SELF_ASSOCIATION_FAIL: code ", Strings.toString(uint256(rc)))));
        }
    }

    // Deposit collateral tokens
    // FOR HTS TOKENS: User must transfer collateral to this contract FIRST via Hedera SDK,
    // then call this function to credit collateral
    function depositCollateral(uint256 amount) external nonReentrant whenNotPaused {
        require(amount > 0, "DEPOSIT_ZERO");
        _ensureSelfAssociated(collateralToken);
        accrueInterest();

        // Update user's collateral balance
        userCollateral[msg.sender] += amount;
        emit CollateralDeposited(msg.sender, amount);
    }

    function withdrawCollateral(uint256 amount) external nonReentrant {
        require(amount > 0, "WITHDRAW_ZERO");
        require(userCollateral[msg.sender] >= amount, "INSUFFICIENT_COLLATERAL");
        accrueInterest();

        userCollateral[msg.sender] -= amount;
        require(getHealthFactor(msg.sender) >= 1e18, "UNDER_COLLATERALIZED");
        _ensureSelfAssociated(collateralToken);

        int256 sendResult = HederaTokenService.transferToken(collateralToken, address(this), msg.sender, toInt64(amount));
        require(sendResult == HederaResponseCodes.SUCCESS, "COLLATERAL_SEND_FAILED");
        emit CollateralWithdrawn(msg.sender, amount);
    }

    function getCollateralValue(address user) public view returns (uint256) {
        (uint256 price, uint8 priceDecimals) = priceOracle.getPrice(collateralToken);
        uint256 collateralAmount = userCollateral[user];

        // Calculate value with proper decimal normalization
        // collateralAmount is in token decimals (e.g., 8 for WHEAT)
        // price is in price decimals (e.g., 8 from oracle)
        // We want result in 18 decimals
        // Formula: (amount * price * 1e18) / (10^(tokenDecimals + priceDecimals))
        return (collateralAmount * price * 1e18) / (10 ** (collateralTokenDecimals + priceDecimals));
    }

    function getBorrowValue(address user) public view returns (uint256) {
        return (userDebtShares[user] * borrowIndex) / 1e27;
    }

    // View function that includes pending interest accrual
    function getBorrowValueWithAccrual(address user) public view returns (uint256) {
        uint256 currentBorrowIndex = borrowIndex;

        // Simulate interest accrual
        uint256 nowTimestamp = block.timestamp;
        if (nowTimestamp > lastInterestAccrualTime) {
            uint256 timeElapsed = nowTimestamp - lastInterestAccrualTime;
            uint256 utilization = utilizationRate();
            uint256 borrowRate = interestRateModel.getBorrowRatePerSecond(utilization);
            uint256 borrowFactor = 1e27 + (borrowRate * timeElapsed * 1e27) / 1e18;
            currentBorrowIndex = (currentBorrowIndex * borrowFactor) / 1e27;
        }

        return (userDebtShares[user] * currentBorrowIndex) / 1e27;
    }

    function getHealthFactor(address user) public view returns (uint256) {
        uint256 borrowValue = getBorrowValue(user);
        if (borrowValue == 0) return 1e27; // Return very high but finite value
        uint256 collateralValue = getCollateralValue(user);
        return (collateralValue * liquidationThreshold) / borrowValue;
    }

    // Health factor that includes pending interest
    function getHealthFactorWithAccrual(address user) public view returns (uint256) {
        uint256 borrowValue = getBorrowValueWithAccrual(user);
        if (borrowValue == 0) return 1e27;
        uint256 collateralValue = getCollateralValue(user);
        return (collateralValue * liquidationThreshold) / borrowValue;
    }

    function utilizationRate() public view returns (uint256) {
        uint256 totalFunds = totalCash + totalBorrowed;
        if (totalFunds == 0) return 0;
        return (totalBorrowed * 1e18) / totalFunds;
    }

    function totalAssets() public view returns (uint256) {
        uint256 total = totalCash + totalBorrowed;
        // Protect against underflow if reserves somehow exceed total
        if (totalReserves > total) return 0;
        return total - totalReserves;
    }

    function accrueInterest() public {
        uint256 nowTimestamp = block.timestamp;
        if (nowTimestamp == lastInterestAccrualTime) return;

        uint256 timeElapsed = nowTimestamp - lastInterestAccrualTime;
        uint256 utilization = utilizationRate();
        uint256 borrowRate = interestRateModel.getBorrowRatePerSecond(utilization);

        uint256 interestAccrued = (totalBorrowed * borrowRate * timeElapsed) / 1e18;
        if (interestAccrued > 0) {
            uint256 reservePortion = (interestAccrued * reserveFactor) / 1e18;
            totalReserves += reservePortion;
            totalBorrowed += (interestAccrued - reservePortion);

            uint256 borrowFactor = 1e27 + (borrowRate * timeElapsed * 1e27) / 1e18;
            borrowIndex = (borrowIndex * borrowFactor) / 1e27;

            uint256 supplyRate = (borrowRate * utilization * (1e18 - reserveFactor)) / 1e36;
            uint256 liquidityFactor = 1e27 + (supplyRate * timeElapsed * 1e27) / 1e18;
            liquidityIndex = (liquidityIndex * liquidityFactor) / 1e27;
        }

        lastInterestAccrualTime = nowTimestamp;
        emit InterestAccrued(borrowIndex, liquidityIndex, nowTimestamp);
    }

    // Deposit underlying tokens and receive LP shares
    // FOR HTS TOKENS: User must transfer tokens to this contract FIRST via Hedera SDK,
    // then call this function to credit LP shares
    // The amount should match what the user transferred
    function deposit(uint256 amount) external nonReentrant whenNotPaused {
        require(amount > 0, "DEPOSIT_ZERO");
        _ensureSelfAssociated(underlyingToken);
        accrueInterest();

        // Update totalCash to reflect the deposit
        // NOTE: We trust the user sent the tokens via Hedera SDK before calling this
        // In production, you might want to check actual token balance vs totalCash
        totalCash += amount;

        // Calculate shares to mint using total LP shares and pool assets
        uint256 totalPoolAssets = totalAssets();
        uint256 sharesToMint = (totalLPShares == 0 || totalPoolAssets == 0) ? amount : (amount * totalLPShares) / totalPoolAssets;

        // Update user's LP shares
        userLPShares[msg.sender] += sharesToMint;
        totalLPShares += sharesToMint;

        emit Deposited(msg.sender, amount, sharesToMint);
    }

    // Withdraw underlying tokens by burning LP shares
    function withdraw(uint256 shares) external nonReentrant whenNotPaused {
        require(shares > 0, "WITHDRAW_ZERO");
        require(userLPShares[msg.sender] >= shares, "INSUFFICIENT_LP_SHARES");
        _ensureSelfAssociated(underlyingToken);
        accrueInterest();

        uint256 underlyingToSend = (shares * totalAssets()) / totalLPShares;
        require(underlyingToSend <= totalCash, "INSUFFICIENT_POOL_LIQUIDITY");

        // Burn user's LP shares (just update mapping!)
        userLPShares[msg.sender] -= shares;
        totalLPShares -= shares;

        // Send underlying tokens
        int256 underlyingSendStatus = HederaTokenService.transferToken(underlyingToken, address(this), msg.sender, toInt64(underlyingToSend));
        require(underlyingSendStatus == HederaResponseCodes.SUCCESS, "UNDERLYING_TRANSFER_FAILED");

        totalCash -= underlyingToSend;
        emit Withdrawn(msg.sender, underlyingToSend, shares);
    }

    function borrow(uint256 amount) external nonReentrant whenNotPaused {
        require(amount > 0, "BORROW_ZERO");
        _ensureSelfAssociated(underlyingToken);
        accrueInterest();

        require(userCollateral[msg.sender] > 0, "NO_COLLATERAL_DEPOSITED");
        require(totalCash >= amount, "INSUFFICIENT_CASH");

        // Cache storage reads
        uint256 currentDebtShares = userDebtShares[msg.sender];
        uint256 currentBorrowIndex = borrowIndex;

        uint256 newBorrowValue = (currentDebtShares * currentBorrowIndex) / 1e27 + amount;
        uint256 maxBorrow = (getCollateralValue(msg.sender) * loanToValue) / 1e18;
        require(newBorrowValue <= maxBorrow, "EXCEEDS_LTV");

        uint256 debtSharesToMint = (amount * 1e27) / currentBorrowIndex;

        // Update user's debt shares (no token minting needed!)
        userDebtShares[msg.sender] = currentDebtShares + debtSharesToMint;
        totalBorrowed += amount;
        totalCash -= amount;

        // Send underlying tokens to borrower
        int256 underlyingSendStatus = HederaTokenService.transferToken(underlyingToken, address(this), msg.sender, toInt64(amount));
        require(underlyingSendStatus == HederaResponseCodes.SUCCESS, "UNDERLYING_SEND_FAILED");

        require(getHealthFactor(msg.sender) >= 1e18, "UNDER_COLLATERALIZED_AFTER_BORROW");
        emit Borrowed(msg.sender, amount, debtSharesToMint);
    }

    // Repay borrowed tokens
    // FOR HTS TOKENS: User must transfer repayment to this contract FIRST via Hedera SDK,
    // then call this function to reduce debt
    function repay(uint256 amount) external nonReentrant whenNotPaused {
        require(amount > 0, "REPAY_ZERO");
        _ensureSelfAssociated(underlyingToken);
        accrueInterest();

        // Cache storage reads
        uint256 debtShares = userDebtShares[msg.sender];
        require(debtShares > 0, "NO_DEBT_BALANCE");

        uint256 currentBorrowIndex = borrowIndex;
        uint256 debtOwed = (debtShares * currentBorrowIndex) / 1e27;
        uint256 repayAmountActual = amount > debtOwed ? debtOwed : amount;

        // Update pool state
        // NOTE: User should have transferred repayment to pool via Hedera SDK first
        totalCash += repayAmountActual;
        totalBorrowed -= repayAmountActual;

        uint256 sharesToBurn = (repayAmountActual * 1e27) / currentBorrowIndex;
        if (sharesToBurn > debtShares) sharesToBurn = debtShares;

        // Burn user's debt shares
        userDebtShares[msg.sender] = debtShares - sharesToBurn;
        emit Repaid(msg.sender, repayAmountActual, sharesToBurn);
    }

    function liquidate(address borrower, uint256 repayAmount) external nonReentrant {
        require(borrower != msg.sender, "CANNOT_LIQUIDATE_SELF");
        _ensureSelfAssociated(underlyingToken);
        _ensureSelfAssociated(collateralToken);
        accrueInterest();

        uint256 healthFactor = getHealthFactor(borrower);
        require(healthFactor < 1e18, "BORROWER_HEALTHY");

        uint256 debtOwed = getBorrowValue(borrower);
        // Apply close factor first, then cap at actual debt
        uint256 maxRepay = (debtOwed * closeFactor) / 1e18;
        uint256 repayActual = repayAmount > maxRepay ? maxRepay : repayAmount;
        repayActual = repayActual > debtOwed ? debtOwed : repayActual;

        // NOTE: Liquidator should have transferred repayment to pool via Hedera SDK first

        uint256 sharesToBurn = (repayActual * 1e27) / borrowIndex;
        uint256 borrowerDebtShares = userDebtShares[borrower];
        if (sharesToBurn > borrowerDebtShares) sharesToBurn = borrowerDebtShares;

        // Burn borrower's debt shares (just update mapping!)
        userDebtShares[borrower] -= sharesToBurn;
        totalBorrowed -= repayActual;
        totalCash += repayActual;

        (uint256 collateralPrice, uint8 collateralDecimals) = priceOracle.getPrice(collateralToken);
        (uint256 underlyingPrice, uint8 underlyingDecimals) = priceOracle.getPrice(underlyingToken);

        // Calculate with normalized precision to prevent loss
        // repayActual is in underlying token decimals
        // Convert to USD value (1e18), add bonus, then convert to collateral amount
        uint256 repayValueUSD = (repayActual * underlyingPrice * 1e18) / (10 ** underlyingDecimals);
        uint256 collateralValueToSeize = (repayValueUSD * (1e18 + liquidationBonus)) / 1e18;
        uint256 collateralToSeize = (collateralValueToSeize * (10 ** collateralDecimals)) / (collateralPrice * 1e18);

        uint256 borrowerCollateral = userCollateral[borrower];
        if (collateralToSeize > borrowerCollateral) collateralToSeize = borrowerCollateral;

        userCollateral[borrower] -= collateralToSeize;

        int256 collateralSendStatus = HederaTokenService.transferToken(collateralToken, address(this), msg.sender, toInt64(collateralToSeize));
        require(collateralSendStatus == HederaResponseCodes.SUCCESS, "COLLATERAL_SEND_FAILED");

        emit Liquidated(borrower, msg.sender, repayActual, collateralToSeize);
    }

    function toInt64(uint256 value) internal pure returns (int64) {
        require(value <= uint256(uint64(type(int64).max)), "VALUE_EXCEEDS_INT64");
        return int64(int256(value));
    }

    function updatePriceOracle(address newOracle) external onlyOwner {
        require(newOracle != address(0), "INVALID_ORACLE");
        address oldOracle = address(priceOracle);
        priceOracle = IPriceOracle(newOracle);
        emit PriceOracleUpdated(oldOracle, newOracle);
    }

    function updateLoanToValue(uint256 newLTV) external onlyOwner {
        require(newLTV <= 1e18, "INVALID_LTV");
        uint256 oldLTV = loanToValue;
        loanToValue = newLTV;
        emit LoanToValueUpdated(oldLTV, newLTV);
    }

    struct PoolDetails {
        address underlyingToken;
        address collateralToken;
        uint256 totalCash;
        uint256 totalBorrowed;
        uint256 totalReserves;
        uint256 totalLPShares;
        uint256 borrowIndex;
        uint256 liquidityIndex;
        uint256 utilization;
        uint256 borrowRate;
        uint256 loanToValue;
        uint256 liquidationThreshold;
        uint256 liquidationBonus;
    }

    function getPoolDetails() external view returns (PoolDetails memory) {
        return PoolDetails({
            underlyingToken: underlyingToken,
            collateralToken: collateralToken,
            totalCash: totalCash,
            totalBorrowed: totalBorrowed,
            totalReserves: totalReserves,
            totalLPShares: totalLPShares,
            borrowIndex: borrowIndex,
            liquidityIndex: liquidityIndex,
            utilization: utilizationRate(),
            borrowRate: interestRateModel.getBorrowRatePerSecond(utilizationRate()),
            loanToValue: loanToValue,
            liquidationThreshold: liquidationThreshold,
            liquidationBonus: liquidationBonus
        });
    }

    function getBorrowAPR() external view returns (uint256) {
        uint256 utilization = utilizationRate();
        uint256 borrowRatePerSecond = interestRateModel.getBorrowRatePerSecond(utilization);
        return (borrowRatePerSecond * 365 * 24 * 3600) / 1e18;
    }

    function getSupplyAPR() external view returns (uint256) {
        uint256 utilization = utilizationRate();
        uint256 borrowRatePerSecond = interestRateModel.getBorrowRatePerSecond(utilization);
        uint256 supplyRatePerSecond = (borrowRatePerSecond * utilization * (1e18 - reserveFactor)) / 1e36;
        return (supplyRatePerSecond * 365 * 24 * 3600) / 1e18;
    }
}