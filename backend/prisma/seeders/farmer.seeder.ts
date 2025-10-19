import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function seedFarmers() {
  console.log('🌾 Seeding farmers with login credentials...');

  const farmers = [
    {
      email: 'farmer1@example.com',
      password: 'password123',
      memberNumber: 'FARM001',
      phoneNumber: '+1234567890',
      nationalId: 'ID123456789',
      walletAddress: '0x1234567890123456789012345678901234567890',
    },
    {
      email: 'farmer2@example.com',
      password: 'password123',
      memberNumber: 'FARM002',
      phoneNumber: '+1234567891',
      nationalId: 'ID123456790',
      walletAddress: '0x1234567890123456789012345678901234567891',
    },
    {
      email: 'john.doe@farm.com',
      password: 'farmlife2024',
      memberNumber: 'FARM003',
      phoneNumber: '+1234567892',
      nationalId: 'ID123456791',
      walletAddress: '0x1234567890123456789012345678901234567892',
    },
    {
      email: 'maria.garcia@agriculture.com',
      password: 'crops2024',
      memberNumber: 'FARM004',
      phoneNumber: '+1234567893',
      nationalId: 'ID123456792',
      walletAddress: '0x1234567890123456789012345678901234567893',
    },
    {
      email: 'ahmed.hassan@farm.com',
      password: 'wheat123',
      memberNumber: 'FARM005',
      phoneNumber: '+1234567894',
      nationalId: 'ID123456793',
      walletAddress: '0x1234567890123456789012345678901234567894',
    },
  ];

  for (const farmerData of farmers) {
    try {
      // Check if farmer already exists
      const existingFarmer = await prisma.farmer.findUnique({
        where: { email: farmerData.email }
      });

      if (existingFarmer) {
        console.log(`⚠️  Farmer with email ${farmerData.email} already exists, skipping...`);
        continue;
      }

      // Hash the password
      const hashedPassword = await bcrypt.hash(farmerData.password, 10);

      // Create farmer with hashed password
      const farmer = await prisma.farmer.create({
        data: {
          ...farmerData,
          password: hashedPassword,
        },
      });

      console.log(`✅ Created farmer: ${farmer.email} (Member: ${farmer.memberNumber})`);
    } catch (error) {
      console.error(`❌ Error creating farmer ${farmerData.email}:`, error);
    }
  }

  console.log('🌾 Farmer seeding completed!');
}

// Run seeder if called directly
if (require.main === module) {
  seedFarmers()
    .catch((error) => {
      console.error('Error seeding farmers:', error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
