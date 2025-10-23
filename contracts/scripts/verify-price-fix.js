const { ethers } = require("hardhat");

/**
 * Quick verification that the price precision fix is working
 */

async function main() {
  console.log("\n✅ VERIFYING PRICE PRECISION FIX\n");

  const deployed = require('../deployed.json');
  const [signer] = await ethers.getSigners();

  const LendingPool = await ethers.getContractFactory("LendingPool");
  const wheatPool = LendingPool.attach(deployed.wheatPool);

  // Check collateral decimals
  const underlyingDecimals = await wheatPool.underlyingTokenDecimals();
  const collateralDecimals = await wheatPool.collateralTokenDecimals();

  console.log("📊 Token Decimals (cached in contract):");
  console.log(`   Underlying (USDC): ${underlyingDecimals} decimals`);
  console.log(`   Collateral (WHEAT): ${collateralDecimals} decimals`);

  // Get user's current collateral
  const userCollateral = await wheatPool.userCollateral(signer.address);
  const collateralValue = await wheatPool.getCollateralValue(signer.address);

  console.log("\n💰 Current User Position:");
  console.log(`   Collateral Amount: ${Number(userCollateral) / 1e8} WHEAT`);
  console.log(`   Collateral Value: $${ethers.formatUnits(collateralValue, 18)}`);

  // Manual calculation
  const MockPriceOracle = await ethers.getContractFactory("MockPriceOracle");
  const oracle = MockPriceOracle.attach(deployed.oracle);
  const [price, priceDecimals] = await oracle.getPrice(`0x${deployed.wheat}`);

  console.log("\n🔍 Price Info:");
  console.log(`   WHEAT Price: $${ethers.formatUnits(price, priceDecimals)}`);
  console.log(`   Price Decimals: ${priceDecimals}`);

  // Calculate expected value
  const wheatAmount = Number(userCollateral) / 1e8;
  const wheatPrice = Number(ethers.formatUnits(price, priceDecimals));
  const expectedValue = wheatAmount * wheatPrice;

  console.log("\n🧮 Expected Calculation:");
  console.log(`   ${wheatAmount} WHEAT × $${wheatPrice} = $${expectedValue}`);
  console.log(`   Contract returned: $${ethers.formatUnits(collateralValue, 18)}`);

  if (Math.abs(expectedValue - Number(ethers.formatUnits(collateralValue, 18))) < 0.01) {
    console.log("\n✅✅✅ PRICE PRECISION FIX IS WORKING CORRECTLY! ✅✅✅");
  } else {
    console.log("\n❌ Price calculation mismatch detected!");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Verification failed:", error.message);
    process.exit(1);
  });
