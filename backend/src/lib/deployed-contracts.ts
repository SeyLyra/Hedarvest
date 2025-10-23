/**
 * Deployed contract addresses and configuration
 *
 * Updated: 2025-10-23
 * Deployment includes critical price precision fix
 * See: contracts/PRICE_PRECISION_FIX.md
 *
 * NOTE: Pool details are fetched dynamically from PoolFactory.getAllPoolsWithDetails()
 * Do not hardcode pool configurations here.
 */

export const DEPLOYED_CONTRACTS = {
  // Core Protocol Contracts
  POOL_FACTORY: process.env.POOL_FACTORY_ADDRESS || '',
  MOCK_PRICE_ORACLE: process.env.ORACLE_ADDRESS || '',
  INTEREST_RATE_MODEL: process.env.INTEREST_RATE_MODEL_ADDRESS || '',

  // Network Configuration
  HEDERA_JSON_RPC_URL: process.env.HEDERA_JSON_RPC_URL || 'https://testnet.hashio.io/api',
  CHAIN_ID: parseInt(process.env.CHAIN_ID || '296'), // Hedera testnet
};
