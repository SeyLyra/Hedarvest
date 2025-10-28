import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../lib/prisma';
import { ContractService } from '../lib/contract.service';
import { HcsService } from '../hcs/hcs.service';
import { CreatePoolDto, UpdatePoolDto } from './dto';

@Injectable()
export class PoolsService {
  private readonly logger = new Logger(PoolsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly contractService: ContractService,
    private readonly hcsService: HcsService,
  ) {}

  async createPoolRecord(createPoolDto: CreatePoolDto) {
    try {
      const pool = await this.prisma.pool.create({
        data: {
          grainType: createPoolDto.grainType,
          poolAddress: createPoolDto.poolAddress,
          lendingToken: 'placeholder-lending-token',
          collateralToken: 'placeholder-collateral-token',
          lpToken: 'placeholder-lp-token',
          oracleAddress: createPoolDto.oracleAddress,
          lendingTokenAddress: createPoolDto.lendingTokenAddress,
          baseLtv: createPoolDto.baseLtv,
          protocolFee: createPoolDto.protocolFee,
        },
      });

      this.logger.log(`Created pool record for ${createPoolDto.grainType}: ${pool.id}`);

      // Publish HCS event for pool creation
      try {
        await this.hcsService.publishEvent('PoolCreated', {
          poolId: pool.id,
          grainType: pool.grainType,
          poolAddress: pool.poolAddress,
          oracleAddress: pool.oracleAddress,
          lendingTokenAddress: pool.lendingTokenAddress,
          baseLtv: pool.baseLtv.toString(),
          protocolFee: pool.protocolFee.toString(),
        });
      } catch (hcsError) {
        this.logger.warn('Failed to publish HCS event for pool creation:', hcsError);
      }

      return pool;
    } catch (error) {
      this.logger.error('Failed to create pool record:', error);
      throw new Error(`Failed to create pool: ${error.message}`);
    }
  }

  async getAllPools() {
    try {
      const pools = await this.prisma.pool.findMany({
        orderBy: { createdAt: 'desc' },
      });

      // Calculate derived fields
      // Note: Loan data is now in smart contracts, not database
      return pools.map((pool) => ({
        id: pool.id,
        grainType: pool.grainType,
        poolAddress: pool.poolAddress,
        oracleAddress: pool.oracleAddress,
        lendingTokenAddress: pool.lendingTokenAddress,
        baseLtv: pool.baseLtv.toString(),
        protocolFee: pool.protocolFee.toString(),
        apr: pool.apr.toString(),
        liquidity: pool.liquidity.toString(),
        totalBorrows: pool.totalBorrows.toString(),
        totalReserves: pool.totalReserves.toString(),
        utilizationRate: pool.utilizationRate.toString(),
        isActive: pool.isActive,
        createdAt: pool.createdAt,
        updatedAt: pool.updatedAt,
      }));
    } catch (error) {
      this.logger.error('Failed to fetch pools:', error);
      throw new Error('Failed to fetch pools');
    }
  }

  async getPoolByGrain(grainType: string) {
    try {
      const pool = await this.prisma.pool.findUnique({
        where: { grainType },
      });

      if (!pool) {
        throw new NotFoundException(
          `Pool not found for grain type: ${grainType}`
        );
      }

      // Note: Loan data is now in smart contracts
      return {
        id: pool.id,
        grainType: pool.grainType,
        poolAddress: pool.poolAddress,
        oracleAddress: pool.oracleAddress,
        lendingTokenAddress: pool.lendingTokenAddress,
        baseLtv: pool.baseLtv.toString(),
        protocolFee: pool.protocolFee.toString(),
        apr: pool.apr.toString(),
        liquidity: pool.liquidity.toString(),
        totalBorrows: pool.totalBorrows.toString(),
        totalReserves: pool.totalReserves.toString(),
        utilizationRate: pool.utilizationRate.toString(),
        isActive: pool.isActive,
        createdAt: pool.createdAt,
        updatedAt: pool.updatedAt,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Failed to fetch pool by grain type ${grainType}:`,
        error
      );
      throw new Error('Failed to fetch pool');
    }
  }

  async getPoolById(id: number) {
    try {
      const pool = await this.prisma.pool.findUnique({
        where: { id },
      });

      if (!pool) {
        throw new NotFoundException(`Pool not found with id: ${id}`);
      }

      // Note: Loan data is now in smart contracts
      return pool;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to fetch pool ${id}:`, error);
      throw new Error('Failed to fetch pool');
    }
  }

  async updatePool(id: number, updatePoolDto: UpdatePoolDto) {
    try {
      const updateData: any = { ...updatePoolDto };
      
      const pool = await this.prisma.pool.update({
        where: { id },
        data: updateData,
      });

      this.logger.log(`Updated pool ${id}`);

      // Publish HCS event for pool update
      try {
        await this.hcsService.publishEvent('PoolUpdated', {
          poolId: pool.id,
          grainType: pool.grainType,
          changes: updatePoolDto,
        });
      } catch (hcsError) {
        this.logger.warn('Failed to publish HCS event for pool update:', hcsError);
      }

      return pool;
    } catch (error) {
      this.logger.error(`Failed to update pool ${id}:`, error);
      throw new Error('Failed to update pool');
    }
  }

  async syncFromFactory() {
    this.logger.log('Starting sync from LendingFactory contract...');
    
    try {
      // Get all pools info from the factory contract
      const allPoolsInfo = await this.contractService.getAllPoolsInfo();
      this.logger.log(`Found ${allPoolsInfo.length} pools in factory contract`);

      const syncResults = {
        created: 0,
        updated: 0,
        errors: 0,
      };

      for (const factoryPool of allPoolsInfo) {
        try {
          // Get detailed pool stats from the contract
          const poolStats = await this.contractService.getPoolInfoFromAddress(factoryPool.poolAddress);
          
          // Check if pool already exists in database
          const existingPool = await this.prisma.pool.findUnique({
            where: { poolAddress: factoryPool.poolAddress },
          });

          if (existingPool) {
            // Update existing pool with latest contract data
            await this.prisma.pool.update({
              where: { id: existingPool.id },
              data: {
                lendingTokenAddress: factoryPool.lendingToken,
                baseLtv: factoryPool.baseLTV,
                liquidity: poolStats.availableLiquidity,
                totalBorrows: poolStats.totalBorrows,
                totalReserves: poolStats.totalReserves,
                utilizationRate: poolStats.utilizationRate,
                updatedAt: new Date(),
              },
            });
            syncResults.updated++;
            this.logger.log(`Updated pool: ${factoryPool.assetType}`);
          } else {
            // Create new pool record
            await this.createPoolRecord({
              grainType: factoryPool.assetType,
              poolAddress: factoryPool.poolAddress,
              oracleAddress: '',
              lendingTokenAddress: factoryPool.lendingToken,
              baseLtv: factoryPool.baseLTV,
              protocolFee: 0,
            });
            syncResults.created++;
            this.logger.log(`Created pool: ${factoryPool.assetType}`);
          }
        } catch (poolError) {
          syncResults.errors++;
          this.logger.error(`Failed to sync pool ${factoryPool.assetType}:`, poolError);
        }
      }

      // Publish HCS event for sync completion
      try {
        await this.hcsService.publishEvent('PoolSyncCompleted', {
          totalPools: allPoolsInfo.length,
          created: syncResults.created,
          updated: syncResults.updated,
          errors: syncResults.errors,
          timestamp: new Date().toISOString(),
        });
      } catch (hcsError) {
        this.logger.warn('Failed to publish HCS event for sync completion:', hcsError);
      }

      this.logger.log(`Factory sync completed: ${syncResults.created} created, ${syncResults.updated} updated, ${syncResults.errors} errors`);
      return syncResults;

    } catch (error) {
      this.logger.error('Failed to sync from factory:', error);
      throw new Error(`Factory sync failed: ${error.message}`);
    }
  }

  async getPoolStats(grainType: string) {
    try {
      const pool = await this.getPoolByGrain(grainType);
      
      // Get additional stats from contract if available
      let contractStats: any = null;
      try {
        contractStats = await this.contractService.getPoolInfo(pool.poolAddress);
      } catch (contractError) {
        this.logger.warn(`Failed to get contract stats for ${grainType}:`, contractError);
      }

      return {
        ...pool,
        contractStats,
        calculatedUtilization: this.calculateUtilizationRate(
          pool.liquidity,
          pool.totalBorrows
        ),
      };
    } catch (error) {
      this.logger.error(`Failed to get pool stats for ${grainType}:`, error);
      throw error;
    }
  }

  private calculateUtilizationRate(liquidity: string, totalBorrows: string): number {
    const liquidityNum = parseFloat(liquidity);
    const borrowsNum = parseFloat(totalBorrows);
    const totalSupply = liquidityNum + borrowsNum;
    
    return totalSupply > 0 ? (borrowsNum / totalSupply) * 100 : 0;
  }

  async handlePoolCreatedEvent(eventData: any) {
    this.logger.log('Handling PoolCreated HCS event:', eventData);
    
    try {
      // Check if pool already exists
      const existingPool = await this.prisma.pool.findUnique({
        where: { poolAddress: eventData.poolAddress },
      });

      if (!existingPool) {
        await this.createPoolRecord({
          grainType: eventData.grainType,
          poolAddress: eventData.poolAddress,
          oracleAddress: eventData.oracleAddress,
          lendingTokenAddress: eventData.lendingTokenAddress,
          baseLtv: parseFloat(eventData.baseLtv),
          protocolFee: parseFloat(eventData.protocolFee),
        });
        this.logger.log(`Created pool from HCS event: ${eventData.grainType}`);
      } else {
        this.logger.log(`Pool already exists for HCS event: ${eventData.grainType}`);
      }
    } catch (error) {
      this.logger.error('Failed to handle PoolCreated HCS event:', error);
    }
  }
}
