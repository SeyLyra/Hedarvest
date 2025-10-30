## Frontend Endpoints

This document lists all endpoints used by the frontend.

- Base URL is centralized in `app/src/lib/config.ts` as:
  - `export const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL as string;`

### Direct calls from frontend to backend (uses BACKEND_URL)

#### Warehouse
- GET `${BACKEND_URL}/warehouse/deliveries?status=inspecting`
- POST `${BACKEND_URL}/warehouse/deliveries/{id}/verify`
- GET `${BACKEND_URL}/warehouse/issued-receipts`
- GET `${BACKEND_URL}/warehouse/deliveries`
- POST `${BACKEND_URL}/warehouse/deliveries/{id}/receive`
- PUT `${BACKEND_URL}/warehouse/deliveries/{id}/status`
- PUT `${BACKEND_URL}/warehouse/deliveries/{id}/status/received`
- GET `${BACKEND_URL}/warehouse/deliveries/farmer/{farmerId}`
- GET `${BACKEND_URL}/warehouse/profile`
- POST `${BACKEND_URL}/warehouse/login`

#### Farmers
- GET `${BACKEND_URL}/warehouse/deliveries/farmer/{farmerId}`

#### Tokens / HCS
- GET `${BACKEND_URL}/hcs/events?address={address}&limit=50`

#### Misc (separate FE base)
- GET `${process.env.NEXT_PUBLIC_API_URL}/warehouse/list` (in `FindWarehouse.tsx`)

### Frontend calls to internal Next.js API routes (under `/api`)

#### Faucet
- GET `/api/faucet/balance/{address}`
- POST `/api/faucet/mint`

#### Pools
- GET `/api/pools/list`
- POST `/api/pools/deposit`
- GET `/api/pools/stats`

#### Farmers
- GET `/api/farmers/borrow/allowance/{grainType}`
- POST `/api/farmers/borrow/funds`
- POST `/api/farmers/collateral/deposit`
- GET `/api/farmers/loans`
- GET `/api/farmers/deposits`

#### Tokens
- GET `/api/tokens/info/{tokenId}`
- POST `/api/tokens/associate`
- POST `/api/tokens/associate-contract`
- POST `/api/tokens/association/{tokenId}`
- POST `/api/tokens/ensure-association`
- POST `/api/tokens/ensure-association-user-contract`

#### Investor
- GET `/api/investor/portfolio/{address}`
- POST `/api/investor/withdraw`

#### Agents
- POST `/api/agents/register`

#### Auth / Tx
- POST `/api/auth/wallet`
- GET `/api/tx/{id}`

### External services (direct FE usage)
- Hedera Mirror Node: `https://testnet.mirrornode.hedera.com/api/v1/contracts/{evmAddress}`


