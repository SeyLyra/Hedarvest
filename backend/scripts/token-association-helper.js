// Hedera Token Association Helper Script
// This script helps automate token association for users and contracts

const { Client, AccountId, PrivateKey, TokenAssociateTransaction } = require("@hashgraph/sdk");

/**
 * Associate a token with an account using the provided credentials
 * @param {string} accountIdStr - The account ID to associate the token with
 * @param {string} privateKeyStr - The private key for the account (hex format)
 * @param {string} tokenIdStr - The token ID to associate
 * @param {string} network - The Hedera network (testnet, mainnet, etc.)
 * @returns {Promise<Object>} - The association result
 */
async function associateToken(accountIdStr, privateKeyStr, tokenIdStr, network = 'testnet') {
  try {
    
    // Initialize client
    const client = Client.forName(network);
    
    // Parse account and token IDs
    const accountId = AccountId.fromString(accountIdStr);
    const tokenId = require("@hashgraph/sdk").TokenId.fromString(tokenIdStr);
    const privateKey = PrivateKey.fromString(privateKeyStr);
    
    // Set operator (the account that will sign the transaction)
    client.setOperator(accountId, privateKey);
    
    // Step 1: Create Association Transaction
    const transaction = new TokenAssociateTransaction()
      .setAccountId(accountId)
      .setTokenIds([tokenId]);

    // Step 2: Sign with the account's private key
    const signedTx = await transaction.freezeWith(client).sign(privateKey);

    // Step 3: Submit and get receipt
    const executeResult = await signedTx.execute(client);
    const receipt = await executeResult.getReceipt(client);

    if (receipt.status.toString() === "SUCCESS") {
      return {
        success: true,
        transactionId: executeResult.transactionId.toString(),
        status: receipt.status.toString(),
        message: `Token ${tokenIdStr} successfully associated with account ${accountIdStr}`
      };
    } else {
      return {
        success: false,
        status: receipt.status.toString(),
        message: `Association failed: ${receipt.status.toString()}`
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error.message,
      message: `Association failed: ${error.message}`
    };
  }
}

/**
 * Batch associate multiple tokens with an account
 * @param {string} accountIdStr - The account ID
 * @param {string} privateKeyStr - The private key
 * @param {string[]} tokenIds - Array of token IDs to associate
 * @param {string} network - The Hedera network
 * @returns {Promise<Object[]>} - Array of association results
 */
async function batchAssociateTokens(accountIdStr, privateKeyStr, tokenIds, network = 'testnet') {
  const results = [];
  
  for (const tokenIdStr of tokenIds) {
    const result = await associateToken(accountIdStr, privateKeyStr, tokenIdStr, network);
    results.push({ tokenId: tokenIdStr, ...result });
    
    // Add a small delay between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  return results;
}

// Example usage when script is run directly
if (require.main === module) {
  // Configuration - Replace with your actual values
  const CONFIG = {
    // Replace these with your actual values
    ACCOUNT_ID: process.env.HEDERA_ACCOUNT_ID || "0.0.xxxx",
    PRIVATE_KEY: process.env.HEDERA_PRIVATE_KEY || "302e...",
    TOKEN_ID: process.env.HEDERA_TOKEN_ID || "0.0.yyyy",
    NETWORK: process.env.HEDERA_NETWORK || "testnet"
  };

  // Run the association
  associateToken(CONFIG.ACCOUNT_ID, CONFIG.PRIVATE_KEY, CONFIG.TOKEN_ID, CONFIG.NETWORK)
    .then(result => {
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      process.exit(1);
    });
}

module.exports = {
  associateToken,
  batchAssociateTokens
};

