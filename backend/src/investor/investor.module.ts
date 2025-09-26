import { Module } from '@nestjs/common';
import { InvestorController } from './investor.controller';
import { InvestorService } from './investor.service';
import { PrismaService } from '../lib/prisma';
import { TransactionModule } from '../transaction/transaction.module';
import { HederaService } from '../lib/hedera.service';
import { ContractService } from '../lib/contract.service';
import { HcsModule } from '../hcs/hcs.module';
import { PoolsModule } from '../pools/pools.module';

@Module({
  imports: [TransactionModule, HcsModule, PoolsModule],
  controllers: [InvestorController],
  providers: [InvestorService, PrismaService, HederaService, ContractService],
  exports: [InvestorService],
})
export class InvestorModule {}
