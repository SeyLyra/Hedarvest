// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./IHederaTokenService.sol";
import "./HederaResponseCode.sol";

/// @title MockToken
/// @notice Simple wrapper contract around an existing HTS token for testing.
/// @dev Assumes this contract is set as both the treasury and supplyKey during token creation.
contract MockToken {
    IHederaTokenService private constant HTS = IHederaTokenService(address(0x167));

    address public immutable tokenAddress;

    constructor(address _tokenAddress) {
        require(_tokenAddress != address(0), "Invalid token address");
        tokenAddress = _tokenAddress;
    }

    /// @notice Faucet mint tokens to msg.sender (only works if this contract is the supplyKey + treasury).
    /// @param amount Number of tokens (in smallest unit, e.g. tinybars) to mint
    function faucetMint(int64 amount) external {
        require(amount > 0, "Invalid mint amount");

        // Mint new supply into this contract (treasury)
        (int64 response, , ) = HTS.mintToken(tokenAddress, amount, new bytes[](0));
        require(response == HederaResponseCodes.SUCCESS, "Mint failed");

        // Transfer minted tokens from this contract (treasury) to caller
        int transferResponse = HTS.transferToken(tokenAddress, address(this), msg.sender, amount);
        require(transferResponse == HederaResponseCodes.SUCCESS, "Transfer failed");
    }

    /// @notice Burn tokens from caller
    /// @param amount Number of tokens to burn
    function faucetBurn(int64 amount) external {
        require(amount > 0, "Invalid burn amount");

        // First, transfer tokens from caller → this contract (treasury)
        int transferResponse = HTS.transferToken(tokenAddress, msg.sender, address(this), amount);
        require(transferResponse == HederaResponseCodes.SUCCESS, "Transfer-in failed");

        // Burn the tokens from this contract's balance
        (int64 burnResponse, ) = HTS.burnToken(tokenAddress, amount, new int64[](0));
        require(burnResponse == HederaResponseCodes.SUCCESS, "Burn failed");
    }

    /// @notice Convenience getter for this contract's balance
    function balanceOf(address) external pure returns (uint256) {
        // HTS doesn't expose balanceOf in precompile, so in tests you'll check via mirror node
        // If you want to simulate balanceOf, you could emit Mint/Burn events and track off-chain.
        revert("Check balance via Mirror Node or HTS query");
    }
}
