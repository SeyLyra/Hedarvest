// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";

/// @title Mock Grain Price Oracle
/// @notice Simple on-chain oracle to store and fetch grain prices in USD (1e18 precision)
/// @dev Used for testing & hackathon demo purposes only
contract MockPriceOracle is Ownable {
    // Mapping grainType => USD price with 1e18 precision
    mapping(string => uint256) private grainPrices;

    /// @notice Emitted when a price is updated
    event PriceUpdated(string indexed grainType, uint256 newPrice, uint256 timestamp);

    constructor() {}

    /// @notice Set the USD price of a grain
    /// @param grainType The string identifier of the grain (e.g. "Rice", "Corn")
    /// @param newPrice The new USD price, scaled to 1e18 (e.g. $200 = 200e18)
    function setPrice(string calldata grainType, uint256 newPrice) external onlyOwner {
        require(newPrice > 0, "Invalid price");
        grainPrices[grainType] = newPrice;
        emit PriceUpdated(grainType, newPrice, block.timestamp);
    }

    /// @notice Get the USD price of a grain
    /// @param grainType The string identifier of the grain
    /// @return price The USD price scaled to 1e18
    function getPrice(string calldata grainType) external view returns (uint256 price) {
        price = grainPrices[grainType];
        require(price > 0, "Price not set");
    }

    /// @notice Batch update multiple grain prices at once (hackathon helper)
    function setBatchPrices(string[] calldata grainTypes, uint256[] calldata newPrices) external onlyOwner {
        require(grainTypes.length == newPrices.length, "Length mismatch");
        for (uint256 i = 0; i < grainTypes.length; i++) {
            require(newPrices[i] > 0, "Invalid price");
            grainPrices[grainTypes[i]] = newPrices[i];
            emit PriceUpdated(grainTypes[i], newPrices[i], block.timestamp);
        }
    }
}
