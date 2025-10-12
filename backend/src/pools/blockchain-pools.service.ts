import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ContractService } from '../lib/contract.service';
import { HcsService } from '../hcs/hcs.service';

@Injectable()
export class BlockchainPoolsService {
  private readonly logger = new Logger(BlockchainPoolsService.name);

  constructor(
    private readonly contractService: ContractService,
    private readonly hcsService: HcsService,
  ) {}

  // Get all pools directly from blockchain
  async getAllPools() {
    try {
      this.logger.log('Fetching all pools from blockchain...');
      const poolAddresses = await this.contractService.getAllPools();
      
      this.logger.log(`Retrieved ${poolAddresses.length} pools from blockchain`);
      
      if (poolAddresses.length === 0) {
        this.logger.warn('No pools found from blockchain - this might indicate:');
        this.logger.warn('1. LENDING_FACTORY_ADDRESS not set correctly');
        this.logger.warn('2. Smart contracts not deployed');
        this.logger.warn('3. RPC connection issues');
        this.logger.warn('4. Contract method getAllPools() not implemented');
      }
      
      // Get detailed info for each pool
      const detailedPools: any[] = [];
      for (const poolAddress of poolAddresses) {
        try {
          const poolDetails = await this.contractService.getPoolInfoFromAddress(poolAddress);
          detailedPools.push({
            assetType: poolDetails.assetType,
            poolAddress: poolAddress,
            lendingTokenAddress: poolDetails.lendingToken,
            collateralTokenAddress: poolDetails.collateralToken,
            lpTokenAddress: poolDetails.lpToken,
            availableLiquidity: poolDetails.availableLiquidity,
            totalBorrows: poolDetails.totalBorrows,
            totalReserves: poolDetails.totalReserves,
            utilizationRate: poolDetails.utilizationRate,
            currentAPR: poolDetails.currentAPR,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        } catch (error) {
          this.logger.warn(`Failed to get details for pool ${poolAddress}:`, error);
        }
      }
      
      return detailedPools;
    } catch (error) {
      this.logger.error('Failed to fetch pools from blockchain:', error);
      throw new Error('Failed to fetch pools from blockchain');
    }
  }

  // Get pool by asset type from blockchain
  async getPoolByAssetType(assetType: string) {
    try {
      this.logger.log(`Fetching pool for asset type: ${assetType} from blockchain`);
      const poolStats = await this.contractService.getPoolStatsByAssetType(assetType);
      
      return {
        assetType: poolStats.assetType,
        poolAddress: poolStats.poolAddress,
        lendingTokenAddress: poolStats.lendingTokenAddress,
        baseLtv: poolStats.baseLtv,
        availableLiquidity: poolStats.availableLiquidity,
        totalBorrows: poolStats.totalBorrows,
        totalReserves: poolStats.totalReserves,
        utilizationRate: poolStats.utilizationRate,
        currentAPR: poolStats.currentAPR,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } catch (error) {
      this.logger.error(`Failed to fetch pool for asset type ${assetType}:`, error);
      throw new NotFoundException(`Pool not found for asset type: ${assetType}`);
    }
  }

  // Get pool stats by asset type
  async getPoolStats(assetType: string) {
    try {
      this.logger.log(`Fetching pool stats for asset type: ${assetType} from blockchain`);
      const poolStats = await this.contractService.getPoolStatsByAssetType(assetType);
      
      return {
        assetType: poolStats.assetType,
        poolAddress: poolStats.poolAddress,
        lendingTokenAddress: poolStats.lendingTokenAddress,
        baseLtv: poolStats.baseLtv,
        availableLiquidity: poolStats.availableLiquidity,
        totalBorrows: poolStats.totalBorrows,
        totalReserves: poolStats.totalReserves,
        utilizationRate: poolStats.utilizationRate,
        currentAPR: poolStats.currentAPR,
        isActive: true,
        // Additional calculated fields
        totalAssets: (parseFloat(poolStats.availableLiquidity) + parseFloat(poolStats.totalBorrows)).toString(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } catch (error) {
      this.logger.error(`Failed to get pool stats for ${assetType}:`, error);
      throw new NotFoundException(`Pool stats not found for asset type: ${assetType}`);
    }
  }

  // Get pool address by asset type
  async getPoolAddress(assetType: string): Promise<string> {
    try {
      return await this.contractService.getPoolByAssetType(assetType);
    } catch (error) {
      this.logger.error(`Failed to get pool address for ${assetType}:`, error);
      throw new NotFoundException(`Pool address not found for asset type: ${assetType}`);
    }
  }

  // Get pool info by address
  async getPoolInfoByAddress(poolAddress: string) {
    try {
      this.logger.log(`Fetching pool info for address: ${poolAddress} from blockchain`);
      const poolInfo = await this.contractService.getPoolInfoFromAddress(poolAddress);
      
      return {
        assetType: poolInfo.assetType,
        poolAddress,
        lendingTokenAddress: poolInfo.lendingToken,
        collateralTokenAddress: poolInfo.collateralToken,
        lpTokenAddress: poolInfo.lpToken,
        availableLiquidity: poolInfo.availableLiquidity,
        totalBorrows: poolInfo.totalBorrows,
        totalReserves: poolInfo.totalReserves,
        utilizationRate: poolInfo.utilizationRate,
        currentAPR: poolInfo.currentAPR,
        activePositions: poolInfo.activePositions,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } catch (error) {
      this.logger.error(`Failed to get pool info for address ${poolAddress}:`, error);
      throw new NotFoundException(`Pool info not found for address: ${poolAddress}`);
    }
  }

  // Publish HCS event for pool operations
  async publishPoolEvent(eventType: string, payload: any) {
    try {
      await this.hcsService.publishEvent(eventType, payload);
      this.logger.log(`Published HCS event: ${eventType}`);
    } catch (error) {
      this.logger.warn(`Failed to publish HCS event ${eventType}:`, error);
    }
  }

  // Health check method
  async healthCheck(): Promise<{ status: string; poolsCount: number; lastUpdated: Date }> {
    try {
      const pools = await this.getAllPools();
      return {
        status: 'healthy',
        poolsCount: pools.length,
        lastUpdated: new Date(),
      };
    } catch (error) {
      this.logger.error('Health check failed:', error);
      return {
        status: 'unhealthy',
        poolsCount: 0,
        lastUpdated: new Date(),
      };
    }
  }
}
