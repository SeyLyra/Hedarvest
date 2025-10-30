import { Controller, Get, Param } from '@nestjs/common';
import { BlockchainPoolsService } from './blockchain-pools.service';

@Controller('pools')
export class PoolsController {
  constructor(
    private readonly blockchainPoolsService: BlockchainPoolsService,
  ) {}

  @Get()
  async getAllPools() {
    return this.blockchainPoolsService.getAllPools();
  }


  @Get(':assetType/stats')
  async getPoolStats(@Param('assetType') assetType: string) {
    return this.blockchainPoolsService.getPoolStats(assetType);
  }

  // removed unused endpoints (asset lookup, health, debug)
}
