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
 * 🧪 COMPREHENSIVE LENDING FLOW TEST
 *
 * Tests all core functionality:
 * 1. Supply (Deposit underlying)
 * 2. Deposit Collateral
 * 3. Borrow
 * 4. Repay
 * 5. Withdraw Collateral
 * 6. Withdraw (underlying)
 */

async function main() {
  console.log("\n🧪 COMPREHENSIVE LENDING FLOW TEST\n");

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
  console.log("📍 USDC:", `0x${deployed.usdc}`);
  console.log("📍 WHEAT:", `0x${deployed.wheat}`);

  const usdcTokenId = TokenId.fromSolidityAddress(`0x${deployed.usdc}`);
  const wheatTokenId = TokenId.fromSolidityAddress(`0x${deployed.wheat}`);
  const poolAccountId = AccountId.fromString(deployed.wheatPoolNativeId);

  // ============================================
  // TEST 1: SUPPLY (Deposit Underlying USDC)
  // ============================================
  console.log("\n" + "=".repeat(60));
  console.log("TEST 1: SUPPLY LIQUIDITY");
  console.log("=".repeat(60));

  const supplyAmount = 2000 * 1e6; // 2000 USDC
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
  console.log(`   Available to Borrow: ${ethers.formatUnits(poolDetails.totalCash, 6)} USDC`);

  // ============================================
  // TEST 2: DEPOSIT COLLATERAL (WHEAT)
  // ============================================
  console.log("\n" + "=".repeat(60));
  console.log("TEST 2: DEPOSIT COLLATERAL");
  console.log("=".repeat(60));

  const collateralAmount = 5 * 1e8; // 5 WHEAT (8 decimals)
  console.log(`\n1️⃣ Transferring ${collateralAmount / 1e8} WHEAT to pool...`);

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

  const maxBorrow = await wheatPool.getCollateralValue(signer.address);
  const ltv = poolDetails.loanToValue;
  const maxBorrowValueUSD = (maxBorrow * ltv) / ethers.parseUnits("1", 18);
  const borrowValueUSD = maxBorrowValueUSD / 2n; // Borrow 50% of max

  // Convert USD value to USDC amount (6 decimals)
  // borrowValueUSD is in 18 decimals, we need 6 decimals for USDC
  const borrowAmount = borrowValueUSD / ethers.parseUnits("1", 12); // Divide by 1e12 to convert from 18 to 6 decimals

  console.log(`\n📊 Borrow Capacity:`);
  console.log(`   Max Borrow: $${ethers.formatUnits(maxBorrowValueUSD, 18)}`);
  console.log(`   Borrowing: $${ethers.formatUnits(borrowValueUSD, 18)} (50% of max)`);
  console.log(`   Borrow Amount: ${ethers.formatUnits(borrowAmount, 6)} USDC`);

  // Check USDC balance before borrow
  const balanceBeforeBorrow = await new AccountBalanceQuery()
    .setAccountId(operatorId)
    .execute(hederaClient);
  const usdcBeforeBorrow = balanceBeforeBorrow.tokens.get(usdcTokenId);

  console.log(`\n1️⃣ Calling borrow(${borrowAmount}) [${ethers.formatUnits(borrowAmount, 6)} USDC]...`);
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
  // TEST 4: REPAY
  // ============================================
  console.log("\n" + "=".repeat(60));
  console.log("TEST 4: REPAY");
  console.log("=".repeat(60));

  const repayAmount = borrowAmount / 2n; // Repay 50% of borrowed amount

  console.log(`\n1️⃣ Transferring ${ethers.formatUnits(repayAmount, 6)} USDC to pool for repayment...`);
  const repayTransferTx = await new TransferTransaction()
    .addTokenTransfer(usdcTokenId, operatorId, -Number(repayAmount))
    .addTokenTransfer(usdcTokenId, poolAccountId, Number(repayAmount))
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

  poolDetails = await wheatPool.getPoolDetails();
  console.log(`   Pool Cash: ${ethers.formatUnits(poolDetails.totalCash, 6)} USDC`);
  console.log(`   Pool Borrowed: ${ethers.formatUnits(poolDetails.totalBorrowed, 6)} USDC`);

  // ============================================
  // TEST 5: REPAY REMAINING DEBT
  // ============================================
  console.log("\n" + "=".repeat(60));
  console.log("TEST 5: REPAY REMAINING DEBT");
  console.log("=".repeat(60));

  const remainingDebt = await wheatPool.getBorrowValue(signer.address);
  console.log(`\n📊 Remaining Debt: $${ethers.formatUnits(remainingDebt, 18)}`);

  console.log(`\n1️⃣ Transferring remaining USDC to pool...`);
  const finalRepayTransferTx = await new TransferTransaction()
    .addTokenTransfer(usdcTokenId, operatorId, -Number(remainingDebt))
    .addTokenTransfer(usdcTokenId, poolAccountId, Number(remainingDebt))
    .execute(hederaClient);
  await finalRepayTransferTx.getReceipt(hederaClient);
  console.log("✅ Transfer complete");

  console.log(`\n2️⃣ Calling repay to clear debt...`);
  const finalRepayTx = await wheatPool.repay(remainingDebt, { gasLimit: 1000000 });
  await finalRepayTx.wait();
  console.log("✅ Debt fully repaid");

  const finalDebtShares = await wheatPool.userDebtShares(signer.address);
  const finalBorrowValue = await wheatPool.getBorrowValue(signer.address);

  console.log(`\n📊 After Full Repay:`);
  console.log(`   User Debt Shares: ${finalDebtShares}`);
  console.log(`   Borrow Value: $${ethers.formatUnits(finalBorrowValue, 18)}`);

  // ============================================
  // TEST 6: WITHDRAW COLLATERAL
  // ============================================
  console.log("\n" + "=".repeat(60));
  console.log("TEST 6: WITHDRAW COLLATERAL");
  console.log("=".repeat(60));

  const withdrawCollateralAmount = collateralAmount / 2n; // Withdraw half

  const wheatBeforeWithdraw = (await new AccountBalanceQuery()
    .setAccountId(operatorId)
    .execute(hederaClient)).tokens.get(wheatTokenId);

  console.log(`\n1️⃣ Calling withdrawCollateral(${withdrawCollateralAmount})...`);
  const withdrawCollateralTx = await wheatPool.withdrawCollateral(withdrawCollateralAmount, { gasLimit: 1000000 });
  await withdrawCollateralTx.wait();
  console.log("✅ Withdraw collateral successful");

  const wheatAfterWithdraw = (await new AccountBalanceQuery()
    .setAccountId(operatorId)
    .execute(hederaClient)).tokens.get(wheatTokenId);

  const remainingCollateral = await wheatPool.userCollateral(signer.address);

  console.log(`\n📊 After Collateral Withdrawal:`);
  console.log(`   WHEAT Received: ${Number(wheatAfterWithdraw - wheatBeforeWithdraw) / 1e8} WHEAT`);
  console.log(`   Remaining Collateral: ${Number(remainingCollateral) / 1e8} WHEAT`);

  // ============================================
  // TEST 7: WITHDRAW LIQUIDITY
  // ============================================
  console.log("\n" + "=".repeat(60));
  console.log("TEST 7: WITHDRAW LIQUIDITY");
  console.log("=".repeat(60));

  const userSharesBeforeWithdraw = await wheatPool.userLPShares(signer.address);
  const withdrawShares = userSharesBeforeWithdraw / 2n; // Withdraw half

  const usdcBeforeWithdraw = (await new AccountBalanceQuery()
    .setAccountId(operatorId)
    .execute(hederaClient)).tokens.get(usdcTokenId);

  console.log(`\n1️⃣ Calling withdraw(${withdrawShares} shares)...`);
  const withdrawTx = await wheatPool.withdraw(withdrawShares, { gasLimit: 1000000 });
  await withdrawTx.wait();
  console.log("✅ Withdraw successful");

  const usdcAfterWithdraw = (await new AccountBalanceQuery()
    .setAccountId(operatorId)
    .execute(hederaClient)).tokens.get(usdcTokenId);

  const userSharesAfterWithdraw = await wheatPool.userLPShares(signer.address);

  console.log(`\n📊 After Liquidity Withdrawal:`);
  console.log(`   USDC Received: ${Number(usdcAfterWithdraw - usdcBeforeWithdraw) / 1e6} USDC`);
  console.log(`   Remaining LP Shares: ${userSharesAfterWithdraw}`);

  // ============================================
  // FINAL SUMMARY
  // ============================================
  console.log("\n" + "=".repeat(60));
  console.log("FINAL SUMMARY");
  console.log("=".repeat(60));

  const finalPoolDetails = await wheatPool.getPoolDetails();
  const finalUserShares = await wheatPool.userLPShares(signer.address);
  const finalUserCollateral = await wheatPool.userCollateral(signer.address);
  const finalUserDebt = await wheatPool.userDebtShares(signer.address);

  console.log(`\n📊 Pool State:`);
  console.log(`   Total Cash: ${ethers.formatUnits(finalPoolDetails.totalCash, 6)} USDC`);
  console.log(`   Total Borrowed: ${ethers.formatUnits(finalPoolDetails.totalBorrowed, 6)} USDC`);
  console.log(`   Total LP Shares: ${finalPoolDetails.totalLPShares}`);
  console.log(`   Utilization: ${finalPoolDetails.totalBorrowed > 0 ? (Number(finalPoolDetails.totalBorrowed) / Number(finalPoolDetails.totalCash) * 100).toFixed(2) : 0}%`);

  console.log(`\n📊 User Position:`);
  console.log(`   LP Shares: ${finalUserShares}`);
  console.log(`   Collateral: ${Number(finalUserCollateral) / 1e8} WHEAT`);
  console.log(`   Debt: ${finalUserDebt} shares`);

  console.log("\n🎉🎉🎉 ALL TESTS PASSED! 🎉🎉🎉");
  console.log("\n✅ Supply (Deposit) - WORKING");
  console.log("✅ Deposit Collateral - WORKING");
  console.log("✅ Borrow - WORKING");
  console.log("✅ Repay - WORKING");
  console.log("✅ Withdraw Collateral - WORKING");
  console.log("✅ Withdraw Liquidity - WORKING");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Test failed:", error.message);
    console.error(error);
    process.exit(1);
  });
