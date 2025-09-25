# Hedarvest

A decentralized agricultural finance platform built on Hedera Hashgraph.

## Project Structure

- `/app` - Next.js frontend application
- `/backend` - NestJS backend API
- `/contracts` - Solidity smart contracts (Hardhat)

## Quick Start

### Frontend
```bash
cd app && pnpm dev
```

### Backend
```bash
cd backend && pnpm start:dev
```

### Contracts
```bash
cd contracts && pnpm hardhat compile
```

## Environment Setup

Copy the environment template and configure your variables:

```bash
cp backend/.env.example backend/.env.local
```

Edit `backend/.env.local` with your Hedera credentials and database configuration:

```env
# Hedera Configuration
HEDERA_OPERATOR_ID=0.0.123456
HEDERA_OPERATOR_KEY=302e020100300506032b657004220420...
HEDERA_NETWORK=testnet
HEDERA_JSON_RPC_URL=https://testnet.hashio.io/api

# EVM Configuration
EVM_PRIVATE_KEY=0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef

# Database
DATABASE_URL=postgresql://username:password@localhost:5432/hedarvest

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here

# Farmer PIN Salt
FARMER_PIN_SALT=your-pin-salt-here

# Frontend URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Getting Hedera Credentials

1. Create a Hedera account at [portal.hedera.com](https://portal.hedera.com)
2. Generate a new account and download the credentials
3. Use the account ID as `HEDERA_OPERATOR_ID`
4. Use the private key as `HEDERA_OPERATOR_KEY`

## Database

Start PostgreSQL with Docker:

```bash
docker compose up -d
```

Run Prisma migrations:

```bash
cd backend && pnpm prisma:migrate
```
