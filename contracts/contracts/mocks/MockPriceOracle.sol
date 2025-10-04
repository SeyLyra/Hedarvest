// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract MockPriceOracle {
    mapping(string => uint256) private prices;
    mapping(string => uint256) private lastUpdateTime;
    uint256 public constant STALE_PRICE_THRESHOLD = 3600; // 1 hour

    function setPrice(string memory asset, uint256 price) external {
        prices[asset] = price;
        lastUpdateTime[asset] = block.timestamp;
    }

    function getPrice(string memory asset) external view returns (uint256) {
        return prices[asset];
    }

    function isPriceStale(string memory asset) external view returns (bool) {
        return block.timestamp - lastUpdateTime[asset] > STALE_PRICE_THRESHOLD;
    }
}
