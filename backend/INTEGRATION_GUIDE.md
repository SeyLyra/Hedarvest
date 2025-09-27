# Hedarvest Backend Integration Guide

## 🚀 Smart Contract Integration Complete

Your backend has been updated to support the new position-based smart contract system with dual tokens (lending + collateral).

## 📋 What's New

### 1. **Dual Token System**
- **Lending Token (mUSD)**: Stablecoin for deposits and loans
- **Collateral Token (mGRAIN)**: Grain tokens for farmer collateral

### 2. **Enhanced Contract Service**
- New methods for token balance queries
- Support for collateral token operations
- Pool and oracle address management
- Enhanced error handling

### 3. **New Environment Variables**
```bash
# Token Addresses (NEW)
LENDING_TOKEN_ADDRESS="0x..."
COLLATERAL_TOKEN_ADDRESS="0x..."

# Oracle Addresses (NEW)
RICE_ORACLE_ADDRESS="0x..."
CORN_ORACLE_ADDRESS="0x..."
WHEAT_ORACLE_ADDRESS="0x..."
SOYBEAN_ORACLE_ADDRESS="0x..."
```

## 🔧 Integration Steps

### Step 1: Update Environment Variables
1. Copy the template from `update-env.js` output to your `backend/.env` file
2. Replace placeholder addresses with your deployed contract addresses:
   - `POOL_FACTORY_ADDRESS`
   - `LENDING_TOKEN_ADDRESS`
   - `COLLATERAL_TOKEN_ADDRESS`
   - Pool addresses: `RICE_POOL_ADDRESS`, `CORN_POOL_ADDRESS`, etc.
   - Oracle addresses: `RICE_ORACLE_ADDRESS`, `CORN_ORACLE_ADDRESS`, etc.

### Step 2: Test Contract Integration
```bash
cd backend
node test-contract-integration.js
```

### Step 3: Start Backend Server
```bash
npm run start:dev
```

## 🎯 New Backend Features

### Contract Service Methods
```typescript
// Token balance queries
getLendingTokenBalance(userAddress: string): Promise<string>
getCollateralTokenBalance(userAddress: string): Promise<string>

// Address management
getPoolAddresses(): { [key: string]: string }
getOracleAddresses(): { [key: string]: string }
getLendingTokenAddress(): string
getCollateralTokenAddress(): string
```

### Enhanced Pool Functions
- `getInvestorShares()` - Get LP token balance
- `getInvestorValue()` - Get USD value of shares
- `getInvestorYield()` - Get earned yield
- `getPoolHealthScore()` - Pool health assessment
- `utilizationRate()` - Real-time utilization
- `getInvestorDepositHistory()` - Historical deposits
- `getCurrentPoolStats()` - Comprehensive pool data

## 🧪 Testing

### Run Integration Test
```bash
node test-contract-integration.js
```

### Expected Output
```
✅ PoolFactory connected successfully
✅ Lending Token: Mock USD (mUSD)
✅ Collateral Token: Mock Grain (mGRAIN)
✅ Rice Pool: TVL $10000, Utilization 38.1%, Health Score 100%
✅ Retrieved stats for 4 pools
```

## 🔍 Troubleshooting

### Common Issues

1. **"Contract address not configured"**
   - Check your `.env` file has all required addresses
   - Ensure addresses don't contain placeholder "XXXX" values

2. **"Provider initialization failed"**
   - Verify `HEDERA_JSON_RPC_URL` is accessible
   - Check `EVM_PRIVATE_KEY` format

3. **"Failed to get pool stats"**
   - Ensure contracts are deployed and verified
   - Check network connectivity

### Debug Mode
Set `NODE_ENV=development` for detailed logging.

## 🎉 Ready for Production

Your backend now supports:
- ✅ Dual-token lending system
- ✅ Enhanced investor dashboard
- ✅ Real-time pool analytics
- ✅ Historical data tracking
- ✅ Health scoring system
- ✅ Comprehensive error handling

The investor dashboard will now display:
- Pool utilization rates
- Health scores
- Yield calculations
- Historical deposits
- Real-time TVL data

## 📞 Support

If you encounter issues:
1. Check the integration test output
2. Verify contract addresses in `.env`
3. Ensure backend logs for detailed error messages
4. Test with a fresh deployment if needed

**Happy coding! 🚀**
