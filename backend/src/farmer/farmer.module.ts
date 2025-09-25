import { Module } from '@nestjs/common';
import { FarmerService } from './farmer.service';
import { FarmerController } from './farmer.controller';
import { PrismaService } from '../lib/prisma';
import { TransactionModule } from '../transaction/transaction.module';
import { HederaService } from '../lib/hedera.service';
import { ContractService } from '../lib/contract.service';
import { OtpService } from '../lib/otp.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TransactionModule, AuthModule],
  controllers: [FarmerController],
  providers: [FarmerService, PrismaService, HederaService, ContractService, OtpService],
  exports: [FarmerService],
})
export class FarmerModule {}