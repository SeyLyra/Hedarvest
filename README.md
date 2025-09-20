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

Edit `backend/.env.local` with your Hedera credentials and database configuration.

## Database

Start PostgreSQL with Docker:

```bash
docker compose up -d
```

Run Prisma migrations:

```bash
cd backend && pnpm prisma:migrate
```
