# Scripts Documentation

This directory contains essential scripts for deploying and testing the Hedarvest lending protocol on Hedera testnet.

## Available Scripts

### 1. `deploy.js` - Main Deployment Script
**Purpose:** Deploys the complete Hedarvest protocol to Hedera testnet

**What it does:**
- Creates test user accounts (user1, user2)
- Creates mock tokens (USDC, WHEAT, RICE)
- Deploys MockPriceOracle
- Deploys InterestRateModel
- Deploys PoolFactory
- Creates lending pools (WHEAT Pool, RICE Pool)
- Initializes pools and associates tokens
- Runs health checks
- Saves deployment data to `deployed.json` and `generated-accounts.json`

**Usage:**
```bash
npx hardhat run scripts/deploy.js --network testnet
```

**Output Files:**
- `deployed.json` - Contract addresses and configuration
- `generated-accounts.json` - Test account credentials (DO NOT COMMIT!)

---

### 2. `verify-price-fix.js` - Price Precision Verification
**Purpose:** Verifies that the critical price precision fix is working correctly

**What it tests:**
- Checks token decimals are properly cached
- Verifies collateral value calculations
- Compares contract calculations with expected values
- Confirms the fix prevents the 10^14 inflation bug

**Usage:**
```bash
npx hardhat run scripts/verify-price-fix.js --network testnet
```

**Expected Output:**
```
✅✅✅ PRICE PRECISION FIX IS WORKING CORRECTLY! ✅✅✅
```

---

### 3. `test-realistic-lending-flow.js` - Realistic Lending Test
**Purpose:** Tests the complete lending flow with realistic amounts

**Test Scenario:**
1. **Supply**: Deposit 1000 USDC as liquidity
2. **Deposit Collateral**: Deposit 0.01 WHEAT ($1000) as collateral
3. **Borrow**: Borrow 500 USDC (well within 75% LTV limit)
4. **Repay**: Repay 250 USDC (half of debt)

**Usage:**
```bash
npx hardhat run scripts/test-realistic-lending-flow.js --network testnet
```

**What it verifies:**
- Supply/deposit functionality
- Collateral deposit and valuation
- Borrowing within LTV limits
- Repayment and debt tracking
- Health factor calculations

---

### 4. `test-full-lending-flow.js` - Comprehensive Lending Test
**Purpose:** Comprehensive test of all lending functions in sequence

**Test Sequence:**
1. Supply liquidity (2000 USDC)
2. Deposit collateral (5 WHEAT)
3. Borrow (50% of max capacity)
4. Repay (50% of debt)
5. Repay remaining debt
6. Withdraw collateral
7. Withdraw liquidity

**Usage:**
```bash
npx hardhat run scripts/test-full-lending-flow.js --network testnet
```

**Note:** This script uses larger amounts and tests the complete lifecycle including withdrawals.

---

## Environment Requirements

All scripts require the following environment variables in `.env`:

```env
HEDERA_ACCOUNT_ID=0.0.xxxxxx
HEDERA_PRIVATE_KEY=302e...
```

## Important Notes

### Token Decimals
- **USDC**: 6 decimals
- **WHEAT/RICE**: 8 decimals
- **USD Values**: 18 decimals (internal representation)

### HTS 2-Step Pattern
All token transfers to the pool follow the HTS 2-step pattern:
1. User transfers tokens to pool via Hedera SDK `TransferTransaction`
2. User calls contract function to update internal accounting

### Price Precision Fix
The critical price precision bug has been fixed in the deployed contracts. The formula now correctly accounts for both token decimals and price decimals:

```solidity
// CORRECT (Fixed)
return (collateralAmount * price * 1e18) / (10 ** (collateralTokenDecimals + priceDecimals));
```

See `PRICE_PRECISION_FIX.md` for full details.

## Testing Workflow

1. **Deploy contracts:**
   ```bash
   npx hardhat run scripts/deploy.js --network testnet
   ```

2. **Verify price fix:**
   ```bash
   npx hardhat run scripts/verify-price-fix.js --network testnet
   ```

3. **Test realistic flow:**
   ```bash
   npx hardhat run scripts/test-realistic-lending-flow.js --network testnet
   ```

4. **Test full flow (optional):**
   ```bash
   npx hardhat run scripts/test-full-lending-flow.js --network testnet
   ```

## Removed Scripts

The following obsolete scripts have been removed:
- ~~`DEPOSIT-WORKING-TEST.js`~~ - Redundant deposit test
- ~~`check-oracle-prices.js`~~ - Replaced by `verify-price-fix.js`
- ~~`check-pool-state.js`~~ - Functionality covered in other tests
- ~~`test-deposit-*.js`~~ - Multiple old deposit tests (functionality merged)
- ~~`create-tokens.js`~~ - Token creation now in `deploy.js`
- ~~`check-rpc.js`~~ - No longer needed
- ~~`test-full-lending-flow.js.bak`~~ - Backup file

## Security

⚠️ **IMPORTANT**: Never commit `generated-accounts.json` to version control! It contains private keys for test accounts.

The `.gitignore` should include:
```
generated-accounts.json
.env
```
