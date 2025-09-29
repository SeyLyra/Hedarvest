import { Controller, Get, Post, Body, Param, ParseIntPipe } from '@nestjs/common';
import { InvestorService } from './investor.service';
import { InvestorDepositDto, InvestorWithdrawDto } from './dto';

@Controller('investor')
export class InvestorController {
  constructor(private readonly investorService: InvestorService) {}

  @Post('deposit')
  async deposit(@Body() investorDepositDto: InvestorDepositDto) {
    return this.investorService.deposit(investorDepositDto);
  }

  @Post('withdraw')
  async withdraw(@Body() investorWithdrawDto: InvestorWithdrawDto) {
    return this.investorService.withdraw(investorWithdrawDto);
  }

  @Get('pools')
  async getAvailablePools() {
    return this.investorService.getAvailablePools();
  }

  @Get('pools/:assetType/stats')
  async getPoolStats(@Param('assetType') assetType: string) {
    return this.investorService.getPoolStatsByAssetType(assetType);
  }

  @Get('portfolio/:address')
  async getPortfolio(@Param('address') address: string) {
    return this.investorService.getInvestorPortfolio(address);
  }

  @Get('debug/contracts')
  async debugContracts() {
    try {
      const contractService = this.investorService['contractService'];
      const pools = await contractService.getAllPools();
      return {
        success: true,
        poolsCount: pools.length,
        pools: pools,
        factoryAddress: process.env.LENDING_FACTORY_ADDRESS
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        factoryAddress: process.env.LENDING_FACTORY_ADDRESS
      };
    }
  }

  @Get('debug/pool/:address')
  async debugPool(@Param('address') address: string) {
    try {
      const contractService = this.investorService['contractService'];
      const poolInfo = await contractService.getPoolInfo(address);
      const poolBalance = await contractService.getPoolBalance(address);
      return {
        success: true,
        poolInfo: poolInfo,
        poolBalance: poolBalance
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        address: address
      };
    }
  }
}
