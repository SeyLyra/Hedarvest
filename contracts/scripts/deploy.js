// SPDX-License-Identifier: MIT
// scripts/deploy.js

const { ethers } = require("hardhat");
const {
  Client,
  AccountId,
  PrivateKey,
  TokenCreateTransaction,
  TokenAssociateTransaction,
  TokenTransferTransaction,
} = require("@hashgraph/sdk");
require("dotenv").config();

// 💡 Patch Hardhat-Ethers v6 provider (missing resolveName)
ethers.provider.resolveName = async (name) => name;

async function main() {
  const [deployer, user1, user2] = await ethers.getSigners();

  // Hedera client setup
  const hederaClient = Client.forTestnet();
  hederaClient.setOperator(
    AccountId.fromString(process.env.HEDERA_ACCOUNT_ID),
    PrivateKey.fromString(process.env.HEDERA_PRIVATE_KEY)
  );

  console.log("🚀 Deploying with account:", deployer.address);

  // ────────────────────────────────────────────────
  // Create mock tokens on Hedera
  // ────────────────────────────────────────────────
  console.log("\n🪙 Creating mock USDC...");
  const usdcTx = await new TokenCreateTransaction()
    .setTokenName("TestUSDC")
    .setTokenSymbol("TUSDC")
    .setDecimals(6)
    .setInitialSupply(1000000e6)
    .setTreasuryAccountId(AccountId.fromString(process.env.HEDERA_ACCOUNT_ID))
    .setAdminKey(hederaClient.operatorPublicKey)
    .execute(hederaClient);
  const usdcReceipt = await usdcTx.getReceipt(hederaClient);
  const usdcAddress = usdcReceipt.tokenId.toSolidityAddress();
  console.log("✅ USDC Token deployed at:", usdcAddress);

  console.log("\n🌾 Creating mock WHEAT token...");
  const wheatTx = await new TokenCreateTransaction()
    .setTokenName("PropertyTokenWHEAT")
    .setTokenSymbol("WHEAT")
    .setDecimals(8)
    .setInitialSupply(100e8)
    .setTreasuryAccountId(AccountId.fromString(process.env.HEDERA_ACCOUNT_ID))
    .setAdminKey(hederaClient.operatorPublicKey)
    .execute(hederaClient);
  const wheatReceipt = await wheatTx.getReceipt(hederaClient);
  const wheatAddress = wheatReceipt.tokenId.toSolidityAddress();
  console.log("✅ WHEAT Token deployed at:", wheatAddress);

  console.log("\n🍚 Creating mock RICE token...");
  const riceTx = await new TokenCreateTransaction()
    .setTokenName("PropertyTokenRICE")
    .setTokenSymbol("RICE")
    .setDecimals(8)
    .setInitialSupply(100e8)
    .setTreasuryAccountId(AccountId.fromString(process.env.HEDERA_ACCOUNT_ID))
    .setAdminKey(hederaClient.operatorPublicKey)
    .execute(hederaClient);
  const riceReceipt = await riceTx.getReceipt(hederaClient);
  const riceAddress = riceReceipt.tokenId.toSolidityAddress();
  console.log("✅ RICE Token deployed at:", riceAddress);

  // ────────────────────────────────────────────────
  // Deploy MockPriceOracle
  // ────────────────────────────────────────────────
  console.log("\n📡 Deploying MockPriceOracle...");
  const MockPriceOracle = await ethers.getContractFactory("MockPriceOracle");
  const oracle = await MockPriceOracle.deploy();
  console.log("✅ MockPriceOracle deployed at:", oracle.target);

  // Set token prices
  await oracle.setPrice(usdcAddress, ethers.parseUnits("1", 8), 8);
  await oracle.setPrice(wheatAddress, ethers.parseUnits("100000", 8), 8);
  await oracle.setPrice(riceAddress, ethers.parseUnits("100000", 8), 8);
  console.log("💲 Oracle prices set successfully");

  // ────────────────────────────────────────────────
  // Deploy InterestRateModel
  // ────────────────────────────────────────────────
  console.log("\n📈 Deploying InterestRateModel...");
  const InterestRateModel = await ethers.getContractFactory("InterestRateModel");
  const interestRateModel = await InterestRateModel.deploy(
    ethers.parseUnits("0.01", 18),
    ethers.parseUnits("0.02", 18),
    ethers.parseUnits("0.05", 18),
    ethers.parseUnits("0.8", 18)
  );
  console.log("✅ InterestRateModel deployed at:", interestRateModel.target);

  // ────────────────────────────────────────────────
  // Deploy PoolFactory
  // ────────────────────────────────────────────────
  console.log("\n🏭 Deploying PoolFactory...");
  const PoolFactory = await ethers.getContractFactory("PoolFactory");
  const poolFactory = await PoolFactory.deploy();
  console.log("✅ PoolFactory deployed at:", poolFactory.target);

  // ────────────────────────────────────────────────
  // Create WHEAT LendingPool
  // ────────────────────────────────────────────────
  console.log("\n⚙️ Creating WHEAT LendingPool...");
  let tx = await poolFactory.createPool(
    usdcAddress,
    wheatAddress,
    interestRateModel.target,
    ethers.parseUnits("0.1", 18),
    oracle.target,
    ethers.parseUnits("0.75", 18),
    ethers.parseUnits("0.8", 18),
    ethers.parseUnits("0.05", 18)
  );
  let receipt = await tx.wait();
  const wheatPoolAddress = receipt.logs.find((log) => log.fragment?.name === "PoolCreated")?.args?.poolAddress;
  console.log("✅ WHEAT LendingPool created at:", wheatPoolAddress);

  const wheatPool = await ethers.getContractAt("LendingPool", wheatPoolAddress);
  await wheatPool.initializeTokens("LP-USDC-WHEAT", "LPWHEAT", 6, "Debt-USDC-WHEAT", "dWHEAT", 6);
  console.log("✅ WHEAT LendingPool tokens initialized");

  // ────────────────────────────────────────────────
  // Create RICE LendingPool
  // ────────────────────────────────────────────────
  console.log("\n⚙️ Creating RICE LendingPool...");
  tx = await poolFactory.createPool(
    usdcAddress,
    riceAddress,
    interestRateModel.target,
    ethers.parseUnits("0.1", 18),
    oracle.target,
    ethers.parseUnits("0.75", 18),
    ethers.parseUnits("0.8", 18),
    ethers.parseUnits("0.05", 18)
  );
  receipt = await tx.wait();
  const ricePoolAddress = receipt.logs.find((log) => log.fragment?.name === "PoolCreated")?.args?.poolAddress;
  console.log("✅ RICE LendingPool created at:", ricePoolAddress);

  const ricePool = await ethers.getContractAt("LendingPool", ricePoolAddress);
  await ricePool.initializeTokens("LP-USDC-RICE", "LPRICE", 6, "Debt-USDC-RICE", "dRICE", 6);
  console.log("✅ RICE LendingPool tokens initialized");

  // ────────────────────────────────────────────────
  // Token association & distribution (optional)
  // ────────────────────────────────────────────────
  console.log("\n🔗 Associating and distributing tokens...");
  const wheatTokens = [usdcAddress, wheatAddress, await wheatPool.lpToken(), await wheatPool.debtToken()];
  const riceTokens = [usdcAddress, riceAddress, await ricePool.lpToken(), await ricePool.debtToken()];

  // Skip user association - users will associate tokens themselves
  // for (const user of [deployer, user1, user2]) {
  //   await wheatPool.connect(user).associateTokensForUser(user.address, wheatTokens);
  //   await ricePool.connect(user).associateTokensForUser(user.address, riceTokens);
  //   console.log(`✅ Tokens associated for user: ${user.address}`);
  // }

  // Skip token distribution - users will get tokens themselves
  // for (const user of [user1, user2]) {
  //   await new TokenAssociateTransaction()
  //     .setAccountId(AccountId.fromString(process.env.HEDERA_ACCOUNT_ID))
  //     .setTokenIds([usdcReceipt.tokenId, wheatReceipt.tokenId, riceReceipt.tokenId])
  //     .execute(hederaClient);

  //   await new TokenTransferTransaction()
  //     .addTokenTransfer(usdcReceipt.tokenId, AccountId.fromString(process.env.HEDERA_ACCOUNT_ID), -10000e6)
  //     .addTokenTransfer(usdcReceipt.tokenId, AccountId.fromEvmAddress(0, 0, user.address), 10000e6)
  //     .addTokenTransfer(wheatReceipt.tokenId, AccountId.fromString(process.env.HEDERA_ACCOUNT_ID), -1e8)
  //     .addTokenTransfer(wheatReceipt.tokenId, AccountId.fromEvmAddress(0, 0, user.address), 1e8)
  //     .addTokenTransfer(riceReceipt.tokenId, AccountId.fromString(process.env.HEDERA_ACCOUNT_ID), -1e8)
  //     .addTokenTransfer(riceReceipt.tokenId, AccountId.fromEvmAddress(0, 0, user.address), 1e8)
  //     .execute(hederaClient);
  //   console.log(`💰 Sent test tokens to ${user.address}`);
  // }

  // ────────────────────────────────────────────────
  // Summary
  // ────────────────────────────────────────────────
  console.log("\n🎉 DEPLOYMENT COMPLETE!");
  console.log("📝 Note: Users will associate tokens themselves when using the pools");
  console.log("🔗 To use the pools, users need to:");
  console.log("   1. Associate with USDC, WHEAT/RICE, LP, and Debt tokens");
  console.log("   2. Call associateTokensForUser() with their address and token list");
  console.log("   3. Start depositing collateral and borrowing!");
  console.log("🏦 PoolFactory:", poolFactory.target);
  console.log("🌾 WHEAT Pool:", wheatPoolAddress);
  console.log("🍚 RICE Pool:", ricePoolAddress);
}

// ────────────────────────────────────────────────
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
