import { PrismaClient } from '@prisma/client';
import {
  Client,
  AccountCreateTransaction,
  PrivateKey,
  Hbar,
} from '@hashgraph/sdk';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

// Encryption setup (same as farmer.service.ts)
const ENCRYPTION_KEY =
  process.env.ENCRYPTION_KEY ||
  'default-insecure-key-please-change-in-production';
const ENCRYPTION_ALGORITHM = 'aes-256-gcm';
const encryptionKey = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);

function encryptPrivateKey(privateKey: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, encryptionKey, iv);

  let encrypted = cipher.update(privateKey, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  // Return iv:authTag:encryptedData
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

async function createCustodialWallet(email: string) {
  try {
    // Initialize Hedera client
    const operatorId = process.env.HEDERA_OPERATOR_ID;
    const operatorKey = process.env.HEDERA_OPERATOR_KEY;
    const network = process.env.HEDERA_NETWORK || 'testnet';

    if (!operatorId || !operatorKey) {
      return {
        accountId: `0.0.${Math.floor(Math.random() * 10000000)}`,
        evmAddress: `0x${Math.random().toString(16).substring(2)}`,
        privateKey: 'PLACEHOLDER_KEY',
      };
    }

    const client = Client.forName(network);
    client.setOperator(operatorId, operatorKey);

    // Generate a new private key for the farmer's account
    const newAccountPrivateKey = PrivateKey.generateED25519();
    const newAccountPublicKey = newAccountPrivateKey.publicKey;

    // Create the account with auto-association enabled
    const newAccountTx = new AccountCreateTransaction()
      .setKey(newAccountPublicKey)
      .setInitialBalance(new Hbar(1)) // 1 HBAR to cover transaction fees
      .setMaxAutomaticTokenAssociations(100); // Auto-associate up to 100 tokens

    const txResponse = await newAccountTx.execute(client);
    const receipt = await txResponse.getReceipt(client);
    const newAccountId = receipt.accountId;

    if (!newAccountId) {
      throw new Error('Failed to get account ID from receipt');
    }

    // Convert to EVM address format
    const evmAddress = `0x${newAccountId.toSolidityAddress()}`;

    console.log(`✅ Created custodial wallet for ${email}: ${newAccountId.toString()}`);

    return {
      accountId: newAccountId.toString(),
      evmAddress,
      privateKey: newAccountPrivateKey.toString(), // Use DER format for consistency
    };
  } catch (error) {
    console.error(`❌ Failed to create wallet for ${email}:`, error);
    throw error;
  }
}

async function main() {
  console.log('🌾 Seeding realistic data...');

  // 1. Create Warehouse (custodial account)
  console.log('Creating warehouse...');
  const warehouse = await prisma.warehouse.upsert({
    where: { warehouseId: 'WH001' },
    update: {},
    create: {
      warehouseId: 'WH001',
      name: 'Green Valley Storage',
      email: 'operator@warehouse.com',
      password: '$2b$10$nLq5ixx5LMco2TKs5sbCM.BM0uW6Jk3UxGbf2EB4MP8oUCxxcKJ0K',
      walletAddress: '0.0.7097157', 
      hederaAccountId: '0.0.7097157',
      encryptedPrivateKey:
        'dc8b393bb5f23162d5844fe5ec67dbaa:e1dc8dfbf001446867167a37a8653937:89ead8c6ad5fcda464a79c49a69a806362610dab568a643aef869e8b30000338ccef11fa35ab60436b2fc32b34c7dcfff2b9eee0d1331a0dd60b46bc138205b1',
      isCustodial: true,
      address: '123 Farm Road, Agricultural City',
      city: 'Agricultural City',
      state: 'Farm State',
      country: 'Indonesia',
      phone: '+62 21 1234 5678',
      manager: 'John Smith',
      capacity: 1000,
      status: 'active',
    },
  });

  const warehouse1Id = warehouse.warehouseId;

  // 2. Create Farmers with Real Hedera Wallets
  console.log('🔧 Creating Hedera wallets for farmers...');

  const farmerData = [
    {
      memberNumber: 'FMR001',
      phoneNumber: '+254701234567',
      email: 'john.kamau@farm.ke',
      password: '$2b$10$BprF3xqmpb4bVRSzar0JJ.FQnrSdqnxiEEhWuLDyy75YMjEJOoZJi', // hashed "password123"
    },
    {
      memberNumber: 'FMR002',
      phoneNumber: '+254702345678',
      email: 'mary.wanjiku@farm.ke',
      password: '$2b$10$BprF3xqmpb4bVRSzar0JJ.FQnrSdqnxiEEhWuLDyy75YMjEJOoZJi',
    },
    {
      memberNumber: 'FMR003',
      phoneNumber: '+254703456789',
      email: 'peter.omondi@farm.ke',
      password: '$2b$10$BprF3xqmpb4bVRSzar0JJ.FQnrSdqnxiEEhWuLDyy75YMjEJOoZJi',
    },
  ];

  // Create wallets first
  const wallets = await Promise.all(
    farmerData.map(async (farmer) => {
      console.log(`  Creating wallet for ${farmer.email}...`);
      const wallet = await createCustodialWallet(farmer.email);
      
      // SECURITY: ALWAYS encrypt private key before storing in database!
      // The raw privateKey from createCustodialWallet is only in memory temporarily
      const encryptedPrivateKey = encryptPrivateKey(wallet.privateKey);
      
      // Clear the raw private key from memory (JavaScript doesn't guarantee this, but good practice)
      // Note: wallet.privateKey is still in the returned object, but we don't use it anymore
      
      return {
        ...farmer,
        accountId: wallet.accountId,
        evmAddress: wallet.evmAddress,
        // DO NOT include wallet.privateKey in the return - we only store encrypted
        encryptedPrivateKey, // ✅ ENCRYPTED - safe to store
      };
    })
  );
  
  // Now create farmers with real wallet data
  const farmers = await Promise.all(
    wallets.map((walletData) =>
      prisma.farmer.upsert({
        where: { memberNumber: walletData.memberNumber },
        update: {
          // Update existing farmers with real wallets if they exist
          hederaAccountId: walletData.accountId,
          walletAddress: walletData.evmAddress,
          encryptedPrivateKey: walletData.encryptedPrivateKey,
          isCustodial: true,
        },
        create: {
          memberNumber: walletData.memberNumber,
          phoneNumber: walletData.phoneNumber,
          walletAddress: walletData.evmAddress,
          hederaAccountId: walletData.accountId,
          encryptedPrivateKey: walletData.encryptedPrivateKey,
          email: walletData.email,
          password: walletData.password,
          isCustodial: true,
        },
      })
    )
  );

  console.log(`✅ Created ${farmers.length} farmers`);

  // 3. Create Delivery Requests
  console.log('Creating delivery requests...');
  const deliveries = await Promise.all([
    prisma.deliveryRequest.create({
      data: {
        farmerId: farmers[0].id,
        warehouseId: warehouse1Id,
        cropType: 'wheat',
        variety: 'Golden Premium',
        estimatedWeight: 2500,
        unit: 'kg',
        estimatedGrade: 'premium',
        moistureContent: 12.5,
        temperature: 25,
        scheduledDate: new Date('2025-10-25'),
        location: 'Kiambu Farm, Plot 45',
        notes: 'Freshly harvested yesterday',
        status: 'completed',
        photos: [],
      },
    }),
    prisma.deliveryRequest.create({
      data: {
        farmerId: farmers[0].id,
        warehouseId: warehouse1Id,
        cropType: 'rice',
        variety: 'Basmati Supreme',
        estimatedWeight: 1100,
        unit: 'kg',
        estimatedGrade: 'grade-a',
        moistureContent: 13.0,
        temperature: 24,
        scheduledDate: new Date('2025-10-20'),
        location: 'Mwea Irrigation, Block C',
        notes: 'Premium quality rice',
        status: 'completed',
        photos: [],
      },
    }),
    prisma.deliveryRequest.create({
      data: {
        farmerId: farmers[1].id,
        warehouseId: warehouse1Id,
        cropType: 'wheat',
        variety: 'Kenya Njoro',
        estimatedWeight: 1800,
        unit: 'kg',
        estimatedGrade: 'grade-a',
        moistureContent: 11.8,
        scheduledDate: new Date('2025-10-28'),
        location: 'Narok Farm, Section 12',
        status: 'pending',
        photos: [],
      },
    }),
  ]);

  console.log(`✅ Created ${deliveries.length} delivery requests`);

  // 4. Create Incoming Deliveries (received at warehouse)
  console.log('Creating incoming deliveries...');
  const incomingDeliveries = await Promise.all([
    prisma.incomingDelivery.create({
      data: {
        deliveryRequestId: deliveries[0].id,
        farmerName: farmers[0].memberNumber,
        farmerId: farmers[0].id,
        cropType: 'wheat',
        weight: 2501.5,
        unit: 'kg',
        grade: 'premium',
        arrivalDate: new Date('2025-10-25'),
        status: 'verified',
        priority: 'high',
        estimatedValue: 12507.5,
        storageLocation: 'Bay A-1',
        notes: 'High quality wheat, verified and tokenized',
      },
    }),
    prisma.incomingDelivery.create({
      data: {
        deliveryRequestId: deliveries[1].id,
        farmerName: farmers[0].memberNumber,
        farmerId: farmers[0].id,
        cropType: 'rice',
        weight: 1090.9,
        unit: 'kg',
        grade: 'grade-a',
        arrivalDate: new Date('2025-10-20'),
        status: 'verified',
        priority: 'medium',
        estimatedValue: 5454.5,
        storageLocation: 'Bay B-2',
        notes: 'Premium Basmati rice, verified and tokenized',
      },
    }),
    prisma.incomingDelivery.create({
      data: {
        deliveryRequestId: deliveries[2].id,
        farmerName: farmers[1].memberNumber,
        farmerId: farmers[1].id,
        cropType: 'wheat',
        weight: 1800,
        unit: 'kg',
        grade: 'grade-a',
        arrivalDate: new Date('2025-10-28'),
        status: 'pending',
        priority: 'high',
        estimatedValue: 9000,
        storageLocation: 'Bay C-1',
        notes: 'Awaiting quality inspection',
      },
    }),
  ]);

  console.log(`✅ Created ${incomingDeliveries.length} incoming deliveries`);

  // 5. Create Grain Deposits (verified deliveries)
  console.log('Creating grain deposits...');
  const deposits = await Promise.all([
    prisma.grainDeposit.create({
      data: {
        farmerId: farmers[0].id,
        grainType: 'wheat',
        weightKg: 2501.5,
        qualityGrade: 'premium',
        moisturePercent: 12.5,
        tokensMinted: 2501.5,
        hederaTxId: '0.0.123456@1234567890.123456789',
      },
    }),
    prisma.grainDeposit.create({
      data: {
        farmerId: farmers[0].id,
        grainType: 'rice',
        weightKg: 1090.9,
        qualityGrade: 'grade-a',
        moisturePercent: 13.0,
        tokensMinted: 1090.9,
        hederaTxId: '0.0.123456@1234567891.123456789',
      },
    }),
  ]);

  // Link grain deposits to incoming deliveries
  await prisma.incomingDelivery.update({
    where: { id: incomingDeliveries[0].id },
    data: { grainDepositId: deposits[0].id },
  });

  await prisma.incomingDelivery.update({
    where: { id: incomingDeliveries[1].id },
    data: { grainDepositId: deposits[1].id },
  });

  console.log(`✅ Created ${deposits.length} grain deposits`);

  console.log('\n🎉 Seeding complete!');
  console.log('\n📊 Summary:');
  console.log(`  - Warehouse: 1 (${warehouse.name})`);
  console.log(`  - Farmers: ${farmers.length}`);
  console.log(`  - Delivery Requests: ${deliveries.length}`);
  console.log(`  - Incoming Deliveries: ${incomingDeliveries.length}`);
  console.log(`  - Grain Deposits: ${deposits.length}`);
  console.log(`\n👤 Test Logins:`);
  console.log(`\n  Farmer 1 (FMR001) - john.kamau@farm.ke:`);
  console.log(`    - Email: john.kamau@farm.ke`);
  console.log(`    - Password: password123`);
  console.log(`    - Member Number: FMR001`);
  console.log(`    - Phone: +254701234567`);
  console.log(
    `    - Hedera Account: ${farmers[0].hederaAccountId || 'NOT SET'}`,
  );
  console.log(`    - Wallet Address: ${farmers[0].walletAddress || 'NOT SET'}`);
  console.log(`\n  Farmer 2 (FMR002) - mary.wanjiku@farm.ke:`);
  console.log(`    - Email: mary.wanjiku@farm.ke`);
  console.log(`    - Password: password123`);
  console.log(`    - Member Number: FMR002`);
  console.log(
    `    - Hedera Account: ${farmers[1].hederaAccountId || 'NOT SET'}`,
  );
  console.log(`\n  Farmer 3 (FMR003) - peter.omondi@farm.ke:`);
  console.log(`    - Email: peter.omondi@farm.ke`);
  console.log(`    - Password: password123`);
  console.log(`    - Member Number: FMR003`);
  console.log(
    `    - Hedera Account: ${farmers[2].hederaAccountId || 'NOT SET'}`,
  );
  console.log(`\n  Warehouse:`);
  console.log(`    - Email: operator@warehouse.com`);
  console.log(`    - Password: password`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  .finally(async () => {
    await prisma.$disconnect();
  });
