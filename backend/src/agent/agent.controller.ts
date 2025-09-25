import { Controller, Get, Post, Body, Param, UseGuards, Request, ParseIntPipe } from '@nestjs/common';
import { AgentService } from './agent.service';
import { RegisterAgentDto, ManageDepositDto, LoginAgentDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('agents')
export class AgentController {
  constructor(private readonly agentService: AgentService) {}

  @Post('register')
  async registerAgent(@Body() registerAgentDto: RegisterAgentDto) {
    return this.agentService.registerAgent(registerAgentDto);
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
    return this.agentService.getAgentProfile(req.user.sub);
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
}