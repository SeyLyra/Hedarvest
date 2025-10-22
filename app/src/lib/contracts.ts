// Deployed contract addresses from Hedera testnet
export const DEPLOYED_CONTRACTS = {
  // Latest deployment addresses
  POOL_FACTORY: '0xfe85D4C2B945ff819065640DCf7f84a56603714e',
  MOCK_PRICE_ORACLE: '0x2999bD1a71f8757ebA881C818b5ddc15A8143183',
  INTEREST_RATE_MODEL: '0x2C2e302Add8F8e18B4F58947289FF0C368D1a230',
  
  // Tokens
  USDC_TOKEN: '0x00000000000000000000000000000000006c4546',
  WHEAT_TOKEN: '0x00000000000000000000000000000000006c4547',
  RICE_TOKEN: '0x00000000000000000000000000000000006c4548',
  
  // Lending Pools
  WHEAT_LENDING_POOL: '0x25684509B4e9CF133ADe0541d5A028B51e50293D',
  RICE_LENDING_POOL: '0xFCd37174a272012667FfAd5F66f9b268F7Cc1663',
  
  // Network configuration
  HEDERA_JSON_RPC_URL: 'https://testnet.hashio.io/api',
  CHAIN_ID: 296, // Hedera testnet
};

// Asset type mappings for frontend
export const POOL_MAPPINGS = {
  'wheat': {
    poolAddress: DEPLOYED_CONTRACTS.WHEAT_LENDING_POOL,
    collateralToken: DEPLOYED_CONTRACTS.WHEAT_TOKEN,
    lendingToken: DEPLOYED_CONTRACTS.USDC_TOKEN,
    grainType: 'Wheat',
    symbol: 'WHEAT',
  },
  'rice': {
    poolAddress: DEPLOYED_CONTRACTS.RICE_LENDING_POOL,
    collateralToken: DEPLOYED_CONTRACTS.RICE_TOKEN,
    lendingToken: DEPLOYED_CONTRACTS.USDC_TOKEN,
    grainType: 'Rice',
    symbol: 'RICE',
  },
};

// Helper function to get pool info by asset type
export function getPoolInfoByAssetType(assetType: string) {
  const mapping = POOL_MAPPINGS[assetType.toLowerCase()];
  if (!mapping) {
    throw new Error(`No pool found for asset type: ${assetType}`);
  }
  return mapping;
}

// Fallback pool data structure (will be populated from backend)
export const MOCK_POOLS: Array<{
  id: number;
  grainType: string;
  address: string;
  lendingTokenAddress: string;
  collateralTokenAddress: string;
  price: number;
  availableLiquidity: string;
  totalBorrows: string;
  utilizationRate: number;
  apr: number;
}> = [];
