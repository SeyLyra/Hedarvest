const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
  console.log("🧪 Deploying LendingPool Tester Contract...\n");

  // Load existing deployed contracts
  const fs = require('fs');
  let deployedData;
  try {
    deployedData = JSON.parse(fs.readFileSync('./deployed.json', 'utf8'));
    console.log("✅ Loaded deployed.json");
  } catch (error) {
    throw new Error("❌ Could not load deployed.json. Please run deployment first.");
  }

  const {
    wheatPool,
    ricePool,
    usdc,
    wheat,
    rice
  } = deployedData;

  console.log("📋 Using Existing Contracts:");
  console.log(`  WHEAT Pool: ${wheatPool}`);
  console.log(`  RICE Pool: ${ricePool}`);
  console.log(`  USDC Token: ${usdc}`);
  console.log(`  WHEAT Token: ${wheat}`);
  console.log(`  RICE Token: ${rice}\n`);

  // Deploy the tester contract
  const LendingPoolTester = await ethers.getContractFactory("LendingPoolTester");
  
  const tester = await LendingPoolTester.deploy(
    wheatPool,
    ricePool,
    `0x${usdc}`,
    `0x${wheat}`,
    `0x${rice}`
  );

  await tester.waitForDeployment();
  const testerAddress = await tester.getAddress();

  console.log("✅ LendingPool Tester deployed to:", testerAddress);

  // Test the contracts
  console.log("\n🔍 Running Initial Tests...\n");

  try {
    // Test pool details
    console.log("📊 Testing Pool Details...");
    const wheatDetails = await tester.wheatPool();
    const riceDetails = await tester.ricePool();
    console.log(`  WHEAT Pool: ${wheatDetails}`);
    console.log(`  RICE Pool: ${riceDetails}`);

    // Test token balances
    console.log("\n💰 Testing Token Balances...");
    const [usdcBalance, wheatBalance, riceBalance] = await tester.testTokenBalances();
    console.log(`  USDC Balance: ${ethers.formatUnits(usdcBalance, 6)}`);
    console.log(`  WHEAT Balance: ${ethers.formatUnits(wheatBalance, 8)}`);
    console.log(`  RICE Balance: ${ethers.formatUnits(riceBalance, 8)}`);

    // Test pool utilization
    console.log("\n📈 Testing Pool Utilization...");
    const [wheatUtil, riceUtil] = await tester.testPoolUtilization();
    console.log(`  WHEAT Utilization: ${(Number(wheatUtil) / 1e18 * 100).toFixed(2)}%`);
    console.log(`  RICE Utilization: ${(Number(riceUtil) / 1e18 * 100).toFixed(2)}%`);

  } catch (error) {
    console.error("❌ Error during initial testing:", error.message);
  }

  // Save tester address
  const updatedDeployed = {
    ...deployedData,
    tester: testerAddress
  };

  fs.writeFileSync('./deployed.json', JSON.stringify(updatedDeployed, null, 2));
  console.log("\n✅ Updated deployed.json with tester address");

  console.log("\n🎉 Tester Contract Deployed Successfully!");
  console.log("\n📝 How to Use:");
  console.log("1. Call tester.testPoolDetails() to test pool information retrieval");
  console.log("2. Call tester.testAPRCalculations() to test APR calculations");
  console.log("3. Call tester.testDeposit(poolAddress, amount) to test deposits");
  console.log("4. Call tester.testWithdraw(poolAddress, amount) to test withdrawals");
  console.log("5. Call tester.testBorrow(poolAddress, amount) to test borrowing");
  console.log("6. Call tester.testRepay(poolAddress, amount) to test repayments");
  console.log("\n⚠️  Note: These tests will use real gas fees on Hedera testnet!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
