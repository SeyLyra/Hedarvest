// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./IHederaTokenService.sol";
import "./HederaResponseCode.sol";

/// @title FaucetToken - Hedera HTS faucet token
/// @notice Anyone can mint via HTS precompile (for testing/demo only)
contract FaucetToken {
    IHederaTokenService private constant HTS = IHederaTokenService(address(0x167));
    address public tokenAddress;

    constructor(address _tokenAddress) {
        tokenAddress = _tokenAddress; // already created HTS fungible token
    }

    /// @notice Mint faucet tokens to caller
    /// @param amount The amount to mint (in lowest denomination)
    function faucetMint(int64 amount) external {
        // Mint to treasury account (this contract must be treasury)
        (int response, , ) = HTS.mintToken(tokenAddress, amount, new bytes[](0));
        require(response == HederaResponseCodes.SUCCESS, "Mint failed");

        // Transfer to caller
        address[] memory receivers = new address[](2);
        int64[] memory amounts = new int64[](2);

        receivers[0] = address(this);     // from treasury
        receivers[1] = msg.sender;        // to caller

        amounts[0] = -amount;
        amounts[1] = amount;

        int transferResponse = HTS.transferTokens(tokenAddress, receivers, amounts);
        require(transferResponse == HederaResponseCodes.SUCCESS, "Transfer failed");
    }
}
