import {
  Client,
  PrivateKey,
  AccountId,
  TokenCreateTransaction,
  TokenType,
  TokenSupplyType,
  Hbar
} from '@hashgraph/sdk';

/**
 * Script to create crop tokens (WHEAT, RICE, CORN) on Hedera testnet
 * These tokens will be used as collateral for farmers to borrow against
 */

const CROP_TOKENS = [
  {
    name: 'Hedarvest Wheat Token',
    symbol: 'WHEAT',
    decimals: 8,
    initialSupply: 0, // We'll mint as needed
  },
  {
    name: 'Hedarvest Rice Token',
    symbol: 'RICE',
    decimals: 8,
    initialSupply: 0,
  },
  {
    name: 'Hedarvest Corn Token',
    symbol: 'CORN',
    decimals: 8,
    initialSupply: 0,
  },
];

async function createCropTokens() {
  console.log('🌾 Creating Hedarvest Crop Tokens...\n');

  // Check environment variables
  if (!process.env.HEDERA_OPERATOR_ID || !process.env.HEDERA_OPERATOR_KEY) {
    console.error('❌ Missing Hedera credentials in environment variables');
    console.error('   Please ensure HEDERA_OPERATOR_ID and HEDERA_OPERATOR_KEY are set in .env');
    process.exit(1);
  }

  // Initialize Hedera client
  const operatorId = AccountId.fromString(process.env.HEDERA_OPERATOR_ID);
  const operatorKey = PrivateKey.fromString(process.env.HEDERA_OPERATOR_KEY);
  const network = process.env.HEDERA_NETWORK || 'testnet';

  const client = Client.forName(network);
  client.setOperator(operatorId, operatorKey);

  console.log(`✅ Connected to Hedera ${network}`);
  console.log(`📍 Operator Account: ${operatorId.toString()}\n`);

  const createdTokens: Array<{ name: string; symbol: string; tokenId: string }> = [];

  for (const token of CROP_TOKENS) {
    try {
      console.log(`\n🔨 Creating ${token.name} (${token.symbol})...`);

      // Create the token
      const tokenCreateTx = new TokenCreateTransaction()
        .setTokenName(token.name)
        .setTokenSymbol(token.symbol)
        .setDecimals(token.decimals)
        .setInitialSupply(token.initialSupply)
        .setTreasuryAccountId(operatorId)
        .setSupplyType(TokenSupplyType.Infinite) // Allow unlimited minting
        .setTokenType(TokenType.FungibleCommon)
        .setSupplyKey(operatorKey) // Required for minting
        .setAdminKey(operatorKey) // Required for token management
        .setMaxTransactionFee(new Hbar(20));

      // Execute transaction
      const tokenCreateResponse = await tokenCreateTx.execute(client);
      const tokenCreateReceipt = await tokenCreateResponse.getReceipt(client);
      const tokenId = tokenCreateReceipt.tokenId;

      if (!tokenId) {
        throw new Error('Failed to get token ID from receipt');
      }

      console.log(`✅ ${token.symbol} token created successfully!`);
      console.log(`   Token ID: ${tokenId.toString()}`);
      console.log(`   Transaction: ${tokenCreateResponse.transactionId.toString()}`);

      createdTokens.push({
        name: token.name,
        symbol: token.symbol,
        tokenId: tokenId.toString(),
      });

      // Wait a bit to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));

    } catch (error) {
      console.error(`❌ Failed to create ${token.symbol} token:`, error);
      throw error;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('🎉 All crop tokens created successfully!');
  console.log('='.repeat(60) + '\n');

  console.log('📝 Add these to your .env file:\n');
  createdTokens.forEach(token => {
    console.log(`${token.symbol}_TOKEN_ID=${token.tokenId}`);
  });

  console.log('\n📝 Add these to your frontend .env.local file:\n');
  createdTokens.forEach(token => {
    console.log(`NEXT_PUBLIC_${token.symbol}_TOKEN_ID=${token.tokenId}`);
  });

  console.log('\n💡 Token Details:');
  console.log('─'.repeat(60));
  createdTokens.forEach(token => {
    console.log(`\n${token.symbol}:`);
    console.log(`  Name: ${token.name}`);
    console.log(`  Token ID: ${token.tokenId}`);
    console.log(`  Decimals: 8`);
    console.log(`  Supply Type: Infinite (can mint as needed)`);
    console.log(`  View on HashScan: https://hashscan.io/testnet/token/${token.tokenId}`);
  });

  console.log('\n' + '='.repeat(60));
  console.log('✅ Setup Complete!');
  console.log('='.repeat(60) + '\n');

  client.close();
}

// Run the script
createCropTokens()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
