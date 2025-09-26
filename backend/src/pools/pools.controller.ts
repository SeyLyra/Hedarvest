import { Controller, Get, Param } from '@nestjs/common';
import { BlockchainPoolsService } from './blockchain-pools.service';

@Controller('pools')
export class PoolsController {
  constructor(private readonly blockchainPoolsService: BlockchainPoolsService) {}

  @Get()
  async getAllPools() {
    return this.blockchainPoolsService.getAllPools();
  }

  @Get(':grainType')
  async getPoolByGrainType(@Param('grainType') grainType: string) {
    return this.blockchainPoolsService.getPoolByGrainType(grainType);
  }

  @Get(':grainType/stats')
  async getPoolStats(@Param('grainType') grainType: string) {
    return this.blockchainPoolsService.getPoolStats(grainType);
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
        factoryAddress: process.env.POOL_FACTORY_ADDRESS
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        factoryAddress: process.env.POOL_FACTORY_ADDRESS
      };
    }
  }
}
