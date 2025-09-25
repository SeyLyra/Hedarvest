# Hedarvest API Endpoints

## Frontend API Routes (Next.js App Router)

All frontend API routes are located in `app/src/app/api/` and proxy to the backend.

### Authentication (`/auth`)
- `POST /auth/wallet-connect` - Wallet authentication with signature verification
- `POST /auth/qr-login` - QR code + PIN authentication
- `POST /auth/generate-qr` - Generate QR code for farmer
- `GET /auth/profile` - Get authenticated user profile

### Farmers (`/farmers`)
- `POST /farmers/register` - Register new farmer
- `POST /farmers/deposits` - Process grain deposit (with Hedera integration)
- `POST /farmers/loans` - Create loan request
- `GET /farmers/profile` - Get farmer profile
- `GET /farmers/deposits` - Get farmer's deposits
- `GET /farmers/loans` - Get farmer's loans
- `GET /farmers/:id` - Get farmer by ID

### Agents (`/agents`)
- `POST /agents/register` - Register new agent
- `GET /agents` - Get all agents
- `GET /agents/profile` - Get agent profile
- `GET /agents/deposits` - Get agent's deposits
- `POST /agents/deposits/manage` - Manage deposit (approve/reject)
- `GET /agents/commission` - Get commission stats
- `GET /agents/:id` - Get agent by ID
- `GET /agents/:id/deposits` - Get agent's deposits by ID
- `GET /agents/:id/commission` - Get commission stats by ID

### Pools (`/pools`)
- `POST /pools` - Create new pool (with Hedera token creation)
- `GET /pools` - Get all pools
- `GET /pools/:id` - Get pool by ID
- `GET /pools/:id/stats` - Get pool statistics
- `GET /pools/:id/loans` - Get pool's loans
- `POST /pools/deposit` - Deposit to pool (with Hedera integration)
- `PUT /pools/:id/apr` - Update pool APR

### Transactions (`/tx`)
- `GET /tx/:id` - Get transaction by ID
- `GET /tx/ref/:ref` - Get transaction by reference
- `GET /tx/kind/:kind` - Get transactions by kind
- `GET /tx/entity/:entity` - Get transactions by entity
- `GET /tx` - Get all transactions

## Hedera Integration

All blockchain operations are handled by the `HederaService`:

- **Token Creation**: Pool creation creates Hedera tokens
- **Token Minting**: Pool deposits mint tokens to depositors
- **HBAR Transfers**: Farmer loans and agent deposits transfer HBAR
- **Transaction Logging**: All operations include Hedera transaction IDs

## Environment Variables

Required environment variables for backend:

```env
HEDERA_OPERATOR_ID=0.0.123456
HEDERA_OPERATOR_KEY=302e020100300506032b657004220420...
HEDERA_NETWORK=testnet
HEDERA_JSON_RPC_URL=https://testnet.hashio.io/api
EVM_PRIVATE_KEY=0x1234567890abcdef...
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret-key
FARMER_PIN_SALT=your-pin-salt
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Status

✅ All required API endpoints are implemented
✅ Hedera blockchain integration is complete
✅ Frontend-backend communication is configured
✅ Transaction logging with Hedera transaction IDs
