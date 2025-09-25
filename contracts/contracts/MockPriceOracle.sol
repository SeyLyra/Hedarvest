// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";

/// @title Mock Oracle for Grain Price
/// @notice Stores grain prices in USD (1e18 precision)
contract MockPriceOracle is Ownable {
    mapping(string => uint256) public grainPrices;

    event PriceUpdated(string grainType, uint256 newPrice);

    constructor() {}

    function setPrice(string calldata grainType, uint256 newPrice) external onlyOwner {
        grainPrices[grainType] = newPrice;
        emit PriceUpdated(grainType, newPrice);
    }

    function getPrice(string calldata grainType) external view returns (uint256) {
        require(grainPrices[grainType] > 0, "Price not set");
        return grainPrices[grainType];
    }
}
