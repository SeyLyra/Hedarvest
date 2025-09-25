import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../lib/prisma';
import { CreatePoolDto, DepositPoolDto } from './dto';
import { TransactionService } from '../transaction/transaction.service';
import { HederaService } from '../lib/hedera.service';

@Injectable()
export class PoolService {
  constructor(
    private prisma: PrismaService,
    private transactionService: TransactionService,
    private hederaService: HederaService,
  ) {}

  async createPool(createPoolDto: CreatePoolDto) {
    const { address, grainType, apr, liquidity } = createPoolDto;

    // Check if pool already exists
    const existingPool = await this.prisma.pool.findUnique({
      where: { address },
    });

    if (existingPool) {
      throw new BadRequestException('Pool already exists with this address');
    }

    // Create pool token on Hedera
    const tokenResult = await this.hederaService.createPoolToken(grainType, 0); // Will be updated with actual pool ID

    // Create pool in database
    const pool = await this.prisma.pool.create({
      data: {
        address: tokenResult.tokenId, // Use token ID as address
        grainType,
        apr: apr || 0,
        liquidity: liquidity || 0,
      },
    });

    // Update pool with correct token ID
    const updatedPool = await this.prisma.pool.update({
      where: { id: pool.id },
      data: { address: tokenResult.tokenId },
    });

    // Log transaction
    await this.transactionService.logTransaction({
      kind: 'pool_creation',
      ref: `pool_${pool.id}`,
      entity: 'Pool',
      meta: {
        address: tokenResult.tokenId,
        grainType,
        apr: pool.apr,
        liquidity: pool.liquidity,
        hederaTxId: tokenResult.transactionId,
      },
    });

    return updatedPool;
  }

  async getAllPools() {
    return this.prisma.pool.findMany({
      include: {
        loans: {
          include: {
            farmer: true,
          },
        },
      },
      orderBy: { id: 'asc' },
    });
  }

  async getPoolById(id: number) {
    const pool = await this.prisma.pool.findUnique({
      where: { id },
      include: {
        loans: {
          include: {
            farmer: true,
          },
        },
      },
    });

    if (!pool) {
      throw new NotFoundException('Pool not found');
    }

    return pool;
  }

  async getPoolStats(id: number) {
    const pool = await this.prisma.pool.findUnique({
      where: { id },
      include: {
        loans: true,
      },
    });

    if (!pool) {
      throw new NotFoundException('Pool not found');
    }

    // Calculate statistics
    const totalLoans = pool.loans.length;
    const totalBorrowed = pool.loans.reduce((sum, loan) => sum + Number(loan.amount), 0);
    const activeLoans = pool.loans.filter(loan => loan.status === 'active').length;
    const totalInterest = pool.loans.reduce((sum, loan) => {
      const interest = Number(loan.amount) * Number(loan.interestRate);
      return sum + interest;
    }, 0);

    return {
      poolId: pool.id,
      address: pool.address,
      grainType: pool.grainType,
      apr: pool.apr,
      liquidity: pool.liquidity,
      totalLoans,
      totalBorrowed,
      activeLoans,
      totalInterest,
      utilizationRate: totalBorrowed > 0 ? (totalBorrowed / Number(pool.liquidity)) * 100 : 0,
    };
  }

  async depositToPool(depositPoolDto: DepositPoolDto) {
    const { poolId, amount, depositorAddress } = depositPoolDto;

    // Verify pool exists
    const pool = await this.prisma.pool.findUnique({
      where: { id: poolId },
    });

    if (!pool) {
      throw new NotFoundException('Pool not found');
    }

    // Process deposit on Hedera blockchain
    const hederaResult = await this.hederaService.processPoolDeposit(
      pool.address, // Token ID
      depositorAddress,
      amount,
    );

    // Update pool liquidity
    const updatedPool = await this.prisma.pool.update({
      where: { id: poolId },
      data: {
        liquidity: Number(pool.liquidity) + amount,
      },
    });

    // Log transaction
    await this.transactionService.logTransaction({
      kind: 'pool_deposit',
      ref: `pool_${poolId}_deposit_${Date.now()}`,
      entity: 'Pool',
      meta: {
        poolId,
        amount,
        depositorAddress,
        newLiquidity: updatedPool.liquidity,
        hederaTxId: hederaResult.transactionId,
      },
    });

    return {
      pool: updatedPool,
      depositAmount: amount,
      depositorAddress,
      transactionId: hederaResult.transactionId,
    };
  }

  async getPoolLoans(poolId: number) {
    const pool = await this.prisma.pool.findUnique({
      where: { id: poolId },
    });

    if (!pool) {
      throw new NotFoundException('Pool not found');
    }

    return this.prisma.loan.findMany({
      where: { poolId },
      include: {
        farmer: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updatePoolApr(poolId: number, newApr: number) {
    const pool = await this.prisma.pool.findUnique({
      where: { id: poolId },
    });

    if (!pool) {
      throw new NotFoundException('Pool not found');
    }

    const updatedPool = await this.prisma.pool.update({
      where: { id: poolId },
      data: { apr: newApr },
    });

    // Log transaction
    await this.transactionService.logTransaction({
      kind: 'pool_apr_update',
      ref: `pool_${poolId}`,
      entity: 'Pool',
      meta: {
        poolId,
        oldApr: pool.apr,
        newApr,
      },
    });

    return updatedPool;
  }
}