// scripts/create-tokens-for-pool.js
const {
    Client,
    AccountId,
    PrivateKey,
    TokenCreateTransaction,
    TokenType,
    ContractId,
  } = require("@hashgraph/sdk");
  require("dotenv").config();
  
  function makeClient() {
    const client = Client.forTestnet();
    client.setOperator(
      AccountId.fromString(process.env.HEDERA_ACCOUNT_ID),
      PrivateKey.fromString(process.env.HEDERA_PRIVATE_KEY)
    );
    return client;
  }
  
  async function createLPTokenForPool(name, symbol, decimals, poolEvm, client) {
    const poolContractId = ContractId.fromEvmAddress(0, 0, poolEvm);
    const tx = await new TokenCreateTransaction()
      .setTokenName(name)
      .setTokenSymbol(symbol)
      .setTokenType(TokenType.FungibleCommon)
      .setDecimals(decimals)
      .setInitialSupply(0)
      // Treasury is the pool contract's account
      .setTreasuryAccountId(AccountId.fromEvmAddress(0, 0, poolEvm))
      // Pool contract can mint/burn via precompile
      .setSupplyKey(poolContractId)
      .setFreezeDefault(false)
      .execute(client);
  
    const receipt = await tx.getReceipt(client);
    return receipt.tokenId;
  }
  
  async function createDebtTokenForPool(name, symbol, decimals, poolEvm, client) {
    const poolContractId = ContractId.fromEvmAddress(0, 0, poolEvm);
    const tx = await new TokenCreateTransaction()
      .setTokenName(name)
      .setTokenSymbol(symbol)
      .setTokenType(TokenType.FungibleCommon)
      .setDecimals(decimals)
      .setInitialSupply(0)
      .setTreasuryAccountId(AccountId.fromEvmAddress(0, 0, poolEvm))
      .setSupplyKey(poolContractId)
      .setWipeKey(poolContractId) // needed for wipe in repay/liquidate
      .setFreezeDefault(false)
      .execute(client);
  
    const receipt = await tx.getReceipt(client);
    return receipt.tokenId;
  }
  
  module.exports = {
    makeClient,
    createLPTokenForPool,
    createDebtTokenForPool,
  };
  