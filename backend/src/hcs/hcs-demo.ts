import { HcsService } from './hcs.service';

/**
 * Demo script to test HCS functionality
 * This script shows how to publish and listen to HCS events
 */
async function demoHcsIntegration() {
  
  try {
    // Initialize HCS Service
    const hcsService = new HcsService();
    
    // Wait a bit for initialization
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    
    // Set up event listener
    hcsService.onEvent((event) => {
    });
    
    // Demo: Publish some test events
    
    // Test investor deposit event
    await hcsService.publishInvestorDeposit({
      poolAddress: '0x1234567890abcdef',
      grainType: 'Rice',
      amount: 1000,
      depositorAddress: '0xdepositor123',
      contractTxHash: '0xcontract123'
    });
    
    // Test loan creation event
    await hcsService.publishLoanCreated({
      poolAddress: '0x1234567890abcdef',
      grainType: 'Rice',
      farmerAddress: '0xfarmer456',
      loanAmount: 500,
      collateralAmount: 750,
      contractTxHash: '0xloan123'
    });
    
    
    // Keep the script running to receive events
    process.on('SIGINT', async () => {
      await hcsService.close();
      process.exit(0);
    });
    
    // Keep alive
    setInterval(() => {
    }, 30000);
    
  } catch (error) {
    process.exit(1);
  }
}

// Set required environment variables for demo
process.env.HEDERA_ACCOUNT_ID = process.env.HEDERA_ACCOUNT_ID || 'your-account-id';
process.env.HEDERA_PRIVATE_KEY = process.env.HEDERA_PRIVATE_KEY || 'your-private-key';
process.env.HEDERA_TOPIC_ID = process.env.HEDERA_TOPIC_ID || 'your-topic-id';

// Run the demo if this file is executed directly
if (require.main === module) {
  demoHcsIntegration().catch(console.error);
}
