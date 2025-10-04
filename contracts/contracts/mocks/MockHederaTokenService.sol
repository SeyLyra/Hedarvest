// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IHederaTokenService {
    function transferToken(address token, address sender, address receiver, int64 amount) external returns (int);
    function mintToken(address token, int64 amount, bytes[] memory metadata) external returns (int, uint64, int32[] memory);
    function burnToken(address token, int64 amount, int64[] memory serialNumbers) external returns (int, uint64);
    function isAssociated(address account, address token) external view returns (int);
}

interface IERC20 {
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function mint(address to, uint256 amount) external;
    function burn(uint256 amount) external;
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
        if (status) {
            totalSupply[token] = IERC20(token).totalSupply();
        }
    }

    function associateToken(address account, address token) external {
        require(isToken[token], "Invalid token");
        associated[account][token] = true;
    }

    function isAssociated(address account, address token) external view override returns (int) {
        return associated[account][token] ? SUCCESS : TOKEN_NOT_ASSOCIATED_TO_ACCOUNT;
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
        IERC20(token).mint(msg.sender, uAmount);
        totalSupply[token] += uAmount;
        return (SUCCESS, uint64(amount), new int32[](0));
    }

    function burnToken(address token, int64 amount, int64[] memory) external override returns (int, uint64) {
        require(isToken[token], "Invalid token");
        require(amount >= 0, "Negative amount");
        uint256 uAmount = uint256(int256(amount));
        require(IERC20(token).balanceOf(msg.sender) >= uAmount, "Insufficient balance");
        IERC20(token).burn(uAmount);
        totalSupply[token] -= uAmount;
        return (SUCCESS, uint64(amount));
    }
}
