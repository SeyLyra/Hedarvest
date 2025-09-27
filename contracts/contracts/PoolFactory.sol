// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./GrainPool.sol";
import "./MockPriceOracle.sol";

contract PoolFactory is Ownable {
    struct PoolInfo {
        address poolAddress;
        address oracleAddress;
        string grainType;
    }

    struct PoolStats {
        address pool;
        string grainType;
        uint256 totalAssets;
        uint256 totalBorrows;
        uint256 availableLiquidity;
        uint256 utilizationRate;
        uint256 currentAPR;
    }

    mapping(string => PoolInfo) public grainPools;
    string[] public allGrains;

    event PoolCreated(address indexed pool, address indexed oracle, string grainType);

    function createPool(
        string calldata grainType,
        address lendingToken,
        address collateralToken,
        uint256 baseLTV,
        uint256 riskPremium,
        uint256 debtCeiling,
        uint256 protocolFee,
        uint256 initialPrice // e.g. $200 scaled to 1e18
    ) external onlyOwner returns (address, address) {
        require(grainPools[grainType].poolAddress == address(0), "Pool exists");

        // Deploy Oracle
        MockPriceOracle oracle = new MockPriceOracle();
        oracle.setPrice(grainType, initialPrice);
        oracle.transferOwnership(msg.sender);

        // Deploy Pool
        GrainPool newPool = new GrainPool(
            grainType,
            lendingToken,
            collateralToken,
            baseLTV,
            riskPremium,
            debtCeiling,
            protocolFee,
            address(oracle),
            msg.sender
        );

        grainPools[grainType] = PoolInfo({
            poolAddress: address(newPool),
            oracleAddress: address(oracle),
            grainType: grainType
        });
        allGrains.push(grainType);

        emit PoolCreated(address(newPool), address(oracle), grainType);
        return (address(newPool), address(oracle));
    }

    function getPool(string calldata grainType) external view returns (PoolInfo memory) {
        return grainPools[grainType];
    }

    function getAllPools() external view returns (PoolInfo[] memory) {
        PoolInfo[] memory pools = new PoolInfo[](allGrains.length);
        for (uint256 i = 0; i < allGrains.length; i++) {
            pools[i] = grainPools[allGrains[i]];
        }
        return pools;
    }

    function getPoolStats() external view returns (PoolStats[] memory) {
        PoolStats[] memory stats = new PoolStats[](allGrains.length);
        for (uint256 i = 0; i < allGrains.length; i++) {
            GrainPool pool = GrainPool(grainPools[allGrains[i]].poolAddress);
            stats[i] = PoolStats({
                pool: grainPools[allGrains[i]].poolAddress,
                grainType: allGrains[i],
                totalAssets: pool.totalAssets(),
                totalBorrows: pool.totalBorrows(),
                availableLiquidity: pool.availableLiquidity(),
                utilizationRate: pool.utilizationRate(),
                currentAPR: pool.currentAPR()
            });
        }
        return stats;
    }

    function getPoolUtilizationRates() external view returns (
        address[] memory pools,
        uint256[] memory utilizationRates
    ) {
        pools = new address[](allGrains.length);
        utilizationRates = new uint256[](allGrains.length);
        
        for (uint256 i = 0; i < allGrains.length; i++) {
            GrainPool pool = GrainPool(grainPools[allGrains[i]].poolAddress);
            pools[i] = grainPools[allGrains[i]].poolAddress;
            utilizationRates[i] = pool.utilizationRate();
        }
        
        return (pools, utilizationRates);
    }

    function getAllPoolAPRs() external view returns (
        address[] memory pools,
        uint256[] memory aprs
    ) {
        pools = new address[](allGrains.length);
        aprs = new uint256[](allGrains.length);
        
        for (uint256 i = 0; i < allGrains.length; i++) {
            GrainPool pool = GrainPool(grainPools[allGrains[i]].poolAddress);
            pools[i] = grainPools[allGrains[i]].poolAddress;
            aprs[i] = pool.currentAPR();
        }
        
        return (pools, aprs);
    }
}
