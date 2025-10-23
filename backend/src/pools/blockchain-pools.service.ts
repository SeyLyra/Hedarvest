import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ContractService } from '../lib/contract.service';
import { HcsService } from '../hcs/hcs.service';

@Injectable()
export class BlockchainPoolsService {
  private readonly logger = new Logger(BlockchainPoolsService.name);
  private poolsCache: any[] = [];
  private lastCacheUpdate: number = 0;
  private readonly CACHE_DURATION = 30000; // 30 seconds

  constructor(
    private readonly contractService: ContractService,
    private readonly hcsService: HcsService,
  ) {}

  // Get all pools directly from blockchain with caching
  async getAllPools() {
    try {
      // Check cache first
      const now = Date.now();
      if (this.poolsCache.length > 0 && now - this.lastCacheUpdate < this.CACHE_DURATION) {
        this.logger.log('Returning cached pools data');
        return this.poolsCache;
      }

      this.logger.log('Fetching all pools from blockchain using getAllPoolsWithDetails()...');
      const poolsInfo = await this.contractService.getAllPoolsInfo();

      this.logger.log(`Retrieved ${poolsInfo.length} pools from blockchain`);

      if (poolsInfo.length === 0) {
        this.logger.warn('No pools found from blockchain - this might indicate:');
        this.logger.warn('1. POOL_FACTORY_ADDRESS not set correctly');
        this.logger.warn('2. Smart contracts not deployed');
        this.logger.warn('3. RPC connection issues');
        this.logger.warn('4. Contract method getAllPoolsWithDetails() not implemented');

        // Return cached data if available, even if stale
        if (this.poolsCache.length > 0) {
          this.logger.log('Returning stale cache as fallback');
          return this.poolsCache;
        }
        return [];
      }

      // Transform poolsInfo to detailed pool format with live data
      const detailedPools = await Promise.all(poolsInfo.map(async (poolInfo, index) => {
        try {
          // Fetch live pool data for each pool
          const livePoolData = await this.contractService.getPoolInfoFromAddress(poolInfo.poolAddress);
          
          return {
            id: index + 1,
            assetType: poolInfo.assetType,
            address: poolInfo.poolAddress,
            poolAddress: poolInfo.poolAddress,
            lendingToken: poolInfo.lendingToken,
            lendingTokenAddress: poolInfo.lendingToken,
            collateralToken: poolInfo.collateralToken,
            collateralTokenAddress: poolInfo.collateralToken,
            baseLtv: poolInfo.baseLTV,
            liquidationThreshold: poolInfo.liquidationThreshold,
            liquidationBonus: poolInfo.liquidationBonus,
            // Live data from contract
            availableLiquidity: livePoolData.availableLiquidity || "0",
            totalBorrows: livePoolData.totalBorrows || "0",
            totalReserves: livePoolData.totalReserves || "0",
            utilizationRate: livePoolData.utilizationRate || "0",
            currentAPR: livePoolData.currentAPR || "0",
            apr: livePoolData.currentAPR || "0",
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
        } catch (error) {
          this.logger.warn(`Failed to fetch live data for pool ${poolInfo.poolAddress}:`, error);
          // Return with basic info if live data fetch fails
          return {
            id: index + 1,
            assetType: poolInfo.assetType,
            address: poolInfo.poolAddress,
            poolAddress: poolInfo.poolAddress,
            lendingToken: poolInfo.lendingToken,
            lendingTokenAddress: poolInfo.lendingToken,
            collateralToken: poolInfo.collateralToken,
            collateralTokenAddress: poolInfo.collateralToken,
            baseLtv: poolInfo.baseLTV,
            liquidationThreshold: poolInfo.liquidationThreshold,
            liquidationBonus: poolInfo.liquidationBonus,
            // Fallback to 0 if live data unavailable
            availableLiquidity: "0",
            totalBorrows: "0",
            totalReserves: "0",
            utilizationRate: "0",
            currentAPR: "0",
            apr: "0",
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
        }
      }));

      // Update cache
      this.poolsCache = detailedPools;
      this.lastCacheUpdate = now;

      return detailedPools;
    } catch (error) {
      this.logger.error('Failed to fetch pools from blockchain:', error);

      // Return cached data if available, even if stale
      if (this.poolsCache.length > 0) {
        this.logger.log('Returning stale cache due to error');
        return this.poolsCache;
      }

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
