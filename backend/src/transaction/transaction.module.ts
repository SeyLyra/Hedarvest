import { Module, forwardRef } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { TransactionController } from './transaction.controller';
import { HederaService } from '../lib/hedera.service';
import { ContractService } from '../lib/contract.service';
import { PrismaService } from '../lib/prisma';
import { HcsModule } from '../hcs/hcs.module';

@Module({
  imports: [forwardRef(() => HcsModule)],
  controllers: [TransactionController],
  providers: [TransactionService, HederaService, ContractService, PrismaService],
  exports: [TransactionService],
})
export class TransactionModule {}