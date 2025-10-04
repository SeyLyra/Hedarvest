// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title ILendingPool
 * @notice Interface for lending pool contracts
 * @dev Defines the standard interface for all lending pool implementations
 */
interface ILendingPool {
    
    // ============ Events ============
    event Deposit(address indexed user, uint256 amount, uint256 lpMinted);
    event Withdraw(address indexed user, uint256 amount, uint256 lpBurned);
    event PositionCreated(address indexed borrower, uint256 indexed positionId, uint256 timestamp);
    event CollateralDeposited(address indexed borrower, uint256 indexed positionId, uint256 amount, address token);
    event CollateralWithdrawn(address indexed borrower, uint256 indexed positionId, uint256 amount);
    event LoanCreated(address indexed borrower, uint256 indexed positionId, uint256 amount);
    event LoanRepaid(address indexed borrower, uint256 indexed positionId, uint256 amount);
    event PositionLiquidated(
        address indexed borrower,
        uint256 indexed positionId,
        address indexed liquidator,
        uint256 debtCovered,
        uint256 collateralSeized
    );
    event PositionClosed(address indexed borrower, uint256 indexed positionId, uint256 timestamp);
    event InterestAccrued(uint256 borrowIndex, uint256 totalBorrows, uint256 reserves);
    event ParametersUpdated(string parameter, uint256 oldValue, uint256 newValue);
    event CollateralTokenValidated(address indexed user, address indexed token, uint256 indexed positionId);
    
    // ============ Core Functions ============
    
    // Liquidity Provider Functions
    function deposit(uint256 amount) external;
    function withdraw(uint256 lpAmount) external;
    
    // Borrower Functions
    function createPosition() external returns (uint256);
    function depositCollateral(uint256 positionId, uint256 amount) external;
    function depositCollateralWithToken(uint256 positionId, address tokenAddress, uint256 amount) external;
    function borrow(uint256 positionId, uint256 amount) external;
    function repay(uint256 positionId, uint256 amount) external;
    function withdrawCollateral(uint256 positionId, uint256 amount) external;
    function closePosition(uint256 positionId) external;
    
    // Liquidation Functions - Removed for MVP
    
    // Interest Rate Functions
    function accrueInterest() external;
    function getUtilizationRate() external view returns (uint256);
    function getBorrowRate() external view returns (uint256);
    function getSupplyRate() external view returns (uint256);
    
    // ============ View Functions ============
    
    // Pool Information
    function getAssetType() external view returns (string memory);
    function getCollateralToken() external view returns (address);
    function lendingToken() external view returns (address);
    function lpToken() external view returns (address);
    function collateralToken() external view returns (address);
    
    // Position Functions
    function getPositionDebt(address borrower, uint256 positionId) external view returns (uint256);
    function getHealthFactor(address borrower, uint256 positionId) external view returns (uint256);
    function getUserPositions(address user) external view returns (uint256[] memory);
    function getPositionDetails(address borrower, uint256 positionId) external view returns (
        uint256 collateral,
        uint256 debt,
        uint256 healthFactor,
        bool active,
        uint256 maxBorrowCapacity,
        uint256 availableToBorrow
    );
    
    // Pool Statistics
    function getPoolStats() external view returns (
        uint256 _totalAssets,
        uint256 _totalBorrows,
        uint256 _totalReserves,
        uint256 _utilizationRate,
        uint256 _borrowRate,
        uint256 _supplyRate,
        uint256 _activePositions,
        uint256 _availableLiquidity
    );
    
    function availableLiquidity() external view returns (uint256);
    function utilizationRate() external view returns (uint256);
    function currentAPR() external view returns (uint256);
    function getTVL() external view returns (uint256);
    
    // User Functions
    function getLPBalance(address user) external view returns (uint256);
    function getUserTotalCollateral(address user) external view returns (uint256);
    function getUserSummary(address user) external view returns (
        uint256 totalCollateral,
        uint256 totalDebt,
        uint256 totalPositions,
        uint256 activePositions,
        uint256 lpBalance,
        uint256 averageHealthFactor
    );
    
    // Liquidation Functions - Removed for MVP
    
    // Collateral Validation
    function isValidCollateral(address tokenAddress) external view returns (bool);
    function validateCollateralDeposit(address tokenAddress, uint256 amount) external view returns (bool valid, string memory reason);
    function getCollateralTokenInfo() external view returns (
        address tokenAddress,
        string memory assetName,
        bool isAssociated
    );
    function canUserDepositToken(address user, address tokenAddress) external view returns (bool canDeposit, string memory reason);
    function getValidCollateralTokens() external view returns (address[] memory tokens, string[] memory names);
    
    // Simulation Functions - Removed for MVP (implement in frontend)
    
    // Risk Parameters
    function getRiskParameters() external view returns (
        uint256 _baseLTV,
        uint256 _liquidationThreshold,
        uint256 _liquidationBonus,
        uint256 minHealthFactor
    );
    
    function getInterestRateModel() external view returns (
        uint256 baseRate,
        uint256 slope1,
        uint256 slope2,
        uint256 optimalUtilization,
        uint256 reserveFactor
    );
    
    // Admin Functions - Removed for MVP
}
