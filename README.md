# 🌾 Hedarvest
### *Decentralized Agricultural Finance Platform on Hedera Hashgraph*

Track: DeFi, Real-World Assets (RWA), Supply Chain on Hedera

[![Hedera](https://img.shields.io/badge/Built%20on-Hedera%20Hashgraph-00C4B4?style=for-the-badge&logo=hedera&logoColor=white)](https://hedera.com)
[![Next.js](https://img.shields.io/badge/Next.js-15.5.3-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org)
[![Solidity](https://img.shields.io/badge/Solidity-^0.8.19-363636?style=for-the-badge&logo=solidity&logoColor=white)](https://soliditylang.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7.3-blue?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)

> **Revolutionizing agricultural finance through blockchain technology, connecting farmers and investors in a transparent, efficient ecosystem.**

Hedarvest tokenizes warehouse receipts for agricultural crops and enables farmers to deposit them as collateral for low-cost credit. Investors fund pools that lend against HTS crop tokens. The system logs key lifecycle events via HCS for transparent, auditable operations.

---

## 🔗 Hedera Integration

Hedarvest leverages Hedera Hashgraph's native services to create a transparent, efficient agricultural finance platform. Here's how we use each Hedera service:

### **HTS (Hedera Token Service)** - Tokenized Grain Receipts
- **Purpose**: Represent warehouse receipts as digital tokens
- **Usage**: 
  - Create HTS tokens for each crop type (WHEAT, RICE)
  - Mint tokens when farmers deposit grain at warehouses
  - Transfer tokens between farmers, investors, and pools
- **Benefits**: 
  - Native token support with fast finality (~3-5 seconds)
  - Predictable micro-fees (~$0.001 per token operation)
  - No smart contract required for basic token operations
  - Perfect for representing many small-value receipts

### **Hedera Smart Contracts (EVM-Compatible)** - Lending Logic
- **Purpose**: Execute complex lending and borrowing logic on Hedera's EVM-compatible network
- **Usage**:
  - `LendingPool`: Core lending/borrowing functionality with collateral management
  - `PoolFactory`: Deploy and manage multiple lending pools
  - `InterestRateModel`: Calculate dynamic interest rates based on utilization
  - `PriceOracle`: Provide real-time price feeds for collateral valuation
- **Benefits**:
  - Hedera's EVM compatibility allows using standard Solidity tools
  - Deterministic execution guarantees with ABFT finality
  - Low-cost contract calls (~$0.0001 per call)
  - Fast finality (~3-5 seconds) reduces reconciliation risk
  - Full compatibility with existing Ethereum tooling

### **HCS (Hedera Consensus Service)** - Immutable Audit Trail
- **Purpose**: Log all critical events for transparency and auditability
- **Usage**:
  - Log grain deposits and withdrawals
  - Record lending and borrowing transactions
  - Track collateral deposits and liquidations
  - Store transaction history for verification
- **Benefits**:
  - Immutable event log (~$0.0001 per message)
  - Queryable via Mirror Node API
  - Independent verification possible
  - Cost-effective for high-volume logging

### **Transaction Types Used**

| Transaction Type | Purpose | Example |
|----------------|---------|---------|
| `TokenCreateTransaction` | Setup phase (if deploying new tokens) | Create WHEAT/RICE tokens |
| `TokenMintTransaction` | Mint tokens for grain deposits | Mint 1000 WHEAT tokens for farmer |
| `TokenTransferTransaction` | Transfer tokens between accounts | Transfer tokens to lending pool |
| `ContractExecuteTransaction` | Execute smart contract functions | `depositCollateral()`, `borrow()` |
| `TopicMessageSubmitTransaction` | Log events to HCS | Log deposit event to topic |

### **Why Hedera?**

Hedera's low, predictable fees and ABFT finality lower the cost-to-serve in markets where margins are thin and connectivity is variable. Predictable per-transaction pricing lets us design farmer- and warehouse-friendly UX without surprise costs. High throughput and rapid finality help us keep investor liquidity and farmer credit access responsive.

## 📐 System Architecture

### **High-Level Architecture Diagram**

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Interface                          │
│                      (Next.js Frontend)                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │ Farmers  │  │Investors │  │Warehouse │    │
│  └──────────┘  └──────────┘  └──────────┘    │
└───────────────────────┬────────────────────────────────────────┘
                        │ HTTP/REST API
                        │
┌───────────────────────▼────────────────────────────────────────┐
│                    Backend API Layer                           │
│                    (NestJS + PostgreSQL)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │   Auth       │  │  Farmer API   │  │ Investor API │       │
│  │   Service    │  │  Warehouse API│  │  Pool API    │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└───────────────────────┬────────────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
┌───────▼──────┐ ┌──────────────▼──────┐ ┌─────▼──────┐
│  Hedera HTS  │ │  Hedera Smart        │ │  Hedera    │
│   (Tokens)   │ │  Contracts           │ │  HCS       │
│              │ │  (EVM-Compatible)    │ │  (Logs)    │
└──────────────┘ └──────────────────────┘ └────────────┘
        │               │               │
        └───────────────┼───────────────┘
                        │
            ┌───────────▼───────────┐
            │   Hedera Network      │
            │   (Testnet/Mainnet)    │
            └───────────┬───────────┘
                        │
            ┌───────────▼───────────┐
            │   Mirror Node API      │
            │   (Read Transactions)   │
            └───────────────────────┘
```

### **Data Flow Examples**

1. **Grain Tokenization Flow**:
   ```
   Farmer → Warehouse → Backend → HTS (Mint Tokens) → HCS (Log Event) → Mirror Node
   ```

2. **Lending Flow**:
   ```
   Farmer → Backend → Hedera Smart Contract (Deposit Collateral) → HTS (Transfer Tokens) → HCS (Log Event)
   ```

3. **Investment Flow**:
   ```
   Investor → Backend → Hedera Smart Contract (Deposit Liquidity) → HTS (Transfer USDC) → HCS (Log Event)
   ```

4. **Audit/Verification Flow**:
   ```
   UI → Backend → Mirror Node API → HCS Topic → Display Transaction History
   ```

## 📍 Deployed Hedera Addresses (Testnet)

> **Note**: Update these values with your actual deployment addresses after deploying contracts.

### **Smart Contract Addresses** (EVM-Compatible)
| Contract | Address | Description |
|----------|---------|-------------|
| PoolFactory | `0x811EF8ecDf2b9a15BF64F0225bbb3B0860B12Adb` | Factory contract for deploying lending pools |
| PriceOracle | `0x32344dEf5EA9Fa9b83962980C8d447dea81F3685` | Price feed oracle for agricultural commodities |
| InterestRateModel | `0x6C90077Ec6364F9aAab9C62EbE950f0653D2d588` | Dynamic interest rate calculation model |
| WHEAT LendingPool | `0x5CCA4F0F0e4e79b5D3B701B214F502183D3f903a` | Lending pool for WHEAT collateral |
| RICE LendingPool | `0x8298E55ddFA89Ec942cE7C7e81DD4BbD0d69f00a` | Lending pool for RICE collateral |

### **HTS Token IDs**
| Token | Token ID | Description |
|-------|----------|-------------|
| USDC | `0.0.7115536` | Stablecoin for lending/borrowing |
| WHEAT | `0.0.7121333` | Tokenized wheat grain |
| RICE | `0.0.7121334` | Tokenized rice grain |

### **HCS Topic IDs**
| Topic | Topic ID | Description |
|-------|----------|-------------|
| Transaction Logs | `0.0.xxxxx` | Event logging topic (create during deployment) |

### **Lending Pool Native IDs**
| Pool | Native ID | EVM Address |
|------|-----------|-------------|
| WHEAT Pool | `0.0.7115543` | `0x5CCA4F0F0e4e79b5D3B701B214F502183D3f903a` |
| RICE Pool | `0.0.7115545` | `0x8298E55ddFA89Ec942cE7C7e81DD4BbD0d69f00a` |

> **📝 Deployment Info**: See `contracts/deployed.json` for complete deployment details and configuration.

## Code Quality & Auditability

- TypeScript across frontend and backend.
- Centralized config for backend URL in `app/src/lib/config.ts`.
- Endpoints catalog: see `ENDPOINTS.md` for FE-used APIs.
- Linters/formatters recommended (ESLint/Prettier). Keep core logic files clean and commented where non-obvious (e.g., lending flow, tokenization).

## Quick Test Plan (manual)

1) Start backend and frontend as above.
2) From the UI, login as warehouse operator and fetch deliveries; verify tokenization flows call Warehouse endpoints.
3) From investor UI, view pools and portfolio; verify events show under Transaction History (HCS-backed).
4) Use the faucet routes to mint test tokens on Testnet accounts.

## Troubleshooting

### Common Issues

**CORS Errors:**
- Ensure `CORS_ORIGINS` in backend `.env` includes the frontend origin (e.g., `http://localhost:3000`)
- Check that backend is running on the correct port (default: 3001)

**Environment Variables:**
- Ensure `NEXT_PUBLIC_BACKEND_URL` is set in `app/.env` and matches backend port
- Verify all required Hedera credentials are set in `backend/.env`
- Check that contract addresses match your deployment

**Database Connection:**
- Ensure PostgreSQL is running: `docker compose ps`
- Verify `DATABASE_URL` in `backend/.env` matches docker-compose settings
- Run migrations: `cd backend && pnpm prisma:deploy`

**Hedera Connectivity:**
- Verify `HEDERA_NETWORK=testnet` in backend `.env`
- Check Hedera operator credentials are correct
- Ensure `HEDERA_JSON_RPC_URL` is accessible

**Build Issues:**
- Clear build artifacts: `rm -rf backend/dist app/.next`
- Reinstall dependencies: `pnpm install` in each workspace
- Regenerate Prisma client: `cd backend && pnpm prisma:generate`

**Port Already in Use:**
- Backend: Change `PORT` in `backend/.env`
- Frontend: Change port: `cd app && PORT=3002 pnpm dev`
- Database: Change port in `docker-compose.yml`

---

## 🚀 Quick Links

- 🌐 **[Live Demo](https://hedarvest.netlify.app/)** - Experience Hedarvest in action
- 📺 **[Demo Video](https://youtu.be/MOYNtMmlqt8)** - Watch the platform walkthrough
- 📊 **[Pitch Deck](https://drive.google.com/file/d/1VxXxQcPSCXy1nqK2hdGTW9DQB8L_dJUe/view?usp=sharing)** - Project presentation
- 🏆 **[Certificate](https://drive.google.com/file/d/13pBMR1sbK9f44NwK5ETC4Kk8y80mznQb/view?usp=sharing)** - Hashgraph Course certificate

---

## 🎯 Problem Statement

**Agricultural finance faces critical challenges:**
- 🌱 **Farmers** struggle to get immediate cash for their harvests
- 🏦 **Traditional banks** have high barriers and slow processes
- 💰 **Investors** lack transparent, verified agricultural investment opportunities
- 🔍 **Supply chains** lack transparency and traceability
- 📊 **Price discovery** is inefficient and often unfair to farmers

**Hedarvest solves these problems by creating a decentralized platform that:**
- Provides instant liquidity to farmers through tokenized grain
- Enables transparent, blockchain-verified agricultural investments
- Connects all stakeholders in a trustless, efficient ecosystem
- Leverages Hedera's fast, low-cost, and sustainable blockchain

---

## ✨ Key Features

### 🌾 **For Farmers**
- **Instant Cash Access**: Get immediate liquidity for your harvest
- **Fair Pricing**: Transparent, market-driven grain pricing
- **Secure Storage**: Blockchain-verified grain deposits
- **Digital Wallet**: Easy-to-use mobile interface

### 💼 **For Investors**
- **Agricultural Investments**: Invest in verified grain pools
- **Transparent Returns**: Real-time tracking of investments
- **Risk Management**: Diversified, collateralized investments
- **Impact Investing**: Support sustainable agriculture

---

## 🏗️ Component Architecture

### **Frontend Layer** (Next.js 15 + TypeScript)
- **Framework**: Next.js 15 with App Router
- **State Management**: TanStack Query for server state
- **Wallet Integration**: HashConnect for Hedera wallet connections
- **UI Components**: Radix UI + Custom components
- **Styling**: Tailwind CSS
- **Features**:
  - Multi-role dashboards (Farmer, Investor, Warehouse)
  - Real-time data visualization with Recharts
  - Responsive mobile-first design

### **Backend Layer** (NestJS + PostgreSQL)
- **Framework**: NestJS (Node.js)
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT + Passport.js
- **API**: RESTful endpoints with comprehensive validation
- **Features**:
  - JWT-based authentication system
- Real-time notifications
  - Hedera SDK integration (@hashgraph/sdk)
  - Smart contract interaction via ethers.js
  - HCS topic management
  - Mirror Node API integration

### **Smart Contract Layer** (Hedera EVM-Compatible)
- **Language**: Solidity ^0.8.19
- **Framework**: Hardhat
- **Blockchain**: Hedera Hashgraph (EVM-compatible)
- **Key Contracts**:
  - **`PoolFactory`**: Deploys and manages lending pools for different grain types
  - **`LendingPool`**: Core lending/borrowing functionality with share-based accounting
  - **`InterestRateModel`**: Dynamic interest rate calculations based on utilization
  - **`MockPriceOracle`**: Price feed for agricultural commodities
- **Deployment**: All contracts deployed on Hedera Testnet/Mainnet via EVM-compatible network

### **Blockchain Layer** (Hedera Hashgraph)
- **Network**: Hedera Testnet/Mainnet
- **Services Used**:
  - **HTS**: Native token service for grain tokens
  - **Smart Contracts**: EVM-compatible contract execution
  - **HCS**: Immutable event logging
  - **Mirror Node**: Read-only transaction history API
- **Benefits**:
  - Fast finality (~3-5 seconds)
  - Low, predictable fees
  - Energy-efficient consensus (ABFT)
  - Carbon-negative operations

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and pnpm
- PostgreSQL database
- Hedera testnet account
- Git

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/hedarvest.git
cd hedarvest
```

### 2. Install Dependencies
```bash
# Install root dependencies
pnpm install

# Install frontend dependencies
cd app && pnpm install

# Install backend dependencies
cd ../backend && pnpm install

# Install contract dependencies
cd ../contracts && pnpm install
```

### 3. Environment Setup

Create `.env` files for each workspace:

```bash
# Frontend
touch app/.env

# Backend
touch backend/.env

# Contracts (if deploying)
touch contracts/.env
```

**Frontend Environment Variables (`app/.env`):**
```env
# Backend API URL
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001

# Smart Contract Addresses
NEXT_PUBLIC_POOL_FACTORY_ADDRESS=0x811EF8ecDf2b9a15BF64F0225bbb3B0860B12Adb
NEXT_PUBLIC_ORACLE_ADDRESS=0x32344dEf5EA9Fa9b83962980C8d447dea81F3685
NEXT_PUBLIC_INTEREST_RATE_MODEL_ADDRESS=0x6C90077Ec6364F9aAab9C62EbE950f0653D2d588

# Hedera Network Configuration
NEXT_PUBLIC_HEDERA_JSON_RPC_URL=https://testnet.hashio.io/api
NEXT_PUBLIC_CHAIN_ID=296

# Token IDs
NEXT_PUBLIC_WHEAT_TOKEN_ID=0.0.7121333
NEXT_PUBLIC_RICE_TOKEN_ID=0.0.7121334
NEXT_PUBLIC_USDC_TOKEN_ID=0.0.7115536

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=Hedarvest
NEXT_PUBLIC_APP_DESCRIPTION=Agricultural Investment Platform on Hedera
NEXT_PUBLIC_HASHCONNECT_PROJECT_ID=fill walletconnect app id
```

**Backend Environment Variables (`backend/.env`):**
```env
# Server Configuration
PORT=3001
CORS_ORIGINS=http://localhost:3000,http://localhost:3002
NODE_ENV=development

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/hedarvest?schema=public

# Hedera Operator (HTS/HCS)
HEDERA_OPERATOR_ID=0.0.123456
HEDERA_OPERATOR_KEY=3030303
HEDERA_NETWORK=testnet

# Hedera EVM JSON-RPC
HEDERA_JSON_RPC_URL=https://testnet.hashio.io/api
EVM_PRIVATE_KEY=0xabbbaba

# HCS Topic ID (optional, seed will create if not provided)
HEDERA_TOPIC_ID=
HCS_TRANSACTION_TOPIC_ID=

# Hedera Mirror Node
HEDERA_MIRROR_NODE_URL=https://testnet.mirrornode.hedera.com

# Smart Contract Addresses
POOL_FACTORY_ADDRESS=0x811EF8ecDf2b9a15BF64F0225bbb3B0860B12Adb
ORACLE_ADDRESS=0x32344dEf5EA9Fa9b83962980C8d447dea81F3685
INTEREST_RATE_MODEL_ADDRESS=0x6C90077Ec6364F9aAab9C62EbE950f0653D2d588
LENDING_TOKEN_ADDRESS=
COLLATERAL_TOKEN_ADDRESS=
CHAIN_ID=296

# Token IDs
USDC_MOCK_TOKEN_ID=0.0.7115536
USDC_TOKEN_ID=0.0.7115536
WHEAT_TOKEN_ID=0.0.7121333
RICE_TOKEN_ID=0.0.7121334
CORN_TOKEN_ID=0.0.7121335

# Authentication
JWT_SECRET=supersupersecre
FARMER_PIN_SALT=static-saltzw
ENCRYPTION_KEY=your-encryption-key-here

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Testing/Development (for seed purposes)
HARDCODED_FARMER_ADDRESS=
HARDCODED_FARMER_PRIVATE_KEY= 
```

**Contracts Environment Variables (`contracts/.env`):**
```env
# Hedera Network Configuration
HEDERA_NETWORK=testnet
HEDERA_OPERATOR_ID=0.0.123456
HEDERA_OPERATOR_KEY=3030303
HEDERA_JSON_RPC_URL=https://testnet.hashio.io/api
```

> **⚠️ Security Note:** Never commit `.env` files to version control. All `.env` files are excluded via `.gitignore`. Replace placeholder values with your actual Hedera testnet credentials.

### 4. Database Setup

```bash
# Start PostgreSQL with Docker
docker compose up -d

# Wait for database to be ready (check health)
docker compose ps

# Run database migrations
cd backend
pnpm prisma:generate
pnpm prisma:deploy

# Seed initial data (optional)
pnpm prisma:seed
```

### 5. Deploy Hedera Smart Contracts
```bash
cd contracts
pnpm hardhat compile
pnpm hardhat run scripts/deploy.js --network hederaTestnet
```

> **Note**: Contracts are deployed on Hedera's EVM-compatible network, allowing use of standard Solidity and Ethereum tooling while benefiting from Hedera's fast finality and low fees.

### 6. Start the Application
```bash
# Terminal 1: Start Backend
cd backend && pnpm start:dev

# Terminal 2: Start Frontend
cd app && pnpm dev
```

**🌐 Access the application at:** `http://localhost:3000`

### 7. Restart Services

**Quick Restart:**
```bash
# Stop services (Ctrl+C in each terminal)

# Restart Backend
cd backend
pnpm start:dev

# Restart Frontend
cd app
pnpm dev

# Restart Database (if needed)
docker compose restart postgres
```

**Full Restart (clean build):**
```bash
# Stop all services
docker compose down

# Clean build artifacts (optional)
cd backend && rm -rf dist
cd ../app && rm -rf .next

# Restart database
docker compose up -d

# Regenerate Prisma client and run migrations
cd backend
pnpm prisma:generate
pnpm prisma:deploy

# Rebuild and start
pnpm build
pnpm start:dev  # Terminal 1

# Start frontend
cd ../app
pnpm dev        # Terminal 2
```

**Complete Clean Restart (if experiencing issues):**
```bash
# Stop all services
docker compose down

# Clean all build artifacts and dependencies
cd backend && rm -rf dist node_modules
cd ../app && rm -rf .next node_modules
cd ../contracts && rm -rf node_modules

# Reinstall dependencies
pnpm install
cd backend && pnpm install
cd ../app && pnpm install
cd ../contracts && pnpm install

# Restart database
docker compose up -d

# Wait for database to be ready
sleep 5

# Regenerate Prisma client and run migrations
cd backend
pnpm prisma:generate
pnpm prisma:deploy

# Rebuild and start
pnpm build
pnpm start:dev  # Terminal 1

# Start frontend
cd ../app
pnpm dev        # Terminal 2
```

---

## 📱 User Flows

### **Farmer Journey**
1. **Register** → Create account and verify identity
2. **Deposit Grain** → Submit grain for tokenization
3. **Get Cash** → Receive immediate payment
4. **Track Status** → Monitor grain and payments

### **Investor Journey**
1. **Connect Wallet** → Link Hedera wallet
2. **Browse Pools** → Explore investment opportunities
3. **Invest** → Deposit funds into grain pools
4. **Track Returns** → Monitor investment performance
5. **Withdraw** → Exit investments when ready

---

## 🛠️ Tech Stack

### **Frontend**
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI + Custom components
- **State Management**: TanStack Query
- **Wallet Integration**: HashConnect

### **Backend**
- **Framework**: NestJS
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT + Passport
- **Validation**: Zod + Class Validator
- **Scheduling**: Node-cron
- **API Documentation**: Swagger/OpenAPI

### **Smart Contracts**
- **Language**: Solidity ^0.8.19
- **Framework**: Hardhat
- **Blockchain**: Hedera Hashgraph (EVM-compatible)
- **Token Standard**: Hedera Token Service (HTS)
- **Libraries**: OpenZeppelin Contracts
- **Deployment**: Deployed on Hedera's EVM-compatible network

### **Infrastructure**
- **Database**: PostgreSQL
- **Containerization**: Docker
- **Package Manager**: pnpm
- **Version Control**: Git

---

## 📊 Hedera Smart Contract Architecture

```mermaid
graph TB
    A[PoolFactory] --> B[WHEAT LendingPool]
    A --> C[RICE LendingPool]

    B --> D[USDC Token - Underlying]
    B --> E[WHEAT Token - Collateral]

    C --> D
    C --> H[RICE Token - Collateral]

    K[PriceOracle] --> B
    K --> C

    L[InterestRateModel] --> B
    L --> C

    B -.Share Accounting.-> M[LP Shares]
    B -.Share Accounting.-> N[Debt Shares]

    C -.Share Accounting.-> O[LP Shares]
    C -.Share Accounting.-> P[Debt Shares]
```

### **Key Contracts**

- **`PoolFactory`**: Deploys and manages lending pools for different grain types
- **`LendingPool`**: Core lending/borrowing with **share-based accounting**
  - Uses internal share tracking instead of separate tokens
  - `userLPShares(address)`: Track liquidity provider positions
  - `userDebtShares(address)`: Track borrower debt positions
  - `liquidityIndex`: Tracks LP share appreciation from interest
  - `borrowIndex`: Tracks debt share growth from interest
- **`InterestRateModel`**: Dynamic interest rate calculations based on utilization
- **`MockPriceOracle`**: Price feed for agricultural commodities (WHEAT, RICE)

### **Share-Based Accounting System**

Instead of minting separate LP and Debt tokens, our lending pools use an efficient share-based system:

- **LP Shares**: Represent proportional ownership of pool liquidity
  - Value increases over time through interest accrual
  - Redeemable for underlying assets + earned interest

- **Debt Shares**: Represent proportional debt obligation
  - Value increases over time through interest accrual
  - Must be repaid with interest to reclaim collateral

**Benefits**:
- Lower gas costs (no ERC20 transfers)
- Simpler contract architecture
- No token association requirements
- Direct share tracking on Hedera

---

## 🔐 Security Features

- **Reentrancy Guards**: Protection against reentrancy attacks
- **Access Controls**: Role-based permissions
- **Input Validation**: Comprehensive data validation
- **Audit Trail**: Complete transaction history
- **Collateral Management**: Automated liquidation mechanisms

---

## 📈 Business Model

### **Revenue Streams**
- **Transaction Fees**: Small percentage on each transaction
- **Interest Spread**: Difference between lending and borrowing rates
- **Premium Features**: Advanced analytics and tools

### **Token Economics**
- **USDC** (Underlying Asset): Stable currency for lending/borrowing
  - 6 decimal precision
  - Used for all liquidity deposits and borrowing
- **WHEAT/RICE** (Collateral Assets): Tokenized agricultural commodities
  - 18 decimal precision
  - Deposited as collateral for borrowing
  - Price tracked by oracle
- **Share Accounting** (Internal):
  - LP Shares: Track liquidity provider positions (not ERC20 tokens)
  - Debt Shares: Track borrower obligations (not ERC20 tokens)
  - Values tracked on-chain via `liquidityIndex` and `borrowIndex`

---

## 🌍 Impact & Sustainability

### **Environmental Impact**
- **Hedera's Sustainability**: 99.9% more energy efficient than Bitcoin
- **Carbon Neutral**: Sustainable blockchain operations
- **Green Agriculture**: Supporting sustainable farming practices

### **Social Impact**
- **Financial Inclusion**: Access to credit for small farmers
- **Transparency**: Transparent supply chains
- **Fair Pricing**: Market-driven, fair pricing mechanisms
- **Community Building**: Connecting agricultural stakeholders

---

## 🚧 Current Status

### **✅ Completed Features**
- [x] Smart contract deployment
- [x] Frontend application
- [x] Backend API
- [x] Database schema
- [x] Wallet integration
- [x] Basic user flows

### **🔄 In Progress**
- [ ] Advanced analytics
- [ ] Smooth Dashboard
- [ ] Testing suite

### **📋 Roadmap**
- [ ] Mobile application
- [ ] Advanced DeFi features
- [ ] Cross-chain integration
- [ ] AI-powered analytics
- [ ] Global expansion

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit your changes**: `git commit -m 'Add amazing feature'`
4. **Push to the branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

### **Development Guidelines**
- Follow TypeScript best practices
- Write comprehensive tests
- Update documentation
- Follow conventional commits

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Hedera Hashgraph** for the sustainable blockchain infrastructure
- **OpenZeppelin** for secure smart contract libraries
- **Next.js Team** for the amazing React framework
- **NestJS Team** for the robust backend framework
- **Agricultural Community** for inspiration and feedback

## 🏆 Hackathon Submission

**Built for**: [Hedera Africa Hackhaton]  
**Track**: DeFi / Rwa  
**Team**: [Hedarvest]  

**Key Achievements**:
- ✅ Complete full-stack application
- ✅ Deployed smart contracts on Hedera
- ✅ Multi-role user interface
- ✅ Real-time blockchain integration
- ✅ Sustainable and scalable architecture

### 📎 Submission Resources

- 🌐 **Live Demo**: [hedarvest.netlify.app](https://hedarvest.netlify.app/)
- 📺 **Demo Video**: [YouTube Walkthrough](https://youtu.be/MOYNtMmlqt8)
- 📊 **Pitch Deck**: [View Presentation](https://drive.google.com/file/d/1VxXxQcPSCXy1nqK2hdGTW9DQB8L_dJUe/view?usp=sharing)
- 🏆 **Certificate**: [View Certificate](https://drive.google.com/file/d/13pBMR1sbK9f44NwK5ETC4Kk8y80mznQb/view?usp=sharing)

---

<div align="center">

**🌾 Building the Future of Agricultural Finance 🌾**

*Empowering farmers, connecting communities, and creating sustainable value through blockchain technology.*

[![Star](https://img.shields.io/github/stars/yourusername/hedarvest?style=social)](https://github.com/yourusername/hedarvest)
[![Fork](https://img.shields.io/github/forks/yourusername/hedarvest?style=social)](https://github.com/yourusername/hedarvest/fork)

</div>