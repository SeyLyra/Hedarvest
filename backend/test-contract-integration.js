#!/usr/bin/env node

/**
 * Contract Integration Test
 * 
 * This script tests the backend's ability to connect to deployed smart contracts
 * Run this after updating your .env file with deployed contract addresses
 */

const { ethers } = require('ethers');

// Load environment variables manually
require('fs').readFileSync('.env', 'utf8').split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    process.env[key] = valueParts.join('=').replace(/"/g, '');
  }
});

// Test contract ABIs (simplified)
const POOL_FACTORY_ABI = [
  'function getAllPools() external view returns (tuple(address poolAddress, address oracleAddress, string grainType)[])',
  'function getPoolStats() external view returns (tuple(address pool, string grainType, uint256 totalAssets, uint256 totalBorrows, uint256 availableLiquidity, uint256 utilizationRate, uint256 currentAPR)[])',
];

const GRAIN_POOL_ABI = [
  'function grainType() external view returns (string)',
  'function lendingToken() external view returns (address)',
  'function collateralToken() external view returns (address)',
  'function totalAssets() external view returns (uint256)',
  'function utilizationRate() external view returns (uint256)',
  'function getPoolHealthScore() external view returns (uint256)',
];

const MOCK_TOKEN_ABI = [
  'function name() external view returns (string)',
  'function symbol() external view returns (string)',
  'function decimals() external view returns (uint8)',
  'function balanceOf(address) external view returns (uint256)',
];

async function testContractIntegration() {
  console.log('🔧 Testing Contract Integration');
  console.log('==============================\n');

  try {
    // Initialize provider and wallet
    const provider = new ethers.JsonRpcProvider(process.env.HEDERA_JSON_RPC_URL);
    const wallet = new ethers.Wallet(process.env.EVM_PRIVATE_KEY, provider);
    
    console.log('✅ Provider and wallet initialized');
    console.log(`   Network: ${process.env.HEDERA_NETWORK}`);
    console.log(`   Wallet: ${wallet.address}`);

    // Test 1: PoolFactory connection
    console.log('\n📋 Test 1: PoolFactory Connection');
    const factoryAddress = process.env.POOL_FACTORY_ADDRESS;
    
    if (!factoryAddress || factoryAddress.includes('XXXX')) {
      console.log('❌ POOL_FACTORY_ADDRESS not configured');
      return;
    }

    const factory = new ethers.Contract(factoryAddress, POOL_FACTORY_ABI, wallet);
    const pools = await factory.getAllPools();
    
    console.log(`✅ PoolFactory connected successfully`);
    console.log(`   Found ${pools.length} pools:`, pools.map(p => p.grainType).join(', '));

    // Test 2: Token contracts
    console.log('\n🪙 Test 2: Token Contracts');
    
    const lendingTokenAddress = process.env.LENDING_TOKEN_ADDRESS;
    const collateralTokenAddress = process.env.COLLATERAL_TOKEN_ADDRESS;
    
    if (lendingTokenAddress && !lendingTokenAddress.includes('XXXX')) {
      const lendingToken = new ethers.Contract(lendingTokenAddress, MOCK_TOKEN_ABI, wallet);
      const name = await lendingToken.name();
      const symbol = await lendingToken.symbol();
      console.log(`✅ Lending Token: ${name} (${symbol})`);
    } else {
      console.log('❌ LENDING_TOKEN_ADDRESS not configured');
    }

    if (collateralTokenAddress && !collateralTokenAddress.includes('XXXX')) {
      const collateralToken = new ethers.Contract(collateralTokenAddress, MOCK_TOKEN_ABI, wallet);
      const name = await collateralToken.name();
      const symbol = await collateralToken.symbol();
      console.log(`✅ Collateral Token: ${name} (${symbol})`);
    } else {
      console.log('❌ COLLATERAL_TOKEN_ADDRESS not configured');
    }

    // Test 3: Pool contracts
    console.log('\n🏊 Test 3: Pool Contracts');
    
    for (const pool of pools) {
      try {
        const poolContract = new ethers.Contract(pool.poolAddress, GRAIN_POOL_ABI, wallet);
        const grainType = await poolContract.grainType();
        const lendingToken = await poolContract.lendingToken();
        const collateralToken = await poolContract.collateralToken();
        const totalAssets = await poolContract.totalAssets();
        const utilizationRate = await poolContract.utilizationRate();
        const healthScore = await poolContract.getPoolHealthScore();
        
        console.log(`✅ ${grainType} Pool:`);
        console.log(`   Address: ${pool.poolAddress}`);
        console.log(`   Lending Token: ${lendingToken}`);
        console.log(`   Collateral Token: ${collateralToken}`);
        console.log(`   Total Assets: ${ethers.formatUnits(totalAssets, 6)}`);
        console.log(`   Utilization: ${Number(utilizationRate) / 100}%`);
        console.log(`   Health Score: ${Number(healthScore) / 100}%`);
      } catch (error) {
        console.log(`❌ Failed to connect to ${pool.grainType} pool:`, error.message);
      }
    }

    // Test 4: Pool Stats
    console.log('\n📊 Test 4: Pool Statistics');
    
    try {
      const poolStats = await factory.getPoolStats();
      console.log(`✅ Retrieved stats for ${poolStats.length} pools:`);
      
      poolStats.forEach(stat => {
        console.log(`   ${stat.grainType}:`);
        console.log(`     TVL: $${ethers.formatUnits(stat.totalAssets, 6)}`);
        console.log(`     Utilization: ${Number(stat.utilizationRate) / 100}%`);
        console.log(`     APR: ${Number(stat.currentAPR) / 100}%`);
      });
    } catch (error) {
      console.log('❌ Failed to get pool stats:', error.message);
    }

    console.log('\n🎉 Contract Integration Test Complete!');
    console.log('\nYour backend is ready to use the deployed contracts.');
    console.log('You can now start your backend server and test the investor dashboard.');

  } catch (error) {
    console.error('\n❌ Contract Integration Test Failed:');
    console.error(error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check your .env file has the correct contract addresses');
    console.log('2. Verify your EVM_PRIVATE_KEY has the correct format');
    console.log('3. Ensure HEDERA_JSON_RPC_URL is accessible');
    console.log('4. Make sure contracts are deployed and verified');
  }
}

// Run the test
testContractIntegration();
