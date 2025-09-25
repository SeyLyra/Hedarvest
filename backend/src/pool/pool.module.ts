import { Module } from '@nestjs/common';
import { PoolService } from './pool.service';
import { PoolController } from './pool.controller';
import { PrismaService } from '../lib/prisma';
import { TransactionModule } from '../transaction/transaction.module';
import { HederaService } from '../lib/hedera.service';

@Module({
  imports: [TransactionModule],
  controllers: [PoolController],
  providers: [PoolService, PrismaService, HederaService],
  exports: [PoolService],
})
export class PoolModule {}