# Backend Contract Integration Guide

**Updated: 2025-10-23**

This document explains how the backend connects to the Hedarvest lending protocol smart contracts deployed on Hedera testnet.

## 📋 Overview

The backend integrates with smart contracts using:
- **ethers.js** for EVM JSON-RPC calls
- **@hashgraph/sdk** for native Hedera operations (HTS, HCS)
- Dynamic pool discovery via PoolFactory contract

## 🔧 Configuration

### Environment Variables

Required variables in `.env`:

```bash
# Hedera Native SDK (for HTS/HCS operations)
HEDERA_OPERATOR_ID=0.0.xxxxxx
HEDERA_OPERATOR_KEY=302e...
HEDERA_NETWORK=testnet

# Hedera EVM JSON-RPC (for contract calls)
HEDERA_JSON_RPC_URL=https://testnet.hashio.io/api
EVM_PRIVATE_KEY=0x...

# Contract Addresses (from latest deployment)
POOL_FACTORY_ADDRESS=0x811EF8ecDf2b9a15BF64F0225bbb3B0860B12Adb
ORACLE_ADDRESS=0x32344dEf5EA9Fa9b83962980C8d447dea81F3685
INTEREST_RATE_MODEL_ADDRESS=0x6C90077Ec6364F9aAab9C62EbE950f0653D2d588
```

### Contract Addresses

Current deployment (2025-10-23):
- **PoolFactory**: `0x811EF8ecDf2b9a15BF64F0225bbb3B0860B12Adb`
- **Oracle**: `0x32344dEf5EA9Fa9b83962980C8d447dea81F3685`
- **Interest Rate Model**: `0x6C90077Ec6364F9aAab9C62EbE950f0653D2d588`

**Note**: Pool addresses are fetched dynamically using `PoolFactory.getAllPoolsWithDetails()`. Do not hardcode pool addresses in the backend.

## 📚 Contract ABIs

### Key Changes (October 2023)

1. **Share Accounting**: Contracts now use internal share tracking instead of LP/Debt tokens
   - `userLPShares` mapping replaces LP token balances
   - `userDebtShares` mapping replaces Debt token balances
   - No more `lpToken()` or `debtToken()` functions

2. **Price Precision Fix**: Critical bug fix in `getCollateralValue()`
   - Now correctly accounts for token decimals
   - See `../contracts/PRICE_PRECISION_FIX.md` for details

3. **Token Decimals**: Pools cache token decimals from HTS
   - `underlyingTokenDecimals()` - typically 6 for USDC
   - `collateralTokenDecimals()` - typically 8 for property tokens

### PoolFactory ABI

```typescript
const POOL_FACTORY_ABI = [
  'function getAllPools() external view returns (address[])',
  'function getAllPoolsWithDetails() external view returns (tuple(...)[])',
];
```

**PoolDetails Structure**:
```solidity
struct PoolDetails {
    address underlyingToken;
    address collateralToken;
    uint256 totalCash;
    uint256 totalBorrowed;
    uint256 totalReserves;
    uint256 totalLPShares;        // Total LP shares issued
    uint256 borrowIndex;
    uint256 liquidityIndex;
    uint256 utilization;
    uint256 borrowRate;
    uint256 loanToValue;
    uint256 liquidationThreshold;
    uint256 liquidationBonus;
}
```

### LendingPool ABI

See `src/lib/contract.service.ts` for the complete ABI.

Key functions:
- `deposit(uint256 amount)` - Supply liquidity (2-step: transfer + call)
- `withdraw(uint256 shares)` - Withdraw liquidity
- `depositCollateral(uint256 amount)` - Deposit collateral (2-step)
- `withdrawCollateral(uint256 amount)` - Withdraw collateral
- `borrow(uint256 amount)` - Borrow underlying
- `repay(uint256 amount)` - Repay debt (2-step)
- `liquidate(address borrower, uint256 repayAmount)` - Liquidate position

## 🔄 HTS 2-Step Pattern

**IMPORTANT**: All token transfers to pools use a 2-step pattern:

### Step 1: Transfer tokens via Hedera SDK
```typescript
import { TransferTransaction, TokenId } from '@hashgraph/sdk';

const transferTx = await new TransferTransaction()
  .addTokenTransfer(tokenId, userId, -amount)
  .addTokenTransfer(tokenId, poolId, amount)
  .execute(hederaClient);

await transferTx.getReceipt(hederaClient);
```

### Step 2: Call contract function
```typescript
await poolContract.deposit(amount, { gasLimit: 1000000 });
// or depositCollateral(), repay(), etc.
```

**Why?** HTS tokens cannot use ERC-20 `transferFrom()` in the same way. The `cryptoTransfer` precompile requires explicit transfers first.

## 📊 Getting Pool Information

### Get All Pools

```typescript
import { ethers } from 'ethers';
import { DEPLOYED_CONTRACTS } from './deployed-contracts';

const provider = new ethers.JsonRpcProvider(DEPLOYED_CONTRACTS.HEDERA_JSON_RPC_URL);
const factory = new ethers.Contract(
  DEPLOYED_CONTRACTS.POOL_FACTORY,
  POOL_FACTORY_ABI,
  provider
);

// Get all pool addresses
const poolAddresses = await factory.getAllPools();

// Get all pool details
const poolDetails = await factory.getAllPoolsWithDetails();
```

### Get Individual Pool Details

```typescript
const pool = new ethers.Contract(poolAddress, LENDING_POOL_ABI, provider);
const details = await pool.getPoolDetails();

console.log('Pool:', {
  underlying: details.underlyingToken,
  collateral: details.collateralToken,
  totalCash: ethers.formatUnits(details.totalCash, 6), // USDC has 6 decimals
  totalLPShares: details.totalLPShares.toString(),
  utilization: ethers.formatUnits(details.utilization, 18),
  loanToValue: ethers.formatUnits(details.loanToValue, 18)
});
```

## 👤 User Positions

### Check User's Position

```typescript
const userAddress = '0x...';

// LP position
const lpShares = await pool.userLPShares(userAddress);

// Collateral
const collateral = await pool.userCollateral(userAddress);
const collateralValue = await pool.getCollateralValue(userAddress);

// Debt
const debtShares = await pool.userDebtShares(userAddress);
const borrowValue = await pool.getBorrowValue(userAddress);

// Health factor
const healthFactor = await pool.getHealthFactor(userAddress);

console.log('User Position:', {
  lpShares: lpShares.toString(),
  collateral: ethers.formatUnits(collateral, 8), // Property tokens have 8 decimals
  collateralValue: ethers.formatUnits(collateralValue, 18),
  debtShares: debtShares.toString(),
  borrowValue: ethers.formatUnits(borrowValue, 6), // USDC has 6 decimals
  healthFactor: ethers.formatUnits(healthFactor, 18)
});
```

## ⚠️ Important Notes

### Decimals

- **USDC** (underlying): 6 decimals
- **Property Tokens** (WHEAT/RICE): 8 decimals
- **USD Values**: Always 18 decimals (e.g., collateralValue, borrowValue)
- **Shares**: No decimals (raw numbers)

### Health Factor

- Represented with 18 decimals
- Must be >= 1e18 (1.0) to avoid liquidation
- Formula: `(collateralValue * liquidationThreshold) / borrowValue`

### LTV vs Liquidation Threshold

- **LTV (Loan-to-Value)**: Maximum borrow ratio (e.g., 0.75 = 75%)
- **Liquidation Threshold**: When liquidation becomes possible (e.g., 0.80 = 80%)
- Always: `LTV < Liquidation Threshold`

## 🔍 Example: Complete Borrow Flow

```typescript
import { ContractService } from './contract.service';

async function borrowExample(
  contractService: ContractService,
  userAddress: string,
  poolAddress: string
) {
  // 1. Get pool contract
  const pool = contractService.getLendingPoolContract(poolAddress);

  // 2. Check user's collateral value
  const collateralValue = await pool.getCollateralValue(userAddress);
  const ltv = await pool.loanToValue();

  // 3. Calculate max borrow
  const maxBorrow = (collateralValue * ltv) / ethers.parseUnits('1', 18);

  // 4. Choose amount to borrow (50% of max)
  const borrowAmount = maxBorrow / 2n;

  // 5. Borrow (no transfer needed - pool sends tokens)
  const tx = await pool.borrow(borrowAmount, { gasLimit: 1000000 });
  await tx.wait();

  // 6. Check new health factor
  const healthFactor = await pool.getHealthFactor(userAddress);
  console.log('Health Factor:', ethers.formatUnits(healthFactor, 18));
}
```

## 🚀 Quick Start

1. **Update `.env`** with contract addresses from `contracts/deployed.json`
2. **Initialize provider**:
   ```typescript
   const provider = new ethers.JsonRpcProvider(process.env.HEDERA_JSON_RPC_URL);
   ```
3. **Get pool list**:
   ```typescript
   const pools = await factoryContract.getAllPoolsWithDetails();
   ```
4. **Interact with pools** using the 2-step pattern for deposits/repays

## 📖 Related Documentation

- **Price Precision Fix**: `../contracts/PRICE_PRECISION_FIX.md`
- **Deployment Info**: `../contracts/deployed.json`
- **Test Scripts**: `../contracts/scripts/README.md`
- **Contract Source**: `../contracts/contracts/core/LendingPool.sol`

## 🔐 Security Notes

1. **Never hardcode private keys** - always use environment variables
2. **Validate user inputs** before contract calls
3. **Check health factors** before allowing borrows
4. **Use gasLimit** for all transactions to prevent runaway gas costs
5. **Verify token associations** before HTS transfers

## 📞 Support

For contract-related questions:
- Check contract tests in `../contracts/scripts/`
- Review deployment logs in `../contracts/deployed.json`
- See `CONTRACT_INTEGRATION.md` (this file)
