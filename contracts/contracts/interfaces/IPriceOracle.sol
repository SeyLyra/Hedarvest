// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title IPriceOracle
 * @notice Interface for price oracle contracts
 * @dev Defines the standard interface for price feed implementations
 */
interface IPriceOracle {
    /**
     * @notice Get the current price of an asset
     * @param asset The asset identifier
     * @return The current price of the asset
     */
    function getPrice(string memory asset) external view returns (uint256);
    
    /**
     * @notice Check if a price is stale
     * @param asset The asset identifier
     * @return True if the price is stale
     */
    function isPriceStale(string memory asset) external view returns (bool);
    
    /**
     * @notice Set the price for an asset
     * @param asset The asset identifier
     * @param price The new price
     */
    function setPrice(string memory asset, uint256 price) external;
    
    /**
     * @notice Get the last update time for an asset
     * @param asset The asset identifier
     * @return The timestamp of the last update
     */
    function getLastUpdateTime(string memory asset) external view returns (uint256);
}
