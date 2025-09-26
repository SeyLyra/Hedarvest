import { Module } from '@nestjs/common';
import { PoolsController } from './pools.controller';
import { BlockchainPoolsService } from './blockchain-pools.service';
import { ContractService } from '../lib/contract.service';
import { HcsModule } from '../hcs/hcs.module';

@Module({
  imports: [HcsModule],
  controllers: [PoolsController],
  providers: [BlockchainPoolsService, ContractService],
  exports: [BlockchainPoolsService],
})
export class PoolsModule {}
