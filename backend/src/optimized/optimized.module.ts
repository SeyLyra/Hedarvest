import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { OptimizedPoolsController } from './optimized-pools.controller';
import { OptimizedPoolsService } from './optimized-pools.service';
import { OptimizedContractService } from '../lib/optimized-contract.service';
import { MirrorNodeService } from '../lib/mirror-node.service';
import { ContractService } from '../lib/contract.service';

@Module({
  imports: [HttpModule],
  controllers: [OptimizedPoolsController],
  providers: [
    OptimizedPoolsService,
    OptimizedContractService,
    MirrorNodeService,
    ContractService,
  ],
  exports: [
    OptimizedPoolsService,
    OptimizedContractService,
    MirrorNodeService,
  ],
})
export class OptimizedModule {}
