// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract InterestRateModel {
    uint256 public immutable baseRatePerSecond;
    uint256 public immutable slope1PerSecond;
    uint256 public immutable slope2PerSecond;
    uint256 public immutable kink;

    constructor(uint256 baseRate, uint256 slope1, uint256 slope2, uint256 kink_) {
        require(kink_ <= 1e18, "INVALID_KINK");
        baseRatePerSecond = baseRate;
        slope1PerSecond = slope1;
        slope2PerSecond = slope2;
        kink = kink_;
    }

    function getBorrowRatePerSecond(uint256 utilization1e18) external view returns (uint256) {
        if (utilization1e18 <= kink) {
            return baseRatePerSecond + (slope1PerSecond * utilization1e18) / 1e18;
        } else {
            uint256 rateAtKink = baseRatePerSecond + (slope1PerSecond * kink) / 1e18;
            uint256 excessUtil = utilization1e18 - kink;
            return rateAtKink + (slope2PerSecond * excessUtil) / 1e18;
        }
    }
}