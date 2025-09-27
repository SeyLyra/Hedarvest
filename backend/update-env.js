#!/usr/bin/env node

/**
 * Environment Update Script for Hedarvest Backend
 * 
 * This script helps you update your .env file with the deployed contract addresses
 * Run this after deploying your smart contracts
 */

const fs = require('fs');
const path = require('path');

// Template for the updated .env file
const envTemplate = `# Database
DATABASE_URL="postgresql://username:password@localhost:5432/hedarvest_db"

# JWT Configuration
JWT_SECRET="your-jwt-secret-key-hedarvest-2025"
JWT_EXPIRES_IN="7d"

# Hedera Configuration
HEDERA_NETWORK="testnet"
HEDERA_ACCOUNT_ID="0.0.xxxxx"
HEDERA_PRIVATE_KEY="302e020100300506032b657004220420xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"

# Legacy Hedera Operator Config (for backward compatibility)
HEDERA_OPERATOR_ID="0.0.xxxxx"  # Same as HEDERA_ACCOUNT_ID
HEDERA_OPERATOR_KEY="302e020100300506032b657004220420xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"

# Hedera Consensus Service (HCS) Configuration
HEDERA_TOPIC_ID="0.0.xxxxx"

# EVM/Smart Contract Configuration
HEDERA_JSON_RPC_URL="https://testnet.hashio.io/api"
EVM_PRIVATE_KEY="0xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"

# Contract Addresses (UPDATE THESE WITH YOUR DEPLOYED ADDRESSES)
POOL_FACTORY_ADDRESS="0xXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"

# Token Addresses (NEW - for dual token system)
LENDING_TOKEN_ADDRESS="0xXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
COLLATERAL_TOKEN_ADDRESS="0xXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"

# Pool Addresses
RICE_POOL_ADDRESS="0xXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
CORN_POOL_ADDRESS="0xXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
WHEAT_POOL_ADDRESS="0xXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
SOYBEAN_POOL_ADDRESS="0xXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"

# Oracle Addresses (NEW)
RICE_ORACLE_ADDRESS="0xXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
CORN_ORACLE_ADDRESS="0xXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
WHEAT_ORACLE_ADDRESS="0xXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
SOYBEAN_ORACLE_ADDRESS="0xXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"

# Application Configuration
PORT=3001
NODE_ENV="development"

# Throttling
THROTTLE_TTL=60
THROTTLE_LIMIT=20

# OTP Configuration (if using SMS/Email)
OTP_SECRET="your-otp-secret"

# Frontend URLs (CORS)
FRONTEND_URL="http://localhost:3000"

# API Base URL (for frontend)
API_BASE_URL="http://localhost:3001"
`;

console.log('🔧 Hedarvest Backend Environment Setup');
console.log('=====================================\n');

console.log('📋 Please update your backend/.env file with the following structure:\n');

console.log(envTemplate);

console.log('\n🚀 Integration Steps:');
console.log('1. Copy the template above to your backend/.env file');
console.log('2. Replace the contract addresses with your deployed addresses:');
console.log('   - POOL_FACTORY_ADDRESS: Your deployed PoolFactory address');
console.log('   - LENDING_TOKEN_ADDRESS: Your deployed MockToken (mUSD) address');
console.log('   - COLLATERAL_TOKEN_ADDRESS: Your deployed MockToken (mGRAIN) address');
console.log('   - Pool addresses: RICE_POOL_ADDRESS, CORN_POOL_ADDRESS, etc.');
console.log('   - Oracle addresses: RICE_ORACLE_ADDRESS, CORN_ORACLE_ADDRESS, etc.');
console.log('\n3. Update Hedera credentials if needed');
console.log('4. Restart your backend server');

console.log('\n📝 Example deployment output format:');
console.log('✅ Lending token deployed at: 0x1234...');
console.log('✅ Collateral token deployed at: 0x5678...');
console.log('✅ PoolFactory deployed at: 0x9abc...');
console.log('✅ Rice pool created at: 0xdef0...');
console.log('✅ Rice oracle at: 0x2468...');

console.log('\n🔄 Backend Integration Complete!');
console.log('Your backend will now support:');
console.log('✅ Dual-token system (lending + collateral)');
console.log('✅ Enhanced investor dashboard functions');
console.log('✅ Pool health scoring and analytics');
console.log('✅ Historical deposit tracking');
console.log('✅ Real-time utilization rates');
console.log('✅ Enhanced events and monitoring');
