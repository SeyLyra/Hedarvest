// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./LendingPool.sol";
import "../oracles/PriceOracle.sol";
import "../interfaces/IPoolFactory.sol";

/**
 * @title PoolFactory
 * @notice Factory contract for creating and managing lending pools with comprehensive validation
 */
contract PoolFactory is IPoolFactory, Ownable {
    
    // ============ Constants ============
    uint256 constant MAX_LTV = 9000;
    uint256 constant MIN_LTV = 1000;
    uint256 constant MAX_LIQUIDATION_THRESHOLD = 9500;
    uint256 constant MAX_LIQUIDATION_BONUS = 2000;
    uint256 constant MIN_LIQUIDATION_BONUS = 100;
    uint256 constant MAX_ASSET_NAME_LENGTH = 32;
    uint256 constant MAX_POOLS = 100;
    
    // ============ State Variables ============
    PriceOracle public priceOracle;
    address public htsAddress;
    
    mapping(string => address) public pools;
    mapping(string => AssetConfig) public assetConfigs;
    mapping(address => bool) public isPool;
    
    address[] public allPools;
    string[] public allAssets;
    
    // Structs are defined in the IPoolFactory interface
    
    // ============ Events ============
    // Events are defined in the IPoolFactory interface
    
    // ============ Custom Errors ============
    error InvalidAddress();
    error InvalidParameters();
    error PoolAlreadyExists();
    error AssetNotConfigured();
    error AssetAlreadyConfigured();
    error MaxPoolsReached();
    error InvalidAssetName();
    error DuplicateTokenAddresses();
    error InvalidLTVRange();
    error InvalidThresholdRange();
    error InvalidBonusRange();
    error PoolNotFound();
    
    // ============ Modifiers ============
    modifier validAddress(address addr) {
        if (addr == address(0)) revert InvalidAddress();
        _;
    }
    
    modifier validAssetName(string memory name) {
        if (bytes(name).length == 0 || bytes(name).length > MAX_ASSET_NAME_LENGTH) {
            revert InvalidAssetName();
        }
        _;
    }
    
    modifier poolExists(string memory assetType) {
        if (pools[assetType] == address(0)) revert PoolNotFound();
        _;
    }
    
    // ============ Constructor ============
    constructor(address _priceOracle, address _htsAddress) Ownable() validAddress(_priceOracle) validAddress(_htsAddress) {
        priceOracle = PriceOracle(_priceOracle);
        htsAddress = _htsAddress;
    }
    
    // ============ Admin Functions with Validation ============
    
    /**
     * @notice Configure asset parameters before pool creation
     * @param assetType Name of the agricultural asset
     * @param baseLTV Base loan-to-value ratio (basis points)
     * @param liquidationThreshold Liquidation threshold (basis points)
     * @param liquidationBonus Liquidation bonus (basis points)
     */
    function configureAsset(
        string memory assetType,
        uint256 baseLTV,
        uint256 liquidationThreshold,
        uint256 liquidationBonus
    ) external onlyOwner validAssetName(assetType) {
        
        if (assetConfigs[assetType].configured) {
            revert AssetAlreadyConfigured();
        }
        
        if (baseLTV < MIN_LTV || baseLTV > MAX_LTV) {
            revert InvalidLTVRange();
        }
        
        if (liquidationThreshold <= baseLTV || liquidationThreshold > MAX_LIQUIDATION_THRESHOLD) {
            revert InvalidThresholdRange();
        }
        
        if (liquidationBonus < MIN_LIQUIDATION_BONUS || liquidationBonus > MAX_LIQUIDATION_BONUS) {
            revert InvalidBonusRange();
        }
        
        assetConfigs[assetType] = AssetConfig({
            baseLTV: baseLTV,
            liquidationThreshold: liquidationThreshold,
            liquidationBonus: liquidationBonus,
            configured: true
        });
        
        emit AssetConfigured(assetType, baseLTV, liquidationThreshold, liquidationBonus, block.timestamp);
    }
    
    /**
     * @notice Reconfigure existing asset parameters
     */
    function reconfigureAsset(
        string memory assetType,
        uint256 baseLTV,
        uint256 liquidationThreshold,
        uint256 liquidationBonus
    ) external onlyOwner validAssetName(assetType) {
        
        if (!assetConfigs[assetType].configured) {
            revert AssetNotConfigured();
        }
        
        if (baseLTV < MIN_LTV || baseLTV > MAX_LTV) {
            revert InvalidLTVRange();
        }
        if (liquidationThreshold <= baseLTV || liquidationThreshold > MAX_LIQUIDATION_THRESHOLD) {
            revert InvalidThresholdRange();
        }
        if (liquidationBonus < MIN_LIQUIDATION_BONUS || liquidationBonus > MAX_LIQUIDATION_BONUS) {
            revert InvalidBonusRange();
        }
        
        AssetConfig storage config = assetConfigs[assetType];
        
        emit AssetReconfigured(
            assetType,
            config.baseLTV,
            baseLTV,
            config.liquidationThreshold,
            liquidationThreshold,
            config.liquidationBonus,
            liquidationBonus
        );
        
        config.baseLTV = baseLTV;
        config.liquidationThreshold = liquidationThreshold;
        config.liquidationBonus = liquidationBonus;
    }
    
    /**
     * @notice Create a new lending pool with comprehensive validation
     */
    function createPool(
        string memory assetType,
        address lendingToken,
        address collateralToken,
        address lpToken
    ) 
        external 
        onlyOwner 
        validAssetName(assetType)
        validAddress(lendingToken)
        validAddress(collateralToken)
        validAddress(lpToken)
        returns (address) 
    {
        if (pools[assetType] != address(0)) {
            revert PoolAlreadyExists();
        }
        
        if (allPools.length >= MAX_POOLS) {
            revert MaxPoolsReached();
        }
        
        if (!assetConfigs[assetType].configured) {
            revert AssetNotConfigured();
        }
        
        if (lendingToken == collateralToken || 
            lendingToken == lpToken || 
            collateralToken == lpToken) {
            revert DuplicateTokenAddresses();
        }
        
        if (!_isContract(lendingToken) || 
            !_isContract(collateralToken) || 
            !_isContract(lpToken)) {
            revert InvalidAddress();
        }
        
        AssetConfig memory config = assetConfigs[assetType];
        
        LendingPool pool = new LendingPool(
            assetType,
            lendingToken,
            collateralToken,
            lpToken,
            config.baseLTV,
            config.liquidationThreshold,
            config.liquidationBonus,
            address(priceOracle),
            htsAddress,
            owner()
        );
        
        address poolAddress = address(pool);
        pools[assetType] = poolAddress;
        isPool[poolAddress] = true;
        allPools.push(poolAddress);
        allAssets.push(assetType);
        
        emit PoolCreated(
            assetType, 
            poolAddress, 
            lendingToken, 
            collateralToken, 
            lpToken,
            block.timestamp
        );
        
        return poolAddress;
    }
    
    // ============ Comprehensive View Functions ============
    
    /**
     * @notice Get detailed statistics for all pools
     * @return Array of PoolStats for all pools
     */
    /*
    function getPoolStats() external view returns (IPoolFactory.PoolStats[] memory) {
        IPoolFactory.PoolStats[] memory stats = new IPoolFactory.PoolStats[](allAssets.length);
        
        for (uint256 i = 0; i < allAssets.length; i++) {
            string memory assetType = allAssets[i];
            address poolAddress = pools[assetType];
            
            if (poolAddress != address(0)) {
                LendingPool pool = LendingPool(poolAddress);
                
                (
                    uint256 totalAssets,
                    uint256 totalBorrows,
                    uint256 totalReserves,
                    uint256 utilizationRate,
                    uint256 borrowRate,
                    uint256 supplyRate,
                    uint256 activePositions,
                    uint256 availableLiquidity
                ) = pool.getPoolStats();
                
                stats[i] = IPoolFactory.PoolStats({
                    poolAddress: poolAddress,
                    assetType: assetType,
                    totalAssets: totalAssets,
                    totalBorrows: totalBorrows,
                    totalReserves: totalReserves,
                    availableLiquidity: availableLiquidity,
                    utilizationRate: utilizationRate,
                    borrowRate: borrowRate,
                    supplyRate: supplyRate,
                    activePositions: activePositions
                });
            }
        }
        
        return stats;
    }
    */
    
    /**
     * @notice Get statistics for a specific pool
     * @param assetType The asset type
     * @return PoolStats for the specified pool
     */
    function getPoolStatsByAsset(string memory assetType) 
        external 
        view 
        validAssetName(assetType)
        poolExists(assetType)
        returns (IPoolFactory.PoolStats memory) 
    {
        address poolAddress = pools[assetType];
        LendingPool pool = LendingPool(poolAddress);
        
        (
            uint256 totalAssets,
            uint256 totalBorrows,
            uint256 totalReserves,
            uint256 utilizationRate,
            uint256 borrowRate,
            uint256 supplyRate,
            uint256 activePositions,
            uint256 availableLiquidity
        ) = pool.getPoolStats();
        
        return IPoolFactory.PoolStats({
            poolAddress: poolAddress,
            assetType: assetType,
            totalAssets: totalAssets,
            totalBorrows: totalBorrows,
            totalReserves: totalReserves,
            availableLiquidity: availableLiquidity,
            utilizationRate: utilizationRate,
            borrowRate: borrowRate,
            supplyRate: supplyRate,
            activePositions: activePositions
        });
    }
    
    /**
     * @notice Get all position IDs for a borrower in a specific pool
     * @param assetType The asset type of the pool
     * @param borrower The address of the borrower
     * @return Array of position IDs
     */
    function getBorrowerPositions(string memory assetType, address borrower) 
        external 
        view 
        validAssetName(assetType)
        validAddress(borrower)
        poolExists(assetType)
        returns (uint256[] memory) 
    {
        LendingPool pool = LendingPool(pools[assetType]);
        return pool.getUserPositions(borrower);
    }
    
    /**
     * @notice Get all positions for a borrower across all pools
     * @param borrower The address of the borrower
     * @return Array of UserPositionSummary for each pool
     */
    function getAllBorrowerPositions(address borrower) 
        external 
        view 
        validAddress(borrower)
        returns (IPoolFactory.UserPositionSummary[] memory) 
    {
        IPoolFactory.UserPositionSummary[] memory summaries = new IPoolFactory.UserPositionSummary[](allAssets.length);
        uint256 count = 0;
        
        for (uint256 i = 0; i < allAssets.length; i++) {
            string memory assetType = allAssets[i];
            address poolAddress = pools[assetType];
            
            if (poolAddress != address(0)) {
                LendingPool pool = LendingPool(poolAddress);
                uint256[] memory positionIds = pool.getUserPositions(borrower);
                
                if (positionIds.length > 0) {
                    uint256 totalCollateral = 0;
                    uint256 totalDebt = 0;
                    uint256 totalHealthFactor = 0;
                    uint256 validPositions = 0;
                    
                    for (uint256 j = 0; j < positionIds.length; j++) {
                        (
                            uint256 collateral,
                            uint256 debt,
                            uint256 healthFactor,
                            bool active,
                            ,
                        ) = pool.getPositionDetails(borrower, positionIds[j]);
                        
                        if (active) {
                            totalCollateral += collateral;
                            totalDebt += debt;
                            if (debt > 0) {
                                totalHealthFactor += healthFactor;
                                validPositions++;
                            }
                        }
                    }
                    
                    uint256 averageHealthFactor = validPositions > 0 
                        ? totalHealthFactor / validPositions 
                        : type(uint256).max;
                    
                    summaries[count] = IPoolFactory.UserPositionSummary({
                        assetType: assetType,
                        poolAddress: poolAddress,
                        positionIds: positionIds,
                        totalCollateral: totalCollateral,
                        totalDebt: totalDebt,
                        averageHealthFactor: averageHealthFactor
                    });
                    count++;
                }
            }
        }
        
        // Resize array to actual count
        UserPositionSummary[] memory result = new UserPositionSummary[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = summaries[i];
        }
        
        return result;
    }
    
    /**
     * @notice Get detailed information about a specific position
     * @param assetType The asset type of the pool
     * @param borrower The address of the borrower
     * @param positionId The position ID
     * @return collateral The collateral amount
     * @return debt The debt amount
     * @return healthFactor The health factor
     * @return active Whether the position is active
     * @return maxBorrowCapacity The maximum borrow capacity
     * @return availableToBorrow The amount available to borrow
     */
    function getPositionDetails(
        string memory assetType,
        address borrower,
        uint256 positionId
    ) 
        external 
        view 
        validAssetName(assetType)
        validAddress(borrower)
        poolExists(assetType)
        returns (
            uint256 collateral,
            uint256 debt,
            uint256 healthFactor,
            bool active,
            uint256 maxBorrowCapacity,
            uint256 availableToBorrow
        ) 
    {
        LendingPool pool = LendingPool(pools[assetType]);
        return pool.getPositionDetails(borrower, positionId);
    }
    
    /**
     * @notice Get complete pool information
     * @param assetType The asset type
     * @return Complete PoolInfo struct
     */
    function getPoolInfo(string memory assetType) 
        external 
        view 
        validAssetName(assetType)
        returns (IPoolFactory.PoolInfo memory) 
    {
        address poolAddress = pools[assetType];
        
        if (poolAddress == address(0)) {
            return IPoolFactory.PoolInfo({
                poolAddress: address(0),
                assetType: assetType,
                lendingToken: address(0),
                collateralToken: address(0),
                lpToken: address(0),
                baseLTV: 0,
                liquidationThreshold: 0,
                liquidationBonus: 0,
                exists: false
            });
        }
        
        LendingPool pool = LendingPool(poolAddress);
        AssetConfig memory config = assetConfigs[assetType];
        
        return IPoolFactory.PoolInfo({
            poolAddress: poolAddress,
            assetType: assetType,
            lendingToken: pool.lendingToken(),
            collateralToken: pool.collateralToken(),
            lpToken: pool.lpToken(),
            baseLTV: config.baseLTV,
            liquidationThreshold: config.liquidationThreshold,
            liquidationBonus: config.liquidationBonus,
            exists: true
        });
    }
    
    /**
     * @notice Get all pool information
     * @return Array of PoolInfo for all pools
     * 
     * NOTE: This function is commented out to reduce contract size.
     * Use getPoolInfo() for individual pool information.
     */

    function getAllPoolsInfo() external view returns (IPoolFactory.PoolInfo[] memory) {
        IPoolFactory.PoolInfo[] memory infos = new IPoolFactory.PoolInfo[](allAssets.length);
        
        for (uint256 i = 0; i < allAssets.length; i++) {
            string memory assetType = allAssets[i];
            address poolAddress = pools[assetType];
            
            if (poolAddress != address(0)) {
                LendingPool pool = LendingPool(poolAddress);
                AssetConfig memory config = assetConfigs[assetType];
                
                infos[i] = IPoolFactory.PoolInfo({
                    poolAddress: poolAddress,
                    assetType: assetType,
                    lendingToken: pool.lendingToken(),
                    collateralToken: pool.collateralToken(),
                    lpToken: pool.lpToken(),
                    baseLTV: config.baseLTV,
                    liquidationThreshold: config.liquidationThreshold,
                    liquidationBonus: config.liquidationBonus,
                    exists: true
                });
            }
        }
        
        return infos;
    }
    
    
    /**
     * @notice Get pool address for an asset
     */
    function getPool(string memory assetType) 
        external 
        view 
        validAssetName(assetType) 
        returns (address) 
    {
        return pools[assetType];
    }
    
    /**
     * @notice Get all pool addresses
     */
    // Commented out to reduce contract size
    
    function getAllPools() external view returns (address[] memory) {
        return allPools;
    }
    
    /**
     * @notice Get all asset types
     */
    // Commented out to reduce contract size
    function getAllAssets() external view returns (string[] memory) {
        return allAssets;
    }
    
    /**
     * @notice Get total number of pools
     */
    function getPoolCount() external view returns (uint256) {
        return allPools.length;
    }
    
    /**
     * @notice Check if pool exists for asset
     */
    function isPoolExists(string memory assetType) 
        external 
        view 
        validAssetName(assetType) 
        returns (bool) 
    {
        return pools[assetType] != address(0);
    }
    
    /**
     * @notice Check if asset is configured
     */
    function isAssetConfigured(string memory assetType) 
        external 
        view 
        validAssetName(assetType) 
        returns (bool) 
    {
        return assetConfigs[assetType].configured;
    }
    
    /**
     * @notice Get asset configuration
     */
    function getAssetConfig(string memory assetType) 
        external 
        view 
        validAssetName(assetType)
        returns (
            uint256 baseLTV,
            uint256 liquidationThreshold,
            uint256 liquidationBonus,
            bool configured
        ) 
    {
        AssetConfig memory config = assetConfigs[assetType];
        return (
            config.baseLTV,
            config.liquidationThreshold,
            config.liquidationBonus,
            config.configured
        );
    }
    
    /**
     * @notice Validate if address is a registered pool
     */
    function validatePool(address poolAddress) external view returns (bool) {
        return isPool[poolAddress];
    }
    
    // ============ Internal Helper Functions ============
    
    function _isContract(address addr) internal view returns (bool) {
        uint256 size;
        assembly {
            size := extcodesize(addr)
        }
        return size > 0;
    }
}
