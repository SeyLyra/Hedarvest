# 🌾 Hedarvest
### *Decentralized Agricultural Finance Platform on Hedera Hashgraph*

[![Hedera](https://img.shields.io/badge/Built%20on-Hedera%20Hashgraph-00C4B4?style=for-the-badge&logo=hedera&logoColor=white)](https://hedera.com)
[![Next.js](https://img.shields.io/badge/Next.js-15.5.3-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org)
[![Solidity](https://img.shields.io/badge/Solidity-^0.8.19-363636?style=for-the-badge&logo=solidity&logoColor=white)](https://soliditylang.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7.3-blue?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)

> **Revolutionizing agricultural finance through blockchain technology, connecting farmers, agents, and investors in a transparent, efficient ecosystem.**

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
- **Agent Network**: Connect with certified local agents

### 🏢 **For Agents**
- **Earn Fees**: Commission-based income from transactions
- **Digital Tools**: Comprehensive dashboard and management tools
- **Certification Program**: Become a verified Hedarvest agent
- **Local Network**: Build relationships with farmers and investors

### 💼 **For Investors**
- **Agricultural Investments**: Invest in verified grain pools
- **Transparent Returns**: Real-time tracking of investments
- **Risk Management**: Diversified, collateralized investments
- **Impact Investing**: Support sustainable agriculture

### 🛒 **For Buyers**
- **Verified Grain**: Quality-assured, blockchain-tracked grain
- **Transparent Pricing**: Fair, market-based pricing
- **Direct Access**: Connect directly with farmers
- **Supply Chain Transparency**: Full traceability from farm to table

---

## 🏗️ Architecture

### **Frontend** (Next.js 15 + TypeScript)
- Modern, responsive web application
- Real-time data visualization
- Wallet integration with HashConnect
- Multi-role dashboards (Farmer, Agent, Investor, Buyer)

### **Backend** (NestJS + PostgreSQL)
- RESTful API with comprehensive endpoints
- JWT-based authentication
- Real-time notifications
- Database management with Prisma ORM

### **Smart Contracts** (Solidity + Hedera)
- **LendingPool**: Core lending and borrowing functionality
- **PoolFactory**: Deploy and manage lending pools
- **InterestRateModel**: Dynamic interest rate calculations
- **PriceOracle**: Real-time price feeds
- **Token Contracts**: USDC, WHEAT, RICE tokens

### **Blockchain** (Hedera Hashgraph)
- Fast, low-cost transactions
- Sustainable, energy-efficient consensus
- Native token support
- EVM compatibility

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
```bash
# Copy environment template
cp backend/.env.example backend/.env.local

# Edit with your credentials
nano backend/.env.local
```

**Required Environment Variables:**
```env
# Hedera Configuration
HEDERA_OPERATOR_ID=0.0.123456
HEDERA_OPERATOR_KEY=302e020100300506032b657004220420...
HEDERA_NETWORK=testnet
HEDERA_JSON_RPC_URL=https://testnet.hashio.io/api

# EVM Configuration
EVM_PRIVATE_KEY=0x1234567890abcdef...

# Database
DATABASE_URL=postgresql://username:password@localhost:5432/hedarvest

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
```

### 4. Database Setup
```bash
# Start PostgreSQL with Docker
docker compose up -d

# Run database migrations
cd backend && pnpm prisma:migrate

# Seed initial data
pnpm seed
```

### 5. Deploy Smart Contracts
```bash
cd contracts
pnpm hardhat compile
pnpm hardhat run scripts/deploy.js --network hederaTestnet
```

### 6. Start the Application
```bash
# Terminal 1: Start Backend
cd backend && pnpm start:dev

# Terminal 2: Start Frontend
cd app && pnpm dev
```

**🌐 Access the application at:** `http://localhost:3000`

---

## 📱 User Flows

### **Farmer Journey**
1. **Register** → Create account and verify identity
2. **Find Agent** → Connect with local certified agent
3. **Deposit Grain** → Submit grain for tokenization
4. **Get Cash** → Receive immediate payment
5. **Track Status** → Monitor grain and payments

### **Agent Journey**
1. **Apply** → Submit agent application
2. **Get Certified** → Complete verification process
3. **Connect Farmers** → Build local farmer network
4. **Process Deposits** → Handle grain tokenization
5. **Earn Fees** → Receive transaction commissions

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
- **Charts**: Recharts

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
- **Blockchain**: Hedera Hashgraph
- **Token Standard**: Hedera Token Service (HTS)
- **Libraries**: OpenZeppelin Contracts

### **Infrastructure**
- **Database**: PostgreSQL
- **Containerization**: Docker
- **Package Manager**: pnpm
- **Version Control**: Git

---

## 📊 Smart Contract Architecture

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
  - Uses internal share tracking instead of separate ERC20 tokens
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

- **Multi-signature Wallets**: Enhanced security for large transactions
- **Reentrancy Guards**: Protection against reentrancy attacks
- **Access Controls**: Role-based permissions
- **Input Validation**: Comprehensive data validation
- **Audit Trail**: Complete transaction history
- **Collateral Management**: Automated liquidation mechanisms

---

## 📈 Business Model

### **Revenue Streams**
- **Transaction Fees**: Small percentage on each transaction
- **Agent Commissions**: Fees for agent services
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
- [ ] Token association fixes
- [ ] Advanced analytics
- [ ] Mobile optimization
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

---

## 📞 Contact & Support

- **Website**: [hedarvest.com](https://hedarvest.com)
- **Email**: support@hedarvest.com
- **Discord**: [Join our community](https://discord.gg/hedarvest)
- **Twitter**: [@Hedarvest](https://twitter.com/hedarvest)

---

## 🏆 Hackathon Submission

**Built for**: [Hackathon Name]  
**Track**: DeFi / Agriculture / Sustainability  
**Team**: [Your Team Name]  
**Duration**: [Hackathon Duration]  

**Key Achievements**:
- ✅ Complete full-stack application
- ✅ Deployed smart contracts on Hedera
- ✅ Multi-role user interface
- ✅ Real-time blockchain integration
- ✅ Sustainable and scalable architecture

---

<div align="center">

**🌾 Building the Future of Agricultural Finance 🌾**

*Empowering farmers, connecting communities, and creating sustainable value through blockchain technology.*

[![Star](https://img.shields.io/github/stars/yourusername/hedarvest?style=social)](https://github.com/yourusername/hedarvest)
[![Fork](https://img.shields.io/github/forks/yourusername/hedarvest?style=social)](https://github.com/yourusername/hedarvest/fork)

</div>