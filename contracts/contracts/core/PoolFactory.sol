// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./LendingPool.sol";

contract PoolFactory {
    address[] public allPools;

    event PoolCreated(address indexed poolAddress, address indexed underlyingToken, address indexed collateralToken);

    function createPool(
        address underlyingToken,
        address collateralToken,
        address interestRateModelAddress,
        uint256 reserveFactor,
        address priceOracle,
        uint256 loanToValue,
        uint256 liquidationThreshold,
        uint256 liquidationBonus
    ) external returns (address) {
        LendingPool pool = new LendingPool(
            underlyingToken,
            collateralToken,
            interestRateModelAddress,
            reserveFactor,
            priceOracle,
            loanToValue,
            liquidationThreshold,
            liquidationBonus,
            msg.sender
        );
        allPools.push(address(pool));
        emit PoolCreated(address(pool), underlyingToken, collateralToken);
        return address(pool);
    }

    function getAllPools() external view returns (address[] memory) {
        return allPools;
    }

    function getAllPoolsWithDetails() external view returns (LendingPool.PoolDetails[] memory) {
        uint256 length = allPools.length;
        LendingPool.PoolDetails[] memory details = new LendingPool.PoolDetails[](length);
        for (uint256 i = 0; i < length; i++) {
            LendingPool pool = LendingPool(allPools[i]);
            details[i] = pool.getPoolDetails();
        }
        return details;
    }
}
