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
} = require("@hashgraph/sdk");
require("dotenv").config();

// Patch Hardhat-Ethers v6
ethers.provider.resolveName = async (name) => name;

async function main() {
  // Validate .env
  if (!process.env.HEDERA_ACCOUNT_ID || !process.env.HEDERA_PRIVATE_KEY) {
    throw new Error("❌ Set HEDERA_ACCOUNT_ID & HEDERA_PRIVATE_KEY in .env");
  }

  const [deployer] = await ethers.getSigners();
  const hederaClient = Client.forTestnet();
  hederaClient.setOperator(
    AccountId.fromString(process.env.HEDERA_ACCOUNT_ID),
    PrivateKey.fromString(process.env.HEDERA_PRIVATE_KEY)
  );

  console.log("🚀 Redeploying pools with existing contracts...");
  console.log("👤 Deployer:", deployer.address);

  // ──────────────────────────────────────────────── UTILITY FUNCTIONS ────────────────────────────────────────────────
  async function fundContract(evmAddress, amount = 0.02) {
    const fromId = AccountId.fromString(process.env.HEDERA_ACCOUNT_ID);
    const toId = AccountId.fromEvmAddress(0, 0, evmAddress);
    try {
      const tx = await new TransferTransaction()
        .addHbarTransfer(fromId, Hbar.from(-amount))
        .addHbarTransfer(toId, Hbar.from(amount))
        .execute(hederaClient);
      await tx.getReceipt(hederaClient);
      console.log(`💰 Funded ${evmAddress} with ${amount} HBAR`);
    } catch (error) {
      console.error(`⚠️ Failed to fund ${evmAddress}: ${error.message}`);
      throw error;
    }
  }

  async function validateToken(tokenId) {
    try {
      const info = await new TokenInfoQuery().setTokenId(tokenId).execute(hederaClient);
      console.log(`✅ Token ${tokenId}: ${info.name} (${info.symbol})`);
      return info;
    } catch (error) {
      console.error(`⚠️ Failed to validate token ${tokenId}: ${error.message}`);
      throw error;
    }
  }

  // ──────────────────────────────────────────────── REUSE EXISTING CONTRACTS ────────────────────────────────────────────────
  console.log("\n📋 Using existing contracts from deployed.json...");
  
  // Load existing contract addresses
  const fs = require('fs');
  let existingContracts;
  try {
    const deployedData = fs.readFileSync('./deployed.json', 'utf8');
    existingContracts = JSON.parse(deployedData);
    console.log("✅ Loaded existing contract addresses");
  } catch (error) {
    throw new Error("❌ Could not load deployed.json. Please run full deployment first.");
  }

  // Extract existing contract addresses
  const {
    poolFactory: poolFactoryAddress,
    oracle: oracleAddress,
    interestRateModel: interestRateModelAddress,
    usdc: usdcAddress,
    wheat: wheatAddress,
    rice: riceAddress
  } = existingContracts;

  console.log("📋 Existing contracts:");
  console.log("  PoolFactory:", poolFactoryAddress);
  console.log("  Oracle:", oracleAddress);
  console.log("  InterestRateModel:", interestRateModelAddress);
  console.log("  USDC:", usdcAddress);
  console.log("  WHEAT:", wheatAddress);
  console.log("  RICE:", riceAddress);

  // ──────────────────────────────────────────────── USE EXISTING POOL TOKENS ────────────────────────────────────────────────
  console.log("\n🪙 Using existing pool tokens from deployed.json...");
  
  // Extract existing token addresses
  const {
    wheatLPToken: existingWheatLPToken,
    wheatDebtToken: existingWheatDebtToken,
    riceLPToken: existingRiceLPToken,
    riceDebtToken: existingRiceDebtToken
  } = existingContracts;

  console.log("📋 Existing pool tokens:");
  console.log("  WHEAT LP Token:", existingWheatLPToken);
  console.log("  WHEAT Debt Token:", existingWheatDebtToken);
  console.log("  RICE LP Token:", existingRiceLPToken);
  console.log("  RICE Debt Token:", existingRiceDebtToken);

  // ──────────────────────────────────────────────── GET EXISTING CONTRACTS ────────────────────────────────────────────────
  console.log("\n🔗 Connecting to existing contracts...");
  
  const PoolFactory = await ethers.getContractFactory("PoolFactory");
  const poolFactory = PoolFactory.attach(poolFactoryAddress);

  const MockPriceOracle = await ethers.getContractFactory("MockPriceOracle");
  const oracle = MockPriceOracle.attach(oracleAddress);

  const InterestRateModel = await ethers.getContractFactory("InterestRateModel");
  const interestRateModel = InterestRateModel.attach(interestRateModelAddress);

  // Fund contracts if needed
  await fundContract(poolFactoryAddress, 0.01);
  await fundContract(oracleAddress, 0.01);
  await fundContract(interestRateModelAddress, 0.01);

  // ──────────────────────────────────────────────── CREATE NEW POOLS ────────────────────────────────────────────────
  const params = [
    interestRateModelAddress,
    ethers.parseUnits("0.1", 18),
    oracleAddress,
    ethers.parseUnits("0.75", 18),
    ethers.parseUnits("0.8", 18),
    ethers.parseUnits("0.05", 18)
  ];

  // WHEAT Pool
  console.log("\n🌾 Creating new WHEAT Pool...");
  let tx = await poolFactory.createPool(usdcAddress, wheatAddress, ...params);
  let receipt = await tx.wait();
  const wheatPoolAddress = receipt.logs.find(log => log.fragment?.name === "PoolCreated")?.args?.poolAddress;
  
  if (!wheatPoolAddress) throw new Error("❌ WHEAT Pool creation failed");
  
  const wheatPool = await ethers.getContractAt("LendingPool", wheatPoolAddress);
  await fundContract(wheatPoolAddress, 0.02);

  try {
    await wheatPool.initializeTokens(
      existingWheatLPToken,
      existingWheatDebtToken
    );
    console.log("✅ WHEAT Pool initialized with existing tokens");
  } catch (error) {
    console.error(`⚠️ WHEAT Pool initializeTokens failed: ${error.message}`);
    throw error;
  }
  console.log("✅ WHEAT Pool:", wheatPoolAddress);

  // RICE Pool
  console.log("\n🍚 Creating new RICE Pool...");
  tx = await poolFactory.createPool(usdcAddress, riceAddress, ...params);
  receipt = await tx.wait();
  const ricePoolAddress = receipt.logs.find(log => log.fragment?.name === "PoolCreated")?.args?.poolAddress;
  
  if (!ricePoolAddress) throw new Error("❌ RICE Pool creation failed");
  
  const ricePool = await ethers.getContractAt("LendingPool", ricePoolAddress);
  await fundContract(ricePoolAddress, 0.02);

  try {
    await ricePool.initializeTokens(
      existingRiceLPToken,
      existingRiceDebtToken
    );
    console.log("✅ RICE Pool initialized with existing tokens");
  } catch (error) {
    console.error(`⚠️ RICE Pool initializeTokens failed: ${error.message}`);
    throw error;
  }
  console.log("✅ RICE Pool:", ricePoolAddress);

  // ──────────────────────────────────────────────── UPDATE DEPLOYED.JSON ────────────────────────────────────────────────
  console.log("\n💾 Updating deployed.json with new pool addresses...");
  
  const updatedContracts = {
    ...existingContracts,
    wheatPool: wheatPoolAddress,
    ricePool: ricePoolAddress
  };

  fs.writeFileSync('./deployed.json', JSON.stringify(updatedContracts, null, 2));

  // ──────────────────────────────────────────────── SUMMARY ────────────────────────────────────────────────
  console.log("\n🎉 POOL REDEPLOYMENT COMPLETE!");
  console.log("\n📋 NEW POOL ADDRESSES:");
  console.log("WHEAT Pool:", wheatPoolAddress);
  console.log("RICE Pool:", ricePoolAddress);
  
  console.log("\n📋 REUSED CONTRACTS & TOKENS:");
  console.log("PoolFactory:", poolFactoryAddress);
  console.log("Oracle:", oracleAddress);
  console.log("InterestRateModel:", interestRateModelAddress);
  console.log("USDC:", usdcAddress);
  console.log("WHEAT:", wheatAddress);
  console.log("RICE:", riceAddress);
  console.log("WHEAT LP Token:", existingWheatLPToken);
  console.log("WHEAT Debt Token:", existingWheatDebtToken);
  console.log("RICE LP Token:", existingRiceLPToken);
  console.log("RICE Debt Token:", existingRiceDebtToken);

  console.log("\n✅ deployed.json has been updated with new pool addresses!");
}

main().catch((error) => {
  console.error("❌ ERROR:", error);
  process.exit(1);
});
