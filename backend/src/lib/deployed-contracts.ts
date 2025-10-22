// Deployed contract addresses from environment variables
export const DEPLOYED_CONTRACTS = {
  // Contract addresses from environment
  POOL_FACTORY: process.env.POOL_FACTORY_ADDRESS || '',
  MOCK_PRICE_ORACLE: process.env.ORACLE_ADDRESS || '',
  INTEREST_RATE_MODEL: process.env.INTEREST_RATE_MODEL_ADDRESS || '',
  
  // Network configuration
  HEDERA_JSON_RPC_URL: process.env.HEDERA_JSON_RPC_URL || 'https://testnet.hashio.io/api',
  CHAIN_ID: parseInt(process.env.CHAIN_ID || '296'), // Hedera testnet
};

// Helper function to get pool info by asset type - now dynamic
export function getPoolInfoByAssetType(assetType: string) {
  // This will be replaced by dynamic lookup from factory contract
  throw new Error(`Dynamic pool lookup not implemented. Use getAllPoolDetails() from factory contract instead.`);
}
