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
    address public lpToken;   // HTS LP token
    address public debtToken; // HTS Debt token (wipe-enabled)

    mapping(address => uint256) public userCollateral;
    IPriceOracle public priceOracle;
    uint256 public loanToValue;            // e.g., 0.75e18
    uint256 public liquidationThreshold;   // e.g., 0.80e18
    uint256 public liquidationBonus;       // e.g., 0.05e18
    uint256 public closeFactor = 5e17;     // 50% cap per liquidation

    uint256 public totalCash;
    uint256 public totalBorrowed;
    uint256 public totalReserves;

    uint256 public borrowIndex = 1e27;
    uint256 public liquidityIndex = 1e27;
    InterestRateModel public immutable interestRateModel;
    uint256 public reserveFactor;
    uint256 public lastInterestAccrualTime;

    uint256 public lpVirtualSupply;
    mapping(address => uint256) public userDebtShares;

    event TokensInitialized(address lpTokenAddress, address debtTokenAddress);
    event Deposited(address indexed user, uint256 amount, uint256 sharesMinted);
    event Withdrawn(address indexed user, uint256 amount, uint256 sharesBurned);
    event Borrowed(address indexed user, uint256 amount, uint256 debtSharesMinted);
    event Repaid(address indexed user, uint256 amount, uint256 debtSharesBurned);
    event CollateralDeposited(address indexed user, uint256 amount);
    event CollateralWithdrawn(address indexed user, uint256 amount);
    event InterestAccrued(uint256 borrowIndexNew, uint256 liquidityIndexNew, uint256 timestamp);
    event Liquidated(address indexed borrower, address indexed liquidator, uint256 debtRepaid, uint256 collateralSeized);

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

    function updateCloseFactor(uint256 newCloseFactor) external onlyOwner {
        require(newCloseFactor <= 1e18, "INVALID_CLOSE_FACTOR");
        closeFactor = newCloseFactor;
    }

    function initializeTokens(
        address _lpToken,
        address _debtToken
    ) external onlyOwner {
        require(lpToken == address(0) && debtToken == address(0), "TOKENS_ALREADY_INITIALIZED");
        require(_lpToken != address(0), "INVALID_LP_TOKEN");
        require(_debtToken != address(0), "INVALID_DEBT_TOKEN");

        lpToken = _lpToken;
        debtToken = _debtToken;

        // Self-associate pool to all tokens
        address[] memory tokensToAssociate = new address[](4);
        tokensToAssociate[0] = underlyingToken;
        tokensToAssociate[1] = collateralToken;
        tokensToAssociate[2] = lpToken;
        tokensToAssociate[3] = debtToken;

        int256 assocRes = HederaTokenService.associateTokens(address(this), tokensToAssociate);
        require(
            assocRes == HederaResponseCodes.SUCCESS || assocRes == HederaResponseCodes.TOKEN_ALREADY_ASSOCIATED_TO_ACCOUNT,
            "POOL_ASSOCIATION_FAILED"
        );

        emit TokensInitialized(lpToken, debtToken);
    }

    function associateAllForUser() external {
        address user = msg.sender;
        address[] memory tokens = new address[](4);
        tokens[0] = underlyingToken;
        tokens[1] = collateralToken;
        tokens[2] = lpToken;
        tokens[3] = debtToken;
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

    function depositCollateral(uint256 amount) external nonReentrant {
        require(amount > 0, "DEPOSIT_ZERO");
        _ensureSelfAssociated(collateralToken);
        accrueInterest();
        int256 transferStatus = HederaTokenService.transferToken(collateralToken, msg.sender, address(this), toInt64(amount));
        require(transferStatus == HederaResponseCodes.SUCCESS, "COLLATERAL_TRANSFER_FAILED");
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
        (uint256 price, uint8 decimals) = priceOracle.getPrice(collateralToken);
        uint256 collateralAmount = userCollateral[user];
        return (collateralAmount * price) / (10 ** decimals);
    }

    function getBorrowValue(address user) public view returns (uint256) {
        return (userDebtShares[user] * borrowIndex) / 1e27;
    }

    function getHealthFactor(address user) public view returns (uint256) {
        uint256 borrowValue = getBorrowValue(user);
        if (borrowValue == 0) return type(uint256).max;
        uint256 collateralValue = getCollateralValue(user);
        return (collateralValue * liquidationThreshold) / borrowValue;
    }

    function utilizationRate() public view returns (uint256) {
        uint256 totalFunds = totalCash + totalBorrowed;
        if (totalFunds == 0) return 0;
        return (totalBorrowed * 1e18) / totalFunds;
    }

    function totalAssets() public view returns (uint256) {
        return totalCash + totalBorrowed - totalReserves;
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

    // FIXED: Pool is now treasury, so minted tokens go directly to pool
    function deposit(uint256 amount) external nonReentrant {
        require(amount > 0, "DEPOSIT_ZERO");
        _ensureSelfAssociated(underlyingToken);
        _ensureSelfAssociated(lpToken);
        accrueInterest();

        // Transfer underlying from user to pool
        int256 transferStatus = HederaTokenService.transferToken(underlyingToken, msg.sender, address(this), toInt64(amount));
        require(transferStatus == HederaResponseCodes.SUCCESS, "UNDERLYING_TRANSFER_FAILED");
        
        totalCash += amount;

        uint256 totalShares = lpVirtualSupply;
        uint256 totalPoolAssets = totalAssets();
        uint256 sharesToMint = (totalShares == 0 || totalPoolAssets == 0) ? amount : (amount * totalShares) / totalPoolAssets;

        // Mint LP tokens - they go to treasury (pool contract)
        (int256 mintStatus,,) = HederaTokenService.mintToken(lpToken, toInt64(sharesToMint), new bytes[](0));
        require(mintStatus == HederaResponseCodes.SUCCESS, "LP_MINT_FAILED");

        // Transfer LP tokens from pool to user - THIS NOW WORKS because pool is treasury
        int256 lpTransferStatus = HederaTokenService.transferToken(lpToken, address(this), msg.sender, toInt64(sharesToMint));
        require(lpTransferStatus == HederaResponseCodes.SUCCESS, "LP_TRANSFER_FAILED");

        lpVirtualSupply += sharesToMint;
        emit Deposited(msg.sender, amount, sharesToMint);
    }

    function withdraw(uint256 shares) external nonReentrant {
        require(shares > 0, "WITHDRAW_ZERO");
        _ensureSelfAssociated(underlyingToken);
        _ensureSelfAssociated(lpToken);
        accrueInterest();

        uint256 underlyingToSend = (shares * totalAssets()) / lpVirtualSupply;
        require(underlyingToSend <= totalCash, "INSUFFICIENT_POOL_LIQUIDITY");

        int256 lpPullStatus = HederaTokenService.transferToken(lpToken, msg.sender, address(this), toInt64(shares));
        require(lpPullStatus == HederaResponseCodes.SUCCESS, "LP_TRANSFER_FROM_USER_FAILED");

        (int256 burnStatus,) = HederaTokenService.burnToken(lpToken, toInt64(shares), new int64[](0));
        require(burnStatus == HederaResponseCodes.SUCCESS, "LP_BURN_FAILED");

        lpVirtualSupply -= shares;

        int256 underlyingSendStatus = HederaTokenService.transferToken(underlyingToken, address(this), msg.sender, toInt64(underlyingToSend));
        require(underlyingSendStatus == HederaResponseCodes.SUCCESS, "UNDERLYING_TRANSFER_FAILED");

        totalCash -= underlyingToSend;
        emit Withdrawn(msg.sender, underlyingToSend, shares);
    }

    function borrow(uint256 amount) external nonReentrant {
        require(amount > 0, "BORROW_ZERO");
        _ensureSelfAssociated(underlyingToken);
        _ensureSelfAssociated(debtToken);
        accrueInterest();

        require(userCollateral[msg.sender] > 0, "NO_COLLATERAL_DEPOSITED");
        require(totalCash >= amount, "INSUFFICIENT_CASH");

        uint256 newBorrowValue = getBorrowValue(msg.sender) + amount;
        uint256 maxBorrow = (getCollateralValue(msg.sender) * loanToValue) / 1e18;
        require(newBorrowValue <= maxBorrow, "EXCEEDS_LTV");

        uint256 debtSharesToMint = (amount * 1e27) / borrowIndex;

        (int256 debtMintStatus,,) = HederaTokenService.mintToken(debtToken, toInt64(debtSharesToMint), new bytes[](0));
        require(debtMintStatus == HederaResponseCodes.SUCCESS, "DEBT_TOKEN_MINT_FAILED");

        int256 debtTransferStatus = HederaTokenService.transferToken(debtToken, address(this), msg.sender, toInt64(debtSharesToMint));
        require(debtTransferStatus == HederaResponseCodes.SUCCESS, "DEBT_TOKEN_TRANSFER_FAILED");

        userDebtShares[msg.sender] += debtSharesToMint;
        totalBorrowed += amount;
        totalCash -= amount;

        int256 underlyingSendStatus = HederaTokenService.transferToken(underlyingToken, address(this), msg.sender, toInt64(amount));
        require(underlyingSendStatus == HederaResponseCodes.SUCCESS, "UNDERLYING_SEND_FAILED");

        require(getHealthFactor(msg.sender) >= 1e18, "UNDER_COLLATERALIZED_AFTER_BORROW");
        emit Borrowed(msg.sender, amount, debtSharesToMint);
    }

    function repay(uint256 amount) external nonReentrant {
        require(amount > 0, "REPAY_ZERO");
        _ensureSelfAssociated(underlyingToken);
        _ensureSelfAssociated(debtToken);
        accrueInterest();

        uint256 debtShares = userDebtShares[msg.sender];
        require(debtShares > 0, "NO_DEBT_BALANCE");

        uint256 debtOwed = getBorrowValue(msg.sender);
        uint256 repayAmountActual = amount > debtOwed ? debtOwed : amount;

        int256 underlyingTransferStatus = HederaTokenService.transferToken(underlyingToken, msg.sender, address(this), toInt64(repayAmountActual));
        require(underlyingTransferStatus == HederaResponseCodes.SUCCESS, "UNDERLYING_TRANSFER_FAILED");

        totalCash += repayAmountActual;
        totalBorrowed -= repayAmountActual;

        uint256 sharesToWipe = (repayAmountActual * 1e27) / borrowIndex;
        if (sharesToWipe > debtShares) sharesToWipe = debtShares;

        int256 wipeRc = HederaTokenService.wipeTokenAccount(debtToken, msg.sender, toInt64(sharesToWipe));
        require(wipeRc == HederaResponseCodes.SUCCESS, "DEBT_TOKEN_WIPE_FAILED");

        userDebtShares[msg.sender] -= sharesToWipe;
        emit Repaid(msg.sender, repayAmountActual, sharesToWipe);
    }

    function liquidate(address borrower, uint256 repayAmount) external nonReentrant {
        require(borrower != msg.sender, "CANNOT_LIQUIDATE_SELF");
        _ensureSelfAssociated(underlyingToken);
        _ensureSelfAssociated(collateralToken);
        _ensureSelfAssociated(debtToken);
        accrueInterest();

        uint256 healthFactor = getHealthFactor(borrower);
        require(healthFactor < 1e18, "BORROWER_HEALTHY");

        uint256 debtOwed = getBorrowValue(borrower);
        uint256 maxRepay = (debtOwed * closeFactor) / 1e18;
        uint256 repayActual = repayAmount > debtOwed ? debtOwed : repayAmount;
        repayActual = repayActual > maxRepay ? maxRepay : repayActual;

        int256 underlyingTransferStatus = HederaTokenService.transferToken(underlyingToken, msg.sender, address(this), toInt64(repayActual));
        require(underlyingTransferStatus == HederaResponseCodes.SUCCESS, "UNDERLYING_TRANSFER_FAILED");

        uint256 sharesToWipe = (repayActual * 1e27) / borrowIndex;
        uint256 borrowerDebtShares = userDebtShares[borrower];
        if (sharesToWipe > borrowerDebtShares) sharesToWipe = borrowerDebtShares;

        int256 wipeRc = HederaTokenService.wipeTokenAccount(debtToken, borrower, toInt64(sharesToWipe));
        require(wipeRc == HederaResponseCodes.SUCCESS, "DEBT_TOKEN_WIPE_FAILED");

        userDebtShares[borrower] -= sharesToWipe;
        totalBorrowed -= repayActual;
        totalCash += repayActual;

        (uint256 collateralPrice, uint8 collateralDecimals) = priceOracle.getPrice(collateralToken);
        (uint256 underlyingPrice, uint8 underlyingDecimals) = priceOracle.getPrice(underlyingToken);

        uint256 collateralValueToSeize = (repayActual * (1e18 + liquidationBonus)) / 1e18;
        uint256 collateralToSeize = (collateralValueToSeize * (10 ** collateralDecimals) * underlyingPrice)
            / (collateralPrice * (10 ** underlyingDecimals));

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
        priceOracle = IPriceOracle(newOracle);
    }

    function updateLoanToValue(uint256 newLTV) external onlyOwner {
        require(newLTV <= 1e18, "INVALID_LTV");
        loanToValue = newLTV;
    }

    struct PoolDetails {
        address underlyingToken;
        address collateralToken;
        address lpToken;
        address debtToken;
        uint256 totalCash;
        uint256 totalBorrowed;
        uint256 totalReserves;
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
            lpToken: lpToken,
            debtToken: debtToken,
            totalCash: totalCash,
            totalBorrowed: totalBorrowed,
            totalReserves: totalReserves,
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