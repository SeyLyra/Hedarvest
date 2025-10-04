// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title IPoolFactory
 * @notice Interface for pool factory contracts
 * @dev Defines the standard interface for all pool factory implementations
 */
interface IPoolFactory {
    
    // ============ Structs ============
    struct AssetConfig {
        uint256 baseLTV;
        uint256 liquidationThreshold;
        uint256 liquidationBonus;
        bool configured;
    }
    
    struct PoolInfo {
        address poolAddress;
        string assetType;
        address lendingToken;
        address collateralToken;
        address lpToken;
        uint256 baseLTV;
        uint256 liquidationThreshold;
        uint256 liquidationBonus;
        bool exists;
    }
    
    struct PoolStats {
        address poolAddress;
        string assetType;
        uint256 totalAssets;
        uint256 totalBorrows;
        uint256 totalReserves;
        uint256 availableLiquidity;
        uint256 utilizationRate;
        uint256 borrowRate;
        uint256 supplyRate;
        uint256 activePositions;
    }
    
    struct UserPositionSummary {
        string assetType;
        address poolAddress;
        uint256[] positionIds;
        uint256 totalCollateral;
        uint256 totalDebt;
        uint256 averageHealthFactor;
    }
    
    // ============ Events ============
    event PoolCreated(
        string indexed assetType,
        address indexed poolAddress,
        address lendingToken,
        address collateralToken,
        address lpToken,
        uint256 timestamp
    );
    
    event AssetConfigured(
        string indexed assetType,
        uint256 baseLTV,
        uint256 liquidationThreshold,
        uint256 liquidationBonus,
        uint256 timestamp
    );
    
    event AssetReconfigured(
        string indexed assetType,
        uint256 oldLTV,
        uint256 newLTV,
        uint256 oldThreshold,
        uint256 newThreshold,
        uint256 oldBonus,
        uint256 newBonus
    );
    
    // ============ Core Functions ============
    
    // Asset Configuration
    function configureAsset(
        string memory assetType,
        uint256 baseLTV,
        uint256 liquidationThreshold,
        uint256 liquidationBonus
    ) external;
    
    function reconfigureAsset(
        string memory assetType,
        uint256 baseLTV,
        uint256 liquidationThreshold,
        uint256 liquidationBonus
    ) external;
    
    // Pool Creation
    function createPool(
        string memory assetType,
        address lendingToken,
        address collateralToken,
        address lpToken
    ) external returns (address);
    
    // ============ View Functions ============
    
    // Pool Information
    function getPool(string memory assetType) external view returns (address);
    function getAllPools() external view returns (address[] memory);
    function getAllAssets() external view returns (string[] memory);
    function isPoolExists(string memory assetType) external view returns (bool);
    function validatePool(address poolAddress) external view returns (bool);
    
    // Pool Details
    function getPoolInfo(string memory assetType) external view returns (PoolInfo memory);
    // Commented out to reduce contract size - use getPoolInfo() for individual pools
    // function getAllPoolsInfo() external view returns (PoolInfo[] memory);
    
    // Pool Statistics
    // Commented out to reduce contract size - use getPoolStatsByAsset() for individual pools
    // function getPoolStats() external view returns (PoolStats[] memory);
    function getPoolStatsByAsset(string memory assetType) external view returns (PoolStats memory);
    
    // Position Management
    function getBorrowerPositions(string memory assetType, address borrower) external view returns (uint256[] memory);
    function getAllBorrowerPositions(address borrower) external view returns (UserPositionSummary[] memory);
    function getPositionDetails(
        string memory assetType,
        address borrower,
        uint256 positionId
    ) external view returns (
        uint256 collateral,
        uint256 debt,
        uint256 healthFactor,
        bool active,
        uint256 maxBorrowCapacity,
        uint256 availableToBorrow
    );
    
    // Liquidation
    // Commented out to reduce contract size - liquidation logic handled by individual pools
    // function getLiquidatablePositions() external view returns (
    //     address[] memory borrowers,
    //     uint256[] memory positionIds,
    //     string[] memory assetTypes
    // );
    
    // Asset Configuration
    function isAssetConfigured(string memory assetType) external view returns (bool);
    function getAssetConfig(string memory assetType) external view returns (
        uint256 baseLTV,
        uint256 liquidationThreshold,
        uint256 liquidationBonus,
        bool configured
    );
}
