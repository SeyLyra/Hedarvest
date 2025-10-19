import { PrismaClient } from '@prisma/client';
import { seedFarmers } from './farmer.seeder';
import { seedPools } from './pool.seeder';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');
  
  try {
    // Seed farmers with login credentials
    await seedFarmers();
    
    // Seed pools
    await seedPools(prisma);
    
    console.log('✅ Database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  }
}

main()
  .catch((error) => {
    console.error('Seeding failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
