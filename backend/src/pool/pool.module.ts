import { Module } from '@nestjs/common';
import { PoolService } from './pool.service';
import { PoolController } from './pool.controller';
import { PrismaService } from '../lib/prisma';
import { TransactionModule } from '../transaction/transaction.module';
import { HederaService } from '../lib/hedera.service';
import { ContractService } from '../lib/contract.service';
import { HcsModule } from '../hcs/hcs.module';

@Module({
  imports: [TransactionModule, HcsModule],
  controllers: [PoolController],
  providers: [PoolService, PrismaService, HederaService, ContractService],
  exports: [PoolService],
})
export class PoolModule {}