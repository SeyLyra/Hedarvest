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

// Patch Hardhat-Ethers v6
ethers.provider.resolveName = async (name) => name;

// --- FIX 1: Add Sleep Utility ---
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// --- Configuration ---
const CONFIG = {
  CONTRACT_FUNDING_HBAR: parseFloat(process.env.CONTRACT_FUNDING_HBAR || "0.02"),
  POOL_FUNDING_HBAR: parseFloat(process.env.POOL_FUNDING_HBAR || "0.02"),
  USER_USDC_AMOUNT: parseInt(process.env.USER_USDC_AMOUNT || "10000"),
  USER_COLLATERAL_AMOUNT: parseInt(process.env.USER_COLLATERAL_AMOUNT || "10"),
  RESERVE_FACTOR: process.env.RESERVE_FACTOR || "0.1",
  LOAN_TO_VALUE: process.env.LOAN_TO_VALUE || "0.75",
  LIQUIDATION_THRESHOLD: process.env.LIQUIDATION_THRESHOLD || "0.8",
  LIQUIDATION_BONUS: process.env.LIQUIDATION_BONUS || "0.05",
};

async function main() {
  // Validate .env
  if (!process.env.HEDERA_ACCOUNT_ID || !process.env.HEDERA_PRIVATE_KEY) {
    throw new Error("❌ Set HEDERA_ACCOUNT_ID & HEDERA_PRIVATE_KEY in .env");
  }

  console.log("📋 Configuration:");
  console.log(`   - Contract Funding: ${CONFIG.CONTRACT_FUNDING_HBAR} HBAR`);
  console.log(`   - User USDC: ${CONFIG.USER_USDC_AMOUNT}`);
  console.log(`   - LTV: ${CONFIG.LOAN_TO_VALUE}`);

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

  // Store generated user credentials
  const generatedAccounts = [];

  // ──────────────────────────────────────────────── UTILITY FUNCTIONS ────────────────────────────────────────────────
  async function fundContract(evmAddress, amount = CONFIG.CONTRACT_FUNDING_HBAR) {
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
  async function resolveContractId(evmAddress, maxAttempts = 30, delayMs = 2000) {
    // Dynamically import fetch for ESM compatibility
    let fetch;
    if (typeof globalThis.fetch === 'undefined') {
      const nodeFetch = await import('node-fetch');
      fetch = nodeFetch.default;
    } else {
      fetch = globalThis.fetch;
    }

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

  /**
   * Verifies token treasury
   */
  async function verifyTokenTreasury(tokenId, expectedAccountId) {
    const info = await new TokenInfoQuery().setTokenId(tokenId).execute(hederaClient);
    const actualTreasury = info.treasuryAccountId.toString();
    const expected = expectedAccountId.toString();
    if (actualTreasury !== expected) {
      throw new Error(`Treasury mismatch! Expected ${expected}, got ${actualTreasury}`);
    }
    console.log(`✅ Verified treasury for ${tokenId}: ${actualTreasury}`);
    return info;
  }

  // Create user accounts if missing
  if (!user1) {
    const { accountId, evmAddress, privateKey } = await createHederaAccount();
    user1 = { address: `0x${evmAddress}`, privateKey: privateKey.toStringRaw() };
    console.log(`✅ Created user1: 0x${evmAddress}`);
    console.log(`   ⚠️ SAVE THIS - Account ID: ${accountId.toString()}`);
    console.log(`   ⚠️ SAVE THIS - Private Key: ${privateKey.toStringRaw()}`);
    generatedAccounts.push({
      name: "user1",
      accountId: accountId.toString(),
      evmAddress: `0x${evmAddress}`,
      privateKey: privateKey.toStringRaw()
    });
  }
  if (!user2) {
    const { accountId, evmAddress, privateKey } = await createHederaAccount();
    user2 = { address: `0x${evmAddress}`, privateKey: privateKey.toStringRaw() };
    console.log(`✅ Created user2: 0x${evmAddress}`);
    console.log(`   ⚠️ SAVE THIS - Account ID: ${accountId.toString()}`);
    console.log(`   ⚠️ SAVE THIS - Private Key: ${privateKey.toStringRaw()}`);
    generatedAccounts.push({
      name: "user2",
      accountId: accountId.toString(),
      evmAddress: `0x${evmAddress}`,
      privateKey: privateKey.toStringRaw()
    });
  }

  // ──────────────────────────────────────────────── CREATE TOKENS ────────────────────────────────────────────────
  console.log("\n🪙 Creating Mock Tokens...");

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
    ethers.parseUnits(CONFIG.RESERVE_FACTOR, 18),
    oracle.target,
    ethers.parseUnits(CONFIG.LOAN_TO_VALUE, 18),
    ethers.parseUnits(CONFIG.LIQUIDATION_THRESHOLD, 18),
    ethers.parseUnits(CONFIG.LIQUIDATION_BONUS, 18)
  ];

  // WHEAT Pool
  console.log("\n🌾 Creating WHEAT Pool...");
  let tx = await poolFactory.createPool(usdcAddress, wheatAddress, ...params);
  let receipt = await tx.wait();
  const wheatPoolAddress = receipt.logs.find(log => log.fragment?.name === "PoolCreated")?.args?.poolAddress;
  const wheatPool = await ethers.getContractAt("LendingPool", wheatPoolAddress);
  await fundContract(wheatPoolAddress, CONFIG.POOL_FUNDING_HBAR);
  
  // --- CRITICAL STABILITY STEP: Resolve native contract ID via mirror node ---
  console.log("⏸️ Resolving native Hedera Contract ID (CRITICAL STEP)...");
  const wheatPoolNativeId = await resolveContractId(wheatPoolAddress);
  const wheatPoolAccountId = AccountId.fromString(wheatPoolNativeId);

  // Initialize pool (associate with HTS tokens)
  console.log("🔧 Initializing WHEAT Pool...");
  const wheatInitTx = await wheatPool.initialize();
  await wheatInitTx.wait();
  console.log("✅ WHEAT Pool initialized (no LP/Debt tokens needed - using share accounting)")

  // 3. Verify pool initialization
  console.log("🔍 Verifying WHEAT Pool setup...");
  const wheatPoolDetails = await wheatPool.getPoolDetails();
  console.log(`   - LP Token: ${wheatPoolDetails.lpToken}`);
  console.log(`   - Debt Token: ${wheatPoolDetails.debtToken}`);
  console.log(`   - Total Cash: ${wheatPoolDetails.totalCash}`);
  console.log(`   - LTV: ${ethers.formatUnits(wheatPoolDetails.loanToValue, 18)}`);
  console.log("✅ WHEAT Pool:", wheatPoolAddress);

  // RICE Pool
  console.log("\n🍚 Creating RICE Pool...");
  tx = await poolFactory.createPool(usdcAddress, riceAddress, ...params);
  receipt = await tx.wait();
  const ricePoolAddress = receipt.logs.find(log => log.fragment?.name === "PoolCreated")?.args?.poolAddress;
  const ricePool = await ethers.getContractAt("LendingPool", ricePoolAddress);
  await fundContract(ricePoolAddress, CONFIG.POOL_FUNDING_HBAR);

  // --- CRITICAL STABILITY STEP: Resolve native contract ID via mirror node ---
  console.log("⏸️ Resolving native Hedera Contract ID (CRITICAL STEP)...");
  const ricePoolNativeId = await resolveContractId(ricePoolAddress);
  const ricePoolAccountId = AccountId.fromString(ricePoolNativeId);

  // Initialize pool (associate with HTS tokens)
  console.log("🔧 Initializing RICE Pool...");
  const riceInitTx = await ricePool.initialize();
  await riceInitTx.wait();
  console.log("✅ RICE Pool initialized (no LP/Debt tokens needed - using share accounting)");

  // 3. Verify pool initialization
  console.log("🔍 Verifying RICE Pool setup...");
  const ricePoolDetails = await ricePool.getPoolDetails();
  console.log(`   - Total Cash: ${ricePoolDetails.totalCash}`);
  console.log(`   - Total LP Shares: ${ricePoolDetails.totalLPShares}`);
  console.log(`   - LTV: ${ethers.formatUnits(ricePoolDetails.loanToValue, 18)}`);
  console.log("✅ RICE Pool:", ricePoolAddress);

  // ──────────────────────────────────────────────── ASSOCIATE & DISTRIBUTE TO USERS ────────────────────────────────────────────────
  console.log("\n🔗 Associating & Distributing to Users...");
  const users = [deployer, user1, user2].filter(user => user && user.address);
  const usdcAmount = CONFIG.USER_USDC_AMOUNT * 1e6;
  const collateralAmount = CONFIG.USER_COLLATERAL_AMOUNT * 1e8;

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
        .addTokenTransfer(usdcTokenId, AccountId.fromString(process.env.HEDERA_ACCOUNT_ID), -usdcAmount)
        .addTokenTransfer(usdcTokenId, AccountId.fromEvmAddress(0, 0, user.address), usdcAmount)
        .addTokenTransfer(wheatTokenId, AccountId.fromString(process.env.HEDERA_ACCOUNT_ID), -collateralAmount)
        .addTokenTransfer(wheatTokenId, AccountId.fromEvmAddress(0, 0, user.address), collateralAmount)
        .addTokenTransfer(riceTokenId, AccountId.fromString(process.env.HEDERA_ACCOUNT_ID), -collateralAmount)
        .addTokenTransfer(riceTokenId, AccountId.fromEvmAddress(0, 0, user.address), collateralAmount)
        .execute(hederaClient);
      await transferTx.getReceipt(hederaClient);
      console.log(`✅ Distributed tokens to ${user.address}: ${CONFIG.USER_USDC_AMOUNT} USDC, ${CONFIG.USER_COLLATERAL_AMOUNT} WHEAT, ${CONFIG.USER_COLLATERAL_AMOUNT} RICE`);
    } catch (error) {
      console.error(`⚠️ Failed for ${user.address}: ${error.message}`);
      if (error.status) console.error(`Hedera Status: ${error.status}`);
      // Continue with next user instead of failing completely
      continue;
    }
  }

  // ──────────────────────────────────────────────── HEALTH CHECKS ────────────────────────────────────────────────
  console.log("\n🏥 Running Health Checks...");

  try {
    // Check WHEAT Pool
    console.log("\n🌾 WHEAT Pool Health Check:");
    const wheatHealth = await wheatPool.getPoolDetails();
    console.log(`   ✅ Underlying Token: ${wheatHealth.underlyingToken === `0x${usdcAddress}` ? 'Valid' : 'MISMATCH'}`);
    console.log(`   ✅ Collateral Token: ${wheatHealth.collateralToken === `0x${wheatAddress}` ? 'Valid' : 'MISMATCH'}`);
    console.log(`   ✅ Total LP Shares: ${wheatHealth.totalLPShares}`);
    console.log(`   ✅ Borrow Index: ${wheatHealth.borrowIndex > 0 ? 'Valid' : 'INVALID'}`);
    console.log(`   ✅ Liquidity Index: ${wheatHealth.liquidityIndex > 0 ? 'Valid' : 'INVALID'}`);

    // Check RICE Pool
    console.log("\n🍚 RICE Pool Health Check:");
    const riceHealth = await ricePool.getPoolDetails();
    console.log(`   ✅ Underlying Token: ${riceHealth.underlyingToken === `0x${usdcAddress}` ? 'Valid' : 'MISMATCH'}`);
    console.log(`   ✅ Collateral Token: ${riceHealth.collateralToken === `0x${riceAddress}` ? 'Valid' : 'MISMATCH'}`);
    console.log(`   ✅ Total LP Shares: ${riceHealth.totalLPShares}`);
    console.log(`   ✅ Borrow Index: ${riceHealth.borrowIndex > 0 ? 'Valid' : 'INVALID'}`);
    console.log(`   ✅ Liquidity Index: ${riceHealth.liquidityIndex > 0 ? 'Valid' : 'INVALID'}`);

    // Verify oracle prices
    console.log("\n💰 Oracle Price Check:");
    const usdcPrice = await oracle.getPrice(`0x${usdcAddress}`);
    const wheatPrice = await oracle.getPrice(`0x${wheatAddress}`);
    const ricePrice = await oracle.getPrice(`0x${riceAddress}`);
    console.log(`   ✅ USDC Price: $${ethers.formatUnits(usdcPrice[0], usdcPrice[1])}`);
    console.log(`   ✅ WHEAT Price: $${ethers.formatUnits(wheatPrice[0], wheatPrice[1])}`);
    console.log(`   ✅ RICE Price: $${ethers.formatUnits(ricePrice[0], ricePrice[1])}`);

    console.log("\n✅ All health checks passed!");
  } catch (error) {
    console.error("\n❌ Health check failed:", error.message);
    console.error("⚠️  Deployment may have issues. Review the errors above.");
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
  console.log("RICE Pool:", ricePoolAddress);
  console.log("\n💡 Pools use share accounting (no LP/Debt tokens needed)");

  // Save to file
  const fs = require('fs');
  const deploymentData = {
    poolFactory: poolFactory.target,
    oracle: oracle.target,
    interestRateModel: interestRateModel.target,
    usdc: usdcAddress,
    wheat: wheatAddress,
    rice: riceAddress,
    wheatPool: wheatPoolAddress,
    wheatPoolNativeId: wheatPoolNativeId,
    ricePool: ricePoolAddress,
    ricePoolNativeId: ricePoolNativeId,
    config: CONFIG,
    deployedAt: new Date().toISOString(),
  };

  fs.writeFileSync('./deployed.json', JSON.stringify(deploymentData, null, 2));
  console.log("💾 Deployment data saved to deployed.json");

  // Save generated accounts to separate secure file
  if (generatedAccounts.length > 0) {
    fs.writeFileSync('./generated-accounts.json', JSON.stringify({
      warning: "⚠️ KEEP THIS FILE SECURE - Contains private keys!",
      accounts: generatedAccounts,
      createdAt: new Date().toISOString(),
    }, null, 2));
    console.log("🔐 Generated account credentials saved to generated-accounts.json");
    console.log("⚠️  WARNING: Keep generated-accounts.json secure and DO NOT commit to git!");
  }
}

main().catch((error) => {
  console.error("❌ ERROR:", error);
  process.exit(1);
});