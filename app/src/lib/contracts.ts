// Deployed contract addresses from Hedera testnet
// Synced with backend env (2025-10-23)
export const DEPLOYED_CONTRACTS = {
  // Core Protocol Contracts
  POOL_FACTORY: process.env.NEXT_PUBLIC_POOL_FACTORY_ADDRESS || '0x811EF8ecDf2b9a15BF64F0225bbb3B0860B12Adb',
  MOCK_PRICE_ORACLE: process.env.NEXT_PUBLIC_ORACLE_ADDRESS || '0x32344dEf5EA9Fa9b83962980C8d447dea81F3685',
  INTEREST_RATE_MODEL: process.env.NEXT_PUBLIC_INTEREST_RATE_MODEL_ADDRESS || '0x6C90077Ec6364F9aAab9C62EbE950f0653D2d588',

  // Network configuration
  HEDERA_JSON_RPC_URL: process.env.NEXT_PUBLIC_HEDERA_JSON_RPC_URL || 'https://testnet.hashio.io/api',
  CHAIN_ID: Number(process.env.NEXT_PUBLIC_CHAIN_ID) || 296, // Hedera testnet
};

// Token IDs for collateral tokens (HTS tokens)
export const CROP_TOKEN_IDS = {
  WHEAT: process.env.NEXT_PUBLIC_WHEAT_TOKEN_ID || '0.0.7121333',
  RICE: process.env.NEXT_PUBLIC_RICE_TOKEN_ID || '0.0.7121334',
};

// USDC Token ID (used for borrowing)
export const USDC_TOKEN_ID = process.env.NEXT_PUBLIC_USDC_TOKEN_ID || '0.0.7115536';

// Mock pool data (fallback when backend is unavailable)
export const MOCK_POOLS = [
  {
    id: 1,
    grainType: 'WHEAT',
    address: '0x0000000000000000000000000000000000000000', // Will be replaced with actual pool addresses
    lendingTokenAddress: USDC_TOKEN_ID,
    collateralTokenAddress: CROP_TOKEN_IDS.WHEAT,
    price: 250.50,
    availableLiquidity: '50000',
    totalBorrows: '15000',
    utilizationRate: 23.0,
    apr: 8.5,
  },
  {
    id: 2,
    grainType: 'RICE',
    address: '0x0000000000000000000000000000000000000001',
    lendingTokenAddress: USDC_TOKEN_ID,
    collateralTokenAddress: CROP_TOKEN_IDS.RICE,
    price: 280.00,
    availableLiquidity: '75000',
    totalBorrows: '30000',
    utilizationRate: 28.5,
    apr: 9.2,
  },
];

// Contract ABIs for frontend use
export const POOL_FACTORY_ABI = [
  'function getAllPools() external view returns (address[])',
  'function getAllPoolsWithDetails() external view returns (tuple(address underlyingToken, address collateralToken, uint256 totalCash, uint256 totalBorrowed, uint256 totalReserves, uint256 totalLPShares, uint256 borrowIndex, uint256 liquidityIndex, uint256 utilization, uint256 borrowRate, uint256 loanToValue, uint256 liquidationThreshold, uint256 liquidationBonus)[])',
];

export const LENDING_POOL_ABI = [
  // Core pool information
  'function underlyingToken() external view returns (address)',
  'function collateralToken() external view returns (address)',
  'function underlyingTokenDecimals() external view returns (uint8)',
  'function collateralTokenDecimals() external view returns (uint8)',

  // Pool statistics
  'function totalCash() external view returns (uint256)',
  'function totalBorrowed() external view returns (uint256)',
  'function totalLPShares() external view returns (uint256)',

  // User positions
  'function userLPShares(address user) external view returns (uint256)',
  'function userCollateral(address user) external view returns (uint256)',
  'function userDebtShares(address user) external view returns (uint256)',

  // Core lending functions
  'function deposit(uint256 amount) external',
  'function withdraw(uint256 shares) external',
  'function depositCollateral(uint256 amount) external',
  'function withdrawCollateral(uint256 amount) external',
  'function borrow(uint256 amount) external',
  'function repay(uint256 amount) external',

  // Health and risk
  'function getHealthFactor(address user) external view returns (uint256)',
  'function getBorrowValue(address user) external view returns (uint256)',
  'function getCollateralValue(address user) external view returns (uint256)',

  // Pool details
  'function getPoolDetails() external view returns (tuple(address underlyingToken, address collateralToken, uint256 totalCash, uint256 totalBorrowed, uint256 totalReserves, uint256 totalLPShares, uint256 borrowIndex, uint256 liquidityIndex, uint256 utilization, uint256 borrowRate, uint256 loanToValue, uint256 liquidationThreshold, uint256 liquidationBonus))',
];
