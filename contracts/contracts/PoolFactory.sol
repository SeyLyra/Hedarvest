// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract PoolFactory {
    address[] public allPools;
    event PoolCreated(address indexed pool);

    function createPool(address pool) external {
        allPools.push(pool);
        emit PoolCreated(pool);
    }

    function getPools() external view returns (address[] memory) {
        return allPools;
    }
}
