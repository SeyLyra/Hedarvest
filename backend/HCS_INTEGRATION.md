# Hedera Consensus Service (HCS) Integration

This document explains how the Hedera Consensus Service (HCS) has been integrated into the Hedarvest NestJS backend to provide real-time event streaming and audit trails for all major platform activities.

## Overview

The HCS integration automatically publishes events to a Hedera topic for the following operations:
- **Investor Operations**: Deposits and withdrawals from grain pools
- **Farmer Operations**: Loan creation, repayment, and collateral deposits
- **Smart Contract Interactions**: All blockchain transactions are logged with their transaction hashes

## Architecture

### HcsService (`src/hcs/hcs.service.ts`)
The core service that handles:
- **Publishing**: Sends events to the configured HCS topic
- **Subscribing**: Listens to all messages on the topic for real-time processing
- **Event Management**: Provides typed interfaces for different event types

### Integration Points
The `HcsService` is injected into `HederaService` to automatically publish events after each blockchain operation:

```typescript
// Example from HederaService
async depositToPool(grainType: string, amount: string, investorAddress: string) {
  // ... contract interaction logic ...
  
  // Publish HCS event
  await this.hcsService.publishInvestorDeposit({
    poolAddress,
    grainType,
    amount: parseFloat(amount),
    depositorAddress: investorAddress,
    contractTxHash,
  });
  
  // ... return result ...
}
```

## Environment Configuration

Add the following environment variables to your `.env` file:

```bash
# Hedera Configuration
HEDERA_ACCOUNT_ID="0.0.xxxxx"
HEDERA_PRIVATE_KEY="302e020100300506032b657004220420xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"

# Hedera Consensus Service (HCS) Configuration
HEDERA_TOPIC_ID="0.0.xxxxx"
```

### Getting Hedera Credentials

1. **Create Hedera Account**: 
   - Go to [Hedera Portal](https://portal.hedera.com) or use HashPack wallet
   - Create a testnet account
   - Note your Account ID and Private Key

2. **Create HCS Topic**:
   ```bash
   # Using Hedera CLI or SDK
   hedera topic create --network testnet
   # Or create via Hedera SDK in your application
   ```

## Event Types

### 1. Investor Events

#### InvestorDeposit
```typescript
{
  eventType: "InvestorDeposit",
  payload: {
    poolAddress: string,
    grainType: string,
    amount: number,
    depositorAddress: string,
    contractTxHash: string
  },
  timestamp: string,
  transactionId: string
}
```

#### InvestorWithdraw
```typescript
{
  eventType: "InvestorWithdraw",
  payload: {
    poolAddress: string,
    grainType: string,
    shares: number,
    depositorAddress: string,
    contractTxHash: string,
    withdrawalAmount: number
  },
  timestamp: string,
  transactionId: string
}
```

### 2. Farmer/Loan Events

#### LoanCreated
```typescript
{
  eventType: "LoanCreated",
  payload: {
    poolAddress: string,
    grainType: string,
    farmerAddress: string,
    loanAmount: number,
    collateralAmount: number,
    contractTxHash: string
  },
  timestamp: string,
  transactionId: string
}
```

#### LoanRepaid
```typescript
{
  eventType: "LoanRepaid",
  payload: {
    poolAddress: string,
    grainType: string,
    farmerAddress: string,
    repaymentAmount: number,
    contractTxHash: string
  },
  timestamp: string,
  transactionId: string
}
```

#### CollateralDeposited
```typescript
{
  eventType: "CollateralDeposited",
  payload: {
    poolAddress: string,
    grainType: string,
    farmerAddress: string,
    collateralAmount: number,
    contractTxHash: string
  },
  timestamp: string,
  transactionId: string
}
```

## Usage Examples

### 1. Manual Event Publishing

```typescript
import { HcsService } from './hcs/hcs.service';

const hcsService = new HcsService();

// Publish custom event
await hcsService.publishEvent('CustomEvent', {
  data: 'your custom data',
  userId: 'user123'
});
```

### 2. Event Listening

```typescript
import { HcsService } from './hcs/hcs.service';

const hcsService = new HcsService();

// Register event callback
hcsService.onEvent((event) => {
  console.log('Received event:', event.eventType);
  console.log('Payload:', event.payload);
  
  // Process event based on type
  switch (event.eventType) {
    case 'InvestorDeposit':
      // Handle investor deposit
      break;
    case 'LoanCreated':
      // Handle loan creation
      break;
    // ... other event types
  }
});
```

### 3. Testing HCS Integration

Run the demo script:

```bash
cd backend
npx ts-node src/hcs/hcs-demo.ts
```

This will:
1. Connect to your HCS topic
2. Publish test events
3. Listen for and display received events
4. Keep running until you press Ctrl+C

## Module Setup

The HCS integration is modular and added to your NestJS application via the `HcsModule`:

```typescript
// app.module.ts
import { HcsModule } from './hcs/hcs.module';

@Module({
  imports: [
    // ... other modules
    HcsModule,
  ],
})
export class AppModule {}
```

Services that need HCS functionality should import the `HcsModule`:

```typescript
// example.module.ts
@Module({
  imports: [HcsModule],
  providers: [ExampleService],
})
export class ExampleModule {}
```

## Benefits

### 1. **Real-time Event Streaming**
- All platform activities are streamed in real-time
- Multiple services can subscribe to the same events
- Perfect for analytics, notifications, and monitoring

### 2. **Immutable Audit Trail**
- All events are stored on Hedera's consensus layer
- Tamper-proof record of all platform activities
- Compliance and regulatory reporting made easy

### 3. **Decentralized Architecture**
- No single point of failure for event streaming
- Events are distributed across Hedera's network
- High availability and reliability

### 4. **Cross-Platform Integration**
- Events can be consumed by external systems
- Easy integration with analytics platforms
- Support for mobile apps, dashboards, etc.

## Error Handling

The HCS integration includes robust error handling:

```typescript
// Example from HederaService
try {
  await this.hcsService.publishInvestorDeposit({...});
} catch (hcsError) {
  this.logger.warn('Failed to publish HCS event for investor deposit:', hcsError);
  // Operation continues even if HCS publishing fails
}
```

**Important**: HCS events are published asynchronously and failures don't affect the main business logic. This ensures system reliability even if Hedera network issues occur.

## Monitoring and Debugging

### 1. **Logs**
All HCS operations are logged with appropriate levels:
- `INFO`: Successful event publishing and receiving
- `WARN`: Non-critical HCS errors
- `ERROR`: Critical HCS initialization failures

### 2. **Event Verification**
You can verify events are being published correctly by:
1. Running the HCS demo script
2. Checking Hedera Explorer for topic messages
3. Monitoring application logs for HCS activity

## Production Considerations

1. **Network Configuration**: Switch from testnet to mainnet in production
2. **Topic Management**: Use appropriate topic IDs for different environments
3. **Rate Limiting**: Monitor HCS transaction costs and implement rate limiting if needed
4. **Error Alerting**: Set up monitoring for HCS connection failures
5. **Backup Strategy**: Consider fallback mechanisms for critical events

## Troubleshooting

### Common Issues

1. **"Topic ID not found"**
   - Verify `HEDERA_TOPIC_ID` is set correctly
   - Ensure the topic exists on the specified network

2. **"Authentication failed"**
   - Check `HEDERA_ACCOUNT_ID` and `HEDERA_PRIVATE_KEY`
   - Verify account has sufficient HBAR balance

3. **"No events received"**
   - Check network connectivity to Hedera
   - Verify topic has messages (check via Hedera Explorer)
   - Ensure subscription started before messages were sent

### Debug Mode
Set `NODE_ENV=development` for verbose HCS logging:

```bash
NODE_ENV=development npm start
```

## Future Enhancements

Potential improvements for the HCS integration:
- **Event Filtering**: Subscribe to specific event types only
- **Batch Publishing**: Group multiple events for efficiency
- **Event Replay**: Replay events from specific timestamps
- **Schema Validation**: Validate event payloads against schemas
- **Metrics Dashboard**: Real-time HCS activity visualization
