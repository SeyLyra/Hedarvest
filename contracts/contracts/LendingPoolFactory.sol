// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./LendingPool.sol";
import "./MockPriceOracle.sol";

/**
 * @title LendingPoolFactory
 * @dev Deploys, configures, and tracks instances of LendingPool and their Oracles.
 * The owner of this factory controls which pools are created and who owns the resulting pools/oracles.
 */
contract LendingPoolFactory is Ownable {
    
    // === Structures ===
    struct PoolInfo {
        address poolAddress;
        address oracleAddress;
        string assetType;
    }

    struct PoolStats {
        address pool;
        string assetType;
        uint256 totalAssets;
        uint256 totalBorrows;
        uint256 availableLiquidity;
        uint256 utilizationRate;
        uint256 currentAPR;
        uint256 activePositions; // New: number of active positions in the pool
    }

    // === State Variables ===
    mapping(string => PoolInfo) public lendingPools;
    string[] public allAssets;

    // === Events ===
    event PoolCreated(address indexed pool, address indexed oracle, string assetType);

    // === Constructor ===
    constructor() {}

    // === Core Functions ===
    /**
     * @dev Creates and deploys a new LendingPool and a dedicated MockPriceOracle for the asset.
     * The caller (msg.sender) takes ownership of both the new Pool and Oracle.
     * @param assetType The unique identifier for the collateral asset (e.g., "Rice").
     * @param lendingToken The address of the lending token (HTS token ID).
     * @param collateralToken The address of the collateral token (HTS token ID).
     * @param lpToken The address of the LP token (HTS token ID).
     * @param baseLTV The Loan-to-Value ratio (e.g., 7500 for 75%).
     * @param protocolFee The fee taken by the protocol from interest (e.g., 1000 for 10%).
     * @param initialPrice The starting price for the asset in USD (fixed point, e.g., 1e18).
     * @return The addresses of the newly created LendingPool and MockPriceOracle.
     */
    function createPool(
        string calldata assetType,
        address lendingToken,
        address collateralToken,
        address lpToken,
        uint256 baseLTV,
        uint256 protocolFee,
        uint256 initialPrice
    ) external returns (address, address) {
        require(bytes(assetType).length > 0, "Asset type cannot be empty");
        require(lendingPools[assetType].poolAddress == address(0), "Pool already exists");
        require(lendingToken != address(0), "Invalid lending token address");
        require(collateralToken != address(0), "Invalid collateral token address");
        require(lpToken != address(0), "Invalid LP token address");
        require(lendingToken != collateralToken, "Lending and collateral tokens must be different");
        require(lendingToken != lpToken, "Lending and LP tokens must be different");
        require(collateralToken != lpToken, "Collateral and LP tokens must be different");
        require(baseLTV > 0 && baseLTV <= 9500, "Invalid LTV"); // MAX_BASE_LTV = 9500
        require(protocolFee <= 2000, "Invalid protocol fee"); // MAX_PROTOCOL_FEE = 2000
        require(initialPrice > 0, "Invalid price");

        // Deploy and configure the Mock Price Oracle
        MockPriceOracle oracle = new MockPriceOracle();
        oracle.setPrice(assetType, initialPrice);
        oracle.transferOwnership(msg.sender);

        // Deploy the Lending Pool
        LendingPool newPool = new LendingPool(
            assetType,
            lendingToken,
            collateralToken,
            lpToken,
            baseLTV,
            protocolFee,
            address(oracle),
            msg.sender
        );
        
        // Register the new pool
        lendingPools[assetType] = PoolInfo({
            poolAddress: address(newPool),
            oracleAddress: address(oracle),
            assetType: assetType
        });
        allAssets.push(assetType);

        emit PoolCreated(address(newPool), address(oracle), assetType);
        return (address(newPool), address(oracle));
    }

    // === Views ===
    /**
     * @dev Retrieves the PoolInfo struct for a specific asset type.
     */
    function getPool(string calldata assetType) external view returns (PoolInfo memory) {
        require(lendingPools[assetType].poolAddress != address(0), "Pool does not exist");
        return lendingPools[assetType];
    }

    /**
     * @dev Retrieves PoolInfo structs for all deployed asset types.
     */
    function getAllPools() external view returns (PoolInfo[] memory) {
        PoolInfo[] memory pools = new PoolInfo[](allAssets.length);
        for (uint256 i = 0; i < allAssets.length; i++) {
            pools[i] = lendingPools[allAssets[i]];
        }
        return pools;
    }

    /**
     * @dev Retrieves live financial stats from all deployed pools.
     */
    function getPoolStats() external view returns (PoolStats[] memory) {
        PoolStats[] memory stats = new PoolStats[](allAssets.length);
        for (uint256 i = 0; i < allAssets.length; i++) {
            LendingPool pool = LendingPool(lendingPools[allAssets[i]].poolAddress);
            stats[i] = PoolStats({
                pool: lendingPools[allAssets[i]].poolAddress,
                assetType: allAssets[i],
                totalAssets: pool.totalAssets(),
                totalBorrows: pool.totalBorrows(),
                availableLiquidity: pool.availableLiquidity(),
                utilizationRate: pool.utilizationRate(),
                currentAPR: pool.currentAPR(),
                activePositions: 0 // Note: Requires position counting logic in LendingPool
            });
        }
        return stats;
    }

    /**
     * @dev Retrieves all position IDs for a borrower across a specific pool.
     * @param borrower The address of the borrower.
     * @param assetType The asset type of the pool.
     * @return Array of position IDs.
     */
    function getBorrowerPositions(string calldata assetType, address borrower) 
        external 
        view 
        returns (uint256[] memory) 
    {
        require(lendingPools[assetType].poolAddress != address(0), "Pool does not exist");
        LendingPool pool = LendingPool(lendingPools[assetType].poolAddress);
        return pool.getPositionIds(borrower);
    }
}