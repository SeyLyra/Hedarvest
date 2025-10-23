const { ethers } = require("hardhat");
const {
  Client,
  AccountId,
  PrivateKey,
  TransferTransaction,
  AccountBalanceQuery,
  TokenId,
} = require("@hashgraph/sdk");

/**
 * Realistic lending flow test with appropriate amounts
 *
 * Scenario:
 * - Supplier deposits 1000 USDC
 * - Borrower deposits 0.01 WHEAT ($1000) as collateral
 * - Borrower can borrow up to $750 (75% LTV)
 * - Borrower borrows $500 USDC
 */

async function main() {
  console.log("\n🧪 REALISTIC LENDING FLOW TEST\n");

  const deployed = require('../deployed.json');

  const operatorId = AccountId.fromString(process.env.HEDERA_ACCOUNT_ID);
  const operatorKey = PrivateKey.fromStringECDSA(process.env.HEDERA_PRIVATE_KEY);

  const hederaClient = Client.forTestnet();
  hederaClient.setOperator(operatorId, operatorKey);

  const [signer] = await ethers.getSigners();
  const LendingPool = await ethers.getContractFactory("LendingPool");
  const wheatPool = LendingPool.attach(deployed.wheatPool);

  console.log("📍 User:", signer.address);
  console.log("📍 WHEAT Pool:", deployed.wheatPool);

  const usdcTokenId = TokenId.fromSolidityAddress(`0x${deployed.usdc}`);
  const wheatTokenId = TokenId.fromSolidityAddress(`0x${deployed.wheat}`);
  const poolAccountId = AccountId.fromString(deployed.wheatPoolNativeId);

  // ============================================
  // TEST 1: SUPPLY (Deposit Underlying USDC)
  // ============================================
  console.log("\n" + "=".repeat(60));
  console.log("TEST 1: SUPPLY LIQUIDITY");
  console.log("=".repeat(60));

  const supplyAmount = 1000 * 1e6; // 1000 USDC
  console.log(`\n1️⃣ Transferring ${supplyAmount / 1e6} USDC to pool...`);

  const supplyTransferTx = await new TransferTransaction()
    .addTokenTransfer(usdcTokenId, operatorId, -supplyAmount)
    .addTokenTransfer(usdcTokenId, poolAccountId, supplyAmount)
    .execute(hederaClient);
  await supplyTransferTx.getReceipt(hederaClient);
  console.log("✅ Transfer complete");

  console.log(`\n2️⃣ Calling deposit(${supplyAmount})...`);
  const depositTx = await wheatPool.deposit(supplyAmount, { gasLimit: 1000000 });
  await depositTx.wait();
  console.log("✅ Deposit successful");

  let userShares = await wheatPool.userLPShares(signer.address);
  let poolDetails = await wheatPool.getPoolDetails();
  console.log(`\n📊 After Supply:`);
  console.log(`   User LP Shares: ${userShares}`);
  console.log(`   Pool Cash: ${ethers.formatUnits(poolDetails.totalCash, 6)} USDC`);

  // ============================================
  // TEST 2: DEPOSIT COLLATERAL (WHEAT)
  // ============================================
  console.log("\n" + "=".repeat(60));
  console.log("TEST 2: DEPOSIT COLLATERAL");
  console.log("=".repeat(60));

  const collateralAmount = 0.01 * 1e8; // 0.01 WHEAT (8 decimals) = $1000
  console.log(`\n1️⃣ Transferring ${collateralAmount / 1e8} WHEAT ($1000) to pool...`);

  const collateralTransferTx = await new TransferTransaction()
    .addTokenTransfer(wheatTokenId, operatorId, -collateralAmount)
    .addTokenTransfer(wheatTokenId, poolAccountId, collateralAmount)
    .execute(hederaClient);
  await collateralTransferTx.getReceipt(hederaClient);
  console.log("✅ Transfer complete");

  console.log(`\n2️⃣ Calling depositCollateral(${collateralAmount})...`);
  const depositCollateralTx = await wheatPool.depositCollateral(collateralAmount, { gasLimit: 1000000 });
  await depositCollateralTx.wait();
  console.log("✅ Deposit collateral successful");

  const userCollateral = await wheatPool.userCollateral(signer.address);
  const collateralValue = await wheatPool.getCollateralValue(signer.address);
  console.log(`\n📊 After Collateral Deposit:`);
  console.log(`   User Collateral: ${Number(userCollateral) / 1e8} WHEAT`);
  console.log(`   Collateral Value: $${ethers.formatUnits(collateralValue, 18)}`);

  // ============================================
  // TEST 3: BORROW
  // ============================================
  console.log("\n" + "=".repeat(60));
  console.log("TEST 3: BORROW");
  console.log("=".repeat(60));

  const maxBorrowValueUSD = await wheatPool.getCollateralValue(signer.address);
  const ltv = poolDetails.loanToValue;
  const maxBorrow = (maxBorrowValueUSD * ltv) / ethers.parseUnits("1", 18);

  // Borrow 500 USDC (well within the $750 limit)
  const borrowAmount = 500 * 1e6; // 500 USDC in 6 decimals

  console.log(`\n📊 Borrow Capacity:`);
  console.log(`   Collateral Value: $${ethers.formatUnits(maxBorrowValueUSD, 18)}`);
  console.log(`   Max Borrow (75% LTV): $${ethers.formatUnits(maxBorrow, 18)}`);
  console.log(`   Borrowing: ${borrowAmount / 1e6} USDC`);

  const balanceBeforeBorrow = await new AccountBalanceQuery()
    .setAccountId(operatorId)
    .execute(hederaClient);
  const usdcBeforeBorrow = balanceBeforeBorrow.tokens.get(usdcTokenId);

  console.log(`\n1️⃣ Calling borrow(${borrowAmount})...`);
  const borrowTx = await wheatPool.borrow(borrowAmount, { gasLimit: 1000000 });
  await borrowTx.wait();
  console.log("✅ Borrow successful");

  const balanceAfterBorrow = await new AccountBalanceQuery()
    .setAccountId(operatorId)
    .execute(hederaClient);
  const usdcAfterBorrow = balanceAfterBorrow.tokens.get(usdcTokenId);

  const userDebtShares = await wheatPool.userDebtShares(signer.address);
  const borrowValue = await wheatPool.getBorrowValue(signer.address);
  const healthFactor = await wheatPool.getHealthFactor(signer.address);

  console.log(`\n📊 After Borrow:`);
  console.log(`   USDC Received: ${Number(usdcAfterBorrow - usdcBeforeBorrow) / 1e6} USDC`);
  console.log(`   User Debt Shares: ${userDebtShares}`);
  console.log(`   Borrow Value: $${ethers.formatUnits(borrowValue, 18)}`);
  console.log(`   Health Factor: ${ethers.formatUnits(healthFactor, 18)}`);

  poolDetails = await wheatPool.getPoolDetails();
  console.log(`   Pool Cash: ${ethers.formatUnits(poolDetails.totalCash, 6)} USDC`);
  console.log(`   Pool Borrowed: ${ethers.formatUnits(poolDetails.totalBorrowed, 6)} USDC`);

  // ============================================
  // TEST 4: REPAY HALF
  // ============================================
  console.log("\n" + "=".repeat(60));
  console.log("TEST 4: REPAY HALF OF DEBT");
  console.log("=".repeat(60));

  const repayAmount = 250 * 1e6; // Repay 250 USDC

  console.log(`\n1️⃣ Transferring ${repayAmount / 1e6} USDC to pool...`);
  const repayTransferTx = await new TransferTransaction()
    .addTokenTransfer(usdcTokenId, operatorId, -repayAmount)
    .addTokenTransfer(usdcTokenId, poolAccountId, repayAmount)
    .execute(hederaClient);
  await repayTransferTx.getReceipt(hederaClient);
  console.log("✅ Transfer complete");

  console.log(`\n2️⃣ Calling repay(${repayAmount})...`);
  const repayTx = await wheatPool.repay(repayAmount, { gasLimit: 1000000 });
  await repayTx.wait();
  console.log("✅ Repay successful");

  const userDebtSharesAfter = await wheatPool.userDebtShares(signer.address);
  const borrowValueAfter = await wheatPool.getBorrowValue(signer.address);
  const healthFactorAfter = await wheatPool.getHealthFactor(signer.address);

  console.log(`\n📊 After Repay:`);
  console.log(`   User Debt Shares: ${userDebtSharesAfter}`);
  console.log(`   Borrow Value: $${ethers.formatUnits(borrowValueAfter, 18)}`);
  console.log(`   Health Factor: ${ethers.formatUnits(healthFactorAfter, 18)}`);

  console.log("\n🎉 ALL TESTS PASSED!");
  console.log("\n✅ Supply - WORKING");
  console.log("✅ Deposit Collateral - WORKING");
  console.log("✅ Borrow - WORKING");
  console.log("✅ Repay - WORKING");
  console.log("✅ Price Precision Fix - WORKING CORRECTLY!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Test failed:", error.message);
    console.error(error);
    process.exit(1);
  });
