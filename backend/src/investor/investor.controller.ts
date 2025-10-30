import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { InvestorService } from './investor.service';
import { InvestorWithdrawDto } from './dto';

@Controller('investor')
export class InvestorController {
  constructor(private readonly investorService: InvestorService) {}

  @Post('withdraw')
  async withdraw(@Body() investorWithdrawDto: InvestorWithdrawDto) {
    return this.investorService.withdraw(investorWithdrawDto);
  }

  @Get('pools')
  async getAvailablePools() {
    return this.investorService.getAvailablePools();
  }

  @Get('portfolio/:address')
  async getPortfolio(@Param('address') address: string) {
    return this.investorService.getInvestorPortfolio(address);
  }
}
