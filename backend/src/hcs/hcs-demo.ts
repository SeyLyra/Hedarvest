import { HcsService } from './hcs.service';

/**
 * Demo script to test HCS functionality
 * This script shows how to publish and listen to HCS events
 */
async function demoHcsIntegration() {
  console.log('🚀 Starting HCS Demo...');
  
  try {
    // Initialize HCS Service
    const hcsService = new HcsService();
    
    // Wait a bit for initialization
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log(`📡 Connected to HCS Topic: ${hcsService.getTopicId()}`);
    
    // Set up event listener
    hcsService.onEvent((event) => {
      console.log('📨 Received HCS Event:', {
        eventType: event.eventType,
        timestamp: event.timestamp,
        payload: event.payload
      });
    });
    
    // Demo: Publish some test events
    console.log('📤 Publishing test events...');
    
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
    
    console.log('✅ Test events published successfully!');
    console.log('🔄 Listening for events (press Ctrl+C to stop)...');
    
    // Keep the script running to receive events
    process.on('SIGINT', async () => {
      console.log('\n🛑 Shutting down HCS demo...');
      await hcsService.close();
      process.exit(0);
    });
    
    // Keep alive
    setInterval(() => {
      console.log('💓 HCS Demo is still running... (listening for events)');
    }, 30000);
    
  } catch (error) {
    console.error('❌ Error in HCS demo:', error);
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
