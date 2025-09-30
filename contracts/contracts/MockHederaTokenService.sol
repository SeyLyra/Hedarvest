// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IHederaTokenService {
    function associateToken(address account, address token) external returns (int);
    function transferToken(address token, address sender, address receiver, int64 amount) external returns (int);
    function mintToken(address token, int64 amount, bytes[] memory metadata) external returns (int, uint64, int32[] memory);
    function burnToken(address token, int64 amount, int64[] memory serialNumbers) external returns (int, uint64);
}

interface IERC20 {
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function approve(address spender, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
}

contract MockHederaTokenService is IHederaTokenService {
    int public constant SUCCESS = 22;
    int public constant TOKEN_NOT_ASSOCIATED_TO_ACCOUNT = 49;
    int public constant INSUFFICIENT_TOKEN_BALANCE = 15;

    mapping(address => bool) public isToken;
    mapping(address => mapping(address => bool)) public associated;
    mapping(address => uint256) public totalSupply;

    function setToken(address token, bool status) external {
        isToken[token] = status;
        totalSupply[token] = IERC20(token).totalSupply();
    }

    function associateToken(address account, address token) external override returns (int) {
        require(isToken[token], "Invalid token");
        require(!associated[account][token], "Already associated");
        associated[account][token] = true;
        return SUCCESS;
    }

    function transferToken(address token, address sender, address receiver, int64 amount) external override returns (int) {
        require(isToken[token], "Invalid token");
        require(associated[sender][token], "Sender not associated");
        require(associated[receiver][token], "Receiver not associated");
        require(amount >= 0, "Negative amount");
        uint256 uAmount = uint256(int256(amount));
        require(IERC20(token).balanceOf(sender) >= uAmount, "Insufficient balance");
        IERC20(token).transferFrom(sender, receiver, uAmount);
        return SUCCESS;
    }

    function mintToken(address token, int64 amount, bytes[] memory) external override returns (int, uint64, int32[] memory) {
        require(isToken[token], "Invalid token");
        require(amount >= 0, "Negative amount");
        uint256 uAmount = uint256(int256(amount));
        totalSupply[token] += uAmount;
        IERC20(token).transfer(msg.sender, uAmount);
        return (SUCCESS, uint64(totalSupply[token]), new int32[](0));
    }

    function burnToken(address token, int64 amount, int64[] memory) external override returns (int, uint64) {
        require(isToken[token], "Invalid token");
        require(amount >= 0, "Negative amount");
        uint256 uAmount = uint256(int256(amount));
        require(IERC20(token).balanceOf(msg.sender) >= uAmount, "Insufficient balance");
        IERC20(token).transferFrom(msg.sender, address(this), uAmount);
        totalSupply[token] -= uAmount;
        return (SUCCESS, uint64(totalSupply[token]));
    }
}
