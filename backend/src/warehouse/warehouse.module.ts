import { Module } from '@nestjs/common';
import { WarehouseController } from './warehouse.controller';
import { WarehouseService } from './warehouse.service';
import { PrismaService } from '../lib/prisma';
import { TransactionModule } from '../transaction/transaction.module';
import { HederaService } from '../lib/hedera.service';
import { ContractService } from '../lib/contract.service';
import { HcsModule } from '../hcs/hcs.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TransactionModule, HcsModule, AuthModule],
  controllers: [WarehouseController],
  providers: [
    WarehouseService,
    PrismaService,
    HederaService,
    ContractService,
  ],
  exports: [WarehouseService],
})
export class WarehouseModule {}
