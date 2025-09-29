import { Controller, Get, Post, Body, Param, UseGuards, Request, ParseIntPipe, Put, HttpException, HttpStatus } from '@nestjs/common';
import { AgentService } from './agent.service';
import { RegisterAgentDto, ManageDepositDto, LoginAgentDto, UpdateAgentProfileDto, ChangePasswordDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('agents')
export class AgentController {
  constructor(private readonly agentService: AgentService) {}

  @Post('register')
  async registerAgent(@Body() registerAgentDto: RegisterAgentDto) {
    try {
      return await this.agentService.registerAgent(registerAgentDto);
    } catch (error) {
      throw new HttpException(
        {
          message: error.message || 'Failed to register agent',
          statusCode: HttpStatus.BAD_REQUEST,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('login')
  async loginAgent(@Body() loginAgentDto: LoginAgentDto) {
    return this.agentService.loginAgent(loginAgentDto);
  }

  @Get()
  async getAllAgents() {
    return this.agentService.getAllAgents();
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Request() req) {
    try {
      return await this.agentService.getAgentProfile(req.user.sub);
    } catch (error) {
      throw new HttpException(
        {
          message: error.message || 'Failed to get agent profile',
          statusCode: HttpStatus.NOT_FOUND,
        },
        HttpStatus.NOT_FOUND,
      );
    }
  }

  @Get('deposits')
  @UseGuards(JwtAuthGuard)
  async getDeposits(@Request() req) {
    return this.agentService.getAgentDeposits(req.user.sub);
  }

  @Post('deposits/manage')
  @UseGuards(JwtAuthGuard)
  async manageDeposit(@Request() req, @Body() manageDepositDto: ManageDepositDto) {
    return this.agentService.manageDeposit(req.user.sub, manageDepositDto);
  }

  @Put('profile')
  @UseGuards(JwtAuthGuard)
  async updateProfile(@Request() req, @Body() updateAgentProfileDto: UpdateAgentProfileDto) {
    try {
      return await this.agentService.updateAgentProfile(req.user.sub, updateAgentProfileDto);
    } catch (error) {
      throw new HttpException(
        {
          message: error.message || 'Failed to update agent profile',
          statusCode: HttpStatus.BAD_REQUEST,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Put('password')
  @UseGuards(JwtAuthGuard)
  async changePassword(@Request() req, @Body() changePasswordDto: ChangePasswordDto) {
    try {
      return await this.agentService.changePassword(req.user.sub, changePasswordDto);
    } catch (error) {
      throw new HttpException(
        {
          message: error.message || 'Failed to change password',
          statusCode: HttpStatus.BAD_REQUEST,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('commission')
  @UseGuards(JwtAuthGuard)
  async getCommissionStats(@Request() req) {
    return this.agentService.getCommissionStats(req.user.sub);
  }

  @Get(':id')
  async getAgentById(@Param('id', ParseIntPipe) id: number) {
    return this.agentService.getAgentProfile(id);
  }

  @Get(':id/deposits')
  async getAgentDepositsById(@Param('id', ParseIntPipe) id: number) {
    return this.agentService.getAgentDeposits(id);
  }

  @Get(':id/commission')
  async getCommissionStatsById(@Param('id', ParseIntPipe) id: number) {
    return this.agentService.getCommissionStats(id);
  }

  @Put(':id/status')
  async updateAgentStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { status: 'pending' | 'approved' | 'rejected' }
  ) {
    try {
      return await this.agentService.updateAgentStatus(id, body.status);
    } catch (error) {
      throw new HttpException(
        {
          message: error.message || 'Failed to update agent status',
          statusCode: HttpStatus.BAD_REQUEST,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}