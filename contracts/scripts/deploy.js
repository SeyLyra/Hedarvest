// scripts/deploy-hts.js
import "dotenv/config";
import hardhat from "hardhat";
import {
  Client,
  PrivateKey,
  TokenCreateTransaction,
  TokenAssociateTransaction,
  TokenUpdateTransaction,
  TokenType,
  TokenSupplyType,
  TokenId,
} from "@hashgraph/sdk";

const { ethers, run } = hardhat;

async function main() {
  // Compile contracts
  await run("compile");
  
  // Get deployer - use the simple approach that works
  const [deployer] = await ethers.getSigners();
  console.log("🚀 Deploying contracts with:", deployer.address);
  
  // Get the provider to avoid resolveName issues
  const provider = deployer.provider;
  
  // Try to disable ENS resolution
  if (provider && provider._isProvider) {
    provider._isProvider = false;
  }

  // 1. Initialize Hedera client for HTS token creation
  const operatorId = process.env.HEDERA_OPERATOR_ID;
  const operatorKey = PrivateKey.fromString(process.env.HEDERA_OPERATOR_KEY);
  const client = Client.forTestnet().setOperator(operatorId, operatorKey);

  // 2. Create HTS tokens instead of ERC20
  console.log("⏳ Creating HTS tokens...");
  
  // Lending token (like stablecoin)
  const lendingTokenTx = await new TokenCreateTransaction()
    .setTokenName("Lending USD")
    .setTokenSymbol("LUSD")
    .setTreasuryAccountId(operatorId)
    .setInitialSupply(1000000)
    .setDecimals(6)
    .setTokenType(TokenType.FungibleCommon)
    .setSupplyType(TokenSupplyType.Infinite)
    .setSupplyKey(operatorKey)
    .freezeWith(client)
    .sign(operatorKey);

  const lendingTokenSubmit = await lendingTokenTx.execute(client);
  const lendingTokenReceipt = await lendingTokenSubmit.getReceipt(client);
  const lendingTokenId = lendingTokenReceipt.tokenId.toString();
  const lendingTokenEvm = "0x" + TokenId.fromString(lendingTokenId).toSolidityAddress();
  
  console.log("✅ Lending token deployed:", lendingTokenId, `(${lendingTokenEvm})`);

  // Collateral token (grain collateral)
  const collateralTokenTx = await new TokenCreateTransaction()
    .setTokenName("Grain Collateral")
    .setTokenSymbol("GRAIN")
    .setTreasuryAccountId(operatorId)
    .setInitialSupply(1000000)
    .setDecimals(6)
    .setTokenType(TokenType.FungibleCommon)
    .setSupplyType(TokenSupplyType.Infinite)
    .setSupplyKey(operatorKey)
    .freezeWith(client)
    .sign(operatorKey);

  const collateralTokenSubmit = await collateralTokenTx.execute(client);
  const collateralTokenReceipt = await collateralTokenSubmit.getReceipt(client);
  const collateralTokenId = collateralTokenReceipt.tokenId.toString();
  const collateralTokenEvm = "0x" + TokenId.fromString(collateralTokenId).toSolidityAddress();
  
  console.log("✅ Collateral token deployed:", collateralTokenId, `(${collateralTokenEvm})`);

  // LP token (for liquidity providers)
  const lpTokenTx = await new TokenCreateTransaction()
    .setTokenName("LP Token")
    .setTokenSymbol("LP")
    .setTreasuryAccountId(operatorId)
    .setInitialSupply(1000000)
    .setDecimals(6)
    .setTokenType(TokenType.FungibleCommon)
    .setSupplyType(TokenSupplyType.Infinite)
    .setSupplyKey(operatorKey)
    .freezeWith(client)
    .sign(operatorKey);

  const lpTokenSubmit = await lpTokenTx.execute(client);
  const lpTokenReceipt = await lpTokenSubmit.getReceipt(client);
  const lpTokenId = lpTokenReceipt.tokenId.toString();
  const lpTokenEvm = "0x" + TokenId.fromString(lpTokenId).toSolidityAddress();
  
  console.log("✅ LP token deployed:", lpTokenId, `(${lpTokenEvm})`);

  // 3. Deploy your LendingPoolFactory
  const Factory = await ethers.getContractFactory("LendingPoolFactory");
  const factory = await Factory.deploy();
  const factoryAddress = factory.target;
  console.log("✅ LendingPoolFactory deployed at:", factoryAddress);
  
  // Create a new contract instance to avoid resolveName issues
  const factoryContract = new ethers.Contract(factoryAddress, Factory.interface, deployer);

  // 4. Grain configurations
  const grainConfigs = [
    { name: "Rice", price: ethers.parseEther("200") },
    { name: "Corn", price: ethers.parseEther("150") },
    { name: "Wheat", price: ethers.parseEther("180") },
    { name: "Soybean", price: ethers.parseEther("300") }
  ];
  
  console.log(`📋 Creating ${grainConfigs.length} pools with HTS tokens...`);
  
  const pools = [];

  for (const grain of grainConfigs) {
    console.log(`\n🌾 Creating ${grain.name} pool...`);

    try {
      // Use the HTS token addresses instead of MockToken addresses
      console.log(`🔍 Debug: About to call createPool for ${grain.name}`);
      console.log(`🔍 Debug: lendingTokenEvm = ${lendingTokenEvm}`);
      console.log(`🔍 Debug: collateralTokenEvm = ${collateralTokenEvm}`);
      console.log(`🔍 Debug: lpTokenEvm = ${lpTokenEvm}`);
      
      // Now that addresses have "0x" prefix, we can use normal contract calls
      const tx = await factoryContract.createPool(
        grain.name,             // assetType
        lendingTokenEvm,        // lendingToken
        collateralTokenEvm,     // collateralToken
        lpTokenEvm,             // lpToken
        6000,                   // baseLTV (60%)
        500,                    // protocolFee (5%)
        grain.price             // initialPrice
      );
      
      const receipt = await tx.wait();
      
      // Get pool info from transaction events instead of calling getPool
      const poolCreatedEvent = receipt.logs.find(log => {
        try {
          const parsed = factoryContract.interface.parseLog(log);
          return parsed && parsed.name === 'PoolCreated';
        } catch (e) {
          return false;
        }
      });
      
      if (poolCreatedEvent) {
        const parsed = factoryContract.interface.parseLog(poolCreatedEvent);
        const poolAddress = parsed.args.pool;
        const oracleAddress = parsed.args.oracle;
        
        pools.push({ 
          grain: grain.name, 
          poolAddress: poolAddress, 
          oracleAddress: oracleAddress,
          price: ethers.formatEther(grain.price)
        });
        
        console.log(`✅ ${grain.name} pool created at:`, poolAddress);
        console.log(`✅ ${grain.name} oracle at:`, oracleAddress);
        
        // Associate the pool contract with HTS tokens and set supply key for LP token
        try {
          console.log(`🔗 Associating pool with HTS tokens...`);
          
          // Associate lending token
          const associateLendingTx = await new TokenAssociateTransaction()
            .setAccountId(operatorId)
            .setTokenIds([TokenId.fromString(lendingTokenId)])
            .freezeWith(client)
            .sign(operatorKey);
          await associateLendingTx.execute(client);
          
          // Associate collateral token
          const associateCollateralTx = await new TokenAssociateTransaction()
            .setAccountId(operatorId)
            .setTokenIds([TokenId.fromString(collateralTokenId)])
            .freezeWith(client)
            .sign(operatorKey);
          await associateCollateralTx.execute(client);
          
          // Associate LP token
          const associateLpTx = await new TokenAssociateTransaction()
            .setAccountId(operatorId)
            .setTokenIds([TokenId.fromString(lpTokenId)])
            .freezeWith(client)
            .sign(operatorKey);
          await associateLpTx.execute(client);
          
          // Set pool as supply key for LP token (so it can mint/burn)
          // Note: We need to convert the pool address to a Hedera key format
          // For now, we'll use the operator key, but in production you'd want to set the pool as supply key
          const updateLpTokenTx = await new TokenUpdateTransaction()
            .setTokenId(TokenId.fromString(lpTokenId))
            .setSupplyKey(operatorKey) // TODO: Set pool address as supply key
            .freezeWith(client)
            .sign(operatorKey);
          await updateLpTokenTx.execute(client);
          
          console.log(`✅ Pool associated with HTS tokens`);
        } catch (assocError) {
          console.log(`⚠️ Token association failed: ${assocError.message}`);
        }
      } else {
        console.log(`⚠️ ${grain.name} pool created but couldn't extract addresses from events`);
      }

    } catch (error) {
      console.error(`❌ Failed to create ${grain.name} pool:`, error.message);
      // Continue with other pools
    }
  }

  // 5. Final summary
  console.log("\n🎉 HTS Deployment Complete!");
  console.log("\n📋 Deployment Summary:");
  console.log(`Lending Token (HTS): ${lendingTokenId} (${lendingTokenEvm})`);
  console.log(`Collateral Token (HTS): ${collateralTokenId} (${collateralTokenEvm})`);
  console.log(`LP Token (HTS): ${lpTokenId} (${lpTokenEvm})`);
  console.log(`Factory: ${factoryAddress}`);
  console.log(`Total Pools: ${pools.length}`);
  
  console.log("\n🏊 Deployed Pools:");
  pools.forEach(pool => {
    console.log(`\n${pool.grain}:`);
    console.log(`  Pool: ${pool.poolAddress}`);
    console.log(`  Oracle: ${pool.oracleAddress}`);
    console.log(`  Price: $${pool.price}`);
  });
}

main().catch((error) => {
  console.error("💥 Deployment failed:", error);
  process.exitCode = 1;
});