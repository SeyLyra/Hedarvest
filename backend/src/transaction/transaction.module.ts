import { Module } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { TransactionController } from './transaction.controller';
import { PrismaService } from '../lib/prisma';

@Module({
  controllers: [TransactionController],
  providers: [TransactionService, PrismaService],
  exports: [TransactionService],
})
export class TransactionModule {}