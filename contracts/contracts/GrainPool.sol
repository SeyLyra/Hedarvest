// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract GrainPool {
    string public grainType;
    uint256 public totalDeposits;

    event Deposited(address indexed user, uint256 amount);

    constructor(string memory _grainType) {
        grainType = _grainType;
    }

    function deposit(uint256 amount) external {
        totalDeposits += amount;
        emit Deposited(msg.sender, amount);
    }
}
