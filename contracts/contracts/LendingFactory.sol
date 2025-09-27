// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./LendingPool.sol";
import "./MockPriceOracle.sol";
// Imports for HTS are handled inside the LendingPool contract, not needed here.
// NOTE: Removed inheritance from HederaTokenService.

/**
 * @title LendingFactory
 * @dev Deploys, configures, and tracks new instances of the LendingPool and their Oracles.
 * The owner of this factory controls which pools are created and who owns the resulting pools/oracles.
 */
contract LendingFactory is Ownable {
    
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
    }

    // === State Variables ===
    // Maps the asset type (string) to its configuration and addresses
    mapping(string => PoolInfo) public lendingPools;
    string[] public allAssets; // Stores all deployed asset types for iteration

    // === Events ===
    event PoolCreated(address indexed pool, address indexed oracle, string assetType);

    // === Constructor ===
    constructor() {
        // Factory is initialized with owner via Ownable
    }

    // === Core Functions ===
    /**
     * @dev Creates and deploys a new LendingPool and a dedicated MockPriceOracle for the asset.
     * The caller (msg.sender) now takes ownership of both the new Pool and the new Oracle.
     * **NOTE:** The onlyOwner modifier has been removed to allow public creation.
     * * @param assetType The unique identifier for the collateral asset (e.g., "Rice").
     * @param baseLTV The Loan-to-Value ratio (e.g., 7500 for 75%).
     * @param protocolFee The fee taken by the protocol from interest (e.g., 1000 for 10%).
     * @param initialPrice The starting price for the asset in USD (fixed point, e.g., 1e18).
     * @return The addresses of the newly created LendingPool and MockPriceOracle.
     */
    function createPool(
        string calldata assetType,
        uint256 baseLTV,
        uint256 protocolFee,
        uint256 initialPrice
    ) external returns (address, address) {
        require(bytes(assetType).length > 0, "Asset type cannot be empty");
        require(lendingPools[assetType].poolAddress == address(0), "Pool already exists");
        require(baseLTV > 0 && baseLTV <= 10000, "Invalid LTV (0-10000)");
        require(protocolFee <= 10000, "Invalid protocol fee (0-10000)");
        require(initialPrice > 0, "Invalid price");

        // 1. Deploy and configure the Mock Price Oracle
        MockPriceOracle oracle = new MockPriceOracle();
        oracle.setPrice(assetType, initialPrice);
        // Transfer ownership of the Oracle to the caller (msg.sender)
        oracle.transferOwnership(msg.sender);

        // 2. Define Token Addresses for the new pool (Mocks for testing environment)
        address lendingTokenAddr = address(0x1);
        address collateralTokenAddr = address(0x2);
        address lpTokenAddr = address(0x3);

        // 3. Deploy the Lending Pool
        LendingPool newPool = new LendingPool(
            assetType,
            lendingTokenAddr,
            collateralTokenAddr,
            lpTokenAddr,
            baseLTV,
            protocolFee,
            address(oracle),
            msg.sender // Sets the caller/owner as the Pool's owner
        );
        
        // 4. Register the new pool
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
     * Requires cross-contract calls to each LendingPool instance.
     */
    function getPoolStats() external view returns (PoolStats[] memory) {
        PoolStats[] memory stats = new PoolStats[](allAssets.length);
        for (uint256 i = 0; i < allAssets.length; i++) {
            // Instantiate the LendingPool interface from the stored address
            LendingPool pool = LendingPool(lendingPools[allAssets[i]].poolAddress);
            stats[i] = PoolStats({
                pool: lendingPools[allAssets[i]].poolAddress,
                assetType: allAssets[i],
                // Direct calls to public view functions on LendingPool
                totalAssets: pool.totalAssets(),
                totalBorrows: pool.totalBorrows(),
                availableLiquidity: pool.availableLiquidity(),
                utilizationRate: pool.utilizationRate(),
                currentAPR: pool.currentAPR()
            });
        }
        return stats;
    }
}
