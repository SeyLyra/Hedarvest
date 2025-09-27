import hardhat from "hardhat";
const { ethers, run } = hardhat;

async function main() {
  // Ensure artifacts exist (especially OZ presets)
  await run("compile");
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with:", deployer.address);

  // 1. Create mock token addresses (simulating HTS tokens)
  // In a real deployment, these would be actual HTS token addresses
  const lendingTokenAddress = ethers.Wallet.createRandom().address;
  const collateralTokenAddress = ethers.Wallet.createRandom().address;
  
  console.log("✅ Mock lending token address:", lendingTokenAddress);
  console.log("✅ Mock collateral token address:", collateralTokenAddress);
  console.log("ℹ️  Note: In production, these would be actual Hedera HTS token addresses");

  // 2. Deploy pool factory (for reference, but we'll deploy pools directly)
  const Factory = await ethers.getContractFactory("LendingFactory");
  const factory = await Factory.deploy();
  await factory.waitForDeployment();
  console.log("✅ LendingFactory deployed at:", await factory.getAddress());

  // 3. Deploy pools and oracles directly (bypassing HTS token creation)
  const grainConfigs = [
    { name: "Rice", price: ethers.parseEther("200") },    // $200 per unit
    { name: "Corn", price: ethers.parseEther("150") },    // $150 per unit
    { name: "Wheat", price: ethers.parseEther("180") },   // $180 per unit
    { name: "Soybean", price: ethers.parseEther("300") }  // $300 per unit
  ];
  
  console.log(`📋 Planning to create ${grainConfigs.length} pools:`, grainConfigs.map(g => g.name).join(", "));
  
  const pools = [];

  for (const grain of grainConfigs) {
    console.log(`\n🌾 Creating ${grain.name} pool...`);

    try {
      // Deploy oracle first
      const MockPriceOracle = await ethers.getContractFactory("MockPriceOracle");
      const oracle = await MockPriceOracle.deploy();
      await oracle.waitForDeployment();
      const oracleAddress = await oracle.getAddress();
      
      // Set initial price
      await oracle.setPrice(grain.name, grain.price);
      
      // Deploy LendingPool directly
      const LendingPool = await ethers.getContractFactory("LendingPool");
      const pool = await LendingPool.deploy(
        grain.name,
        lendingTokenAddress,
        collateralTokenAddress,
        lendingTokenAddress, // Use lending token as LP token
        7500, // baseLTV (75%)
        1000, // protocol fee (10%)
        oracleAddress,
        deployer.address
      );
      await pool.waitForDeployment();
      const poolAddress = await pool.getAddress();

      pools.push({ 
        grain: grain.name, 
        poolAddress, 
        oracleAddress,
        price: ethers.formatEther(grain.price)
      });
      
      console.log(`✅ ${grain.name} pool created at:`, poolAddress);
      console.log(`✅ ${grain.name} oracle at:`, oracleAddress);
      console.log(`✅ ${grain.name} initial price: $${ethers.formatEther(grain.price)}`);
    } catch (error) {
      console.error(`❌ Failed to create ${grain.name} pool:`, error.message);
      // Continue with other pools
    }
  }

  console.log("\n🚀 All pools deployed successfully!");
  console.table(pools.map(p => ({
    Grain: p.grain,
    Pool: p.poolAddress,
    Oracle: p.oracleAddress,
    Price: `$${p.price}`
  })));

  console.log("\n📋 Deployment Summary:");
  console.log(`Lending Token: ${lendingTokenAddress}`);
  console.log(`Collateral Token: ${collateralTokenAddress}`);
  console.log(`Factory: ${await factory.getAddress()}`);
  console.log(`Total Pools: ${pools.length}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});