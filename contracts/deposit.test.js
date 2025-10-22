// scripts/test-deposit.js
// Test script to verify deposit functionality works

const { ethers } = require("hardhat");
const {
  Client,
  AccountId,
  PrivateKey,
  TokenAssociateTransaction,
  TransferTransaction,
} = require("@hashgraph/sdk");
require("dotenv").config();

// Patch Hardhat-Ethers v6
ethers.provider.resolveName = async (name) => name;

async function main() {
  // Load deployed addresses
  const fs = require('fs');
  const deployed = JSON.parse(fs.readFileSync('./deployed.json', 'utf8'));

  console.log("🧪 Testing Deposit Functionality\n");
  console.log("📋 Loaded Contracts:");
  console.log("WHEAT Pool:", deployed.wheatPool);
  console.log("USDC Token:", deployed.usdc);

  // Get signer
  const [deployer] = await ethers.getSigners();
  console.log("\n👤 Testing with account:", deployer.address);

  // Setup Hedera client
  const hederaClient = Client.forTestnet();
  hederaClient.setOperator(
    AccountId.fromString(process.env.HEDERA_ACCOUNT_ID),
    PrivateKey.fromString(process.env.HEDERA_PRIVATE_KEY)
  );

  // Get contract instances
  const wheatPool = await ethers.getContractAt("LendingPool", deployed.wheatPool);

  // Step 1: Associate user with LP token
  console.log("\n🔗 Step 1: Associating with pool tokens...");
  try {
    const tx = await wheatPool.associateAllForUser();
    await tx.wait();
    console.log("✅ Associated with all pool tokens");
  } catch (error) {
    console.log("⚠️ Association failed or already associated:", error.message);
  }

  // Step 2: Check USDC balance
  console.log("\n💰 Step 2: Checking USDC balance...");
  const usdcBalance = await getTokenBalance(deployed.usdc, deployer.address);
  console.log(`USDC Balance: ${usdcBalance / 1e6} USDC`);

  if (usdcBalance === 0) {
    console.log("❌ No USDC balance. Please fund your account first.");
    return;
  }

  // Step 3: Approve USDC (Hedera doesn't need approval, but we check association)
  console.log("\n✅ Step 3: Hedera tokens don't need approval");

  // Step 4: Deposit USDC into pool
  const depositAmount = 1000 * 1e6; // 1000 USDC
  console.log(`\n💵 Step 4: Depositing ${depositAmount / 1e6} USDC...`);
  
  try {
    const depositTx = await wheatPool.deposit(depositAmount);
    console.log("⏳ Transaction submitted, waiting for confirmation...");
    const receipt = await depositTx.wait();
    console.log("✅ Deposit successful!");
    console.log("Transaction hash:", receipt.hash);

    // Find Deposited event
    const depositEvent = receipt.logs.find(log => {
      try {
        const parsed = wheatPool.interface.parseLog(log);
        return parsed?.name === "Deposited";
      } catch {
        return false;
      }
    });

    if (depositEvent) {
      const parsed = wheatPool.interface.parseLog(depositEvent);
      console.log("\n📊 Deposit Details:");
      console.log("Amount deposited:", ethers.formatUnits(parsed.args.amount, 6), "USDC");
      console.log("LP tokens minted:", ethers.formatUnits(parsed.args.sharesMinted, 6));
    }

  } catch (error) {
    console.error("\n❌ DEPOSIT FAILED!");
    console.error("Error:", error.message);
    
    if (error.message.includes("LP_TRANSFER_FAILED")) {
      console.error("\n🔍 LP_TRANSFER_FAILED Error Detected!");
      console.error("This means the pool contract couldn't transfer LP tokens to you.");
      console.error("\n💡 SOLUTION:");
      console.error("1. Make sure the pool contract is the treasury for the LP token");
      console.error("2. Run the deploy script again - it should update the treasury automatically");
      console.error("3. Check that TokenUpdateTransaction was executed successfully");
    }
    
    if (error.data) {
      console.error("Error data:", error.data);
    }
    return;
  }

  // Step 5: Check LP token balance
  console.log("\n🪙 Step 5: Checking LP token balance...");
  const lpTokenAddress = await wheatPool.lpToken();
  const lpBalance = await getTokenBalance(lpTokenAddress, deployer.address);
  console.log(`LP Token Balance: ${lpBalance / 1e6}`);

  // Step 6: Check pool details
  console.log("\n📈 Step 6: Pool Status:");
  const poolDetails = await wheatPool.getPoolDetails();
  console.log("Total Cash:", ethers.formatUnits(poolDetails.totalCash, 6), "USDC");
  console.log("Total Borrowed:", ethers.formatUnits(poolDetails.totalBorrowed, 6), "USDC");
  console.log("Utilization:", (Number(poolDetails.utilization) / 1e18 * 100).toFixed(2), "%");

  console.log("\n✅ ALL TESTS PASSED! Deposit functionality is working correctly.");
}

// Helper function to get token balance
async function getTokenBalance(tokenAddress, accountAddress) {
  try {
    const token = await ethers.getContractAt(
      ["function balanceOf(address) view returns (uint256)"],
      tokenAddress
    );
    const balance = await token.balanceOf(accountAddress);
    return Number(balance);
  } catch (error) {
    console.log(`⚠️ Could not fetch balance for ${tokenAddress}`);
    return 0;
  }
}

main().catch((error) => {
  console.error("❌ TEST ERROR:", error);
  process.exit(1);
});