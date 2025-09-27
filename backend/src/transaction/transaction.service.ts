import { Injectable } from '@nestjs/common';
import { PrismaService } from '../lib/prisma';

export interface LogTransactionDto {
  kind: string;
  ref: string;
  entity?: string;
  meta?: any;
}

@Injectable()
export class TransactionService {
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
    return this.prisma.txLog.findMany({
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
  }

  async getAllTransactions(limit: number = 100, offset: number = 0) {
    return this.prisma.txLog.findMany({
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' },
    });
  }
}