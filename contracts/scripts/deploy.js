// scripts/deploy-hts.js
import "dotenv/config";
import hardhat from "hardhat";
import {
  Client,
  PrivateKey,
  AccountId,
  TokenCreateTransaction,
  TokenAssociateTransaction,
  TokenType,
  TokenSupplyType
} from "@hashgraph/sdk";

import fs from "fs";
import path from "path";

const { ethers, run } = hardhat;

/**
 * Convert an EVM address (0x...) to a Hedera Account ID (0.0.x)
 */
function evmAddressToAccountId(evmAddress) {
  const hex = evmAddress.startsWith("0x") ? evmAddress.slice(2) : evmAddress;
  const paddedHex = hex.padStart(40, "0");
  const addressBytes = paddedHex.slice(-40);
  return `0.0.${parseInt(addressBytes, 16)}`;
}

async function main() {
  console.log("🚀 Starting HTS Lending Platform Deployment...\n");

  await run("compile");

  const [deployer] = await ethers.getSigners();
  console.log("📍 Deployer:", deployer.address);
  console.log(
    "💰 Balance:",
    ethers.formatEther(await ethers.provider.getBalance(deployer.address)),
    "HBAR\n"
  );

  // 1️⃣ Initialize Hedera client
  const operatorId = AccountId.fromString(process.env.HEDERA_OPERATOR_ID);
  const operatorKey = PrivateKey.fromString(process.env.HEDERA_OPERATOR_KEY);
  const client = Client.forTestnet().setOperator(operatorId, operatorKey);

  console.log("🔗 Connected to Hedera Testnet as:", operatorId.toString(), "\n");

  // 2️⃣ Create Tokens (AUSD + Collaterals + LP)
  console.log("🪙 Creating HTS Tokens...\n");

  const ausdTx = await new TokenCreateTransaction()
    .setTokenName("Agricultural USD")
    .setTokenSymbol("AUSD")
    .setDecimals(6)
    .setInitialSupply(10_000_000_000_000)
    .setTreasuryAccountId(operatorId)
    .setTokenType(TokenType.FungibleCommon)
    .setSupplyType(TokenSupplyType.Infinite)
    .setSupplyKey(operatorKey)
    .setAdminKey(operatorKey)
    .freezeWith(client)
    .sign(operatorKey);

  const ausdReceipt = await (await ausdTx.execute(client)).getReceipt(client);
  const ausdTokenId = ausdReceipt.tokenId;
  const ausdEvm = "0x" + ausdTokenId.toSolidityAddress();
  console.log(`✅ AUSD deployed: ${ausdTokenId.toString()} (${ausdEvm})\n`);

  const grains = ["RICE", "CORN", "WHEAT", "SOYBEAN"];
  const grainTokens = {};
  const lpTokens = {};

  for (const symbol of grains) {
    const grainTx = await new TokenCreateTransaction()
      .setTokenName(`${symbol} Token`)
      .setTokenSymbol(symbol)
      .setDecimals(6)
      .setInitialSupply(1_000_000_000_000)
      .setTreasuryAccountId(operatorId)
      .setTokenType(TokenType.FungibleCommon)
      .setSupplyType(TokenSupplyType.Infinite)
      .setSupplyKey(operatorKey)
      .setAdminKey(operatorKey)
      .freezeWith(client)
      .sign(operatorKey);

    const receipt = await (await grainTx.execute(client)).getReceipt(client);
    const id = receipt.tokenId;
    const evm = "0x" + id.toSolidityAddress();
    grainTokens[symbol] = { id, evm };
    console.log(`✅ ${symbol} Token created: ${id.toString()} (${evm})`);

    const lpTx = await new TokenCreateTransaction()
      .setTokenName(`${symbol} LP Token`)
      .setTokenSymbol(`LP-${symbol}`)
      .setDecimals(6)
      .setInitialSupply(0)
      .setTreasuryAccountId(operatorId)
      .setTokenType(TokenType.FungibleCommon)
      .setSupplyType(TokenSupplyType.Infinite)
      .setSupplyKey(operatorKey)
      .setAdminKey(operatorKey)
      .freezeWith(client)
      .sign(operatorKey);

    const lpReceipt = await (await lpTx.execute(client)).getReceipt(client);
    const lpId = lpReceipt.tokenId;
    const lpEvm = "0x" + lpId.toSolidityAddress();
    lpTokens[symbol] = { id: lpId, evm: lpEvm };
    console.log(`✅ LP-${symbol} Token created: ${lpId.toString()} (${lpEvm})\n`);
  }

  // 3️⃣ Deploy PriceOracle
  console.log("📊 Deploying PriceOracle...");
  const Oracle = await ethers.getContractFactory("MockPriceOracle");
  const oracle = await Oracle.deploy();
  await oracle.waitForDeployment();
  const oracleAddress = await oracle.getAddress();
  console.log("✅ PriceOracle deployed at:", oracleAddress, "\n");

  // 4️⃣ Deploy PoolFactory
  console.log("🏭 Deploying PoolFactory...");
  const Factory = await ethers.getContractFactory("PoolFactory");
  const factory = await Factory.deploy(oracleAddress, ausdEvm); // _priceOracle, _htsAddress
  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();
  const factoryContractId = evmAddressToAccountId(factoryAddress);

  console.log("✅ PoolFactory deployed at:", factoryAddress);
  console.log("📋 Hedera Contract ID:", factoryContractId, "\n");

  // 5️⃣ Configure Assets
  for (const symbol of grains) {
    console.log(`⚙️ Configuring ${symbol} parameters...`);
    await (await factory.configureAsset(symbol, 7000, 8500, 500)).wait();
    console.log(`✅ ${symbol} configured`);
  }

  // 6️⃣ Create Pools
  const pools = [];
  for (const symbol of grains) {
    console.log(`🏊 Creating ${symbol} pool...`);
    const tx = await factory.createPool(
      symbol,
      ausdEvm,
      grainTokens[symbol].evm,
      lpTokens[symbol].evm
    );
    const receipt = await tx.wait();
    const poolCreated = receipt.logs.find((log) => {
      try {
        const parsed = factory.interface.parseLog(log);
        return parsed?.name === "PoolCreated";
      } catch {
        return false;
      }
    });

    if (poolCreated) {
      const parsed = factory.interface.parseLog(poolCreated);
      const poolAddress = parsed.args.poolAddress || parsed.args[1];
      console.log(`✅ ${symbol} Pool created at: ${poolAddress}`);
      pools.push({ symbol, poolAddress });
    }
  }

  // 7️⃣ Save deployment
  const deployment = {
    network: "hedera-testnet",
    factory: factoryAddress,
    factoryContractId,
    oracle: oracleAddress,
    ausd: { id: ausdTokenId.toString(), evm: ausdEvm },
    tokens: grainTokens,
    lpTokens,
    pools
  };

  const deployDir = path.join(process.cwd(), "deployments");
  if (!fs.existsSync(deployDir)) fs.mkdirSync(deployDir);
  fs.writeFileSync(
    path.join(deployDir, "hedera-testnet.json"),
    JSON.stringify(deployment, null, 2)
  );

  console.log("\n💾 Deployment saved to deployments/hedera-testnet.json");
  console.log("🎉 Done!");
}

main().catch((err) => {
  console.error("💥 Deployment failed:", err);
  process.exitCode = 1;
});
