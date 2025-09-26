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
      const pools = await this.contractService.getAllPoolsFromFactory();
      
      this.logger.log(`Retrieved ${pools.length} pools from blockchain`);
      
      if (pools.length === 0) {
        this.logger.warn('No pools found from blockchain - this might indicate:');
        this.logger.warn('1. POOL_FACTORY_ADDRESS not set correctly');
        this.logger.warn('2. Smart contracts not deployed');
        this.logger.warn('3. RPC connection issues');
        this.logger.warn('4. Contract method getAllPools() not implemented');
      }
      
      return pools.map(pool => ({
        grainType: pool.grainType,
        poolAddress: pool.poolAddress,
        oracleAddress: pool.oracleAddress,
        lendingTokenAddress: pool.lendingTokenAddress,
        baseLtv: pool.baseLtv,
        riskPremium: pool.riskPremium,
        debtCeiling: pool.debtCeiling.toString(), // Convert BigInt to string
        protocolFee: pool.protocolFee,
        availableLiquidity: pool.availableLiquidity,
        totalBorrows: pool.totalBorrows,
        totalReserves: pool.totalReserves,
        utilizationRate: pool.utilizationRate,
        // Add calculated fields
        apr: this.calculateAPR(pool.riskPremium, pool.utilizationRate),
        isActive: true, // All blockchain pools are active
        createdAt: new Date(), // Not available from blockchain
        updatedAt: new Date(),
      }));
    } catch (error) {
      this.logger.error('Failed to fetch pools from blockchain:', error);
      throw new Error('Failed to fetch pools from blockchain');
    }
  }

  // Get pool by grain type from blockchain
  async getPoolByGrainType(grainType: string) {
    try {
      this.logger.log(`Fetching pool for grain type: ${grainType} from blockchain`);
      const poolStats = await this.contractService.getPoolStatsByGrainType(grainType);
      
      return {
        grainType: poolStats.grainType,
        poolAddress: poolStats.poolAddress,
        oracleAddress: poolStats.oracleAddress,
        lendingTokenAddress: poolStats.lendingTokenAddress,
        baseLtv: poolStats.baseLtv,
        riskPremium: poolStats.riskPremium,
        debtCeiling: poolStats.debtCeiling.toString(), // Convert BigInt to string
        protocolFee: poolStats.protocolFee,
        availableLiquidity: poolStats.availableLiquidity,
        totalBorrows: poolStats.totalBorrows,
        totalReserves: poolStats.totalReserves,
        utilizationRate: poolStats.utilizationRate,
        exchangeRate: poolStats.exchangeRate,
        apr: this.calculateAPR(poolStats.riskPremium, poolStats.utilizationRate),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } catch (error) {
      this.logger.error(`Failed to fetch pool for grain type ${grainType}:`, error);
      throw new NotFoundException(`Pool not found for grain type: ${grainType}`);
    }
  }

  // Get pool stats by grain type
  async getPoolStats(grainType: string) {
    try {
      this.logger.log(`Fetching pool stats for grain type: ${grainType} from blockchain`);
      const poolStats = await this.contractService.getPoolStatsByGrainType(grainType);
      
      return {
        grainType: poolStats.grainType,
        poolAddress: poolStats.poolAddress,
        oracleAddress: poolStats.oracleAddress,
        lendingTokenAddress: poolStats.lendingTokenAddress,
        baseLtv: poolStats.baseLtv,
        riskPremium: poolStats.riskPremium,
        debtCeiling: poolStats.debtCeiling.toString(), // Convert BigInt to string
        protocolFee: poolStats.protocolFee,
        availableLiquidity: poolStats.availableLiquidity,
        totalBorrows: poolStats.totalBorrows,
        totalReserves: poolStats.totalReserves,
        utilizationRate: poolStats.utilizationRate,
        exchangeRate: poolStats.exchangeRate,
        apr: this.calculateAPR(poolStats.riskPremium, poolStats.utilizationRate),
        isActive: true,
        // Additional calculated fields
        totalAssets: (parseFloat(poolStats.availableLiquidity) + parseFloat(poolStats.totalBorrows)).toString(),
        calculatedUtilization: this.calculateUtilizationRate(
          poolStats.availableLiquidity,
          poolStats.totalBorrows
        ),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } catch (error) {
      this.logger.error(`Failed to get pool stats for ${grainType}:`, error);
      throw new NotFoundException(`Pool stats not found for grain type: ${grainType}`);
    }
  }

  // Get pool address by grain type
  async getPoolAddress(grainType: string): Promise<string> {
    try {
      return await this.contractService.getPoolByGrainType(grainType);
    } catch (error) {
      this.logger.error(`Failed to get pool address for ${grainType}:`, error);
      throw new NotFoundException(`Pool address not found for grain type: ${grainType}`);
    }
  }

  // Get pool info by address
  async getPoolInfoByAddress(poolAddress: string) {
    try {
      this.logger.log(`Fetching pool info for address: ${poolAddress} from blockchain`);
      const poolInfo = await this.contractService.getPoolInfo(poolAddress);
      const poolBalance = await this.contractService.getPoolBalance(poolAddress);
      
      const utilizationRate = this.calculateUtilizationRate(
        poolBalance.availableLiquidity,
        poolBalance.totalBorrows
      );
      
      return {
        grainType: poolInfo.grainType,
        poolAddress,
        oracleAddress: poolInfo.oracle,
        lendingTokenAddress: poolInfo.lendingToken,
        collateralTokenAddress: poolInfo.collateralToken,
        baseLtv: poolInfo.baseLTV,
        riskPremium: poolInfo.riskPremium,
        debtCeiling: poolInfo.debtCeiling.toString(), // Convert BigInt to string
        protocolFee: poolInfo.protocolFee,
        availableLiquidity: poolBalance.availableLiquidity,
        totalBorrows: poolBalance.totalBorrows,
        totalReserves: poolInfo.totalReserves,
        utilizationRate,
        exchangeRate: poolInfo.exchangeRate,
        apr: this.calculateAPR(poolInfo.riskPremium, utilizationRate),
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

  // Calculate APR based on risk premium and utilization
  private calculateAPR(riskPremium: number, utilizationRate: number): number {
    // Base APR calculation: risk premium + utilization factor
    const baseAPR = riskPremium;
    const utilizationFactor = (utilizationRate / 100) * 2; // 2% max additional for high utilization
    return Math.round((baseAPR + utilizationFactor) * 100) / 100;
  }

  // Calculate utilization rate
  private calculateUtilizationRate(availableLiquidity: string, totalBorrows: string): number {
    const liquidity = parseFloat(availableLiquidity);
    const borrows = parseFloat(totalBorrows);
    const totalSupply = liquidity + borrows;
    
    return totalSupply > 0 ? Math.round((borrows / totalSupply) * 100) : 0;
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
