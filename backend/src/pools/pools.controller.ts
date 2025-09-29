import { Controller, Get, Param } from '@nestjs/common';
import { BlockchainPoolsService } from './blockchain-pools.service';

@Controller('pools')
export class PoolsController {
  constructor(private readonly blockchainPoolsService: BlockchainPoolsService) {}

  @Get()
  async getAllPools() {
    return this.blockchainPoolsService.getAllPools();
  }

  @Get(':assetType')
  async getPoolByAssetType(@Param('assetType') assetType: string) {
    return this.blockchainPoolsService.getPoolByAssetType(assetType);
  }

  @Get(':assetType/stats')
  async getPoolStats(@Param('assetType') assetType: string) {
    return this.blockchainPoolsService.getPoolStats(assetType);
  }

  @Get('health/check')
  async healthCheck() {
    return this.blockchainPoolsService.healthCheck();
  }

  @Get('debug/factory')
  async debugFactory() {
    try {
      const contractService = this.blockchainPoolsService['contractService'];
      const pools = await contractService.getAllPools();
      return {
        success: true,
        poolsCount: pools.length,
        pools: pools,
        factoryAddress: process.env.LENDING_FACTORY_ADDRESS
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        factoryAddress: process.env.LENDING_FACTORY_ADDRESS
      };
    }
  }
}
