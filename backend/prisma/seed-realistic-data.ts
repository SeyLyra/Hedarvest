import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
      password: '$2b$10$nLq5ixx5LMco2TKs5sbCM.BM0uW6Jk3UxGbf2EB4MP8oUCxxcKJ0K', // hashed "password"
      walletAddress: '0.0.7097157', // Warehouse Hedera account
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

  console.log(`✅ Created warehouse: ${warehouse.name} (${warehouse.warehouseId})`);

  const warehouse1Id = warehouse.warehouseId;

  // 2. Create Farmers
  console.log('Creating farmers...');
  const farmers = await Promise.all([
    prisma.farmer.upsert({
      where: { memberNumber: 'FMR001' },
      update: {},
      create: {
        memberNumber: 'FMR001',
        phoneNumber: '+254701234567',
        walletAddress: '0.0.7097158',
        hederaAccountId: '0.0.7097158',
        encryptedPrivateKey:
          '87007248d3e44e7d880b88ed1b0f1a5a:ac748d98876344348cab9237375b13e0:02fb783ddb8166c7bfc32b965ff73548a5c97a4f7980647c38bf873642449b00880844cf5e1e36e15b5c079e9b921e0c924eb88c31340d0d6d12f138cc17f407',
        email: 'john.kamau@farm.ke',
        password:
          '$2b$10$BprF3xqmpb4bVRSzar0JJ.FQnrSdqnxiEEhWuLDyy75YMjEJOoZJi', // hashed "password123"
        isCustodial: true, // Platform manages wallet with auto-association
      },
    }),
    prisma.farmer.upsert({
      where: { memberNumber: 'FMR002' },
      update: {},
      create: {
        memberNumber: 'FMR002',
        phoneNumber: '+254702345678',
        walletAddress: '0.0.7097159',
        hederaAccountId: '0.0.7097159',
        encryptedPrivateKey:
          'a3284e48bcd1461292b5588488c41704:f5723b27230a2cd392d6d4f4988454ed:a8e036f5e5b76a12bcb9d0a03d90b37b5e0e54bfa43c45f63f8f8858ca07da0fc6f471821250c61dedafcbc6dd5619c3b8397d123b90516390b0f28a71910574',
        email: 'mary.wanjiku@farm.ke',
        password:
          '$2b$10$BprF3xqmpb4bVRSzar0JJ.FQnrSdqnxiEEhWuLDyy75YMjEJOoZJi', // hashed "password123"
        isCustodial: true, // Platform manages wallet with auto-association
      },
    }),
    prisma.farmer.upsert({
      where: { memberNumber: 'FMR003' },
      update: {},
      create: {
        memberNumber: 'FMR003',
        phoneNumber: '+254703456789',
        walletAddress: '0.0.7097160',
        hederaAccountId: '0.0.7097160',
        encryptedPrivateKey:
          'f7b6bb465974b58a7fcdb50219e9ef6b:916eccf6a4b542a1a0b134554a3796b3:734e9d469d76dd8a3cc5ccc9f8fdd9b35f9a7159262bb6820f3911f971df36add4f04f91c1abe44e5b0565261ba4ae5e6ee28756c1ba6d717a8218d76b24032a',
        email: 'peter.omondi@farm.ke',
        password:
          '$2b$10$BprF3xqmpb4bVRSzar0JJ.FQnrSdqnxiEEhWuLDyy75YMjEJOoZJi', // hashed "password123"
        isCustodial: true, // Platform manages wallet with auto-association
      },
    }),
  ]);

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
  console.log(`\n  Farmer 1 (FMR001):`);
  console.log(`    - Email: john.kamau@farm.ke`);
  console.log(`    - Password: password123`);
  console.log(`    - Member Number: FMR001`);
  console.log(`    - Phone: +254701234567`);
  console.log(`    - Wallet: 0.0.7097158`);
  console.log(`\n  Farmer 2 (FMR002):`);
  console.log(`    - Email: mary.wanjiku@farm.ke`);
  console.log(`    - Password: password123`);
  console.log(`    - Member Number: FMR002`);
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
