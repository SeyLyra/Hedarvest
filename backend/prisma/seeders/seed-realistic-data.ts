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
  let client: Client | null = null;
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

    client = Client.forName(network);
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

    console.log(
      `✅ Created custodial wallet for ${email}: ${newAccountId.toString()}`,
    );

    return {
      accountId: newAccountId.toString(),
      evmAddress,
      // eslint-disable-next-line @typescript-eslint/no-base-to-string
      privateKey: newAccountPrivateKey.toString(), // Use DER format for consistency
    };
  } catch (error) {
    console.error(`❌ Failed to create wallet for ${email}:`, error);
    throw error;
  } finally {
    // Close Hedera client connection to prevent hanging
    if (client) {
      try {
        await client.close();
      } catch (closeError) {
        // Ignore close errors
      }
    }
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
  const warehousePkId = warehouse.id;

  // 2. Create Farmers with Real Hedera Wallets
  console.log('🔧 Creating Hedera wallets for farmers...');

  // Hardcoded farmer credentials (stored as-is, no encryption when inserting)
  // NOTE: Replace these with your actual hardcoded values
  const HARDCODED_FARMER_ADDRESS = process.env.HARDCODED_FARMER_ADDRESS || ''; // e.g., "0.0.1234567"
  const HARDCODED_FARMER_PRIVATE_KEY = process.env.HARDCODED_FARMER_PRIVATE_KEY || ''; // Plain text private key
  
  const farmerData = [
    {
      memberNumber: 'FMR001',
      phoneNumber: '+254701234567',
      email: 'john.kamau@farm.ke',
      password: '$2b$10$BprF3xqmpb4bVRSzar0JJ.FQnrSdqnxiEEhWuLDyy75YMjEJOoZJi', // hashed "password123"
      // Hardcoded values - store private key as-is (no encryption)
      useHardcoded: true,
      hardcodedAccountId: HARDCODED_FARMER_ADDRESS,
      hardcodedPrivateKey: HARDCODED_FARMER_PRIVATE_KEY,
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

  // Create wallets - first farmer uses hardcoded, others create new wallets
  const wallets = await Promise.all(
    farmerData.map(async (farmer, index) => {
      if (farmer.useHardcoded && farmer.hardcodedAccountId && farmer.hardcodedPrivateKey) {
        console.log(`  Using hardcoded wallet for ${farmer.email}...`);
        // For hardcoded: convert account ID to EVM address and store private key as-is (no encryption)
        let evmAddress: string;
        try {
          const { AccountId } = await import('@hashgraph/sdk');
          const accountId = AccountId.fromString(farmer.hardcodedAccountId);
          evmAddress = `0x${accountId.toSolidityAddress()}`;
        } catch {
          // If it's already an EVM address, use it as-is
          evmAddress = farmer.hardcodedAccountId.startsWith('0x') 
            ? farmer.hardcodedAccountId 
            : `0x${farmer.hardcodedAccountId}`;
        }

        return {
          ...farmer,
          accountId: farmer.hardcodedAccountId.startsWith('0.0.') 
            ? farmer.hardcodedAccountId 
            : `0.0.${farmer.hardcodedAccountId.replace(/^0x/, '')}`,
          evmAddress,
          encryptedPrivateKey: farmer.hardcodedPrivateKey, // Store as-is, no encryption
        };
      } else {
        console.log(`  Creating wallet for ${farmer.email}...`);
        const wallet = await createCustodialWallet(farmer.email);
        const encryptedPrivateKey = encryptPrivateKey(wallet.privateKey);

        return {
          ...farmer,
          accountId: wallet.accountId,
          evmAddress: wallet.evmAddress,
          encryptedPrivateKey, // Encrypted for dynamically created wallets
        };
      }
    }),
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
      }),
    ),
  );

  console.log(`✅ Created ${farmers.length} farmers`);

  // 3. Create Deliveries
  console.log('Creating deliveries...');
  const deliveries = await Promise.all([
    prisma.delivery.create({
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
    prisma.delivery.create({
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
    prisma.delivery.create({
      data: {
        farmerId: farmers[1].id,
        warehouseId: warehouse1Id,
        cropType: 'wheat',
        variety: 'Kenya Njoro',
        estimatedWeight: 1800,
        unit: 'kg',
        estimatedGrade: 'grade-a',
        scheduledDate: new Date('2025-10-28'),
        location: 'Narok Farm, Section 12',
        status: 'pending',
        photos: [],
      },
    }),
  ]);

  console.log(`✅ Created ${deliveries.length} deliveries`);

  // 4. Update Deliveries with actual arrival data
  console.log('Updating deliveries with arrival data...');
  const updatedDeliveries = await Promise.all([
    prisma.delivery.update({
      where: { id: deliveries[0].id },
      data: {
        arrivalDate: new Date('2025-10-25'),
        actualWeight: 2501.5,
        actualGrade: 'premium',
        status: 'verified',
        priority: 'high',
        estimatedValue: 12507.5,
        storageLocation: 'Bay A-1',
        notes: 'High quality wheat, verified and tokenized',
      },
    }),
    prisma.delivery.update({
      where: { id: deliveries[1].id },
      data: {
        arrivalDate: new Date('2025-10-20'),
        actualWeight: 1090.9,
        actualGrade: 'grade-a',
        status: 'verified',
        priority: 'medium',
        estimatedValue: 5454.5,
        storageLocation: 'Bay B-2',
        notes: 'Premium Basmati rice, verified and tokenized',
      },
    }),
    prisma.delivery.update({
      where: { id: deliveries[2].id },
      data: {
        arrivalDate: new Date('2025-10-28'),
        actualWeight: 1800,
        actualGrade: 'grade-a',
        status: 'pending',
        priority: 'high',
        estimatedValue: 9000,
        storageLocation: 'Bay C-1',
        notes: 'Awaiting quality inspection',
      },
    }),
  ]);
  void updatedDeliveries;

  // 5. Create Grain Deposits (verified deliveries)
  console.log('Creating grain deposits...');
  const deposits = await Promise.all([
    prisma.grainDeposit.create({
      data: {
        farmerId: farmers[0].id,
        warehouseId: warehousePkId,
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
        warehouseId: warehousePkId,
        grainType: 'rice',
        weightKg: 1090.9,
        qualityGrade: 'grade-a',
        moisturePercent: 13.0,
        tokensMinted: 1090.9,
        hederaTxId: '0.0.123456@1234567891.123456789',
      },
    }),
  ]);

  // Link grain deposits to deliveries
  await prisma.delivery.update({
    where: { id: deliveries[0].id },
    data: { grainDepositId: deposits[0].id },
  });

  await prisma.delivery.update({
    where: { id: deliveries[1].id },
    data: { grainDepositId: deposits[1].id },
  });

  console.log(`✅ Created ${deposits.length} grain deposits`);

  // 6. Extra activity for John Kamau (more realistic history)
  console.log('Adding extra deliveries and deposits for John Kamau...');
  const extraDeliveries = await Promise.all([
    prisma.delivery.create({
      data: {
        farmerId: farmers[0].id,
        warehouseId: warehouse1Id,
        cropType: 'rice',
        variety: 'Pishori',
        estimatedWeight: 1350.75,
        unit: 'kg',
        estimatedGrade: 'grade-a',
        moistureContent: 12.9,
        temperature: 24.5,
        scheduledDate: new Date('2025-10-18'),
        location: 'Mwea, Sector 7',
        notes: 'Second batch rice',
        status: 'completed',
        photos: [],
      },
    }),
    prisma.delivery.create({
      data: {
        farmerId: farmers[0].id,
        warehouseId: warehouse1Id,
        cropType: 'wheat',
        variety: 'Kenya Seed 1',
        estimatedWeight: 920.3,
        unit: 'kg',
        estimatedGrade: 'grade-b',
        moistureContent: 13.1,
        temperature: 26,
        scheduledDate: new Date('2025-10-29'),
        location: 'Narok East',
        notes: 'Awaiting harvest completion',
        status: 'pending',
        photos: [],
      },
    }),
  ]);

  await prisma.delivery.update({
    where: { id: extraDeliveries[0].id },
    data: {
      arrivalDate: new Date('2025-10-18'),
      actualWeight: 1349.8,
      actualGrade: 'grade-a',
      status: 'verified',
      priority: 'medium',
      estimatedValue: 6749,
      storageLocation: 'Bay B-3',
      notes: 'Verified and queued for tokenization',
    },
  });

  const extraDeposits = await Promise.all([
    prisma.grainDeposit.create({
      data: {
        farmerId: farmers[0].id,
        warehouseId: warehousePkId,
        grainType: 'rice',
        weightKg: 1349.8,
        qualityGrade: 'grade-a',
        moisturePercent: 12.9,
        tokensMinted: 1349.8,
        hederaTxId: '0.0.123456@1234567892.123456789',
      },
    }),
  ]);

  await prisma.delivery.update({
    where: { id: extraDeliveries[0].id },
    data: { grainDepositId: extraDeposits[0].id },
  });

  console.log('\n🎉 Seeding complete!');
  console.log('\n📊 Summary:');
  console.log(`  - Warehouse: 1 (${warehouse.name})`);
  console.log(`  - Farmers: ${farmers.length}`);
  console.log(`  - Deliveries: ${deliveries.length}`);
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

(async () => {
  try {
    await main();
    console.log('\n✅ Seed completed successfully');
  } catch (e) {
    console.error('❌ Seeding failed:', e);
    process.exitCode = 1;
  } finally {
    // Close Prisma connection
    await prisma.$disconnect();
    // Force exit after a short delay to ensure cleanup completes
    setTimeout(() => {
      process.exit(process.exitCode || 0);
    }, 500);
  }
})();
