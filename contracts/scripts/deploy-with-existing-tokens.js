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

  console.log("🚀 Deploying with existing tokens:", deployer.address);

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

  // ──────────────────────────────────────────────── LOAD EXISTING TOKENS ────────────────────────────────────────────────
  console.log("\n📋 Loading existing tokens from deployed.json...");
  
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

  // Extract existing contract and token addresses
  const {
    poolFactory: existingPoolFactoryAddress,
    oracle: existingOracleAddress,
    interestRateModel: existingInterestRateModelAddress,
    usdc: usdcAddress,
    wheat: wheatAddress,
    rice: riceAddress,
    wheatLPToken: existingWheatLPToken,
    wheatDebtToken: existingWheatDebtToken,
    riceLPToken: existingRiceLPToken,
    riceDebtToken: existingRiceDebtToken
  } = existingContracts;

  console.log("📋 Using existing contracts and tokens:");
  console.log("  PoolFactory:", existingPoolFactoryAddress);
  console.log("  Oracle:", existingOracleAddress);
  console.log("  InterestRateModel:", existingInterestRateModelAddress);
  console.log("  USDC:", usdcAddress);
  console.log("  WHEAT:", wheatAddress);
  console.log("  RICE:", riceAddress);
  console.log("  WHEAT LP Token:", existingWheatLPToken);
  console.log("  WHEAT Debt Token:", existingWheatDebtToken);
  console.log("  RICE LP Token:", existingRiceLPToken);
  console.log("  RICE Debt Token:", existingRiceDebtToken);

  // ──────────────────────────────────────────────── CONNECT TO EXISTING CONTRACTS ────────────────────────────────────────────────
  console.log("\n🔗 Connecting to existing contracts...");
  
  const MockPriceOracle = await ethers.getContractFactory("MockPriceOracle");
  const oracle = MockPriceOracle.attach(existingOracleAddress);
  console.log("✅ Connected to existing Oracle:", existingOracleAddress);

  const InterestRateModel = await ethers.getContractFactory("InterestRateModel");
  const interestRateModel = InterestRateModel.attach(existingInterestRateModelAddress);
  console.log("✅ Connected to existing InterestRateModel:", existingInterestRateModelAddress);

  const PoolFactory = await ethers.getContractFactory("PoolFactory");
  const poolFactory = PoolFactory.attach(existingPoolFactoryAddress);
  console.log("✅ Connected to existing PoolFactory:", existingPoolFactoryAddress);

  // Fund contracts if needed
  await fundContract(existingOracleAddress, 0.01);
  await fundContract(existingInterestRateModelAddress, 0.01);
  await fundContract(existingPoolFactoryAddress, 0.01);

  // ──────────────────────────────────────────────── CREATE & INITIALIZE POOLS ────────────────────────────────────────────────
  const params = [
    existingInterestRateModelAddress,
    ethers.parseUnits("0.1", 18),
    existingOracleAddress,
    ethers.parseUnits("0.75", 18),
    ethers.parseUnits("0.8", 18),
    ethers.parseUnits("0.05", 18)
  ];

  // WHEAT Pool
  console.log("\n🌾 Creating WHEAT Pool...");
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
  console.log("\n🍚 Creating RICE Pool...");
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

  // ──────────────────────────────────────────────── TEST DEPOSIT FUNCTION ────────────────────────────────────────────────
  console.log("\n🧪 Testing deposit function...");
  
  async function testDeposit(poolAddress, poolName, amount = "1") {
    try {
      console.log(`\n💰 Testing deposit to ${poolName} pool...`);
      console.log(`   Pool Address: ${poolAddress}`);
      console.log(`   Amount: ${amount} USDC`);
      
      const pool = await ethers.getContractAt("LendingPool", poolAddress);
      
      // Get pool info first
      console.log("   📊 Getting pool details...");
      const poolDetails = await pool.getPoolDetails();
      console.log(`   📈 Pool Utilization: ${(Number(poolDetails.utilization) / 1e18 * 100).toFixed(2)}%`);
      console.log(`   💵 Total Cash: ${ethers.formatUnits(poolDetails.totalCash, 6)} USDC`);
      console.log(`   💸 Total Borrowed: ${ethers.formatUnits(poolDetails.totalBorrowed, 6)} USDC`);
      
      // Check if we can call deposit function
      console.log("   🔍 Testing deposit function call...");
      const depositAmount = ethers.parseUnits(amount, 6); // 6 decimals for USDC
      
      // Try to estimate gas for deposit
      try {
        const gasEstimate = await pool.deposit.estimateGas(depositAmount);
        console.log(`   ⛽ Gas estimate: ${gasEstimate.toString()}`);
      } catch (gasError) {
        console.log(`   ⚠️ Gas estimation failed: ${gasError.message}`);
      }
      
      // Try to call deposit (this will fail if we don't have tokens, but we can see the error)
      try {
        console.log("   🚀 Attempting deposit transaction...");
        const tx = await pool.deposit(depositAmount);
        console.log(`   ✅ Deposit transaction sent: ${tx.hash}`);
        
        const receipt = await tx.wait();
        console.log(`   ✅ Deposit successful! Gas used: ${receipt.gasUsed.toString()}`);
        
        // Get updated pool details
        const updatedDetails = await pool.getPoolDetails();
        console.log(`   📊 Updated Total Cash: ${ethers.formatUnits(updatedDetails.totalCash, 6)} USDC`);
        
        return { success: true, txHash: tx.hash };
        
      } catch (depositError) {
        console.log(`   ❌ Deposit failed: ${depositError.message}`);
        
        // Analyze the error
        if (depositError.message.includes("INSUFFICIENT_BALANCE")) {
          console.log("   💡 Issue: Not enough USDC tokens");
        } else if (depositError.message.includes("NOT_ASSOCIATED")) {
          console.log("   💡 Issue: Pool not associated with USDC token");
        } else if (depositError.message.includes("CONTRACT_REVERT_EXECUTED")) {
          console.log("   💡 Issue: Contract execution reverted");
        } else if (depositError.message.includes("INVALID_TOKEN")) {
          console.log("   💡 Issue: Invalid token configuration");
        }
        
        return { success: false, error: depositError.message };
      }
      
    } catch (error) {
      console.log(`   ❌ Test failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  }
  
  // Test both pools
  console.log("\n🧪 Running deposit tests...");
  
  const wheatTest = await testDeposit(wheatPoolAddress, "WHEAT", "1");
  const riceTest = await testDeposit(ricePoolAddress, "RICE", "1");
  
  console.log("\n📋 Test Results:");
  console.log(`   WHEAT Pool: ${wheatTest.success ? '✅ PASS' : '❌ FAIL'}`);
  if (!wheatTest.success) {
    console.log(`   WHEAT Error: ${wheatTest.error}`);
  }
  
  console.log(`   RICE Pool: ${riceTest.success ? '✅ PASS' : '❌ FAIL'}`);
  if (!riceTest.success) {
    console.log(`   RICE Error: ${riceTest.error}`);
  }
  
  // Test pool functions
  console.log("\n🔍 Testing pool functions...");
  
  try {
    const wheatPool = await ethers.getContractAt("LendingPool", wheatPoolAddress);
    
    // Test view functions
    console.log("   📊 Testing view functions...");
    const totalAssets = await wheatPool.totalAssets();
    const utilization = await wheatPool.utilizationRate();
    const borrowIndex = await wheatPool.borrowIndex();
    const liquidityIndex = await wheatPool.liquidityIndex();
    
    console.log(`   💰 Total Assets: ${ethers.formatUnits(totalAssets, 6)} USDC`);
    console.log(`   📈 Utilization Rate: ${(Number(utilization) / 1e18 * 100).toFixed(2)}%`);
    console.log(`   📊 Borrow Index: ${ethers.formatUnits(borrowIndex, 18)}`);
    console.log(`   📊 Liquidity Index: ${ethers.formatUnits(liquidityIndex, 18)}`);
    
    // Test token addresses
    console.log("   🪙 Testing token addresses...");
    const underlyingToken = await wheatPool.underlyingToken();
    const collateralToken = await wheatPool.collateralToken();
    const lpToken = await wheatPool.lpToken();
    const debtToken = await wheatPool.debtToken();
    
    console.log(`   💵 Underlying Token: ${underlyingToken}`);
    console.log(`   🌾 Collateral Token: ${collateralToken}`);
    console.log(`   🏦 LP Token: ${lpToken}`);
    console.log(`   💸 Debt Token: ${debtToken}`);
    
    console.log("   ✅ All view functions working!");
    
  } catch (viewError) {
    console.log(`   ❌ View functions failed: ${viewError.message}`);
  }

  // ──────────────────────────────────────────────── SUMMARY ────────────────────────────────────────────────
  console.log("\n🎉 POOL DEPLOYMENT COMPLETE!");
  console.log("\n📋 NEW POOL ADDRESSES:");
  console.log("WHEAT Pool:", wheatPoolAddress);
  console.log("RICE Pool:", ricePoolAddress);

  console.log("\n📋 REUSED CONTRACTS & TOKENS:");
  console.log("PoolFactory:", existingPoolFactoryAddress);
  console.log("Oracle:", existingOracleAddress);
  console.log("InterestRateModel:", existingInterestRateModelAddress);
  console.log("USDC:", usdcAddress);
  console.log("WHEAT:", wheatAddress);
  console.log("RICE:", riceAddress);
  console.log("WHEAT LP Token:", existingWheatLPToken);
  console.log("WHEAT Debt Token:", existingWheatDebtToken);
  console.log("RICE LP Token:", existingRiceLPToken);
  console.log("RICE Debt Token:", existingRiceDebtToken);

  // Save to file
  fs.writeFileSync('./deployed.json', JSON.stringify({
    poolFactory: existingPoolFactoryAddress,
    oracle: existingOracleAddress,
    interestRateModel: existingInterestRateModelAddress,
    usdc: usdcAddress,
    wheat: wheatAddress,
    rice: riceAddress,
    wheatLPToken: existingWheatLPToken,
    wheatDebtToken: existingWheatDebtToken,
    riceLPToken: existingRiceLPToken,
    riceDebtToken: existingRiceDebtToken,
    wheatPool: wheatPoolAddress,
    ricePool: ricePoolAddress,
  }, null, 2));
}

main().catch((error) => {
  console.error("❌ ERROR:", error);
  process.exit(1);
});
