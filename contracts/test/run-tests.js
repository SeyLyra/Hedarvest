const { execSync } = require('child_process');

console.log("🧪 Running comprehensive test suite for LendingPool and LendingPoolFactory...\n");

try {
  // Compile contracts first
  console.log("📦 Compiling contracts...");
  execSync("npx hardhat compile", { stdio: "inherit" });
  
  console.log("\n📋 Running Comprehensive LendingPool tests...");
  execSync("npx hardhat test test/ComprehensiveLendingPool.test.js", { stdio: "inherit" });
  
  console.log("\n✅ All tests completed successfully!");
  process.exit(0);
  
} catch (error) {
  console.error("\n❌ Test suite failed");
  process.exit(1);
}
