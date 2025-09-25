import { Controller, Get, Post, Body, Param, Put, ParseIntPipe } from '@nestjs/common';
import { PoolService } from './pool.service';
import { CreatePoolDto, DepositPoolDto } from './dto';

@Controller('pools')
export class PoolController {
  constructor(private readonly poolService: PoolService) {}

  @Post()
  async createPool(@Body() createPoolDto: CreatePoolDto) {
    return this.poolService.createPool(createPoolDto);
  }

  @Get()
  async getAllPools() {
    return this.poolService.getAllPools();
  }

  @Get(':id')
  async getPoolById(@Param('id', ParseIntPipe) id: number) {
    return this.poolService.getPoolById(id);
  }

  @Get(':id/stats')
  async getPoolStats(@Param('id', ParseIntPipe) id: number) {
    return this.poolService.getPoolStats(id);
  }

  @Get(':id/loans')
  async getPoolLoans(@Param('id', ParseIntPipe) id: number) {
    return this.poolService.getPoolLoans(id);
  }

  @Post('deposit')
  async depositToPool(@Body() depositPoolDto: DepositPoolDto) {
    return this.poolService.depositToPool(depositPoolDto);
  }

  @Put(':id/apr')
  async updatePoolApr(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { apr: number },
  ) {
    return this.poolService.updatePoolApr(id, body.apr);
  }
}