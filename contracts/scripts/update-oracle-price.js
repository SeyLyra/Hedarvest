// SPDX-License-Identifier: MIT
// Script to update oracle prices without redeploying

const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("\n🔧 Updating Oracle Prices...\n");

  // Load deployed contracts
  const deployedPath = path.join(__dirname, "..", "deployed.json");
  if (!fs.existsSync(deployedPath)) {
    throw new Error("deployed.json not found. Please deploy contracts first.");
  }

  const deployed = JSON.parse(fs.readFileSync(deployedPath, "utf8"));
  const network = deployed.network || "hederaTestnet";

  // Get signer
  const [signer] = await ethers.getSigners();
  console.log(`📝 Using account: ${signer.address}`);

  // Get deployed oracle address
  const oracleAddress = deployed.oracle || "0x32344dEf5EA9Fa9b83962980C8d447dea81F3685";
  if (!oracleAddress) {
    throw new Error("Oracle address not found in deployed.json");
  }

  // Get token addresses - format: "00000000000000000000000000000000006c9311" -> "0x00000000000000000000000000000000006c9311"
  const wheatAddress = deployed.wheat;
  const riceAddress = deployed.rice;

  if (!wheatAddress || !riceAddress) {
    throw new Error("Token addresses not found in deployed.json");
  }

  // Format addresses with 0x prefix (they're already in the correct format from deployed.json)
  const wheatAddr = wheatAddress.startsWith("0x") ? wheatAddress : `0x${wheatAddress}`;
  const riceAddr = riceAddress.startsWith("0x") ? riceAddress : `0x${riceAddress}`;

  console.log(`📍 Oracle address: ${oracleAddress}`);
  console.log(`📍 WHEAT token: ${wheatAddr}`);
  console.log(`📍 RICE token: ${riceAddr}\n`);

  // Connect to oracle
  const MockPriceOracle = await ethers.getContractFactory("MockPriceOracle");
  const oracle = MockPriceOracle.attach(oracleAddress);

  // Get current prices
  console.log("📊 Current Prices:");
  const [wheatPriceBefore, wheatDecimals] = await oracle.getPrice(wheatAddr);
  const [ricePriceBefore, riceDecimals] = await oracle.getPrice(riceAddr);
  console.log(`   WHEAT: $${ethers.formatUnits(wheatPriceBefore, wheatDecimals)}`);
  console.log(`   RICE: $${ethers.formatUnits(ricePriceBefore, riceDecimals)}\n`);

  // Update prices: $2 for WHEAT and $1 for RICE (8 decimals)
  console.log("🔄 Updating prices: WHEAT to $2, RICE to $1...\n");
  
  const wheatPrice = ethers.parseUnits("2", 8); // $2 with 8 decimals
  const ricePrice = ethers.parseUnits("1", 8);   // $1 with 8 decimals
  
  // Update WHEAT price
  console.log("📝 Updating WHEAT price to $2...");
  const tx1 = await oracle.setPrice(wheatAddr, wheatPrice, 8);
  await tx1.wait();
  console.log(`   ✅ Transaction hash: ${tx1.hash}`);

  // Update RICE price
  console.log("📝 Updating RICE price to $1...");
  const tx2 = await oracle.setPrice(riceAddr, ricePrice, 8);
  await tx2.wait();
  console.log(`   ✅ Transaction hash: ${tx2.hash}\n`);

  // Verify new prices
  console.log("✅ Updated Prices:");
  const [wheatPriceAfter] = await oracle.getPrice(wheatAddr);
  const [ricePriceAfter] = await oracle.getPrice(riceAddr);
  console.log(`   WHEAT: $${ethers.formatUnits(wheatPriceAfter, 8)} (should be $2)`);
  console.log(`   RICE: $${ethers.formatUnits(ricePriceAfter, 8)} (should be $1)\n`);

  console.log("🎉 Oracle prices updated successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Error updating oracle prices:");
    console.error(error);
    process.exit(1);
  });

