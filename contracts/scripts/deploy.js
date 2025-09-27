import hardhat from "hardhat";
const { ethers, run } = hardhat;

async function main() {
  // Ensure artifacts exist (especially OZ presets)
  await run("compile");
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with:", deployer.address);

  // 1. Deploy mock stablecoin (lending token for all pools)
  const Token = await ethers.getContractFactory("MockToken");
  const lendingToken = await Token.deploy("Mock USD", "mUSD", (await ethers.getSigners())[0].address);
  await lendingToken.waitForDeployment();
  console.log("✅ Lending token deployed at:", await lendingToken.getAddress());

  // 2. Deploy mock collateral token (grain tokens for collateral)
  const collateralToken = await Token.deploy("Mock Grain", "mGRAIN", (await ethers.getSigners())[0].address);
  await collateralToken.waitForDeployment();
  console.log("✅ Collateral token deployed at:", await collateralToken.getAddress());

  // 3. Deploy pool factory
  const Factory = await ethers.getContractFactory("PoolFactory");
  const factory = await Factory.deploy();
  await factory.waitForDeployment();
  console.log("✅ PoolFactory deployed at:", await factory.getAddress());

  // Grain types with their initial prices (in USD, scaled to 1e18)
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
      // Check if pool already exists
      const existingPool = await factory.getPool(grain.name);
      if (existingPool.poolAddress !== "0x0000000000000000000000000000000000000000") {
        console.log(`⚠️  ${grain.name} pool already exists, skipping...`);
        pools.push({ 
          grain: grain.name, 
          poolAddress: existingPool.poolAddress, 
          oracleAddress: existingPool.oracleAddress,
          price: ethers.formatEther(grain.price)
        });
        continue;
      }

      // Create pool using factory (this will deploy both pool and oracle)
      const tx = await factory.createPool(
        grain.name,
        await lendingToken.getAddress(),
        await collateralToken.getAddress(), // collateral token
        6000, // baseLTV (60%)
        200,  // riskPremium (2%)
        ethers.parseEther("1000000"), // debt ceiling = 1M
        500,  // protocol fee (5%)
        grain.price // initial price
      );
      const receipt = await tx.wait();
      
      // Get pool info from factory
      const poolInfo = await factory.getPool(grain.name);
      const poolAddress = poolInfo.poolAddress;
      const oracleAddress = poolInfo.oracleAddress;

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
  console.log(`Lending Token: ${await lendingToken.getAddress()}`);
  console.log(`Collateral Token: ${await collateralToken.getAddress()}`);
  console.log(`Factory: ${await factory.getAddress()}`);
  console.log(`Total Pools: ${pools.length}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});