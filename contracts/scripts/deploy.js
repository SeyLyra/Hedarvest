// SPDX-License-Identifier: MIT
// scripts/deploy.js

const { ethers } = require("hardhat");
const {
  Client,
  AccountId,
  PrivateKey,
  TokenCreateTransaction,
  TokenType,
  TransferTransaction,
  Hbar,
  TokenInfoQuery,
  TokenAssociateTransaction,
  AccountCreateTransaction,
  TokenUpdateTransaction,
} = require("@hashgraph/sdk");
require("dotenv").config();
const fetch = require('node-fetch'); // Install with: npm install node-fetch

// Patch Hardhat-Ethers v6
ethers.provider.resolveName = async (name) => name;

// --- FIX 1: Add Sleep Utility ---
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function main() {
  // Validate .env
  if (!process.env.HEDERA_ACCOUNT_ID || !process.env.HEDERA_PRIVATE_KEY) {
    throw new Error("❌ Set HEDERA_ACCOUNT_ID & HEDERA_PRIVATE_KEY in .env");
  }

  // Get signers and check availability
  const signers = await ethers.getSigners();
  const deployer = signers[0];
  let user1 = signers[1];
  let user2 = signers[2];

  console.log("🚀 Deploying with:", deployer.address);
  if (!user1 || !user2) {
    console.warn("⚠️ Not enough signers. Creating Hedera accounts for user1 and user2...");
  }

  const hederaClient = Client.forTestnet();
  hederaClient.setOperator(
    AccountId.fromString(process.env.HEDERA_ACCOUNT_ID),
    PrivateKey.fromString(process.env.HEDERA_PRIVATE_KEY)
  );

  // ──────────────────────────────────────────────── UTILITY FUNCTIONS ────────────────────────────────────────────────
  async function fundContract(evmAddress, amount = 0.01) {
    const fromId = AccountId.fromString(process.env.HEDERA_ACCOUNT_ID);
    const toId = AccountId.fromEvmAddress(0, 0, evmAddress);
    const tx = await new TransferTransaction()
      .addHbarTransfer(fromId, Hbar.from(-amount))
      .addHbarTransfer(toId, Hbar.from(amount))
      .execute(hederaClient);
    await tx.getReceipt(hederaClient);
    console.log(`💰 Funded ${evmAddress} with ${amount} HBAR`);
  }

  async function validateToken(tokenId) {
    const info = await new TokenInfoQuery().setTokenId(tokenId).execute(hederaClient);
    console.log(`✅ Token ${tokenId}: ${info.name} (${info.symbol})`);
    return info;
  }

  async function createHederaAccount() {
    const newKey = PrivateKey.generateED25519();
    const tx = await new AccountCreateTransaction()
      .setKey(newKey)
      .setInitialBalance(Hbar.from(0.01))
      .execute(hederaClient);
    const receipt = await tx.getReceipt(hederaClient);
    const accountId = receipt.accountId;
    return { accountId, privateKey: newKey, evmAddress: accountId.toSolidityAddress() };
  }

  /**
   * Associates a list of HTS tokens with a given contract's Hedera Account ID.
   */
  async function associateContractTokens(nativeIdStr, tokenIds) {
    const accountId = AccountId.fromString(nativeIdStr);
    const tx = await new TokenAssociateTransaction()
      .setAccountId(accountId)
      .setTokenIds(tokenIds)
      .execute(hederaClient);
    await tx.getReceipt(hederaClient);
    console.log(`🔗 Associated ${tokenIds.length} tokens with contract ${nativeIdStr}`);
  }

  /**
   * Polls the mirror node to resolve the native contract ID (0.0.X) from the EVM address.
   * This bypasses alias resolution issues in transactions.
   */
  async function resolveContractId(evmAddress, maxAttempts = 300, delayMs = 200000) {
    const mirrorUrl = `https://testnet.mirrornode.hedera.com/api/v1/contracts/${evmAddress.toLowerCase()}`;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const response = await fetch(mirrorUrl);
        if (response.ok) {
          const data = await response.json();
          if (data.contract_id) {
            console.log(`✅ Resolved native contract ID: ${data.contract_id} for EVM ${evmAddress}`);
            return data.contract_id;  // e.g., '0.0.7109054'
          }
        }
      } catch (err) {
        console.error(`Mirror query error on attempt ${attempt}:`, err.message);
      }
      console.log(`⏳ Attempt ${attempt}/${maxAttempts}: Contract ID not resolved yet, retrying in ${delayMs/1000}s...`);
      if (attempt < maxAttempts) await sleep(delayMs);
    }
    throw new Error(`❌ Failed to resolve contract ID for ${evmAddress} after ${maxAttempts} attempts`);
  }

  // Create user accounts if missing
  if (!user1) {
    const { evmAddress, privateKey } = await createHederaAccount();
    user1 = { address: `0x${evmAddress}`, privateKey: privateKey.toStringRaw() };
    console.log(`✅ Created user1: 0x${evmAddress}`);
  }
  if (!user2) {
    const { evmAddress, privateKey } = await createHederaAccount();
    user2 = { address: `0x${evmAddress}`, privateKey: privateKey.toStringRaw() };
    console.log(`✅ Created user2: 0x${evmAddress}`);
  }

  // ──────────────────────────────────────────────── CREATE TOKENS ────────────────────────────────────────────────
  console.log("\n🪙 Creating Mock Tokens...");
  const { createLPToken, createDebtToken } = require("./create-tokens");

  // Underlying: USDC
  const usdcTx = await new TokenCreateTransaction()
    .setTokenName("TestUSDC")
    .setTokenSymbol("TUSDC")
    .setDecimals(6)
    .setInitialSupply(1000000 * 1e6)
    .setTreasuryAccountId(AccountId.fromString(process.env.HEDERA_ACCOUNT_ID))
    .setAdminKey(hederaClient.operatorPublicKey)
    .setSupplyKey(hederaClient.operatorPublicKey)
    .execute(hederaClient);
  const usdcReceipt = await usdcTx.getReceipt(hederaClient);
  const usdcTokenId = usdcReceipt.tokenId;
  const usdcAddress = usdcTokenId.toSolidityAddress();
  await validateToken(usdcTokenId);

  // Collateral: WHEAT
  const wheatTx = await new TokenCreateTransaction()
    .setTokenName("PropertyTokenWHEAT")
    .setTokenSymbol("WHEAT")
    .setDecimals(8)
    .setInitialSupply(100 * 1e8)
    .setTreasuryAccountId(AccountId.fromString(process.env.HEDERA_ACCOUNT_ID))
    .setAdminKey(hederaClient.operatorPublicKey)
    .setSupplyKey(hederaClient.operatorPublicKey)
    .execute(hederaClient);
  const wheatReceipt = await wheatTx.getReceipt(hederaClient);
  const wheatTokenId = wheatReceipt.tokenId;
  const wheatAddress = wheatTokenId.toSolidityAddress();
  await validateToken(wheatTokenId);

  // Collateral: RICE
  const riceTx = await new TokenCreateTransaction()
    .setTokenName("PropertyTokenRICE")
    .setTokenSymbol("RICE")
    .setDecimals(8)
    .setInitialSupply(100 * 1e8)
    .setTreasuryAccountId(AccountId.fromString(process.env.HEDERA_ACCOUNT_ID))
    .setAdminKey(hederaClient.operatorPublicKey)
    .setSupplyKey(hederaClient.operatorPublicKey)
    .execute(hederaClient);
  const riceReceipt = await riceTx.getReceipt(hederaClient);
  const riceTokenId = riceReceipt.tokenId;
  const riceAddress = riceTokenId.toSolidityAddress();
  await validateToken(riceTokenId);

  // ──────────────────────────────────────────────── DEPLOY CONTRACTS & FUND ────────────────────────────────────────────────
  console.log("\n📡 Deploying MockPriceOracle...");
  const MockPriceOracle = await ethers.getContractFactory("MockPriceOracle");
  const oracle = await MockPriceOracle.deploy();
  await fundContract(oracle.target);
  await oracle.setPrice(usdcAddress, ethers.parseUnits("1", 8), 8);
  await oracle.setPrice(wheatAddress, ethers.parseUnits("100000", 8), 8);
  await oracle.setPrice(riceAddress, ethers.parseUnits("100000", 8), 8);

  console.log("\n📈 Deploying InterestRateModel...");
  const InterestRateModel = await ethers.getContractFactory("InterestRateModel");
  const interestRateModel = await InterestRateModel.deploy(
    ethers.parseUnits("0.0000000317", 18),
    ethers.parseUnits("0.0000000634", 18),
    ethers.parseUnits("0.0000001584", 18),
    ethers.parseUnits("0.8", 18)
  );
  await fundContract(interestRateModel.target);

  console.log("\n🏭 Deploying PoolFactory...");
  const PoolFactory = await ethers.getContractFactory("PoolFactory");
  const poolFactory = await PoolFactory.deploy();
  await fundContract(poolFactory.target);

  // ──────────────────────────────────────────────── CREATE & INITIALIZE POOLS ────────────────────────────────────────────────
  const params = [
    interestRateModel.target,
    ethers.parseUnits("0.1", 18),
    oracle.target,
    ethers.parseUnits("0.75", 18),
    ethers.parseUnits("0.8", 18),
    ethers.parseUnits("0.05", 18)
  ];

  // WHEAT Pool
  console.log("\n🌾 Creating WHEAT Pool...");
  let tx = await poolFactory.createPool(usdcAddress, wheatAddress, ...params);
  let receipt = await tx.wait();
  const wheatPoolAddress = receipt.logs.find(log => log.fragment?.name === "PoolCreated")?.args?.poolAddress;
  const wheatPool = await ethers.getContractAt("LendingPool", wheatPoolAddress);
  await fundContract(wheatPoolAddress, 0.02);
  
  // --- CRITICAL STABILITY STEP: Resolve native contract ID via mirror node ---
  console.log("⏸️ Resolving native Hedera Contract ID (CRITICAL STEP)...");
  const wheatPoolNativeId = await resolveContractId(wheatPoolAddress);
  const wheatPoolAccountId = AccountId.fromString(wheatPoolNativeId);

  // Create LP and Debt tokens for WHEAT pool
  console.log("🪙 Creating WHEAT Pool Tokens...");
  const wheatLPToken = await createLPToken("LP-USDC-WHEAT", "LPWHEAT", 6, hederaClient);
  const wheatDebtToken = await createDebtToken("Debt-USDC-WHEAT", "dWHEAT", 6, hederaClient);

  // 1. Associate LP/Debt tokens with pool (do this FIRST, safe even with 0 supply)
  console.log("🔗 Associating LP/Debt tokens with WHEAT Pool contract...");
  await associateContractTokens(wheatPoolNativeId, [wheatLPToken, wheatDebtToken]);

  // 2. Update treasury to pool using native ID (no alias, no retries needed)
  console.log("🔄 Updating WHEAT LP token treasury to pool...");
  const lpUpdateTx = await new TokenUpdateTransaction()
    .setTokenId(wheatLPToken)
    .setTreasuryAccountId(wheatPoolAccountId)
    .execute(hederaClient);
  await lpUpdateTx.getReceipt(hederaClient);

  console.log("🔄 Updating WHEAT Debt token treasury to pool...");
  const debtUpdateTx = await new TokenUpdateTransaction()
    .setTokenId(wheatDebtToken)
    .setTreasuryAccountId(wheatPoolAccountId)
    .execute(hederaClient);
  await debtUpdateTx.getReceipt(hederaClient);

  // 3. Initialize Tokens
  await wheatPool.initializeTokens(
    `0x${wheatLPToken.toSolidityAddress()}`,
    `0x${wheatDebtToken.toSolidityAddress()}`
  );
  console.log("✅ WHEAT Pool:", wheatPoolAddress);

  // RICE Pool
  console.log("\n🍚 Creating RICE Pool...");
  tx = await poolFactory.createPool(usdcAddress, riceAddress, ...params);
  receipt = await tx.wait();
  const ricePoolAddress = receipt.logs.find(log => log.fragment?.name === "PoolCreated")?.args?.poolAddress;
  const ricePool = await ethers.getContractAt("LendingPool", ricePoolAddress);
  await fundContract(ricePoolAddress, 0.02);

  // --- CRITICAL STABILITY STEP: Resolve native contract ID via mirror node ---
  console.log("⏸️ Resolving native Hedera Contract ID (CRITICAL STEP)...");
  const ricePoolNativeId = await resolveContractId(ricePoolAddress);
  const ricePoolAccountId = AccountId.fromString(ricePoolNativeId);

  // Create LP and Debt tokens for RICE pool
  console.log("🪙 Creating RICE Pool Tokens...");
  const riceLPToken = await createLPToken("LP-USDC-RICE", "LPRICE", 6, hederaClient);
  const riceDebtToken = await createDebtToken("Debt-USDC-RICE", "dRICE", 6, hederaClient);

  // 1. Associate LP/Debt tokens with pool (do this FIRST, safe even with 0 supply)
  console.log("🔗 Associating LP/Debt tokens with RICE Pool contract...");
  await associateContractTokens(ricePoolNativeId, [riceLPToken, riceDebtToken]);

  // 2. Update treasury to pool using native ID (no alias, no retries needed)
  console.log("🔄 Updating RICE LP token treasury to pool...");
  const riceLpUpdateTx = await new TokenUpdateTransaction()
    .setTokenId(riceLPToken)
    .setTreasuryAccountId(ricePoolAccountId)
    .execute(hederaClient);
  await riceLpUpdateTx.getReceipt(hederaClient);

  console.log("🔄 Updating RICE Debt token treasury to pool...");
  const riceDebtUpdateTx = await new TokenUpdateTransaction()
    .setTokenId(riceDebtToken)
    .setTreasuryAccountId(ricePoolAccountId)
    .execute(hederaClient);
  await riceDebtUpdateTx.getReceipt(hederaClient);

  // 3. Initialize Tokens
  await ricePool.initializeTokens(
    `0x${riceLPToken.toSolidityAddress()}`,
    `0x${riceDebtToken.toSolidityAddress()}`
  );
  console.log("✅ RICE Pool:", ricePoolAddress);

  // ──────────────────────────────────────────────── ASSOCIATE & DISTRIBUTE TO USERS ────────────────────────────────────────────────
  console.log("\n🔗 Associating & Distributing to Users...");
  const users = [deployer, user1, user2].filter(user => user && user.address);
  for (const user of users) {
    try {
      // Associate base tokens
      const assocTx = await new TokenAssociateTransaction()
        .setAccountId(AccountId.fromEvmAddress(0, 0, user.address))
        .setTokenIds([usdcTokenId, wheatTokenId, riceTokenId])
        .execute(hederaClient);
      await assocTx.getReceipt(hederaClient);
      console.log(`✅ Associated base tokens for ${user.address}`);

      // Distribute
      const transferTx = await new TransferTransaction()
        .addTokenTransfer(usdcTokenId, AccountId.fromString(process.env.HEDERA_ACCOUNT_ID), -10000 * 1e6)
        .addTokenTransfer(usdcTokenId, AccountId.fromEvmAddress(0, 0, user.address), 10000 * 1e6)
        .addTokenTransfer(wheatTokenId, AccountId.fromString(process.env.HEDERA_ACCOUNT_ID), -10 * 1e8)
        .addTokenTransfer(wheatTokenId, AccountId.fromEvmAddress(0, 0, user.address), 10 * 1e8)
        .addTokenTransfer(riceTokenId, AccountId.fromString(process.env.HEDERA_ACCOUNT_ID), -10 * 1e8)
        .addTokenTransfer(riceTokenId, AccountId.fromEvmAddress(0, 0, user.address), 10 * 1e8)
        .execute(hederaClient);
      await transferTx.getReceipt(hederaClient);
      console.log(`✅ Distributed tokens to ${user.address}: 10k USDC, 10 WHEAT, 10 RICE`);
    } catch (error) {
      console.error(`⚠️ Failed for ${user.address}: ${error.message}`);
      if (error.status) console.error(`Hedera Status: ${error.status}`);
    }
  }

  // ──────────────────────────────────────────────── SUMMARY ────────────────────────────────────────────────
  console.log("\n🎉 DEPLOYMENT COMPLETE!");
  console.log("\n📋 ADDRESSES:");
  console.log("PoolFactory:", poolFactory.target);
  console.log("Oracle:", oracle.target);
  console.log("InterestRateModel:", interestRateModel.target);
  console.log("USDC:", usdcAddress);
  console.log("WHEAT:", wheatAddress);
  console.log("RICE:", riceAddress);
  console.log("WHEAT Pool:", wheatPoolAddress);
  console.log("WHEAT LP Token:", wheatLPToken.toString());
  console.log("WHEAT Debt Token:", wheatDebtToken.toString());
  console.log("RICE Pool:", ricePoolAddress);
  console.log("RICE LP Token:", riceLPToken.toString());
  console.log("RICE Debt Token:", riceDebtToken.toString());

  // Save to file
  const fs = require('fs');
  fs.writeFileSync('./deployed.json', JSON.stringify({
    poolFactory: poolFactory.target,
    oracle: oracle.target,
    interestRateModel: interestRateModel.target,
    usdc: usdcAddress,
    wheat: wheatAddress,
    rice: riceAddress,
    wheatPool: wheatPoolAddress,
    wheatLPToken: wheatLPToken.toString(),
    wheatDebtToken: wheatDebtToken.toString(),
    ricePool: ricePoolAddress,
    riceLPToken: riceLPToken.toString(),
    riceDebtToken: riceDebtToken.toString(),
  }, null, 2));
}

main().catch((error) => {
  console.error("❌ ERROR:", error);
  process.exit(1);
});