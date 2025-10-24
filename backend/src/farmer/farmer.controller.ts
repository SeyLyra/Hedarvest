import { Controller, Get, Post, Body, Param, UseGuards, Request, ParseIntPipe } from '@nestjs/common';
import { FarmerService } from './farmer.service';
import { RegisterFarmerDto, DepositGrainDto, RedeemDto, FarmerLoginDto, FarmerRegisterDto, DepositCollateralDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OtpService } from '../lib/otp.service';
import { IsString } from 'class-validator';

class RequestOtpBody { @IsString() memberNumber: string }
class VerifyOtpBody { @IsString() memberNumber: string; @IsString() otpCode: string }

@Controller('farmers')
export class FarmerController {
  constructor(private readonly farmerService: FarmerService, private otpService: OtpService) {}

  @Post('register')
  async registerFarmer(@Body() registerFarmerDto: RegisterFarmerDto) {
    return this.farmerService.registerFarmer(registerFarmerDto);
  }

  @Post('deposits')
  @UseGuards(JwtAuthGuard)
  async depositGrain(@Body() depositGrainDto: DepositGrainDto) {
    return this.farmerService.depositGrain(depositGrainDto);
  }


  @Post('redeem')
  @UseGuards(JwtAuthGuard)
  async redeem(@Body() redeemDto: RedeemDto) {
    return this.farmerService.redeemTokens(redeemDto);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Request() req) {
    return this.farmerService.getFarmerProfile(req.user.sub);
  }

  @Get('deposits')
  @UseGuards(JwtAuthGuard)
  async getDeposits(@Request() req) {
    return this.farmerService.getFarmerDeposits(req.user.sub);
  }

  @Get('loans')
  @UseGuards(JwtAuthGuard)
  async getLoans(@Request() req) {
    return this.farmerService.getFarmerLoans(req.user.sub);
  }

  @Get(':id')
  async getFarmerById(@Param('id', ParseIntPipe) id: number) {
    return this.farmerService.getFarmerProfile(id);
  }

  @Post('request-otp')
  @UseGuards(JwtAuthGuard)
  async requestOtp(@Body() body: RequestOtpBody) {
    const farmer = await this.farmerService.getFarmerByMemberNumber(body.memberNumber);
    return this.otpService.requestOtpForFarmer(farmer.id, farmer.phoneNumber);
  }

  @Post('verify-otp')
  @UseGuards(JwtAuthGuard)
  async verifyOtp(@Body() body: VerifyOtpBody) {
    const farmer = await this.farmerService.getFarmerByMemberNumber(body.memberNumber);
    return this.otpService.verifyOtpForFarmer(farmer.id, body.otpCode);
  }

  @Post('register-with-auth')
  async registerWithAuth(@Body() farmerRegisterDto: FarmerRegisterDto) {
    return this.farmerService.registerFarmerWithAuth(farmerRegisterDto);
  }

  @Post('login')
  async login(@Body() farmerLoginDto: FarmerLoginDto) {
    return this.farmerService.loginFarmer(farmerLoginDto);
  }

  @Post('deposits/:id/verify-and-mint')
  async verifyAndMintTokens(
    @Param('id', ParseIntPipe) depositId: number,
    @Body() body: { warehouseSignature: string }
  ) {
    return this.farmerService.verifyAndMintTokens(depositId, body.warehouseSignature);
  }

  @Post('collateral/deposit')
  @UseGuards(JwtAuthGuard)
  async depositCollateral(@Body() depositCollateralDto: DepositCollateralDto) {
    return this.farmerService.depositCollateral(depositCollateralDto);
  }
}