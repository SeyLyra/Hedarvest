const { Client, AccountId, PrivateKey, TokenCreateTransaction, TokenType } = require("@hashgraph/sdk");
require('dotenv').config();

async function createLPToken(name, symbol, decimals, client = null) {
  const hederaClient = client || Client.forTestnet();
  
  if (!client) {
    hederaClient.setOperator(
      AccountId.fromString(process.env.HEDERA_ACCOUNT_ID),
      PrivateKey.fromString(process.env.HEDERA_PRIVATE_KEY)
    );
  }

  console.log(`Creating LP Token: ${name} (${symbol})`);

  const tokenCreateTx = new TokenCreateTransaction()
    .setTokenName(name)
    .setTokenSymbol(symbol)
    .setTokenType(TokenType.FungibleCommon)
    .setDecimals(decimals)
    .setInitialSupply(0) // Initial supply is 0, will be minted by pool
    .setTreasuryAccountId(AccountId.fromString(process.env.HEDERA_ACCOUNT_ID)) // Temporary treasury
    .setAdminKey(hederaClient.operatorPublicKey)
    .setSupplyKey(hederaClient.operatorPublicKey) // Pool needs this to mint
    .setFreezeDefault(false);

  const tokenCreateSign = await tokenCreateTx.execute(hederaClient);
  const tokenCreateReceipt = await tokenCreateSign.getReceipt(hederaClient);
  const tokenId = tokenCreateReceipt.tokenId;

  console.log(`✅ LP Token created: ${tokenId.toString()}`);
  return tokenId;
}

async function createDebtToken(name, symbol, decimals, client = null) {
  const hederaClient = client || Client.forTestnet();
  
  if (!client) {
    hederaClient.setOperator(
      AccountId.fromString(process.env.HEDERA_ACCOUNT_ID),
      PrivateKey.fromString(process.env.HEDERA_PRIVATE_KEY)
    );
  }

  console.log(`Creating Debt Token: ${name} (${symbol})`);

  const tokenCreateTx = new TokenCreateTransaction()
    .setTokenName(name)
    .setTokenSymbol(symbol)
    .setTokenType(TokenType.FungibleCommon)
    .setDecimals(decimals)
    .setInitialSupply(0) // Initial supply is 0, will be minted by pool
    .setTreasuryAccountId(AccountId.fromString(process.env.HEDERA_ACCOUNT_ID)) // Temporary treasury
    .setAdminKey(hederaClient.operatorPublicKey)
    .setSupplyKey(hederaClient.operatorPublicKey) // Pool needs this to mint
    .setWipeKey(hederaClient.operatorPublicKey) // CRITICAL: Pool needs this to wipe debt
    .setFreezeDefault(false);

  const tokenCreateSign = await tokenCreateTx.execute(hederaClient);
  const tokenCreateReceipt = await tokenCreateSign.getReceipt(hederaClient);
  const tokenId = tokenCreateReceipt.tokenId;

  console.log(`✅ Debt Token created: ${tokenId.toString()}`);
  return tokenId;
}

async function main() {
  try {
    const client = Client.forTestnet();
    client.setOperator(
      AccountId.fromString(process.env.HEDERA_ACCOUNT_ID),
      PrivateKey.fromString(process.env.HEDERA_PRIVATE_KEY)
    );

    // Create WHEAT pool tokens
    console.log("🌾 Creating WHEAT Pool Tokens...");
    const wheatLPToken = await createLPToken("LP-USDC-WHEAT", "LPWHEAT", 6, client);
    const wheatDebtToken = await createDebtToken("Debt-USDC-WHEAT", "dWHEAT", 6, client);

    // Create RICE pool tokens
    console.log("\n🍚 Creating RICE Pool Tokens...");
    const riceLPToken = await createLPToken("LP-USDC-RICE", "LPRICE", 6, client);
    const riceDebtToken = await createDebtToken("Debt-USDC-RICE", "dRICE", 6, client);

    console.log("\n🎉 All tokens created successfully!");
    console.log("\n📋 Token Addresses:");
    console.log(`WHEAT LP Token: ${wheatLPToken.toString()}`);
    console.log(`WHEAT Debt Token: ${wheatDebtToken.toString()}`);
    console.log(`RICE LP Token: ${riceLPToken.toString()}`);
    console.log(`RICE Debt Token: ${riceDebtToken.toString()}`);

    // Convert to EVM addresses for contract use
    console.log("\n🔗 EVM Addresses for contracts:");
    console.log(`WHEAT LP Token: 0x${wheatLPToken.toSolidityAddress()}`);
    console.log(`WHEAT Debt Token: 0x${wheatDebtToken.toSolidityAddress()}`);
    console.log(`RICE LP Token: 0x${riceLPToken.toSolidityAddress()}`);
    console.log(`RICE Debt Token: 0x${riceDebtToken.toSolidityAddress()}`);

    // Save to file
    const fs = require('fs');
    fs.writeFileSync('./tokens.json', JSON.stringify({
      wheatLPToken: wheatLPToken.toString(),
      wheatLPTokenEVM: `0x${wheatLPToken.toSolidityAddress()}`,
      wheatDebtToken: wheatDebtToken.toString(),
      wheatDebtTokenEVM: `0x${wheatDebtToken.toSolidityAddress()}`,
      riceLPToken: riceLPToken.toString(),
      riceLPTokenEVM: `0x${riceLPToken.toSolidityAddress()}`,
      riceDebtToken: riceDebtToken.toString(),
      riceDebtTokenEVM: `0x${riceDebtToken.toSolidityAddress()}`,
    }, null, 2));

  } catch (error) {
    console.error("❌ Error creating tokens:", error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { createLPToken, createDebtToken };