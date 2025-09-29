import { Controller, Get, Param, Query, Logger } from '@nestjs/common';
import { OptimizedPoolsService } from './optimized-pools.service';

@Controller('optimized-pools')
export class OptimizedPoolsController {
  private readonly logger = new Logger(OptimizedPoolsController.name);

  constructor(private readonly optimizedPoolsService: OptimizedPoolsService) {}

  /**
   * Get all pools with enhanced data from both RPC and Mirror Node
   * GET /optimized-pools
   */
  @Get()
  async getAllPools() {
    this.logger.log('GET /optimized-pools - Fetching all pools with enhanced data');
    return this.optimizedPoolsService.getAllPools();
  }

  /**
   * Get pool by asset type with comprehensive analytics
   * GET /optimized-pools/:assetType
   */
  @Get(':assetType')
  async getPoolByAssetType(@Param('assetType') assetType: string) {
    this.logger.log(`GET /optimized-pools/${assetType} - Fetching pool with analytics`);
    return this.optimizedPoolsService.getPoolByAssetType(assetType);
  }

  /**
   * Get pool statistics with historical context
   * GET /optimized-pools/:assetType/stats
   */
  @Get(':assetType/stats')
  async getPoolStats(@Param('assetType') assetType: string) {
    this.logger.log(`GET /optimized-pools/${assetType}/stats - Fetching pool stats`);
    return this.optimizedPoolsService.getPoolStats(assetType);
  }

  /**
   * Get pool analytics with historical data
   * GET /optimized-pools/:assetType/analytics?timeRange=month
   */
  @Get(':assetType/analytics')
  async getPoolAnalytics(
    @Param('assetType') assetType: string,
    @Query('timeRange') timeRange: 'day' | 'week' | 'month' = 'month'
  ) {
    this.logger.log(`GET /optimized-pools/${assetType}/analytics - timeRange: ${timeRange}`);
    
    const poolAddress = await this.optimizedPoolsService.getPoolAddress(assetType);
    return this.optimizedPoolsService.getPoolAnalytics(poolAddress, timeRange);
  }

  /**
   * Get pool transaction history from Mirror Node
   * GET /optimized-pools/:assetType/transactions?limit=100
   */
  @Get(':assetType/transactions')
  async getPoolTransactionHistory(
    @Param('assetType') assetType: string,
    @Query('limit') limit: string = '100'
  ) {
    this.logger.log(`GET /optimized-pools/${assetType}/transactions - limit: ${limit}`);
    
    const poolAddress = await this.optimizedPoolsService.getPoolAddress(assetType);
    return this.optimizedPoolsService.getPoolTransactionHistory(poolAddress, parseInt(limit));
  }

  /**
   * Get pool info by address with comprehensive data
   * GET /optimized-pools/address/:poolAddress
   */
  @Get('address/:poolAddress')
  async getPoolInfoByAddress(@Param('poolAddress') poolAddress: string) {
    this.logger.log(`GET /optimized-pools/address/${poolAddress} - Fetching pool info`);
    return this.optimizedPoolsService.getPoolInfoByAddress(poolAddress);
  }

  /**
   * Get user portfolio with historical context
   * GET /optimized-pools/user/:userAddress/portfolio
   */
  @Get('user/:userAddress/portfolio')
  async getUserPortfolio(@Param('userAddress') userAddress: string) {
    this.logger.log(`GET /optimized-pools/user/${userAddress}/portfolio - Fetching user portfolio`);
    return this.optimizedPoolsService.getUserPortfolio(userAddress);
  }

  /**
   * Get account transaction history from Mirror Node
   * GET /optimized-pools/user/:userAddress/transactions?limit=100
   */
  @Get('user/:userAddress/transactions')
  async getAccountTransactionHistory(
    @Param('userAddress') userAddress: string,
    @Query('limit') limit: string = '100'
  ) {
    this.logger.log(`GET /optimized-pools/user/${userAddress}/transactions - limit: ${limit}`);
    return this.optimizedPoolsService.getAccountTransactionHistory(userAddress, parseInt(limit));
  }

  /**
   * Get token transaction history from Mirror Node
   * GET /optimized-pools/token/:tokenId/transactions?limit=100
   */
  @Get('token/:tokenId/transactions')
  async getTokenTransactionHistory(
    @Param('tokenId') tokenId: string,
    @Query('limit') limit: string = '100'
  ) {
    this.logger.log(`GET /optimized-pools/token/${tokenId}/transactions - limit: ${limit}`);
    return this.optimizedPoolsService.getTokenTransactionHistory(tokenId, parseInt(limit));
  }

  /**
   * Health check for the optimized service
   * GET /optimized-pools/health
   */
  @Get('health')
  async healthCheck() {
    this.logger.log('GET /optimized-pools/health - Checking service health');
    return this.optimizedPoolsService.healthCheck();
  }
}
