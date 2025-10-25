import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../lib/prisma';

export interface LogTransactionDto {
  kind: string;
  ref: string;
  entity?: string;
  meta?: any;
}

@Injectable()
export class TransactionService {
  private readonly logger = new Logger(TransactionService.name);

  constructor(private prisma: PrismaService) {}

  async logTransaction(data: LogTransactionDto) {
    return this.prisma.txLog.create({
      data: {
        kind: data.kind,
        ref: data.ref,
        entity: data.entity,
        meta: data.meta,
      },
    });
  }

  async getTransactionById(id: number) {
    return this.prisma.txLog.findUnique({
      where: { id },
    });
  }

  async getTransactionsByRef(ref: string) {
    return this.prisma.txLog.findMany({
      where: { ref },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getTransactionsByKind(kind: string) {
    return this.prisma.txLog.findMany({
      where: { kind },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getTransactionsByEntity(entity: string) {
    return this.prisma.txLog.findMany({
      where: { entity },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getTransactionsByEntityAndAddress(entity: string, address: string, limit: number = 10) {
    this.logger.log(`\n[TransactionService] Querying transactions:`);
    this.logger.log(`  Entity: "${entity}"`);
    this.logger.log(`  Address: "${address}"`);
    this.logger.log(`  Limit: ${limit}`);

    const results = await this.prisma.txLog.findMany({
      where: {
        entity,
        meta: {
          path: ['depositorAddress'],
          equals: address
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    this.logger.log(`  Found: ${results.length} transactions`);

    // If no results, try to find ANY investor transactions to help debug
    if (results.length === 0 && entity === 'Investor') {
      const allInvestorTxs = await this.prisma.txLog.findMany({
        where: { entity: 'Investor' },
        orderBy: { createdAt: 'desc' },
        take: 5,
      });

      this.logger.warn(`  No transactions found for address "${address}"`);
      this.logger.warn(`  Sample of recent Investor transactions in DB:`);
      allInvestorTxs.forEach((tx, i) => {
        const meta = tx.meta as any || {};
        this.logger.warn(`    ${i + 1}. depositorAddress="${meta.depositorAddress}", kind="${tx.kind}"`);
      });
    }

    return results;
  }

  async getAllTransactions(limit: number = 100, offset: number = 0) {
    return this.prisma.txLog.findMany({
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' },
    });
  }
}