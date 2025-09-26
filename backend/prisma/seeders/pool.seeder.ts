import { PrismaClient } from '@prisma/client';

type PoolSeed = {
  grainType: string;
  poolAddress: string;
  oracleAddress: string;
  lendingTokenAddress: string;
  baseLtv: number;
  riskPremium: number;
  debtCeiling: bigint;
  protocolFee: number;
  apr: number;
  liquidity: number;
  totalBorrows: number;
  totalReserves: number;
  utilizationRate: number;
};

const pools: PoolSeed[] = [
  {
    grainType: 'Rice',
    poolAddress: process.env.SEED_RICE_POOL_ADDRESS || '0x84565EEAE3ddD89325bB5726C912b5478B8078Af',
    oracleAddress: process.env.SEED_RICE_ORACLE_ADDRESS || '0xOracleRice000000000000000000000000000001',
    lendingTokenAddress: process.env.SEED_RICE_LENDING_TOKEN || '0xLendingRice0000000000000000000000000001',
    baseLtv: 65,
    riskPremium: 2.5,
    debtCeiling: BigInt(process.env.SEED_RICE_DEBT_CEILING || '1000000'),
    protocolFee: 0.5,
    apr: 8.5,
    liquidity: 250000,
    totalBorrows: 100000,
    totalReserves: 20000,
    utilizationRate: 40,
  },
  {
    grainType: 'Corn',
    poolAddress: process.env.SEED_CORN_POOL_ADDRESS || '0xE7CAc2F391BA5f839D4145219BA50D5D5635aB56',
    oracleAddress: process.env.SEED_CORN_ORACLE_ADDRESS || '0xOracleCorn000000000000000000000000000001',
    lendingTokenAddress: process.env.SEED_CORN_LENDING_TOKEN || '0xLendingCorn0000000000000000000000000001',
    baseLtv: 60,
    riskPremium: 2.0,
    debtCeiling: BigInt(process.env.SEED_CORN_DEBT_CEILING || '800000'),
    protocolFee: 0.45,
    apr: 8.2,
    liquidity: 180000,
    totalBorrows: 75000,
    totalReserves: 15000,
    utilizationRate: 41,
  },
  {
    grainType: 'Wheat',
    poolAddress: process.env.SEED_WHEAT_POOL_ADDRESS || '0xcC54Dd59FCC4dF32bb1e5C2390aD8e2d35bD6aF8',
    oracleAddress: process.env.SEED_WHEAT_ORACLE_ADDRESS || '0xOracleWheat0000000000000000000000000001',
    lendingTokenAddress: process.env.SEED_WHEAT_LENDING_TOKEN || '0xLendingWheat000000000000000000000000001',
    baseLtv: 62,
    riskPremium: 2.3,
    debtCeiling: BigInt(process.env.SEED_WHEAT_DEBT_CEILING || '900000'),
    protocolFee: 0.48,
    apr: 8.7,
    liquidity: 220000,
    totalBorrows: 95000,
    totalReserves: 18000,
    utilizationRate: 43,
  },
  {
    grainType: 'Soybean',
    poolAddress: process.env.SEED_SOYBEAN_POOL_ADDRESS || '0x6cbB47e0cE71Ad3a7ef0d42B4B6b735583BF60c7',
    oracleAddress: process.env.SEED_SOYBEAN_ORACLE_ADDRESS || '0xOracleSoy000000000000000000000000000001',
    lendingTokenAddress: process.env.SEED_SOYBEAN_LENDING_TOKEN || '0xLendingSoy0000000000000000000000000001',
    baseLtv: 58,
    riskPremium: 2.1,
    debtCeiling: BigInt(process.env.SEED_SOYBEAN_DEBT_CEILING || '750000'),
    protocolFee: 0.42,
    apr: 8.0,
    liquidity: 190000,
    totalBorrows: 76000,
    totalReserves: 14000,
    utilizationRate: 40,
  },
];

export async function seedPools(prisma: PrismaClient) {
  for (const pool of pools) {
    try {
      await prisma.pool.upsert({
        where: { grainType: pool.grainType },
        update: {
          poolAddress: pool.poolAddress,
          oracleAddress: pool.oracleAddress,
          lendingTokenAddress: pool.lendingTokenAddress,
          baseLtv: pool.baseLtv,
          riskPremium: pool.riskPremium,
          debtCeiling: pool.debtCeiling,
          protocolFee: pool.protocolFee,
          apr: pool.apr,
          liquidity: pool.liquidity,
          totalBorrows: pool.totalBorrows,
          totalReserves: pool.totalReserves,
          utilizationRate: pool.utilizationRate,
          updatedAt: new Date(),
        },
        create: {
          grainType: pool.grainType,
          poolAddress: pool.poolAddress,
          oracleAddress: pool.oracleAddress,
          lendingTokenAddress: pool.lendingTokenAddress,
          baseLtv: pool.baseLtv,
          riskPremium: pool.riskPremium,
          debtCeiling: pool.debtCeiling,
          protocolFee: pool.protocolFee,
          apr: pool.apr,
          liquidity: pool.liquidity,
          totalBorrows: pool.totalBorrows,
          totalReserves: pool.totalReserves,
          utilizationRate: pool.utilizationRate,
        },
      });
      console.log(`Seeded pool: ${pool.grainType} (${pool.poolAddress})`);
    } catch (error) {
      console.error(`Failed to seed pool ${pool.grainType}:`, error);
    }
  }
}

type SeedOptions = {
  skipFactorySync?: boolean;
};

export async function runPoolSeed(prisma: PrismaClient, options: SeedOptions = {}) {
  console.log('Starting pool seeder...');

  // Optionally trigger factory sync
  if (!options.skipFactorySync) {
    console.log('Attempting to sync pools from factory before seeding...');
    try {
      // In a full implementation we might call PoolsService.syncFromFactory here
      // For this seeder we focus on static seeding
    } catch (error) {
      console.warn('Factory sync skipped or failed:', error);
    }
  }

  await seedPools(prisma);

  console.log('Pool seeding completed.');
}

if (require.main === module) {
  const prisma = new PrismaClient();
  runPoolSeed(prisma)
    .catch((error) => {
      console.error('Pool seeding failed:', error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
