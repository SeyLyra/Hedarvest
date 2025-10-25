# Hedarvest - Complete Flow Documentation

## Table of Contents
1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Farmer Flow](#farmer-flow)
4. [Warehouse Flow](#warehouse-flow)
5. [Investor Flow](#investor-flow)
6. [Technical Details](#technical-details)
7. [API Endpoints](#api-endpoints)

---

## Overview

Hedarvest is a blockchain-based agricultural financing platform built on Hedera Hashgraph. It connects three key stakeholders:

- **Farmers**: Store crops, tokenize them, and access DeFi lending
- **Warehouses**: Verify and store crops, mint crop tokens
- **Investors**: Provide liquidity to lending pools and earn interest

### Key Technologies
- **Blockchain**: Hedera Hashgraph (Testnet)
- **Smart Contracts**: Solidity
- **Backend**: NestJS, PostgreSQL, Prisma
- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Wallet**: HashPack

---

## System Architecture

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   Farmer    │◄───────►│  Warehouse  │◄───────►│  Investor   │
└─────────────┘         └─────────────┘         └─────────────┘
       │                       │                       │
       │                       │                       │
       ▼                       ▼                       ▼
┌──────────────────────────────────────────────────────────┐
│                    Backend API (NestJS)                   │
│  • Authentication (JWT)                                   │
│  • Delivery Request Management                           │
│  • Warehouse Operations                                  │
│  • Pool Management                                        │
└──────────────────────────────────────────────────────────┘
       │                       │                       │
       ▼                       ▼                       ▼
┌──────────────────────────────────────────────────────────┐
│              Hedera Hashgraph Network (Testnet)          │
│  • Lending Pool Smart Contracts                          │
│  • Crop Token Minting                                    │
│  • Collateral Management                                 │
│  • Lending/Borrowing Operations                          │
└──────────────────────────────────────────────────────────┘
```

---

## Farmer Flow

### Overview
Farmers can store their harvested crops in warehouses, receive tokenized crop certificates, and use them as collateral to borrow funds.

### Complete Step-by-Step Flow

#### 1. **Farmer Registration & Login**
```
Location: /farmer
```

**Steps:**
1. Farmer visits the farmer portal
2. Enters email and password
3. System validates credentials
4. JWT token stored in localStorage
5. Redirected to Farmer Dashboard

**Technical Details:**
- Endpoint: `POST /farmers/login`
- Authentication: Email + Password
- Token Storage: `farmerToken`, `farmerEmail`, `farmerId` in localStorage
- Session Persistence: Token validated on page refresh

---

#### 2. **Find & Select Warehouse**
```
Dashboard → My Crops → Register New Crop → Find Warehouse
```

**Steps:**
1. Click "Register New Crop" or navigate to crop management
2. System fetches available warehouses from backend
3. View warehouse list with:
   - Distance from farmer's location
   - Available capacity
   - Storage pricing
   - Ratings & certifications
   - Contact information
4. Filter by status (available/full), sort by distance/rating/price
5. Select preferred warehouse
6. Confirm selection

**Technical Details:**
- Endpoint: `GET /warehouse/list`
- Response: Array of warehouses with details
- Selection: Warehouse ID passed to next step

**Warehouse Information Shown:**
- Name, address, city, state
- Capacity & availability (in tons)
- Utilization percentage
- Services (Storage, Quality Testing, Insurance, Transportation)
- Operating hours
- Contact (Manager, Phone, Email)
- Pricing (Storage per ton/month, Handling fee)
- Certifications (ISO 9001, Food Safety, etc.)
- Rating (out of 5 stars)

---

#### 3. **Register Crop Details**
```
Find Warehouse → Register Crop (4-Step Process)
```

**Step 1: Crop Details**
- Crop Type (Rice, Corn, Wheat, Soybean, Cotton, etc.)
- Variety (e.g., Basmati, Golden Corn)
- Quantity + Unit (kg, tons, quintals)
- Harvest Date

**Step 2: Quality & Measurements**
- Quality Grade (Premium, Grade A, B, C)
- Moisture Content (%)
- Storage Temperature (°C)
- Additional quality notes

**Step 3: Location & Photos**
- Harvest location address
- Photo upload (visual documentation)
- Additional notes

**Step 4: Review & Submit**
- Review all entered information
- Submit delivery request

**Technical Details:**
- Endpoint: `POST /warehouse/delivery-requests`
- Request Body:
```json
{
  "farmerId": 123,
  "warehouseId": "WH001",
  "cropType": "rice",
  "variety": "Basmati",
  "estimatedWeight": 500.0,
  "unit": "kg",
  "estimatedGrade": "grade-a",
  "moistureContent": 12.5,
  "temperature": 25.0,
  "scheduledDate": "2025-02-01",
  "location": "Farm Address, City",
  "notes": "Additional information",
  "photos": []
}
```
- Response: Delivery request created with ID and status

---

#### 4. **Deliver Crops to Warehouse**
```
Physical Delivery Process
```

**Steps:**
1. Farmer receives delivery request confirmation
2. Farmer transports crops to selected warehouse
3. Warehouse receives and inspects crops
4. Quality verification performed
5. Actual weight and grade recorded

**Status Updates:**
- `pending` → Delivery request created
- `confirmed` → Warehouse confirms acceptance
- `in_transit` → Crops being transported
- `received` → Crops arrived at warehouse
- `completed` → Verification complete, tokens minted

---

#### 5. **Receive Crop Tokens**
```
Automatic after Warehouse Verification
```

**Steps:**
1. Warehouse verifies crop quality and quantity
2. Smart contract mints crop tokens
3. Tokens sent to farmer's Hedera wallet
4. Farmer receives notification
5. Tokens appear in "My Crops" section

**Token Details:**
- Token Symbol: WHEAT, RICE, CORN, etc.
- Amount: Based on verified weight
- Value: Based on current market price
- Status: Available for collateral

**Technical Details:**
- Smart Contract: Crop Token Minting Contract
- Tokens: HTS (Hedera Token Service) tokens
- Metadata: Crop type, grade, warehouse, date

---

#### 6. **View Available Lending Pools**
```
Dashboard → Borrow & Loans → Crop Pools
```

**Pool Information:**
- Pool Name (RICE Pool, CORN Pool, WHEAT Pool)
- Crop Type supported
- Total Liquidity available
- APY (Annual Percentage Yield) for borrowing
- Utilization rate
- Available funds to borrow

**Example:**
```
RICE Pool
- Total Liquidity: $150,000
- APY: 8.5%
- Utilization: 65%
- Available: $52,500
```

**Technical Details:**
- Endpoint: `GET /pools/blockchain`
- Smart Contract: Pool contract `getPoolDetails()`
- Real-time data from blockchain

---

#### 7. **Deposit Crop Tokens as Collateral**
```
Crop Pools → Select Pool → Deposit Collateral
```

**Steps:**
1. Select appropriate lending pool for crop type
2. Click "Deposit Collateral"
3. Enter amount of crop tokens to deposit
4. Connect HashPack wallet
5. Approve transaction in HashPack
6. Tokens locked in smart contract
7. Collateral value calculated

**Loan-to-Value (LTV):**
- Typical LTV: 70% (can borrow up to 70% of collateral value)
- Example: $1,000 collateral → $700 borrowing power

**Technical Details:**
- Smart Contract Function: `depositCollateral(uint256 amount)`
- Token Transfer: Farmer wallet → Pool contract
- Collateral Record: Stored on-chain
- Health Factor: Calculated and monitored

---

#### 8. **Borrow Funds (USDC)**
```
Pool → Borrow Funds
```

**Steps:**
1. View available borrowing power
2. Enter desired borrow amount
3. Review loan terms:
   - APR (Annual Percentage Rate)
   - Loan amount
   - Collateral required
   - Health factor after borrow
4. Confirm borrow transaction
5. USDC transferred to farmer's wallet

**Borrowing Rules:**
- Maximum: Based on collateral value × LTV ratio
- Health Factor: Must remain > 1.0
- Interest: Accrues continuously
- Liquidation Threshold: Typically 85%

**Technical Details:**
- Smart Contract Function: `borrow(uint256 amount)`
- Token: USDC (Hedera Token ID)
- Interest Calculation: Compounding based on utilization
- Health Factor Formula: `(Collateral Value × Liquidation Threshold) / Borrow Value`

---

#### 9. **Use Borrowed Funds**
```
USDC in Wallet → Real-world Usage
```

**Use Cases:**
- Buy seeds, fertilizer, equipment
- Pay farm labor
- Cover operational expenses
- Invest in farm expansion

---

#### 10. **Withdraw USDC to Bank Account**
```
Dashboard → Borrow & Loans → Withdraw to Bank
```

**Steps:**
1. Click "Withdraw to Bank"
2. Enter withdrawal amount in USDC
3. Select linked bank account
4. System converts USDC to local currency (IDR, USD, etc.)
5. Conversion rate displayed
6. Confirm withdrawal
7. Funds transferred to bank (1-2 business days)

**Example:**
```
Available: $5,000 USDC
Withdraw: $2,000 USDC
Conversion: 1 USDC = 15,500 IDR
You receive: 31,000,000 IDR
Processing: 1-2 business days
```

---

#### 11. **Repay Loan**
```
Dashboard → Borrow & Loans → Loan Status → Repay
```

**Steps:**
1. View current loan details:
   - Principal borrowed
   - Interest accrued
   - Total amount due
   - Health factor
2. Enter repayment amount
3. Approve USDC transfer from wallet
4. Smart contract processes repayment
5. Debt reduced, health factor improved

**Repayment Options:**
- Partial repayment: Any amount
- Full repayment: Total debt + interest
- Interest only: Reduce accrual

**Technical Details:**
- Smart Contract Function: `repay(uint256 amount)`
- Token Transfer: Farmer wallet → Pool contract
- Interest Calculation: Updated on-chain
- Debt Shares: Burned proportionally

---

#### 12. **Withdraw Collateral**
```
After Loan Repayment → Withdraw Collateral
```

**Steps:**
1. Fully repay loan (or partial if health factor allows)
2. Click "Withdraw Collateral"
3. Enter amount to withdraw
4. System checks health factor
5. Approve transaction
6. Crop tokens returned to wallet

**Conditions:**
- Health factor must remain > 1.0 after withdrawal
- Full collateral withdrawal only if loan fully repaid

---

### Farmer Dashboard Features

**Overview Section:**
- Total tokenized crops
- Total value in USD
- Available credit
- Active loans
- Next repayment date
- Total earnings

**My Crops Section:**
- WHEAT tokens balance
- RICE tokens balance
- Available vs pledged as collateral
- Token values in USD

**Borrow & Loans Section:**
- View lending pools
- Deposit collateral
- Borrow funds
- View loan status
- Repay loans
- Withdraw to bank

**Activity Feed:**
- Recent transactions
- Delivery requests status
- Token minting events
- Borrow/repay history

---

## Warehouse Flow

### Overview
Warehouses receive crop deliveries from farmers, verify quality and quantity, store crops securely, and mint crop tokens for farmers.

### Complete Step-by-Step Flow

#### 1. **Warehouse Operator Login**
```
Location: /warehouse-login
```

**Steps:**
1. Warehouse operator visits warehouse portal
2. Enters warehouse credentials
3. System validates
4. Redirected to Warehouse Dashboard

**Technical Details:**
- Endpoint: `POST /warehouse/login` (if implemented)
- Alternative: Admin panel access
- Permissions: View requests, verify deliveries, mint tokens

---

#### 2. **View Incoming Delivery Requests**
```
Dashboard → Delivery Requests
```

**Information Displayed:**
- Delivery request ID
- Farmer information (name, phone, member number)
- Crop type and variety
- Estimated weight and unit
- Estimated grade
- Moisture content
- Temperature requirements
- Scheduled delivery date
- Location
- Photos
- Status

**Filter Options:**
- By status (pending, confirmed, in_transit, received)
- By crop type
- By scheduled date

**Technical Details:**
- Endpoint: `GET /warehouse/delivery-requests?warehouseId=WH001&status=pending`
- Response: Array of delivery requests

---

#### 3. **Confirm Delivery Request**
```
Delivery Requests → Select Request → Confirm
```

**Steps:**
1. Review delivery request details
2. Check warehouse capacity
3. Verify scheduled date availability
4. Confirm or reject request
5. Status updated to `confirmed`
6. Farmer notified

**Technical Details:**
- Endpoint: `PUT /warehouse/delivery-requests/:id/status`
- Request Body:
```json
{
  "status": "confirmed",
  "notes": "Delivery confirmed for Feb 1, 2025"
}
```

---

#### 4. **Receive Physical Delivery**
```
Scheduled Date → Crops Arrive → Receive Delivery
```

**Steps:**
1. Farmer delivers crops to warehouse
2. Warehouse operator marks delivery as received
3. Creates incoming delivery record
4. Initial inspection performed
5. Crops moved to inspection area

**Technical Details:**
- Endpoint: `POST /warehouse/delivery-requests/:id/receive`
- Request Body:
```json
{
  "actualWeight": 480.0,
  "actualGrade": "grade-a",
  "moistureContent": 12.3,
  "temperature": 24.5,
  "notes": "Crops in good condition",
  "inspectorName": "John Smith"
}
```
- Response: IncomingDelivery record created

---

#### 5. **Quality Verification**
```
Incoming Deliveries → Verify Quality
```

**Verification Process:**
1. **Visual Inspection**
   - Color, appearance
   - Presence of foreign materials
   - Pest damage assessment

2. **Laboratory Testing**
   - Moisture content measurement
   - Grade classification
   - Purity testing
   - Germination test (if applicable)

3. **Weight Verification**
   - Accurate weighing
   - Unit conversion if needed

4. **Documentation**
   - Photos of crops
   - Test results
   - Inspector signature

**Verification Results:**
- Actual weight
- Actual grade
- Quality score
- Accept/Reject decision
- Rejection reason (if rejected)

---

#### 6. **Accept or Reject Delivery**

**Option A: Accept Delivery**
```
Verify → Accept → Mint Tokens
```

**Steps:**
1. Review verification results
2. Click "Accept Delivery"
3. Confirm token minting details
4. Enter smart contract details
5. Initiate token minting transaction

**Technical Details:**
- Endpoint: `POST /warehouse/incoming-deliveries/:id/verify`
- Request Body:
```json
{
  "verified": true,
  "actualWeight": 480.0,
  "actualGrade": "grade-a",
  "qualityScore": 95,
  "tokenAmount": 480,
  "notes": "Quality verified, tokens minted"
}
```

**Option B: Reject Delivery**
```
Verify → Reject → Notify Farmer
```

**Steps:**
1. Document rejection reason
2. Click "Reject Delivery"
3. Farmer notified
4. Crops returned or disposed

**Rejection Reasons:**
- Poor quality
- High moisture content
- Pest infestation
- Wrong crop type/variety
- Insufficient quantity

**Technical Details:**
- Endpoint: `POST /warehouse/incoming-deliveries/:id/reject`
- Request Body:
```json
{
  "reason": "Moisture content too high (18%). Acceptable range is 12-14%."
}
```

---

#### 7. **Mint Crop Tokens**
```
Accept Delivery → Smart Contract Interaction
```

**Minting Process:**
1. **Calculate Token Amount**
   - Based on verified weight
   - Adjusted for grade (premium = 1.1x, grade-a = 1.0x, etc.)

2. **Execute Smart Contract**
   - Call token minting function
   - Specify farmer's wallet address
   - Specify token amount

3. **Blockchain Transaction**
   - Tokens created on Hedera
   - Tokens transferred to farmer's wallet
   - Transaction ID recorded

4. **Update Database**
   - Mark delivery as completed
   - Record transaction hash
   - Update farmer's token balance

**Technical Details:**
- Smart Contract: Crop Token Factory
- Function: `mintCropTokens(address farmer, uint256 amount, string cropType)`
- Network: Hedera Testnet
- Gas Fees: Paid by warehouse operator

**Token Metadata:**
```json
{
  "tokenId": "0.0.123456",
  "symbol": "WHEAT",
  "name": "Wheat Token",
  "amount": 480,
  "grade": "grade-a",
  "warehouse": "WH001",
  "mintDate": "2025-02-01",
  "expiryDate": "2025-08-01"
}
```

---

#### 8. **Store Crops**
```
After Acceptance → Physical Storage
```

**Storage Process:**
1. Move crops to designated storage area
2. Label with unique identifier
3. Monitor storage conditions:
   - Temperature
   - Humidity
   - Pest control
4. Regular inspections
5. Inventory management

**Storage Records:**
- Storage location
- Condition monitoring logs
- Inspection reports
- Inventory levels

---

#### 9. **Manage Inventory**
```
Dashboard → Inventory Management
```

**Features:**
- Current inventory by crop type
- Storage utilization
- Capacity planning
- Expiry tracking
- Quality degradation monitoring

---

#### 10. **Process Withdrawal Requests**
```
When Farmer Repays Loan → Release Crops
```

**Steps:**
1. Receive crop withdrawal/release request
2. Verify token burn/collateral release on blockchain
3. Prepare crops for release
4. Farmer collects or arranges transport
5. Update inventory

**Technical Details:**
- Triggered by: Collateral withdrawal on smart contract
- Verification: Check blockchain events
- Release: Physical crop handover

---

### Warehouse Dashboard Features

**Delivery Requests:**
- Pending requests
- Confirmed deliveries
- In-transit tracking
- Quick actions (confirm/reject)

**Incoming Deliveries:**
- Deliveries to verify
- Verification in progress
- Completed verifications
- Rejected deliveries

**Inventory:**
- Current stock by crop type
- Storage utilization charts
- Capacity planning
- Condition monitoring alerts

**Analytics:**
- Total deliveries processed
- Average verification time
- Acceptance/rejection rates
- Revenue from storage fees

---

## Investor Flow

### Overview
Investors provide liquidity to lending pools, earn interest from farmer borrowings, and can withdraw funds anytime.

### Complete Step-by-Step Flow

#### 1. **Connect Wallet**
```
Location: /investor-login
```

**Steps:**
1. Visit investor portal
2. Click "Connect HashPack Wallet"
3. HashPack extension opens
4. Select account to connect
5. Approve connection
6. Wallet address saved
7. Redirected to Investor Dashboard

**Technical Details:**
- Wallet: HashPack (Hedera wallet)
- Integration: HashConnect SDK
- Network: Hedera Testnet
- Session: Wallet address stored in localStorage

---

#### 2. **View Available Pools**
```
Dashboard → Explore Pools
```

**Pool Information:**
- Pool name and crop type
- Total liquidity (TVL - Total Value Locked)
- APY (Annual Percentage Yield) for lenders
- Utilization rate
- Your balance in pool
- Estimated earnings

**Example Pools:**
```
RICE Pool
- TVL: $150,000
- APY: 6.2%
- Utilization: 65%
- Your Balance: $0
- 24h Volume: $5,400

WHEAT Pool
- TVL: $120,000
- APY: 7.1%
- Utilization: 45%
- Your Balance: $0
- 24h Volume: $3,200
```

**Technical Details:**
- Endpoint: `GET /pools/blockchain`
- Smart Contract: `getPoolDetails()` for each pool
- Real-time APY calculation based on utilization

---

#### 3. **Deposit USDC to Pool**
```
Pools → Select Pool → Deposit
```

**Steps:**
1. Select desired lending pool
2. Click "Deposit"
3. Enter USDC amount to deposit
4. Review transaction details:
   - Deposit amount
   - Current APY
   - Estimated monthly earnings
   - LP shares to receive
5. Connect HashPack if not connected
6. Approve USDC spending in HashPack
7. Confirm deposit transaction
8. Receive LP (Liquidity Provider) shares

**LP Shares:**
- Represent ownership in the pool
- Exchangeable for USDC + interest
- Value increases over time
- Transferable tokens

**Technical Details:**
- Smart Contract Function: `deposit(uint256 amount)`
- Token: USDC → Pool contract
- Receive: LP shares (proportional to deposit)
- Exchange Rate: USDC per LP share = (Total USDC) / (Total LP Shares)

**Example:**
```
Deposit: 10,000 USDC
Current Exchange Rate: 1 LP = 1.05 USDC
LP Shares Received: 10,000 / 1.05 = 9,523.81 LP

After 1 month @ 6.2% APY:
Exchange Rate: 1 LP = 1.0552 USDC
Your Value: 9,523.81 × 1.0552 = 10,049.60 USDC
Earnings: 49.60 USDC
```

---

#### 4. **Earn Interest**
```
Automatic - Passive Income
```

**How Interest Accrues:**
1. Farmers borrow from pool → Pay interest
2. Interest added to pool's total USDC
3. LP share value increases
4. Your shares worth more USDC

**Interest Calculation:**
- **Utilization-based**: Higher utilization = Higher APY
- **Continuous compounding**: Interest accrues every block
- **Dynamic rates**: APY adjusts automatically

**APY Formula:**
```
Supply APY = Borrow APY × Utilization Rate × (1 - Reserve Factor)

Example:
Borrow APY: 8.5%
Utilization: 65%
Reserve Factor: 10%
Supply APY: 8.5% × 65% × 90% = 4.97%
```

---

#### 5. **Monitor Portfolio**
```
Dashboard → Portfolio
```

**Dashboard Metrics:**
- **Total Supplied**: Total USDC deposited across all pools
- **Total Earned**: Total interest earned
- **APY Weighted**: Average APY across your positions
- **Positions**: List of all pool deposits

**Per-Pool Metrics:**
- Deposited amount
- Current value
- Earnings to date
- Current APY
- LP shares balance

**Charts & Analytics:**
- Portfolio value over time
- Earnings history
- APY trends
- Pool performance comparison

---

#### 6. **Claim Rewards (Optional)**
```
Some pools may have additional reward tokens
```

**Steps:**
1. View available rewards
2. Click "Claim Rewards"
3. Approve transaction
4. Reward tokens sent to wallet

**Reward Types:**
- **Governance tokens**: Vote on protocol decisions
- **Bonus tokens**: Additional incentives
- **Staking rewards**: Extra yield for long-term holders

---

#### 7. **Withdraw Funds**
```
Dashboard → Pool → Withdraw
```

**Partial Withdrawal:**
1. Select pool
2. Click "Withdraw"
3. Enter USDC amount to withdraw
4. Review:
   - Withdrawal amount
   - Remaining balance
   - Updated APY
5. Approve transaction
6. LP shares burned
7. USDC returned to wallet

**Full Withdrawal:**
1. Click "Withdraw All"
2. All LP shares burned
3. Receive all USDC + accrued interest
4. Position closed

**Technical Details:**
- Smart Contract Function: `withdraw(uint256 shares)`
- LP shares → USDC conversion
- Exchange Rate: Current ratio
- No withdrawal fees (typically)
- Available liquidity: Based on pool utilization

**Example:**
```
Your LP Shares: 9,523.81
Current Exchange Rate: 1 LP = 1.0552 USDC
Withdraw: 5,000 USDC

LP Shares Needed: 5,000 / 1.0552 = 4,738.88 LP
Remaining LP Shares: 4,784.93 LP
Remaining Value: 4,784.93 × 1.0552 = 5,049.60 USDC
```

**Liquidity Considerations:**
- Can only withdraw available (non-borrowed) liquidity
- If utilization is 100%, must wait for repayments
- Usually not an issue with proper pool management

---

#### 8. **Reinvest Earnings**
```
Compound Interest Strategy
```

**Steps:**
1. Monitor earnings
2. When desired profit reached
3. Withdraw earnings
4. Re-deposit to same or different pool
5. Compound interest effect

---

### Investor Dashboard Features

**Portfolio Overview:**
- Total value supplied
- Total interest earned
- Weighted APY
- Number of active positions
- 24h earnings

**Pool List:**
- All available lending pools
- APY comparison
- Utilization rates
- Your balance in each
- Quick deposit/withdraw

**My Positions:**
- Detailed view of each investment
- Performance tracking
- Earnings history
- Transaction history

**Analytics:**
- Portfolio performance charts
- APY trends
- Earnings projections
- Risk metrics

---

## Technical Details

### Smart Contracts

#### 1. **Lending Pool Contract**
```solidity
// Key Functions
function deposit(uint256 amount) external
function withdraw(uint256 shares) external
function depositCollateral(uint256 amount) external
function withdrawCollateral(uint256 amount) external
function borrow(uint256 amount) external
function repay(uint256 amount) external
function liquidate(address borrower, uint256 repayAmount) external

// View Functions
function getPoolDetails() external view returns (PoolDetails)
function getHealthFactor(address user) external view returns (uint256)
function getUserPosition(address user) external view returns (UserPosition)
```

#### 2. **Crop Token Contract**
```solidity
// ERC-20 Compatible on Hedera
function mint(address to, uint256 amount) external
function burn(uint256 amount) external
function transfer(address to, uint256 amount) external
function approve(address spender, uint256 amount) external
```

---

### Database Schema

#### Key Models

**Farmer:**
```prisma
model Farmer {
  id             Int       @id @default(autoincrement())
  memberNumber   String    @unique
  email          String    @unique
  phoneNumber    String?
  walletAddress  String?
  passwordHash   String
  deliveryRequests DeliveryRequest[]
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt
}
```

**DeliveryRequest:**
```prisma
model DeliveryRequest {
  id                Int      @id @default(autoincrement())
  farmer            Farmer   @relation(fields: [farmerId], references: [id])
  farmerId          Int
  warehouseId       String
  cropType          String
  variety           String?
  estimatedWeight   Decimal
  unit              String   @default("kg")
  estimatedGrade    String?
  moistureContent   Decimal?
  temperature       Decimal?
  scheduledDate     DateTime
  location          String?
  status            String   @default("pending")
  notes             String?
  photos            Json?
  incomingDelivery  IncomingDelivery?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}
```

**IncomingDelivery:**
```prisma
model IncomingDelivery {
  id                  Int      @id @default(autoincrement())
  deliveryRequest     DeliveryRequest @relation(fields: [deliveryRequestId], references: [id])
  deliveryRequestId   Int      @unique
  actualWeight        Decimal
  actualGrade         String?
  moistureContent     Decimal?
  temperature         Decimal?
  qualityScore        Int?
  verified            Boolean  @default(false)
  tokenAmount         Decimal?
  transactionHash     String?
  status              String   @default("received")
  notes               String?
  inspectorName       String?
  verifiedAt          DateTime?
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
}
```

---

## API Endpoints

### Farmer Endpoints

#### Authentication
```
POST /farmers/register
POST /farmers/login
GET  /farmers/profile
```

#### Delivery Requests
```
POST /warehouse/delivery-requests
GET  /warehouse/delivery-requests/farmer/:farmerId
GET  /warehouse/delivery-requests/:id
PUT  /warehouse/delivery-requests/:id/status
```

### Warehouse Endpoints

#### Warehouses
```
GET  /warehouse/list
GET  /warehouse/:id
```

#### Delivery Management
```
GET  /warehouse/delivery-requests?warehouseId=WH001&status=pending
PUT  /warehouse/delivery-requests/:id/status
POST /warehouse/delivery-requests/:id/receive
```

#### Incoming Deliveries
```
GET  /warehouse/incoming-deliveries?warehouseId=WH001
PUT  /warehouse/incoming-deliveries/:id/status
POST /warehouse/incoming-deliveries/:id/verify
POST /warehouse/incoming-deliveries/:id/reject
```

### Investor/Pool Endpoints

#### Pools
```
GET  /pools/blockchain
GET  /pools/:poolAddress
GET  /pools/:poolAddress/user/:userAddress
```

#### Transactions
```
POST /pools/:poolAddress/deposit
POST /pools/:poolAddress/withdraw
POST /pools/:poolAddress/borrow
POST /pools/:poolAddress/repay
```

---

## Environment Variables

### Backend (.env)
```env
DATABASE_URL="postgresql://user:password@localhost:5432/hedarvest"
JWT_SECRET="your-secret-key"
HEDERA_OPERATOR_ID="0.0.xxxxx"
HEDERA_OPERATOR_KEY="your-private-key"
HEDERA_NETWORK="testnet"
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL="http://localhost:4000"
NEXT_PUBLIC_HASHCONNECT_PROJECT_ID="your-project-id"
NEXT_PUBLIC_APP_NAME="Hedarvest"
NEXT_PUBLIC_APP_URL="http://localhost:3002"
NEXT_PUBLIC_HEDERA_NETWORK="testnet"
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL
- HashPack Wallet Extension
- Hedera Testnet Account

### Installation

1. **Clone Repository**
```bash
git clone https://github.com/your-repo/hedarvest.git
cd hedarvest
```

2. **Backend Setup**
```bash
cd backend
npm install
npx prisma migrate dev
npm run start:dev
```

3. **Frontend Setup**
```bash
cd app
npm install
npm run dev
```

4. **Access Applications**
- Frontend: http://localhost:3002
- Backend API: http://localhost:4000
- API Docs: http://localhost:4000/api

---

## Testing Accounts

### Farmers
```
Email: farmer1@test.com
Password: password123
```

### Warehouses
```
Warehouse IDs: WH001, WH002, WH003, WH004
```

### Investors
```
Use your HashPack wallet on Hedera Testnet
Get test HBAR: https://portal.hedera.com/faucet
```

---

## Support & Contact

- **Documentation**: https://docs.hedarvest.com
- **GitHub Issues**: https://github.com/your-repo/hedarvest/issues
- **Email**: support@hedarvest.com

---

## License

MIT License - See LICENSE file for details
