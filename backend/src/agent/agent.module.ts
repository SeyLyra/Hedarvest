import { Module } from '@nestjs/common';
import { AgentService } from './agent.service';
import { AgentController } from './agent.controller';
import { PrismaService } from '../lib/prisma';
import { TransactionModule } from '../transaction/transaction.module';
import { HederaService } from '../lib/hedera.service';
import { ContractService } from '../lib/contract.service';
import { AuthModule } from '../auth/auth.module';
import { HcsModule } from '../hcs/hcs.module';

@Module({
  imports: [TransactionModule, AuthModule, HcsModule],
  controllers: [AgentController],
  providers: [AgentService, PrismaService, HederaService, ContractService],
  exports: [AgentService],
})
export class AgentModule {}