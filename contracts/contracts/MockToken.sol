// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title MockToken - Simple mintable ERC20 for testing and deployments
contract MockToken is ERC20, Ownable {
    constructor(string memory name_, string memory symbol_, address owner_) ERC20(name_, symbol_) {
        _transferOwnership(owner_);
    }

    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}


