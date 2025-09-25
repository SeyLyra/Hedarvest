import { Injectable, NotFoundException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../lib/prisma';
import { RegisterAgentDto, ManageDepositDto, LoginAgentDto } from './dto';
import { TransactionService } from '../transaction/transaction.service';
import { HederaService } from '../lib/hedera.service';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AgentService {
  constructor(
    private prisma: PrismaService,
    private transactionService: TransactionService,
    private hederaService: HederaService,
    private jwtService: JwtService,
  ) {}

  async registerAgent(registerAgentDto: RegisterAgentDto) {
    const { name, email, password, walletAddress, location, commissionRate } = registerAgentDto as any;

    // Check if agent already exists
    const existingAgent = await this.prisma.agent.findUnique({
      where: { email },
    });

    if (existingAgent) {
      throw new BadRequestException('Agent already registered with this email');
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create agent
    const agent = await this.prisma.agent.create({
      data: {
        name,
        email,
        passwordHash,
        walletAddress,
        location,
        commissionRate: commissionRate || 0.05,
      },
    });

    // Log transaction
    await this.transactionService.logTransaction({
      kind: 'agent_registration',
      ref: `agent_${agent.id}`,
      entity: 'Agent',
      meta: {
        name,
        email,
        walletAddress,
        location,
        commissionRate: agent.commissionRate,
      },
    });

    return agent;
  }

  async loginAgent(loginAgentDto: LoginAgentDto) {
    const { email, password } = loginAgentDto;

    const agent = await this.prisma.agent.findUnique({ where: { email } });
    if (!agent || !agent.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isValid = await bcrypt.compare(password, agent.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!agent.isActive) {
      throw new UnauthorizedException('Account disabled');
    }

    const payload = { sub: agent.id, role: 'agent', email: agent.email };
    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      agent: {
        id: agent.id,
        name: agent.name,
        email: agent.email,
        location: agent.location,
        commissionRate: agent.commissionRate,
      },
    };
  }

  async getAgentProfile(agentId: number) {
    const agent = await this.prisma.agent.findUnique({
      where: { id: agentId },
      include: {
        deposits: {
          include: {
            farmer: true,
          },
        },
      },
    });

    if (!agent) {
      throw new NotFoundException('Agent not found');
    }

    return agent;
  }

  async getAgentDeposits(agentId: number) {
    return this.prisma.grainDeposit.findMany({
      where: { agentId },
      include: {
        farmer: true,
      },
      orderBy: { depositedAt: 'desc' },
    });
  }

  async manageDeposit(agentId: number, manageDepositDto: ManageDepositDto) {
    const { depositId, action, notes, updatedWeight, updatedQualityGrade } = manageDepositDto;

    // Verify deposit exists and belongs to agent
    const deposit = await this.prisma.grainDeposit.findFirst({
      where: {
        id: depositId,
        agentId,
      },
    });

    if (!deposit) {
      throw new NotFoundException('Deposit not found or not assigned to this agent');
    }

    let updatedDeposit;

    switch (action) {
      case 'approve':
        updatedDeposit = await this.prisma.grainDeposit.update({
          where: { id: depositId },
          data: {
            // Mark as approved (you might want to add a status field)
            hederaTxId: `approved_${Date.now()}`, // Placeholder for actual HTS transaction
          },
        });
        break;

      case 'reject':
        updatedDeposit = await this.prisma.grainDeposit.update({
          where: { id: depositId },
          data: {
            hederaTxId: `rejected_${Date.now()}`, // Placeholder for rejection
          },
        });
        break;

      case 'update':
        if (!updatedWeight && !updatedQualityGrade) {
          throw new BadRequestException('No updates provided');
        }
        
        updatedDeposit = await this.prisma.grainDeposit.update({
          where: { id: depositId },
          data: {
            ...(updatedWeight && { weightKg: updatedWeight }),
            ...(updatedQualityGrade && { qualityGrade: updatedQualityGrade }),
          },
        });
        break;

      default:
        throw new BadRequestException('Invalid action');
    }

    // Log transaction
    await this.transactionService.logTransaction({
      kind: 'deposit_management',
      ref: `deposit_${depositId}`,
      entity: 'GrainDeposit',
      meta: {
        agentId,
        depositId,
        action,
        notes,
        updatedWeight,
        updatedQualityGrade,
      },
    });

    return updatedDeposit;
  }

  async getCommissionStats(agentId: number) {
    const agent = await this.prisma.agent.findUnique({
      where: { id: agentId },
    });

    if (!agent) {
      throw new NotFoundException('Agent not found');
    }

    // Get all deposits for this agent
    const deposits = await this.prisma.grainDeposit.findMany({
      where: { agentId },
    });

    // Calculate commission
    const totalTokensMinted = deposits.reduce((sum, deposit) => sum + Number(deposit.tokensMinted), 0);
    const totalCommission = totalTokensMinted * Number(agent.commissionRate);

    return {
      agentId,
      commissionRate: agent.commissionRate,
      totalDeposits: deposits.length,
      totalTokensMinted,
      totalCommission,
      deposits: deposits.map(deposit => ({
        id: deposit.id,
        grainType: deposit.grainType,
        weightKg: deposit.weightKg,
        tokensMinted: deposit.tokensMinted,
        commission: Number(deposit.tokensMinted) * Number(agent.commissionRate),
        depositedAt: deposit.depositedAt,
      })),
    };
  }

  async getAllAgents() {
    return this.prisma.agent.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }
}