import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../lib/prisma';
import {
  RegisterAgentDto,
  ManageDepositDto,
  LoginAgentDto,
  UpdateAgentProfileDto,
  ChangePasswordDto,
} from './dto';
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
    const {
      name,
      email,
      password,
      phoneNumber,
      walletAddress,
      location,
      commissionRate,
    } = registerAgentDto;

    // Check if agent already exists
    const existingAgent = await this.prisma.agent.findUnique({
      where: { email },
    });

    if (existingAgent) {
      throw new BadRequestException('Agent already registered with this email');
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create agent with pending status
    const agent = await this.prisma.agent.create({
      data: {
        name,
        email,
        passwordHash: hashedPassword,
        phoneNumber: phoneNumber || null,
        walletAddress: walletAddress || null,
        location: location || null,
        status: 'pending', // Default to pending for approval
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
        phoneNumber,
        walletAddress,
        location,
        status: 'pending',
      },
    });

    // Return agent without password hash
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...agentResponse } = agent;
    return {
      ...agentResponse,
      message: 'Agent registration submitted successfully. Awaiting approval.',
    };
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

    // Return agent without password hash
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...agentResponse } = agent;
    return agentResponse;
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
      throw new NotFoundException(
        'Deposit not found or not assigned to this agent',
      );
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

    return updatedDeposit as any;
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
    const totalTokensMinted = deposits.reduce(
      (sum, deposit) => sum + Number(deposit.tokensMinted),
      0,
    );
    const totalCommission = totalTokensMinted * Number(agent.commissionRate);

    return {
      agentId,
      commissionRate: agent.commissionRate,
      totalDeposits: deposits.length,
      totalTokensMinted,
      totalCommission,
      deposits: deposits.map((deposit) => ({
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
    const agents = await this.prisma.agent.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });

    // Return agents without password hashes
    return agents.map(({ passwordHash, ...agent }) => agent);
  }

  async updateAgentStatus(
    agentId: number,
    status: 'pending' | 'approved' | 'rejected',
  ) {
    const agent = await this.prisma.agent.findUnique({
      where: { id: agentId },
    });

    if (!agent) {
      throw new NotFoundException('Agent not found');
    }

    const updatedAgent = await this.prisma.agent.update({
      where: { id: agentId },
      data: { status },
    });

    // Log transaction
    await this.transactionService.logTransaction({
      kind: 'agent_status_update',
      ref: `agent_${agentId}`,
      entity: 'Agent',
      meta: {
        agentId,
        previousStatus: agent.status,
        newStatus: status,
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...agentResponse } = updatedAgent;
    return agentResponse;
  }

  async updateAgentProfile(
    agentId: number,
    updateAgentProfileDto: UpdateAgentProfileDto,
  ) {
    const agent = await this.prisma.agent.findUnique({
      where: { id: agentId },
    });

    if (!agent) {
      throw new NotFoundException('Agent not found');
    }

    // Only allow updates to certain fields
    const allowedUpdates = {
      name: updateAgentProfileDto.name,
      phoneNumber: updateAgentProfileDto.phoneNumber,
      location: updateAgentProfileDto.location,
      walletAddress: updateAgentProfileDto.walletAddress,
    };

    // Remove undefined values
    const filteredUpdates = Object.fromEntries(
      Object.entries(allowedUpdates).filter(
        ([, value]) => value !== undefined,
      ),
    );

    if (Object.keys(filteredUpdates).length === 0) {
      throw new BadRequestException('No valid updates provided');
    }

    const updatedAgent = await this.prisma.agent.update({
      where: { id: agentId },
      data: filteredUpdates,
    });

    // Log transaction
    await this.transactionService.logTransaction({
      kind: 'agent_profile_update',
      ref: `agent_${agentId}`,
      entity: 'Agent',
      meta: {
        agentId,
        updatedFields: Object.keys(filteredUpdates),
        previousValues: {
          name: agent.name,
          phoneNumber: agent.phoneNumber,
          location: agent.location,
          walletAddress: agent.walletAddress,
        },
        newValues: filteredUpdates,
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...agentResponse } = updatedAgent;
    return agentResponse;
  }

  async changePassword(agentId: number, changePasswordDto: ChangePasswordDto) {
    const { currentPassword, newPassword } = changePasswordDto;

    const agent = await this.prisma.agent.findUnique({
      where: { id: agentId },
    });

    if (!agent || !agent.passwordHash) {
      throw new NotFoundException('Agent not found');
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, agent.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Hash new password
    const saltRounds = 12;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await this.prisma.agent.update({
      where: { id: agentId },
      data: { passwordHash: hashedNewPassword },
    });

    // Log transaction
    await this.transactionService.logTransaction({
      kind: 'agent_password_change',
      ref: `agent_${agentId}`,
      entity: 'Agent',
      meta: {
        agentId,
        email: agent.email,
      },
    });

    return { message: 'Password changed successfully' };
  }
}
