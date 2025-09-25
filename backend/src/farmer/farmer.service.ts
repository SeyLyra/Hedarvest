import { Injectable, NotFoundException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../lib/prisma';
import { RegisterFarmerDto, DepositGrainDto, RedeemDto } from './dto';
import { TransactionService } from '../transaction/transaction.service';
import { HederaService } from '../lib/hedera.service';

@Injectable()
export class FarmerService {
  constructor(
    private prisma: PrismaService,
    private transactionService: TransactionService,
    private hederaService: HederaService,
  ) {}

  async registerFarmer(registerFarmerDto: RegisterFarmerDto) {
    const { walletAddress, phoneNumber, nationalId } = registerFarmerDto;

    // Check if farmer already exists
    const existingFarmer = await this.prisma.farmer.findUnique({
      where: { walletAddress },
    });

    if (existingFarmer) {
      throw new BadRequestException('Farmer already registered');
    }

    // Create farmer
    const farmer = await this.prisma.farmer.create({
      data: {
        walletAddress,
        phoneNumber: phoneNumber || 'N/A',
        memberNumber: `MBR-${Date.now()}`,
      },
    });

    // Log transaction
    await this.transactionService.logTransaction({
      kind: 'farmer_registration',
      ref: `farmer_${farmer.id}`,
      entity: 'Farmer',
      meta: {
        walletAddress,
        phoneNumber,
        nationalId,
      },
    });

    return farmer;
  }

  async depositGrain(depositGrainDto: DepositGrainDto) {
    const { farmerId, agentId, grainType, weightKg, qualityGrade, moisturePercent } = depositGrainDto;

    // Verify farmer exists
    const farmer = await this.prisma.farmer.findUnique({
      where: { id: farmerId },
    });

    if (!farmer) {
      throw new NotFoundException('Farmer not found');
    }

    // Verify agent exists
    const agent = await this.prisma.agent.findUnique({
      where: { id: agentId },
    });

    if (!agent) {
      throw new NotFoundException('Agent not found');
    }

    // Calculate tokens to mint (1 token per kg for now)
    const tokensMinted = weightKg;

    // Process grain deposit on Hedera blockchain
    if (!agent.walletAddress) {
      throw new BadRequestException('Agent wallet address is required');
    }
    
    const hederaResult = await this.hederaService.processGrainDeposit(
      agent.walletAddress,
      tokensMinted,
    );

    // Create grain deposit
    const deposit = await this.prisma.grainDeposit.create({
      data: {
        farmerId,
        agentId,
        grainType,
        weightKg,
        qualityGrade,
        moisturePercent,
        tokensMinted,
        hederaTxId: hederaResult.transactionId,
      },
    });

    // Log transaction
    await this.transactionService.logTransaction({
      kind: 'grain_deposit',
      ref: `deposit_${deposit.id}`,
      entity: 'GrainDeposit',
      meta: {
        farmerId,
        agentId,
        grainType,
        weightKg,
        qualityGrade,
        moisturePercent,
        tokensMinted,
      },
    });

    return deposit;
  }


  async getFarmerProfile(farmerId: number) {
    const farmer = await this.prisma.farmer.findUnique({
      where: { id: farmerId },
      include: {
        deposits: {
          include: {
            agent: true,
          },
        },
        loans: {
          include: {
            pool: true,
          },
        },
      },
    });

    if (!farmer) {
      throw new NotFoundException('Farmer not found');
    }

    return farmer;
  }

  async getFarmerDeposits(farmerId: number) {
    return this.prisma.grainDeposit.findMany({
      where: { farmerId },
      include: {
        agent: true,
      },
      orderBy: { depositedAt: 'desc' },
    });
  }

  async getFarmerLoans(farmerId: number) {
    return this.prisma.loan.findMany({
      where: { farmerId },
      include: {
        pool: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getFarmerByMemberNumber(memberNumber: string) {
    const farmer = await this.prisma.farmer.findUnique({ where: { memberNumber } as any });
    if (!farmer) {
      throw new NotFoundException('Farmer not found');
    }
    return farmer;
  }

  async redeemTokens(redeemDto: RedeemDto) {
    const { farmerId, amount } = redeemDto;

    // Verify farmer exists
    const farmer = await this.prisma.farmer.findUnique({ where: { id: farmerId } });
    if (!farmer) {
      throw new NotFoundException('Farmer not found');
    }

    // OTP must be verified prior to invoking this endpoint in the flow (checked via separate endpoint)

    // Process redemption on Hedera (burn/transfer as required)
    const hederaResult = await this.hederaService.processGrainDeposit(farmer.walletAddress, -amount);

    // Log transaction
    await this.transactionService.logTransaction({
      kind: 'token_redemption',
      ref: `farmer_${farmerId}_redeem_${Date.now()}`,
      entity: 'Farmer',
      meta: { farmerId, amount, hederaTxId: hederaResult.transactionId },
    });

    return { success: true, transactionId: hederaResult.transactionId };
  }
}