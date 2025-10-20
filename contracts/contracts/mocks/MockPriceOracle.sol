// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IPriceOracle {
    function getPrice(address token) external view returns (uint256 price, uint8 decimals);
}

contract MockPriceOracle is IPriceOracle {
    mapping(address => uint256) public prices;
    mapping(address => uint8) public decimals;

    function setPrice(address token, uint256 price, uint8 dec) external {
        prices[token] = price;
        decimals[token] = dec;
    }

    function getPrice(address token) external view returns (uint256, uint8) {
        return (prices[token], decimals[token]);
    }
}