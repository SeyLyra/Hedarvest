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

    mapping(string => PoolInfo) public grainPools;
    string[] public allGrains;

    event PoolCreated(address indexed pool, address indexed oracle, string grainType);

    function createPool(
        string calldata grainType,
        address lendingToken,
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
}
