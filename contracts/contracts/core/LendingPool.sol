// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "../interfaces/IHederaTokenService.sol";
import "../interfaces/HederaResponseCode.sol";
import "../interfaces/ILendingPool.sol";
import "../mocks/MockPriceOracle.sol";

/**
 * @title LendingPool
 * @notice lending pool for agricultural assets using Hedera Token Service
 * @dev Each pool has a SPECIFIC collateral token (RICE, CORN, WHEAT, SOYBEAN)
 */
contract LendingPool is ILendingPool, Ownable, ReentrancyGuard, Pausable {
    
    // ============ Constants ============
    // HTS address will be passed as constructor parameter for testing
    uint256 constant MAX_LTV = 9000; // 90% maximum
    uint256 constant MIN_LTV = 1000; // 10% minimum
    uint256 constant MAX_LIQUIDATION_THRESHOLD = 9500; // 95% maximum
    uint256 constant MAX_LIQUIDATION_BONUS = 2000; // 20% maximum
    uint256 constant MIN_LIQUIDATION_BONUS = 100; // 1% minimum
    uint256 constant PRECISION = 10000; // 100%
    uint256 constant MIN_HEALTH_FACTOR = 1e18; // 1.0
    uint256 constant MAX_UTILIZATION = 9500; // 95%
    uint256 constant MIN_DEPOSIT = 1e6; // Minimum 1 token (6 decimals)
    uint256 constant MIN_BORROW = 1e6; // Minimum 1 token (6 decimals)
    uint256 constant MAX_POSITIONS_PER_USER = 100;
    uint8 constant COLLATERAL_DECIMALS = 6; // HTS token decimals
    
    IHederaTokenService internal HTS;
    
    // ============ State Variables ============
    string public assetType; // "RICE", "CORN", "WHEAT", "SOYBEAN"
    address public lendingToken; // Shared AUSD token
    address public collateralToken; // Pool-specific collateral (RICE/CORN/WHEAT/SOYBEAN token)
    address public lpToken; // Pool-specific LP token
    
    uint256 public baseLTV;
    uint256 public liquidationThreshold;
    uint256 public liquidationBonus;
    
    MockPriceOracle public priceOracle;
    
    uint256 public totalAssets;
    uint256 public totalBorrows;
    uint256 public totalReserves;
    uint256 public borrowIndex = 1e18;
    uint256 public lastUpdateTime;
    
    uint256 public constant RESERVE_FACTOR = 1000; // 10%
    uint256 public constant BASE_RATE = 200;       // 2%
    uint256 public constant SLOPE1 = 400;          // 4%
    uint256 public constant SLOPE2 = 10000;        // 100%
    uint256 public constant OPTIMAL_UTILIZATION = 8000; // 80%
    
    uint256 public nextPositionId = 1;
    uint256 public activePositionsCount;
    
    // ============ Structs ============
    struct Position {
        uint256 collateral;
        uint256 borrows;
        uint256 borrowIndex;
        uint256 lastUpdateTime;
        bool active;
    }
    
    // ============ Mappings ============
    mapping(address => mapping(uint256 => Position)) public positions;
    mapping(address => uint256[]) public userPositions;
    mapping(address => uint256) public lpBalances;
    
    address[] private allBorrowers;
    mapping(address => bool) private isBorrower;
    
    // ============ Events ============
    // Events are defined in the ILendingPool interface
    
    // ============ Custom Errors ============
    error InvalidAmount();
    error InvalidAddress();
    error InvalidParameters();
    error PositionNotActive();
    error PositionNotFound();
    error InsufficientLiquidity();
    error ExceedsBorrowingCapacity();
    error ExceedsLTV();
    error PositionHealthy();
    error OutstandingDebt();
    error HTSTransferFailed(int responseCode);
    error HTSMintFailed(int responseCode);
    error HTSBurnFailed(int responseCode);
    error PriceStale();
    error MaxPositionsReached();
    error UtilizationTooHigh();
    error HealthFactorTooLow();
    error InvalidLiquidationAmount();
    error InvalidCollateralToken(address provided, address expected);
    error InvalidTokenAddress();
    error TokenNotAssociated(address token);
    error CollateralMismatch(string poolAssetType, address providedToken);
    
    // ============ Modifiers ============
    
    modifier validAddress(address addr) {
        if (addr == address(0)) revert InvalidAddress();
        _;
    }
    
    modifier validAmount(uint256 amount) {
        if (amount == 0) revert InvalidAmount();
        _;
    }
    
    modifier positionExists(address user, uint256 positionId) {
        if (positionId == 0 || positionId >= nextPositionId) revert PositionNotFound();
        if (!positions[user][positionId].active) revert PositionNotActive();
        _;
    }
    
    modifier checkPriceValidity() {
        if (priceOracle.isPriceStale(assetType)) revert PriceStale();
        _;
    }
    
    modifier onlyValidCollateral(address tokenAddress) {
        _validateCollateralToken(tokenAddress);
        _;
    }
    
    // ============ Constructor ============
    constructor(
        string memory _assetType,
        address _lendingToken,
        address _collateralToken,
        address _lpToken,
        uint256 _baseLTV,
        uint256 _liquidationThreshold,
        uint256 _liquidationBonus,
        address _priceOracle,
        address _htsAddress,
        address _owner
    ) 
        Ownable()
        validAddress(_lendingToken)
        validAddress(_collateralToken)
        validAddress(_lpToken)
        validAddress(_priceOracle)
        validAddress(_htsAddress)
        validAddress(_owner)
    {
        // Validate asset type
        if (bytes(_assetType).length == 0 || bytes(_assetType).length > 32) {
            revert InvalidParameters();
        }
        
        // Validate LTV
        if (_baseLTV < MIN_LTV || _baseLTV > MAX_LTV) {
            revert InvalidParameters();
        }
        
        // Validate liquidation threshold
        if (_liquidationThreshold <= _baseLTV || _liquidationThreshold > MAX_LIQUIDATION_THRESHOLD) {
            revert InvalidParameters();
        }
        
        // Validate liquidation bonus
        if (_liquidationBonus < MIN_LIQUIDATION_BONUS || _liquidationBonus > MAX_LIQUIDATION_BONUS) {
            revert InvalidParameters();
        }
        
        // Validate token addresses are different
        if (_lendingToken == _collateralToken || _lendingToken == _lpToken || _collateralToken == _lpToken) {
            revert InvalidParameters();
        }
        
        assetType = _assetType;
        lendingToken = _lendingToken;
        collateralToken = _collateralToken;
        lpToken = _lpToken;
        baseLTV = _baseLTV;
        liquidationThreshold = _liquidationThreshold;
        liquidationBonus = _liquidationBonus;
        priceOracle = MockPriceOracle(_priceOracle);
        lastUpdateTime = block.timestamp;
        
        HTS = IHederaTokenService(_htsAddress);
    }
    
    // ============ COLLATERAL VALIDATION FUNCTIONS ============
    
    /**
     * @notice Validate that token is this pool's designated collateral
     * @dev Prevents cross-pool collateral deposits (e.g., CORN into RICE pool)
     * @param tokenAddress Token address to validate
     */
    function _validateCollateralToken(address tokenAddress) internal view {
        // Check 1: Token must match pool's collateral
        if (tokenAddress != collateralToken) {
            revert InvalidCollateralToken(tokenAddress, collateralToken);
        }
        
        // Check 2: Token must not be zero address
        if (tokenAddress == address(0)) {
            revert InvalidTokenAddress();
        }
        
        // Check 3: Verify token is associated with this contract
        _verifyTokenAssociation(tokenAddress);
    }
    
    /**
     * @notice Verify HTS token is associated with this contract
     * @dev Calls HTS to check token association
     * @param tokenAddress Token to verify
     */
    function _verifyTokenAssociation(address tokenAddress) internal view {
        // Query HTS for token association
        int responseCode = HTS.isAssociated(address(this), tokenAddress);
        
        if (responseCode != HederaResponseCodes.SUCCESS) {
            revert TokenNotAssociated(tokenAddress);
        }
    }
    
    /**
     * @notice Check if a token is valid collateral for this pool
     * @param tokenAddress Token to check
     * @return True if token is valid collateral
     */
    function isValidCollateral(address tokenAddress) public view returns (bool) {
        return tokenAddress == collateralToken && tokenAddress != address(0);
    }
    
    /**
     * @notice Get pool's designated collateral token
     * @return Collateral token address
     */
    function getCollateralToken() external view returns (address) {
        return collateralToken;
    }
    
    /**
     * @notice Get pool's asset type (grain name)
     * @return Asset type string
     */
    function getAssetType() external view returns (string memory) {
        return assetType;
    }
    
    // ============ HTS Helper Functions with Validation ============
    
    function _transferHTS(address token, address from, address to, int64 amount) internal {
        if (token == address(0) || from == address(0) || to == address(0)) {
            revert InvalidAddress();
        }
        if (amount <= 0) revert InvalidAmount();
        
        int responseCode = HTS.transferToken(token, from, to, amount);
        if (responseCode != HederaResponseCodes.SUCCESS) {
            revert HTSTransferFailed(responseCode);
        }
    }
    
    function _mintLP(address to, int64 amount) internal validAddress(to) {
        if (amount <= 0) revert InvalidAmount();
        
        (int responseCode,,) = HTS.mintToken(lpToken, amount, new bytes[](0));
        if (responseCode != HederaResponseCodes.SUCCESS) {
            revert HTSMintFailed(responseCode);
        }
    }
    
    function _burnLP(address from, int64 amount) internal validAddress(from) {
        if (amount <= 0) revert InvalidAmount();
        
        (int responseCode,) = HTS.burnToken(lpToken, amount, new int64[](0));
        if (responseCode != HederaResponseCodes.SUCCESS) {
            revert HTSBurnFailed(responseCode);
        }
    }
    
    // ============ Interest Rate Functions ============
    
    function getUtilizationRate() public view returns (uint256) {
        if (totalAssets == 0) return 0;
        return (totalBorrows * PRECISION) / totalAssets;
    }
    
    function getBorrowRate() public view returns (uint256) {
        uint256 utilization = getUtilizationRate();
        
        if (utilization <= OPTIMAL_UTILIZATION) {
            return BASE_RATE + (utilization * SLOPE1) / OPTIMAL_UTILIZATION;
        } else {
            uint256 excessUtil = utilization - OPTIMAL_UTILIZATION;
            return BASE_RATE + SLOPE1 + (excessUtil * SLOPE2) / (PRECISION - OPTIMAL_UTILIZATION);
        }
    }
    
    function getSupplyRate() public view returns (uint256) {
        uint256 borrowRate = getBorrowRate();
        uint256 utilization = getUtilizationRate();
        return (borrowRate * utilization * (PRECISION - RESERVE_FACTOR)) / (PRECISION * PRECISION);
    }
    
    function accrueInterest() public {
        uint256 timeDelta = block.timestamp - lastUpdateTime;
        if (timeDelta == 0) return;
        
        uint256 borrowRate = getBorrowRate();
        uint256 interestFactor = (borrowRate * timeDelta) / 365 days;
        uint256 interestAccumulated = (totalBorrows * interestFactor) / PRECISION;
        uint256 reservesAdded = (interestAccumulated * RESERVE_FACTOR) / PRECISION;
        
        totalBorrows += interestAccumulated;
        totalReserves += reservesAdded;
        borrowIndex = borrowIndex + (borrowIndex * interestFactor) / PRECISION;
        lastUpdateTime = block.timestamp;
        
        emit InterestAccrued(borrowIndex, totalBorrows, totalReserves);
    }
    
    // ============ Liquidity Provider Functions ============
    
    function deposit(uint256 amount) 
        external 
        nonReentrant 
        whenNotPaused 
        validAmount(amount)
    {
        if (amount < MIN_DEPOSIT) revert InvalidAmount();
        
        accrueInterest();
        
        uint256 lpToMint;
        if (totalAssets == 0) {
            lpToMint = amount;
        } else {
            uint256 totalLPSupply = totalAssets - totalBorrows;
            if (totalLPSupply == 0) revert InvalidParameters();
            lpToMint = (amount * totalLPSupply) / (totalAssets - totalBorrows);
        }
        
        if (lpToMint == 0) revert InvalidAmount();
        
        _transferHTS(lendingToken, msg.sender, address(this), int64(uint64(amount)));
        _mintLP(msg.sender, int64(uint64(lpToMint)));
        
        lpBalances[msg.sender] += lpToMint;
        totalAssets += amount;
        
        emit Deposit(msg.sender, amount, lpToMint);
    }
    
    function withdraw(uint256 lpAmount) 
        external 
        nonReentrant 
        whenNotPaused 
        validAmount(lpAmount)
    {
        if (lpAmount > lpBalances[msg.sender]) revert InvalidAmount();
        
        accrueInterest();
        
        uint256 totalLPSupply = totalAssets - totalBorrows;
        if (totalLPSupply == 0) revert InvalidParameters();
        
        uint256 amountToWithdraw = (lpAmount * (totalAssets - totalBorrows)) / totalLPSupply;
        
        if (amountToWithdraw > totalAssets - totalBorrows) {
            revert InsufficientLiquidity();
        }
        
        uint256 newTotalAssets = totalAssets - amountToWithdraw;
        if (newTotalAssets > 0) {
            uint256 newUtilization = (totalBorrows * PRECISION) / newTotalAssets;
            if (newUtilization > MAX_UTILIZATION) revert UtilizationTooHigh();
        }
        
        _burnLP(msg.sender, int64(uint64(lpAmount)));
        _transferHTS(lendingToken, address(this), msg.sender, int64(uint64(amountToWithdraw)));
        
        lpBalances[msg.sender] -= lpAmount;
        totalAssets -= amountToWithdraw;
        
        emit Withdraw(msg.sender, amountToWithdraw, lpAmount);
    }
    
    // ============ Borrower Functions with Collateral Validation ============
    
    function createPosition() 
        external 
        nonReentrant 
        whenNotPaused 
        returns (uint256) 
    {
        if (userPositions[msg.sender].length >= MAX_POSITIONS_PER_USER) {
            revert MaxPositionsReached();
        }
        
        uint256 positionId = nextPositionId++;
        
        positions[msg.sender][positionId] = Position({
            collateral: 0,
            borrows: 0,
            borrowIndex: borrowIndex,
            lastUpdateTime: block.timestamp,
            active: true
        });
        
        userPositions[msg.sender].push(positionId);
        
        if (!isBorrower[msg.sender]) {
            allBorrowers.push(msg.sender);
            isBorrower[msg.sender] = true;
        }
        
        activePositionsCount++;
        
        emit PositionCreated(msg.sender, positionId, block.timestamp);
        return positionId;
    }
    
    /**
     * @notice Deposit collateral for a position (VALIDATES COLLATERAL TOKEN)
     * @dev Only accepts this pool's designated collateral token
     * @param positionId The position ID
     * @param amount Amount of collateral to deposit
     */
    function depositCollateral(uint256 positionId, uint256 amount) 
        external 
        nonReentrant 
        whenNotPaused 
        positionExists(msg.sender, positionId)
        validAmount(amount)
        checkPriceValidity
    {
        Position storage position = positions[msg.sender][positionId];
        
        // Validation 1: Minimum deposit amount
        if (amount < MIN_DEPOSIT) revert InvalidAmount();
        
        // Validation 2: Ensure this pool only accepts its designated collateral token
        // This prevents users from depositing wrong grain type
        // e.g., Can't deposit CORN into RICE pool
        _validateCollateralToken(collateralToken);
        
        // Transfer collateral from user to pool
        _transferHTS(collateralToken, msg.sender, address(this), int64(uint64(amount)));
        
        // Update position
        position.collateral += amount;
        
        emit CollateralDeposited(msg.sender, positionId, amount, collateralToken);
        emit CollateralTokenValidated(msg.sender, collateralToken, positionId);
    }
    
    /**
     * @notice Deposit collateral with explicit token address (SAFER - RECOMMENDED)
     * @dev Validates that the provided token matches pool's collateral
     * @param positionId The position ID
     * @param tokenAddress The collateral token address to deposit
     * @param amount Amount of collateral to deposit
     */
    function depositCollateralWithToken(
        uint256 positionId, 
        address tokenAddress,
        uint256 amount
    ) 
        external 
        nonReentrant 
        whenNotPaused 
        positionExists(msg.sender, positionId)
        validAmount(amount)
        checkPriceValidity
        onlyValidCollateral(tokenAddress)
    {
        Position storage position = positions[msg.sender][positionId];
        
        // Validation 1: Minimum deposit amount
        if (amount < MIN_DEPOSIT) revert InvalidAmount();
        
        // Validation 2: Token must match pool's collateral token
        if (tokenAddress != collateralToken) {
            revert InvalidCollateralToken(tokenAddress, collateralToken);
        }
        
        // Transfer collateral from user to pool
        _transferHTS(tokenAddress, msg.sender, address(this), int64(uint64(amount)));
        
        // Update position
        position.collateral += amount;
        
        emit CollateralDeposited(msg.sender, positionId, amount, tokenAddress);
        emit CollateralTokenValidated(msg.sender, tokenAddress, positionId);
    }
    
    function borrow(uint256 positionId, uint256 amount) 
        external 
        nonReentrant 
        whenNotPaused 
        positionExists(msg.sender, positionId)
        validAmount(amount)
        checkPriceValidity
    {
        if (amount < MIN_BORROW) revert InvalidAmount();
        
        accrueInterest();
        
        Position storage position = positions[msg.sender][positionId];
        
        if (amount > totalAssets - totalBorrows) {
            revert InsufficientLiquidity();
        }
        
        if (position.collateral == 0) revert InvalidAmount();
        
        uint256 collateralValue = getCollateralValue(position.collateral);
        uint256 maxBorrow = (collateralValue * baseLTV) / PRECISION;
        uint256 currentDebt = getPositionDebt(msg.sender, positionId);
        
        if (currentDebt + amount > maxBorrow) {
            revert ExceedsBorrowingCapacity();
        }
        
        position.borrows += (amount * 1e18) / borrowIndex;
        position.borrowIndex = borrowIndex;
        position.lastUpdateTime = block.timestamp;
        
        totalBorrows += amount;
        
        uint256 healthFactor = getHealthFactor(msg.sender, positionId);
        if (healthFactor < MIN_HEALTH_FACTOR) {
            revert HealthFactorTooLow();
        }
        
        uint256 utilization = getUtilizationRate();
        if (utilization > MAX_UTILIZATION) {
            revert UtilizationTooHigh();
        }
        
        _transferHTS(lendingToken, address(this), msg.sender, int64(uint64(amount)));
        
        emit LoanCreated(msg.sender, positionId, amount);
    }
    
    function repay(uint256 positionId, uint256 amount) 
        external 
        nonReentrant 
        whenNotPaused 
        positionExists(msg.sender, positionId)
        validAmount(amount)
    {
        accrueInterest();
        
        Position storage position = positions[msg.sender][positionId];
        
        uint256 currentDebt = getPositionDebt(msg.sender, positionId);
        if (currentDebt == 0) revert InvalidAmount();
        
        uint256 repayAmount = amount > currentDebt ? currentDebt : amount;
        
        _transferHTS(lendingToken, msg.sender, address(this), int64(uint64(repayAmount)));
        
        uint256 borrowSharesReduction = (repayAmount * 1e18) / borrowIndex;
        position.borrows -= borrowSharesReduction;
        position.borrowIndex = borrowIndex;
        position.lastUpdateTime = block.timestamp;
        
        totalBorrows -= repayAmount;
        
        emit LoanRepaid(msg.sender, positionId, repayAmount);
    }
    
    function withdrawCollateral(uint256 positionId, uint256 amount) 
        external 
        nonReentrant 
        whenNotPaused 
        positionExists(msg.sender, positionId)
        validAmount(amount)
        checkPriceValidity
    {
        accrueInterest();
        
        Position storage position = positions[msg.sender][positionId];
        
        if (amount > position.collateral) revert InvalidAmount();
        
        uint256 newCollateral = position.collateral - amount;
        uint256 currentDebt = getPositionDebt(msg.sender, positionId);
        
        if (currentDebt > 0) {
            uint256 collateralValue = getCollateralValue(newCollateral);
            uint256 maxBorrow = (collateralValue * baseLTV) / PRECISION;
            
            if (currentDebt > maxBorrow) revert ExceedsLTV();
            
            uint256 maxDebtThreshold = (collateralValue * liquidationThreshold) / PRECISION;
            uint256 newHealthFactor = (maxDebtThreshold * 1e18) / currentDebt;
            
            if (newHealthFactor < MIN_HEALTH_FACTOR) {
                revert HealthFactorTooLow();
            }
        }
        
        position.collateral = newCollateral;
        
        // Validate collateral token before transfer
        _validateCollateralToken(collateralToken);
        _transferHTS(collateralToken, address(this), msg.sender, int64(uint64(amount)));
        
        emit CollateralWithdrawn(msg.sender, positionId, amount);
    }
    
    function closePosition(uint256 positionId) 
        external 
        nonReentrant 
        whenNotPaused 
        positionExists(msg.sender, positionId)
    {
        Position storage position = positions[msg.sender][positionId];
        
        uint256 currentDebt = getPositionDebt(msg.sender, positionId);
        if (currentDebt > 0) revert OutstandingDebt();
        
        uint256 collateralToReturn = position.collateral;
        
        if (collateralToReturn > 0) {
            _validateCollateralToken(collateralToken);
            _transferHTS(collateralToken, address(this), msg.sender, int64(uint64(collateralToReturn)));
        }
        
        position.active = false;
        activePositionsCount--;
        
        emit PositionClosed(msg.sender, positionId, block.timestamp);
    }
    
    function getCollateralValue(uint256 collateralAmount) public view returns (uint256) {
        if (collateralAmount == 0) return 0;
        uint256 price = priceOracle.getPrice(assetType);
        return (collateralAmount * price) / (10 ** COLLATERAL_DECIMALS);
    }
    
    function getPositionDebt(address borrower, uint256 positionId) public view returns (uint256) {
        Position storage position = positions[borrower][positionId];
        if (!position.active || position.borrows == 0) return 0;
        return (position.borrows * borrowIndex) / 1e18;
    }
    
    function getHealthFactor(address borrower, uint256 positionId) public view returns (uint256) {
        Position storage position = positions[borrower][positionId];
        if (!position.active) return 0;
        
        uint256 currentDebt = getPositionDebt(borrower, positionId);
        if (currentDebt == 0) return type(uint256).max;
        
        uint256 collateralValue = getCollateralValue(position.collateral);
        uint256 maxDebt = (collateralValue * liquidationThreshold) / PRECISION;
        
        return (maxDebt * 1e18) / currentDebt;
    }
    
    function getUserPositions(address user) external view returns (uint256[] memory) {
        return userPositions[user];
    }
    
    function getPositionDetails(address borrower, uint256 positionId) external view returns (
        uint256 collateral,
        uint256 debt,
        uint256 healthFactor,
        bool active,
        uint256 maxBorrowCapacity,
        uint256 availableToBorrow
    ) {
        Position storage position = positions[borrower][positionId];
        debt = getPositionDebt(borrower, positionId);
        healthFactor = getHealthFactor(borrower, positionId);
        
        uint256 collateralValue = getCollateralValue(position.collateral);
        maxBorrowCapacity = (collateralValue * baseLTV) / PRECISION;
        availableToBorrow = maxBorrowCapacity > debt ? maxBorrowCapacity - debt : 0;
        
        return (
            position.collateral,
            debt,
            healthFactor,
            position.active,
            maxBorrowCapacity,
            availableToBorrow
        );
    }
    
    function getAllBorrowers() external view returns (address[] memory) {
        return allBorrowers;
    }
    
    function getPoolStats() external view returns (
        uint256 _totalAssets,
        uint256 _totalBorrows,
        uint256 _totalReserves,
        uint256 _utilizationRate,
        uint256 _borrowRate,
        uint256 _supplyRate,
        uint256 _activePositions,
        uint256 _availableLiquidity
    ) {
        return (
            totalAssets,
            totalBorrows,
            totalReserves,
            getUtilizationRate(),
            getBorrowRate(),
            getSupplyRate(),
            activePositionsCount,
            totalAssets - totalBorrows
        );
    }
    
    function availableLiquidity() external view returns (uint256) {
        return totalAssets > totalBorrows ? totalAssets - totalBorrows : 0;
    }
    
    function utilizationRate() external view returns (uint256) {
        return getUtilizationRate();
    }
    
    function currentAPR() external view returns (uint256) {
        return getBorrowRate();
    }
    
    function getLPBalance(address user) external view validAddress(user) returns (uint256) {
        return lpBalances[user];
    }
    
    function getTVL() external view returns (uint256) {
        return totalAssets;
    }
    
    function getUserTotalCollateral(address user) 
        external 
        view 
        validAddress(user)
        returns (uint256) 
    {
        uint256 total = 0;
        uint256[] memory posIds = userPositions[user];
        
        for (uint256 i = 0; i < posIds.length; i++) {
            if (positions[user][posIds[i]].active) {
                total += positions[user][posIds[i]].collateral;
            }
        }
        
        return total;
    }
    
    function getUserSummary(address user) 
        external 
        view 
        validAddress(user)
        returns (
            uint256 totalCollateral,
            uint256 totalDebt,
            uint256 totalPositions,
            uint256 activePositions,
            uint256 lpBalance,
            uint256 averageHealthFactor
        ) 
    {
        uint256[] memory posIds = userPositions[user];
        totalPositions = posIds.length;
        lpBalance = lpBalances[user];
        
        uint256 totalHealthFactor = 0;
        uint256 positionsWithDebt = 0;
        
        for (uint256 i = 0; i < posIds.length; i++) {
            if (positions[user][posIds[i]].active) {
                activePositions++;
                totalCollateral += positions[user][posIds[i]].collateral;
                
                uint256 debt = getPositionDebt(user, posIds[i]);
                totalDebt += debt;
                
                if (debt > 0) {
                    totalHealthFactor += getHealthFactor(user, posIds[i]);
                    positionsWithDebt++;
                }
            }
        }
        
        averageHealthFactor = positionsWithDebt > 0 
            ? totalHealthFactor / positionsWithDebt 
            : type(uint256).max;
        
        return (
            totalCollateral,
            totalDebt,
            totalPositions,
            activePositions,
            lpBalance,
            averageHealthFactor
        );
    }
    
    function getInterestRateModel() 
        external 
        pure 
        returns (
            uint256 baseRate,
            uint256 slope1,
            uint256 slope2,
            uint256 optimalUtilization,
            uint256 reserveFactor
        ) 
    {
        return (BASE_RATE, SLOPE1, SLOPE2, OPTIMAL_UTILIZATION, RESERVE_FACTOR);
    }
    
    function getRiskParameters() 
        external 
        view 
        returns (
            uint256 _baseLTV,
            uint256 _liquidationThreshold,
            uint256 _liquidationBonus,
            uint256 minHealthFactor
        ) 
    {
        return (baseLTV, liquidationThreshold, liquidationBonus, MIN_HEALTH_FACTOR);
    }
    
    function getLPTokenValue(uint256 lpAmount) 
        external 
        view 
        returns (uint256) 
    {
        if (lpAmount == 0) return 0;
        
        uint256 totalLPSupply = totalAssets - totalBorrows;
        if (totalLPSupply == 0) return 0;
        
        return (lpAmount * (totalAssets - totalBorrows)) / totalLPSupply;
    }
    
    function getLPTokensForDeposit(uint256 depositAmount) 
        external 
        view 
        returns (uint256) 
    {
        if (depositAmount == 0) return 0;
        
        if (totalAssets == 0) {
            return depositAmount;
        }
        
        uint256 totalLPSupply = totalAssets - totalBorrows;
        if (totalLPSupply == 0) return 0;
        
        return (depositAmount * totalLPSupply) / (totalAssets - totalBorrows);
    }
    
    // ============ COLLATERAL VALIDATION VIEW FUNCTIONS ============
    
    /**
     * @notice Validate if a deposit would be accepted
     * @param tokenAddress Token to validate
     * @param amount Amount to validate
     * @return valid Whether deposit is valid
     * @return reason Reason if invalid
     */
    function validateCollateralDeposit(address tokenAddress, uint256 amount)
        external
        view
        returns (bool valid, string memory reason)
    {
        // Check 1: Token matches pool's collateral
        if (tokenAddress != collateralToken) {
            return (false, "Wrong collateral token for this pool");
        }
        
        // Check 2: Token is not zero address
        if (tokenAddress == address(0)) {
            return (false, "Invalid token address");
        }
        
        // Check 3: Amount is sufficient
        if (amount < MIN_DEPOSIT) {
            return (false, "Amount below minimum deposit");
        }
        
        // Check 4: Token is associated (view function, may revert)
        try this.isValidCollateral(tokenAddress) returns (bool isValid) {
            if (!isValid) {
                return (false, "Token not associated with pool");
            }
        } catch {
            return (false, "Token association check failed");
        }
        
        return (true, "Valid collateral deposit");
    }
    
    /**
     * @notice Get pool's collateral token info
     * @return tokenAddress Collateral token address
     * @return assetName Asset type name
     * @return isAssociated Whether token is associated
     */
    function getCollateralTokenInfo()
        external
        view
        returns (
            address tokenAddress,
            string memory assetName,
            bool isAssociated
        )
    {
        tokenAddress = collateralToken;
        assetName = assetType;
        
        try this.isValidCollateral(collateralToken) returns (bool valid) {
            isAssociated = valid;
        } catch {
            isAssociated = false;
        }
        
        return (tokenAddress, assetName, isAssociated);
    }
    
    /**
     * @notice Check if user can deposit a specific token
     * @param user User address
     * @param tokenAddress Token to check
     * @return canDeposit Whether user can deposit
     * @return reason Reason if cannot deposit
     */
    function canUserDepositToken(address user, address tokenAddress)
        external
        view
        validAddress(user)
        returns (bool canDeposit, string memory reason)
    {
        // Check if token is valid collateral
        if (tokenAddress != collateralToken) {
            return (false, "Token is not valid collateral for this pool");
        }
        
        // Check if user has reached max positions
        if (userPositions[user].length >= MAX_POSITIONS_PER_USER) {
            bool hasActivePosition = false;
            uint256[] memory posIds = userPositions[user];
            
            for (uint256 i = 0; i < posIds.length; i++) {
                if (positions[user][posIds[i]].active) {
                    hasActivePosition = true;
                    break;
                }
            }
            
            if (!hasActivePosition) {
                return (false, "No active positions and max positions reached");
            }
        }
        
        return (true, "User can deposit this token");
    }
    
    /**
     * @notice Get all valid collateral tokens for this pool
     * @return tokens Array of valid collateral token addresses (only one for this pool)
     * @return names Array of asset names
     */
    function getValidCollateralTokens()
        external
        view
        returns (address[] memory tokens, string[] memory names)
    {
        tokens = new address[](1);
        names = new string[](1);
        
        tokens[0] = collateralToken;
        names[0] = assetType;
        
        return (tokens, names);
    }
}
