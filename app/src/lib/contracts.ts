// Deployed contract addresses from Hedera testnet
// Synced with backend env (2025-10-23)
export const DEPLOYED_CONTRACTS = {
  // Core Protocol Contracts
  POOL_FACTORY: '0x811EF8ecDf2b9a15BF64F0225bbb3B0860B12Adb',
  MOCK_PRICE_ORACLE: '0x32344dEf5EA9Fa9b83962980C8d447dea81F3685',
  INTEREST_RATE_MODEL: '0x6C90077Ec6364F9aAab9C62EbE950f0653D2d588',

  // Network configuration
  HEDERA_JSON_RPC_URL: 'https://testnet.hashio.io/api',
  CHAIN_ID: 296, // Hedera testnet
};

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
