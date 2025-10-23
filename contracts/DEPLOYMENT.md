# Deployment Guide

## Overview
This guide explains how to deploy the HedHarvest lending protocol on Hedera testnet.

## Prerequisites

1. **Environment Setup**
   - Node.js v16 or higher
   - Hardhat installed
   - Hedera testnet account with sufficient HBAR

2. **Environment Variables**
   Create a `.env` file with:
   ```bash
   HEDERA_ACCOUNT_ID=0.0.xxxxx
   HEDERA_PRIVATE_KEY=302e020100300506032b657004220420...

   # Optional Configuration
   CONTRACT_FUNDING_HBAR=0.02
   POOL_FUNDING_HBAR=0.02
   USER_USDC_AMOUNT=10000
   USER_COLLATERAL_AMOUNT=10
   RESERVE_FACTOR=0.1
   LOAN_TO_VALUE=0.75
   LIQUIDATION_THRESHOLD=0.8
   LIQUIDATION_BONUS=0.05
   ```

## Deployment Process

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Deployment Script
```bash
npx hardhat run scripts/deploy.js --network testnet
```

### 3. Deployment Steps

The script will automatically:

1. **Validate Configuration**
   - Check required environment variables
   - Display deployment configuration

2. **Create User Accounts** (if needed)
   - Generate user1 and user2 accounts with keys
   - Fund accounts with initial HBAR

3. **Create Mock Tokens**
   - USDC (6 decimals) - underlying token
   - WHEAT (8 decimals) - collateral token
   - RICE (8 decimals) - collateral token

4. **Deploy Core Contracts**
   - MockPriceOracle
   - InterestRateModel
   - PoolFactory

5. **Create Lending Pools**
   - WHEAT/USDC pool
   - RICE/USDC pool

6. **Initialize Pool Tokens**
   - Create LP tokens (for liquidity providers)
   - Create Debt tokens (for borrowers)
   - Update treasury to pool contracts
   - Verify treasury transfer
   - Initialize tokens in pools

7. **Associate & Distribute Tokens**
   - Associate all base tokens with user accounts
   - Distribute initial token balances

8. **Health Checks**
   - Verify pool initialization
   - Check token configurations
   - Validate oracle prices
   - Confirm all contract states

### 4. Review Deployment Output

The script generates two files:

#### `deployed.json`
Contains all deployed contract addresses:
```json
{
  "poolFactory": "0x...",
  "oracle": "0x...",
  "interestRateModel": "0x...",
  "usdc": "0x...",
  "wheat": "0x...",
  "rice": "0x...",
  "wheatPool": "0x...",
  "wheatPoolNativeId": "0.0.xxxxx",
  "wheatLPToken": "0.0.xxxxx",
  "wheatDebtToken": "0.0.xxxxx",
  "ricePool": "0x...",
  "ricePoolNativeId": "0.0.xxxxx",
  "riceLPToken": "0.0.xxxxx",
  "riceDebtToken": "0.0.xxxxx",
  "config": { ... },
  "deployedAt": "2025-..."
}
```

#### `generated-accounts.json` (if users were created)
⚠️ **KEEP SECURE** - Contains private keys for generated accounts:
```json
{
  "warning": "⚠️ KEEP THIS FILE SECURE - Contains private keys!",
  "accounts": [
    {
      "name": "user1",
      "accountId": "0.0.xxxxx",
      "evmAddress": "0x...",
      "privateKey": "..."
    }
  ]
}
```

## Security Notes

1. **Private Keys**: Generated account credentials are saved to `generated-accounts.json`
   - This file is in `.gitignore` automatically
   - Store securely and never commit to version control
   - Back up to a secure location

2. **Environment Variables**: Keep `.env` secure
   - Never commit to git
   - Use different keys for mainnet

3. **Key Management**:
   - LP and Debt tokens are created with deployer's supply/wipe keys
   - Treasury is transferred to pool contracts
   - Pool contracts can mint/burn LP tokens and mint/wipe debt tokens

## Troubleshooting

### Mirror Node Resolution Timeout
If contract ID resolution fails:
- Increase `maxAttempts` in `resolveContractId()` function
- Check Hedera mirror node status
- Verify network connectivity

### Token Association Failures
If users fail to associate tokens:
- Check user account has sufficient HBAR
- Verify token IDs are correct
- Review Hedera transaction status codes

### Pool Initialization Issues
If pools fail to initialize:
- Verify treasury transfer completed successfully
- Check pool contract has sufficient HBAR
- Review health check output for specific issues

### Health Check Failures
If health checks fail:
- Review specific check that failed
- Verify all contracts deployed successfully
- Check token configurations
- Ensure oracle prices are set correctly

## Post-Deployment

After successful deployment:

1. **Test Basic Operations**
   ```bash
   # Test deposit
   # Test borrow
   # Test repay
   # Test withdrawal
   ```

2. **Verify on HashScan**
   - Check contract deployments
   - Verify token creations
   - Review transaction histoyry

3. **Update Frontend Configuration**
   - Copy addresses from `deployed.json`
   - Update contract ABIs if needed

4. **Monitor Pools**
   - Check utilization rates
   - Monitor interest accrual
   - Verify liquidation parameters

## Configuration Parameters

### Pool Parameters
- **Reserve Factor**: Portion of interest going to reserves (default: 10%)
- **Loan-to-Value (LTV)**: Maximum borrow ratio (default: 75%)
- **Liquidation Threshold**: Health factor trigger (default: 80%)
- **Liquidation Bonus**: Liquidator incentive (default: 5%)

### Interest Rate Model
- **Base Rate**: 0.0000000317 per second (1% APR)
- **Multiplier**: 0.0000000634 per second
- **Jump Multiplier**: 0.0000001584 per second
- **Optimal Utilization**: 80%

### Token Decimals
- **USDC**: 6 decimals
- **WHEAT/RICE**: 8 decimals
- **LP/Debt Tokens**: Match underlying (6 decimals)

## Support

For issues or questions:
- Check deployment logs for specific errors
- Review Hedera documentation for HTS-specific issues
- Consult protocol documentation for parameter tuning
