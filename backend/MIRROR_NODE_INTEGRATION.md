# 🚀 Hedera Mirror Node Integration Guide

## 📊 **Data Source Optimization Strategy**

This document outlines the optimal data sources for different types of blockchain operations in your Hedera Harvest application.

## 🎯 **Data Source Recommendations**

### **🟢 Mirror Node - BEST FOR:**

#### **1. Historical Data & Analytics**
- ✅ **Transaction History** - Complete transaction records with timestamps
- ✅ **Token Transfer History** - All token movements and transfers
- ✅ **Contract Interaction History** - Historical contract calls and results
- ✅ **Account Activity** - User transaction patterns and behavior
- ✅ **Network Statistics** - Chain-wide metrics and analytics

#### **2. Static Information**
- ✅ **Token Metadata** - Token names, symbols, decimals, total supply
- ✅ **Contract Information** - Contract deployment details and metadata
- ✅ **Account Balances** - Current token balances (more reliable than RPC)
- ✅ **Network Information** - Block data, consensus timestamps

#### **3. Query Operations**
- ✅ **Complex Filtering** - Advanced querying capabilities
- ✅ **Pagination** - Efficient large dataset handling
- ✅ **Aggregation** - Statistical analysis and reporting
- ✅ **Historical Analysis** - Trend analysis and pattern recognition

### **🟡 Direct RPC - BEST FOR:**

#### **1. Real-time Operations**
- ✅ **Current Contract State** - Live pool statistics, balances, rates
- ✅ **Immediate Interactions** - Deposits, withdrawals, loans, liquidations
- ✅ **State Changes** - Real-time updates and modifications
- ✅ **Event Listening** - Live event monitoring

#### **2. Transaction Execution**
- ✅ **Smart Contract Calls** - Immediate contract interactions
- ✅ **Token Operations** - Minting, burning, transfers
- ✅ **Pool Management** - Creating pools, updating parameters
- ✅ **User Actions** - All user-initiated transactions

## 📋 **Implementation Mapping**

### **Your Current Backend Operations:**

| Operation | Current Source | Recommended Source | Reason |
|-----------|---------------|-------------------|---------|
| `getAllPools()` | RPC | **Hybrid** | RPC for current state + Mirror Node for historical context |
| `getPoolInfo()` | RPC | **RPC** | Real-time contract state |
| `getPoolStats()` | RPC | **Hybrid** | RPC for current + Mirror Node for historical analytics |
| `getTransactionHistory()` | Database | **Mirror Node** | Complete blockchain history |
| `getUserPortfolio()` | RPC | **Hybrid** | RPC for current positions + Mirror Node for history |
| `getAccountBalance()` | RPC | **Mirror Node** | More reliable balance data |
| `depositToPool()` | RPC | **RPC** | Immediate transaction execution |
| `createLoan()` | RPC | **RPC** | Immediate transaction execution |

## 🔧 **New Optimized Services**

### **1. MirrorNodeService**
```typescript
// Historical data operations
await mirrorNodeService.getTransactionsByAccount(accountId);
await mirrorNodeService.getTokenTransactions(tokenId);
await mirrorNodeService.getContractTransactions(contractId);
await mirrorNodeService.getTokenInfo(tokenId);
await mirrorNodeService.getAccountBalance(accountId);
```

### **2. OptimizedContractService**
```typescript
// Hybrid operations combining both sources
await optimizedContractService.getAllPools(); // Enhanced with historical data
await optimizedContractService.getPoolAnalytics(poolAddress); // Real-time + historical
await optimizedContractService.getUserPortfolio(userAddress); // Current + historical
```

### **3. OptimizedPoolsController**
```typescript
// New endpoints with enhanced data
GET /optimized-pools/:assetType/analytics
GET /optimized-pools/:assetType/transactions
GET /optimized-pools/user/:userAddress/portfolio
GET /optimized-pools/health
```

## 🌐 **Mirror Node URLs**

### **Available Mirror Node Endpoints:**

| Network | URL | Status |
|---------|-----|--------|
| **Mainnet** | `https://mainnet-public.mirrornode.hedera.com` | ✅ Public |
| **Testnet** | `https://testnet.mirrornode.hedera.com` | ✅ Public |
| **Previewnet** | `https://previewnet.mirrornode.hedera.com` | ✅ Public |

### **Environment Configuration:**
```env
# Add to your .env file
HEDERA_MIRROR_NODE_URL="https://testnet.mirrornode.hedera.com"
```

## 📈 **Performance Benefits**

### **Mirror Node Advantages:**
- 🚀 **Faster Queries** - Optimized for read operations
- 📊 **Rich Analytics** - Built-in aggregation and filtering
- 🔍 **Advanced Filtering** - Complex query capabilities
- 📚 **Complete History** - Full transaction records
- 🎯 **Reliable Balances** - More accurate balance data

### **RPC Advantages:**
- ⚡ **Real-time State** - Immediate contract state
- 🔄 **Live Interactions** - Instant transaction execution
- 📡 **Event Streaming** - Real-time event monitoring
- 🎮 **Interactive Operations** - User-initiated actions

## 🛠 **Migration Strategy**

### **Phase 1: Add Mirror Node Services**
- ✅ Create `MirrorNodeService`
- ✅ Create `OptimizedContractService`
- ✅ Add new optimized endpoints

### **Phase 2: Gradual Migration**
- 🔄 Update existing services to use hybrid approach
- 🔄 Add historical analytics to current endpoints
- 🔄 Implement caching for frequently accessed data

### **Phase 3: Full Optimization**
- 🎯 Replace database transaction logs with Mirror Node data
- 🎯 Implement advanced analytics and reporting
- 🎯 Add real-time dashboard with historical context

## 📊 **Example Usage**

### **Before (RPC Only):**
```typescript
// Limited to current state only
const poolInfo = await contractService.getPoolInfo(poolAddress);
```

### **After (Hybrid):**
```typescript
// Rich data with historical context
const analytics = await optimizedContractService.getPoolAnalytics(poolAddress, 'month');
// Returns: current state + historical metrics + transaction history + trends
```

## 🔍 **Health Monitoring**

### **Service Health Check:**
```bash
GET /optimized-pools/health
```

Returns:
```json
{
  "status": "healthy",
  "services": {
    "mirrorNode": {
      "status": "healthy",
      "mirrorNodeUrl": "https://testnet.mirrornode.hedera.com"
    },
    "rpc": {
      "status": "connected"
    }
  }
}
```

## 🚀 **Getting Started**

1. **Update Environment Variables:**
   ```bash
   cp env.example.txt .env
   # Add HEDERA_MIRROR_NODE_URL
   ```

2. **Install Dependencies:**
   ```bash
   npm install axios
   ```

3. **Start Using Optimized Endpoints:**
   ```bash
   # Test the new endpoints
   curl http://localhost:3001/optimized-pools/health
   curl http://localhost:3001/optimized-pools
   ```

4. **Monitor Performance:**
   ```bash
   # Check service health
   curl http://localhost:3001/optimized-pools/health
   ```

## 📝 **Best Practices**

### **Do Use Mirror Node For:**
- 📊 Analytics and reporting
- 📚 Historical data queries
- 🔍 Complex filtering operations
- 📈 Trend analysis
- 💰 Balance verification

### **Do Use RPC For:**
- ⚡ Real-time state queries
- 🔄 Transaction execution
- 📡 Event monitoring
- 🎮 User interactions
- 🔧 Contract management

### **Use Hybrid Approach For:**
- 🏦 Pool analytics (current + historical)
- 👤 User portfolios (positions + history)
- 📊 Comprehensive reporting
- 🎯 Dashboard data

This optimization strategy will significantly improve your application's performance, reliability, and user experience by leveraging the strengths of both data sources! 🎉
