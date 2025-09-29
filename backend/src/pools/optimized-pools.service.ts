import { Injectable, Logger } from '@nestjs/common';
import { OptimizedContractService } from '../lib/optimized-contract.service';

@Injectable()
export class OptimizedPoolsService {
  private readonly logger = new Logger(OptimizedPoolsService.name);

  constructor(
    private readonly optimizedContractService: OptimizedContractService
  ) {}

  /**
   * Get all pools with enhanced data from both RPC and Mirror Node
   */
  async getAllPools() {
    try {
      this.logger.log('Fetching all pools with optimized data sources');
      
      const pools = await this.optimizedContractService.getAllPools();
      
      this.logger.log(`Retrieved ${pools.length} pools with enhanced data`);
      return pools;
    } catch (error) {
      this.logger.error('Failed to get all pools:', error.message);
      throw error;
    }
  }

  /**
   * Get pool by asset type with comprehensive analytics
   */
  async getPoolByAssetType(assetType: string) {
    try {
      this.logger.log(`Fetching pool for asset type: ${assetType}`);
      
      const poolAddress = await this.optimizedContractService.getPoolByAssetType(assetType);
      const poolStats = await this.optimizedContractService.getPoolStatsByAssetType(assetType);
      const analytics = await this.optimizedContractService.getPoolAnalytics(poolAddress, 'month');
      
      return {
        ...poolStats,
        analytics,
        poolAddress
      };
    } catch (error) {
      this.logger.error(`Failed to get pool for asset type ${assetType}:`, error.message);
      throw error;
    }
  }

  /**
   * Get pool statistics with historical context
   */
  async getPoolStats(assetType: string) {
    try {
      this.logger.log(`Fetching pool stats for asset type: ${assetType}`);
      
      const poolAddress = await this.optimizedContractService.getPoolByAssetType(assetType);
      const stats = await this.optimizedContractService.getPoolStatsByAssetType(assetType);
      
      return {
        ...stats,
        poolAddress,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error(`Failed to get pool stats for ${assetType}:`, error.message);
      throw error;
    }
  }

  /**
   * Get pool address by asset type
   */
  async getPoolAddress(assetType: string): Promise<string> {
    return this.optimizedContractService.getPoolByAssetType(assetType);
  }

  /**
   * Get pool info by address with comprehensive data
   */
  async getPoolInfoByAddress(poolAddress: string) {
    try {
      this.logger.log(`Fetching pool info for address: ${poolAddress}`);
      
      const poolInfo = await this.optimizedContractService.getPoolInfo(poolAddress);
      const analytics = await this.optimizedContractService.getPoolAnalytics(poolAddress, 'month');
      
      return {
        ...poolInfo,
        analytics,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error(`Failed to get pool info for address ${poolAddress}:`, error.message);
      throw error;
    }
  }

  /**
   * Get pool transaction history from Mirror Node
   */
  async getPoolTransactionHistory(poolAddress: string, limit: number = 100) {
    try {
      this.logger.log(`Fetching transaction history for pool: ${poolAddress}`);
      
      const transactions = await this.optimizedContractService.getPoolTransactionHistory(
        poolAddress, 
        limit
      );
      
      return {
        transactions,
        count: transactions.length,
        poolAddress,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error(`Failed to get transaction history for pool ${poolAddress}:`, error.message);
      throw error;
    }
  }

  /**
   * Get comprehensive pool analytics
   */
  async getPoolAnalytics(poolAddress: string, timeRange: 'day' | 'week' | 'month' = 'month') {
    try {
      this.logger.log(`Fetching analytics for pool: ${poolAddress}, timeRange: ${timeRange}`);
      
      const analytics = await this.optimizedContractService.getPoolAnalytics(poolAddress, timeRange);
      
      return analytics;
    } catch (error) {
      this.logger.error(`Failed to get analytics for pool ${poolAddress}:`, error.message);
      throw error;
    }
  }

  /**
   * Get user portfolio with historical context
   */
  async getUserPortfolio(userAddress: string) {
    try {
      this.logger.log(`Fetching portfolio for user: ${userAddress}`);
      
      const portfolio = await this.optimizedContractService.getUserPortfolio(userAddress);
      
      return portfolio;
    } catch (error) {
      this.logger.error(`Failed to get portfolio for user ${userAddress}:`, error.message);
      throw error;
    }
  }

  /**
   * Get transaction history for a specific account
   */
  async getAccountTransactionHistory(accountId: string, limit: number = 100) {
    try {
      this.logger.log(`Fetching transaction history for account: ${accountId}`);
      
      const transactions = await this.optimizedContractService.getTransactionHistory(
        accountId, 
        limit
      );
      
      return {
        transactions,
        count: transactions.length,
        accountId,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error(`Failed to get transaction history for account ${accountId}:`, error.message);
      throw error;
    }
  }

  /**
   * Get token transaction history
   */
  async getTokenTransactionHistory(tokenId: string, limit: number = 100) {
    try {
      this.logger.log(`Fetching transaction history for token: ${tokenId}`);
      
      const transactions = await this.optimizedContractService.getTokenTransactionHistory(
        tokenId, 
        limit
      );
      
      return {
        transactions,
        count: transactions.length,
        tokenId,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error(`Failed to get transaction history for token ${tokenId}:`, error.message);
      throw error;
    }
  }

  /**
   * Health check for the optimized service
   */
  async healthCheck() {
    try {
      const health = await this.optimizedContractService.healthCheck();
      
      return {
        status: 'healthy',
        services: health,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error('Health check failed:', error.message);
      
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}
