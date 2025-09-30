// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "./MockPriceOracle.sol";
import "./IHederaTokenService.sol";
import "./HederaResponseCode.sol";

/**
 * @title LendingPool
 * @dev A DeFi lending and borrowing pool for Hedera EVM, using HTS for token transfers.
 * Supports multiple independent positions per borrower, with position-specific collateral and borrows.
 */
contract LendingPool is ReentrancyGuard, Ownable, Pausable {
    IHederaTokenService private constant HTS = IHederaTokenService(address(0x167));
    
    // === Constants ===
    uint256 public constant MAX_BASE_LTV = 9500; // 95% max LTV
    uint256 public constant MAX_PROTOCOL_FEE = 2000; // 20% max protocol fee
    uint256 public constant MAX_RESERVE_FACTOR = 5000; // 50% max reserve factor
    uint256 public constant MAX_LIQUIDATION_BONUS = 2000; // 20% max liquidation bonus
    uint256 public constant MIN_LIQUIDATION_BONUS = 500; // 5% min liquidation bonus
    uint256 public constant MAX_UTILIZATION_RATE = 9500; // 95% max utilization
    uint256 public constant PRECISION = 1e18; // Standard 18 decimal precision
    uint256 public constant BLOCKS_PER_YEAR = 365 * 24 * 60 * 60 / 3; // Assuming 3-second blocks
    
    // === Pool Configuration & State Variables ===
    string public assetType; // e.g., "Rice", "Corn"
    address public immutable lendingToken; // Token supplied by investors and borrowed
    address public immutable collateralToken; // Token used as collateral
    address public immutable lpToken; // LP share token (HTS Token ID)
    MockPriceOracle public priceOracle;

    // Interest Rate Model Parameters
    uint256 public baseLTV; // Loan-to-value ratio (e.g., 8000 = 80%)
    uint256 public reserveFactor = 1000; // 10% of accrued interest goes to reserves
    uint256 public liquidationBonus = 500; // 5% bonus for liquidators
    uint256 public optimalUtilizationRate = 8000; // 80%
    uint256 public baseRate = 100; // 1%
    uint256 public rateSlope1 = 500; // 5%
    uint256 public rateSlope2 = 3000; // 30%

    // Financial Metrics
    uint256 public totalAssets; // Liquid cash in the pool
    uint256 public totalBorrows; // Total principal and interest owed by borrowers
    uint256 public totalReserves; // Protocol-owned assets
    uint256 public protocolFee; // Configured protocol fee rate (unused; consider removing)

    // LP Supply
    uint256 public lpTokenSupply; // Total LP tokens minted
    mapping(address => uint256) public lpShares; // Investor LP shares

    // Interest Tracking
    uint256 public lastAccrualBlock; // Block of last interest accrual
    uint256 public borrowIndex = PRECISION; // Tracks interest accrual over time

    // Borrower Positions
    struct Position {
        uint256 collateral; // Collateral amount in this position
        uint256 borrows; // Borrowed amount (principal + compounded interest) at positionBorrowIndex
        uint256 positionBorrowIndex; // Borrow index at last update
        bool active; // Indicates if the position is active
    }
    mapping(address => mapping(uint256 => Position)) public borrowerPositions; // borrower => positionId => Position
    mapping(address => uint256) public borrowerPositionCount; // Tracks number of positions per borrower
    mapping(address => uint256[]) public borrowerPositionIds; // List of active position IDs per borrower

    // === Events ===
    event PositionCreated(address indexed borrower, uint256 positionId, uint256 timestamp);
    event PositionClosed(address indexed borrower, uint256 positionId, uint256 timestamp);
    event Deposited(address indexed supporter, uint256 amount, uint256 shares, uint256 timestamp);
    event Withdrawn(address indexed supporter, uint256 amount, uint256 shares, uint256 timestamp);
    event CollateralDeposited(address indexed borrower, uint256 positionId, uint256 tokens, uint256 usdValue);
    event CollateralWithdrawn(address indexed borrower, uint256 positionId, uint256 amount, uint256 timestamp);
    event LoanCreated(address indexed borrower, uint256 positionId, uint256 amount, uint256 borrowIndex);
    event LoanRepaid(address indexed borrower, uint256 positionId, uint256 principalRepaid, uint256 interestPaid);
    event LoanLiquidated(address indexed borrower, uint256 positionId, uint256 debtRepaid, uint256 collateralSeized);
    event InterestAccrued(uint256 interestAmount, uint256 newTotalBorrows, uint256 borrowAPR, uint256 timestamp);
    event ParametersUpdated(string parameter, uint256 oldValue, uint256 newValue);

    // === Modifiers ===
    modifier validAmount(uint256 amount) {
        require(amount > 0, "Amount must be greater than zero");
        _;
    }

    modifier validAddress(address addr) {
        require(addr != address(0), "Invalid address");
        _;
    }

    modifier validPosition(address borrower, uint256 positionId) {
        require(borrowerPositions[borrower][positionId].active, "Invalid or inactive position");
        _;
    }

    modifier onlyValidAssetType(string memory _assetType) {
        require(bytes(_assetType).length > 0, "Asset type cannot be empty");
        _;
    }

    constructor(
        string memory _assetType,
        address _lendingToken,
        address _collateralToken,
        address _lpToken,
        uint256 _baseLTV,
        uint256 _protocolFee,
        address _oracle,
        address _owner
    ) validAddress(_lendingToken) validAddress(_collateralToken) validAddress(_lpToken) validAddress(_oracle) validAddress(_owner) onlyValidAssetType(_assetType) {
        require(_baseLTV <= MAX_BASE_LTV, "Base LTV too high");
        require(_protocolFee <= MAX_PROTOCOL_FEE, "Protocol fee too high");
        require(_lendingToken != _collateralToken, "Lending and collateral tokens must be different");
        require(_lendingToken != _lpToken, "Lending and LP tokens must be different");
        
        assetType = _assetType;
        lendingToken = _lendingToken;
        collateralToken = _collateralToken;
        lpToken = _lpToken;
        baseLTV = _baseLTV;
        protocolFee = _protocolFee;
        priceOracle = MockPriceOracle(_oracle);
        
        _associateHTS();
        transferOwnership(_owner);
        lastAccrualBlock = block.number;
    }

    // === Internal Helpers ===
    function _associateHTS() private {
        if (block.chainid == 296 || block.chainid == 295) { // Hedera testnet or mainnet
            try HTS.associateToken(address(this), lendingToken) {} catch {}
            try HTS.associateToken(address(this), collateralToken) {} catch {}
            try HTS.associateToken(address(this), lpToken) {} catch {}
        }
    }

    function _min(uint256 a, uint256 b) private pure returns (uint256) {
        return a < b ? a : b;
    }
    
    function _safeSub(uint256 a, uint256 b) private pure returns (uint256) {
        require(b <= a, "Subtraction overflow");
        return a - b;
    }

    function _safeDiv(uint256 a, uint256 b) private pure returns (uint256) {
        require(b > 0, "Division by zero");
        return a / b;
    }

    function _safeMulDiv(uint256 a, uint256 b, uint256 c) private pure returns (uint256) {
        require(c > 0, "Division by zero");
        return (a * b) / c;
    }

    function _removePositionId(address borrower, uint256 positionId) private {
        uint256[] storage ids = borrowerPositionIds[borrower];
        for (uint256 i = 0; i < ids.length; i++) {
            if (ids[i] == positionId) {
                ids[i] = ids[ids.length - 1];
                ids.pop();
                break;
            }
        }
    }

    // === Position Management ===
    function createPosition() external whenNotPaused returns (uint256) {
        address borrower = msg.sender;
        uint256 positionId = borrowerPositionCount[borrower]++;
        borrowerPositions[borrower][positionId] = Position({
            collateral: 0,
            borrows: 0,
            positionBorrowIndex: borrowIndex,
            active: true
        });
        borrowerPositionIds[borrower].push(positionId);
        emit PositionCreated(borrower, positionId, block.timestamp);
        return positionId;
    }

    function closePosition(uint256 positionId) 
        external 
        nonReentrant 
        whenNotPaused 
        validPosition(msg.sender, positionId) 
    {
        Position storage position = borrowerPositions[msg.sender][positionId];
        require(position.borrows == 0, "Outstanding debt in position");
        require(position.collateral == 0, "Collateral must be withdrawn");

        position.active = false;
        _removePositionId(msg.sender, positionId);
        emit PositionClosed(msg.sender, positionId, block.timestamp);
    }

    function getPositionIds(address borrower) external view validAddress(borrower) returns (uint256[] memory) {
        return borrowerPositionIds[borrower];
    }

    // === Interest Calculations ===
    function calculateBorrowAPR() internal view returns (uint256) {
        uint256 totalSupply = totalAssets + totalBorrows;
        if (totalSupply == 0) return baseRate;
        
        uint256 utilization = utilizationRate();
        require(utilization <= 10000, "Utilization exceeds 100%");
        
        if (utilization <= optimalUtilizationRate) {
            return baseRate + _safeMulDiv(utilization, rateSlope1, optimalUtilizationRate);
        } else {
            uint256 excessUtilization = utilization - optimalUtilizationRate;
            uint256 excessCapacity = 10000 - optimalUtilizationRate;
            require(excessCapacity > 0, "Invalid optimal utilization rate");
            return baseRate + rateSlope1 + _safeMulDiv(excessUtilization, rateSlope2, excessCapacity);
        }
    }
    
    function getCurrentBorrowBalance(address borrower, uint256 positionId) 
        public 
        view 
        validAddress(borrower) 
        validPosition(borrower, positionId) 
        returns (uint256) 
    {
        Position storage position = borrowerPositions[borrower][positionId];
        uint256 principal = position.borrows;
        if (principal == 0) return 0;

        uint256 borrowerIndex = position.positionBorrowIndex;
        if (lastAccrualBlock == block.number) {
             return _safeMulDiv(principal, borrowIndex, borrowerIndex);
        }
        
        uint256 blocksElapsed = block.number - lastAccrualBlock;
        uint256 borrowAPR = calculateBorrowAPR();
        uint256 interestFactor = _safeMulDiv(borrowAPR, blocksElapsed, BLOCKS_PER_YEAR);
        uint256 projectedBorrowIndex = borrowIndex + _safeMulDiv(borrowIndex, interestFactor, 10000);
        return _safeMulDiv(principal, projectedBorrowIndex, borrowerIndex);
    }
    
    function accrueInterest() public {
        uint256 currentBlock = block.number;
        if (currentBlock == lastAccrualBlock) return;

        uint256 blocksElapsed = currentBlock - lastAccrualBlock;
        
        if (totalBorrows > 0) {
            uint256 borrowAPR = calculateBorrowAPR();
            uint256 interestFactor = _safeMulDiv(borrowAPR, blocksElapsed, BLOCKS_PER_YEAR);
            uint256 interest = _safeMulDiv(totalBorrows, interestFactor, 10000);
            
            totalBorrows += interest;
            borrowIndex += _safeMulDiv(borrowIndex, interestFactor, 10000);
            
            uint256 reserves = _safeMulDiv(interest, reserveFactor, 10000);
            totalReserves += reserves;
            
            emit InterestAccrued(interest, totalBorrows, borrowAPR, block.timestamp);
        }

        lastAccrualBlock = currentBlock;
    }

    // === Core Functions ===
    function deposit(uint256 amount) external nonReentrant whenNotPaused validAmount(amount) {
        accrueInterest();

        int rc = HTS.transferToken(lendingToken, msg.sender, address(this), int64(int256(amount)));
        require(rc == HederaResponseCodes.SUCCESS, "Transfer failed");

        uint256 shares;
        uint256 totalPoolValue = totalAssets + totalBorrows - totalReserves;
        
        if (lpTokenSupply == 0) {
            shares = amount;
        } else {
            require(totalPoolValue > 0, "Invalid pool value");
            shares = _safeMulDiv(amount, lpTokenSupply, totalPoolValue);
        }

        totalAssets += amount;
        lpShares[msg.sender] += shares;
        lpTokenSupply += shares;

        (int64 mintRc,,) = HTS.mintToken(lpToken, int64(int256(shares)), new bytes[](0));
        require(mintRc == HederaResponseCodes.SUCCESS, "LP token mint failed");
        
        emit Deposited(msg.sender, amount, shares, block.timestamp);
    }

    function withdraw(uint256 shares) external nonReentrant whenNotPaused validAmount(shares) {
        accrueInterest();
        require(lpShares[msg.sender] >= shares, "Insufficient LP shares");
        require(lpTokenSupply > 0, "Invalid LP supply");
        
        uint256 totalPoolValue = totalAssets + totalBorrows - totalReserves;
        require(totalPoolValue > 0, "No assets to withdraw");

        uint256 withdrawAmount = _safeMulDiv(shares, totalPoolValue, lpTokenSupply);
        require(withdrawAmount <= availableLiquidity(), "Insufficient liquidity");
        
        lpShares[msg.sender] = _safeSub(lpShares[msg.sender], shares);
        lpTokenSupply = _safeSub(lpTokenSupply, shares);
        totalAssets = _safeSub(totalAssets, withdrawAmount);

        (int64 burnRc,) = HTS.burnToken(lpToken, int64(int256(shares)), new int64[](0));
        require(burnRc == HederaResponseCodes.SUCCESS, "LP token burn failed");

        int rc = HTS.transferToken(lendingToken, address(this), msg.sender, int64(int256(withdrawAmount)));
        require(rc == HederaResponseCodes.SUCCESS, "Withdraw failed");

        emit Withdrawn(msg.sender, withdrawAmount, shares, block.timestamp);
    }

    function depositCollateral(uint256 amount, uint256 positionId) 
        external 
        nonReentrant 
        whenNotPaused 
        validAmount(amount) 
        validPosition(msg.sender, positionId) 
    {
        accrueInterest();

        int rc = HTS.transferToken(collateralToken, msg.sender, address(this), int64(int256(amount)));
        require(rc == HederaResponseCodes.SUCCESS, "Collateral transfer failed");

        uint256 price = priceOracle.getPrice(assetType);
        require(price > 0, "Invalid price");
        uint256 usdValue = _safeMulDiv(amount, price, PRECISION);

        borrowerPositions[msg.sender][positionId].collateral += amount;
        emit CollateralDeposited(msg.sender, positionId, amount, usdValue);
    }

    function withdrawCollateral(uint256 amount, uint256 positionId) 
        external 
        nonReentrant 
        whenNotPaused 
        validAmount(amount) 
        validPosition(msg.sender, positionId) 
    {
        accrueInterest();
        Position storage position = borrowerPositions[msg.sender][positionId];
        require(position.collateral >= amount, "Insufficient collateral");

        uint256 price = priceOracle.getPrice(assetType);
        require(price > 0, "Invalid price");

        uint256 newCollateral = _safeSub(position.collateral, amount);
        uint256 collateralUSD = _safeMulDiv(newCollateral, price, PRECISION);
        uint256 maxBorrow = _safeMulDiv(collateralUSD, baseLTV, 10000);
        uint256 currentDebt = getCurrentBorrowBalance(msg.sender, positionId);
        require(currentDebt <= maxBorrow, "Withdrawal would make position unhealthy");

        position.collateral = newCollateral;
        if (position.collateral == 0 && position.borrows == 0) {
            position.active = false;
            _removePositionId(msg.sender, positionId);
        }

        int rc = HTS.transferToken(collateralToken, address(this), msg.sender, int64(int256(amount)));
        require(rc == HederaResponseCodes.SUCCESS, "Collateral withdrawal failed");

        emit CollateralWithdrawn(msg.sender, positionId, amount, block.timestamp);
    }

    function createLoan(uint256 amount, uint256 positionId) 
        external 
        nonReentrant 
        whenNotPaused 
        validAmount(amount) 
        validPosition(msg.sender, positionId) 
    {
        accrueInterest();
        
        Position storage position = borrowerPositions[msg.sender][positionId];
        uint256 collateralAmount = position.collateral;
        require(collateralAmount > 0, "No collateral deposited");
        
        uint256 price = priceOracle.getPrice(assetType);
        require(price > 0, "Invalid price");
        
        uint256 collateralUSD = _safeMulDiv(collateralAmount, price, PRECISION);
        uint256 maxBorrow = _safeMulDiv(collateralUSD, baseLTV, 10000);
        
        uint256 currentDebt = getCurrentBorrowBalance(msg.sender, positionId);
        uint256 newDebt = currentDebt + amount;

        require(newDebt <= maxBorrow, "Exceeds borrow limit");
        require(amount <= availableLiquidity(), "Insufficient liquidity");

        totalBorrows += amount;
        position.borrows = newDebt;
        position.positionBorrowIndex = borrowIndex;
        totalAssets = _safeSub(totalAssets, amount);

        int rc = HTS.transferToken(lendingToken, address(this), msg.sender, int64(int256(amount)));
        require(rc == HederaResponseCodes.SUCCESS, "Loan transfer failed");
        
        emit LoanCreated(msg.sender, positionId, amount, borrowIndex);
    }

    function repayLoan(uint256 amount, uint256 positionId) 
        external 
        nonReentrant 
        whenNotPaused 
        validAmount(amount) 
        validPosition(msg.sender, positionId) 
    {
        accrueInterest();
        
        address borrower = msg.sender;
        uint256 currentDebt = getCurrentBorrowBalance(borrower, positionId);
        require(currentDebt > 0, "No active loan");

        uint256 repayAmount = _min(amount, currentDebt);
        
        int rc = HTS.transferToken(lendingToken, msg.sender, address(this), int64(int256(repayAmount)));
        require(rc == HederaResponseCodes.SUCCESS, "Repay transfer failed");

        Position storage position = borrowerPositions[borrower][positionId];
        uint256 principalAtLastIndex = position.borrows;
        uint256 accruedInterest = currentDebt - principalAtLastIndex;
        
        uint256 interestRepaid = _min(repayAmount, accruedInterest);
        uint256 principalRepaid = repayAmount - interestRepaid;

        totalBorrows = _safeSub(totalBorrows, repayAmount);
        totalAssets += repayAmount;

        uint256 remainingDebt = currentDebt - repayAmount;
        if (remainingDebt > 0) {
            position.borrows = remainingDebt;
            position.positionBorrowIndex = borrowIndex;
        } else {
            position.borrows = 0;
            position.positionBorrowIndex = 0;
            if (position.collateral == 0) {
                position.active = false;
                _removePositionId(borrower, positionId);
            }
        }

        emit LoanRepaid(borrower, positionId, principalRepaid, interestRepaid);
    }

    function liquidate(address borrower, uint256 positionId) 
        external 
        nonReentrant 
        whenNotPaused 
        validAddress(borrower) 
        validPosition(borrower, positionId) 
    {
        accrueInterest();
        uint256 price = priceOracle.getPrice(assetType);
        require(price > 0, "Invalid price");
        
        Position storage position = borrowerPositions[borrower][positionId];
        uint256 collateralAmount = position.collateral;
        require(collateralAmount > 0, "No collateral to liquidate");
        
        uint256 collateralUSD = _safeMulDiv(collateralAmount, price, PRECISION);
        uint256 maxBorrow = _safeMulDiv(collateralUSD, baseLTV, 10000);
        uint256 currentDebt = getCurrentBorrowBalance(borrower, positionId);

        require(currentDebt > 0, "No debt to liquidate");
        require(currentDebt > maxBorrow, "Position healthy");

        uint256 debtToRepay = currentDebt;
        uint256 seizedCollateralValueUSD = _safeMulDiv(debtToRepay, 10000 + liquidationBonus, 10000);
        uint256 requiredCollateralTokens = _safeMulDiv(seizedCollateralValueUSD, PRECISION, price);
        uint256 collateralToSeize = _min(requiredCollateralTokens, position.collateral);

        require(collateralToSeize > 0, "Invalid collateral to seize");

        int rc1 = HTS.transferToken(lendingToken, msg.sender, address(this), int64(int256(debtToRepay)));
        require(rc1 == HederaResponseCodes.SUCCESS, "Repay failed");

        totalBorrows = _safeSub(totalBorrows, debtToRepay);
        totalAssets += debtToRepay;

        position.borrows = 0;
        position.positionBorrowIndex = 0;
        position.collateral = _safeSub(position.collateral, collateralToSeize);
        if (position.collateral == 0) {
            position.active = false;
            _removePositionId(borrower, positionId);
        }

        int rc2 = HTS.transferToken(collateralToken, address(this), msg.sender, int64(int256(collateralToSeize)));
        require(rc2 == HederaResponseCodes.SUCCESS, "Seize transfer failed");

        emit LoanLiquidated(borrower, positionId, debtToRepay, collateralToSeize);
    }

    // === Views ===
    function utilizationRate() public view returns (uint256) {
        uint256 totalSupply = totalAssets + totalBorrows;
        if (totalSupply == 0) return 0;
        return _safeMulDiv(totalBorrows, 10000, totalSupply);
    }

    function availableLiquidity() public view returns (uint256) {
        return totalAssets;
    }

    function exchangeRate() public view returns (uint256) {
        if (lpTokenSupply == 0) return PRECISION;
        uint256 totalPoolValue = totalAssets + totalBorrows - totalReserves;
        return _safeMulDiv(totalPoolValue, PRECISION, lpTokenSupply);
    }

    function totalLP() public view returns (uint256) {
        return lpTokenSupply;
    }

    function currentAPR() external view returns (uint256) {
        return calculateBorrowAPR();
    }

    function getCollateralBalance(address borrower, uint256 positionId) 
        external 
        view 
        validAddress(borrower) 
        validPosition(borrower, positionId) 
        returns (uint256) 
    {
        return borrowerPositions[borrower][positionId].collateral;
    }

    function getHealthFactor(address borrower, uint256 positionId) 
        external 
        view 
        validAddress(borrower) 
        validPosition(borrower, positionId) 
        returns (uint256) 
    {
        Position storage position = borrowerPositions[borrower][positionId];
        uint256 collateralAmount = position.collateral;
        if (collateralAmount == 0) return 0;
        
        uint256 price = priceOracle.getPrice(assetType);
        if (price == 0) return 0;
        
        uint256 collateralUSD = _safeMulDiv(collateralAmount, price, PRECISION);
        uint256 maxBorrow = _safeMulDiv(collateralUSD, baseLTV, 10000);
        
        uint256 currentDebt = getCurrentBorrowBalance(borrower, positionId);
        if (currentDebt == 0) return type(uint256).max;
        return _safeMulDiv(maxBorrow, PRECISION, currentDebt);
    }

    function getInvestorShares(address investor) external view validAddress(investor) returns (uint256) {
        return lpShares[investor];
    }

    // === Admin Functions ===
    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }
    function updateReserveFactor(uint256 newReserveFactor) external onlyOwner { 
        require(newReserveFactor <= MAX_RESERVE_FACTOR, "Reserve factor too high");
        uint256 oldValue = reserveFactor;
        reserveFactor = newReserveFactor;
        emit ParametersUpdated("reserveFactor", oldValue, newReserveFactor);
    }
    function updateLiquidationBonus(uint256 newLiquidationBonus) external onlyOwner {
        require(newLiquidationBonus >= MIN_LIQUIDATION_BONUS && newLiquidationBonus <= MAX_LIQUIDATION_BONUS, "Invalid liquidation bonus");
        uint256 oldValue = liquidationBonus;
        liquidationBonus = newLiquidationBonus;
        emit ParametersUpdated("liquidationBonus", oldValue, newLiquidationBonus);
    }
    function updateOptimalUtilizationRate(uint256 newOptimalUtilizationRate) external onlyOwner {
        require(newOptimalUtilizationRate <= MAX_UTILIZATION_RATE, "Optimal utilization rate too high");
        uint256 oldValue = optimalUtilizationRate;
        optimalUtilizationRate = newOptimalUtilizationRate;
        emit ParametersUpdated("optimalUtilizationRate", oldValue, newOptimalUtilizationRate);
    }
    function updateInterestRateParameters(
        uint256 newBaseRate,
        uint256 newRateSlope1,
        uint256 newRateSlope2
    ) external onlyOwner {
        require(newBaseRate <= 10000, "Base rate too high");
        require(newRateSlope1 <= 10000, "Rate slope 1 too high");
        require(newRateSlope2 <= 10000, "Rate slope 2 too high");
        
        baseRate = newBaseRate;
        rateSlope1 = newRateSlope1;
        rateSlope2 = newRateSlope2;
        
        emit ParametersUpdated("interestRateParameters", 0, newBaseRate);
    }
    
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner validAddress(token) validAmount(amount) {
        require(token != lendingToken || amount <= totalReserves, "Cannot withdraw more than reserves");
        
        int rc = HTS.transferToken(token, address(this), msg.sender, int64(int256(amount)));
        require(rc == HederaResponseCodes.SUCCESS, "Emergency withdraw failed");

        if (token == lendingToken) {
            totalAssets = _safeSub(totalAssets, amount);
            totalReserves = _safeSub(totalReserves, amount);
        }
    }
}