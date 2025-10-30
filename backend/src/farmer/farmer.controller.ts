import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  ParseIntPipe,
} from '@nestjs/common';
import { FarmerService } from './farmer.service';
import {
  RegisterFarmerDto,
  DepositGrainDto,
  RedeemDto,
  FarmerLoginDto,
  FarmerRegisterDto,
  DepositCollateralDto,
  BorrowFundsDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('farmers')
export class FarmerController {
  constructor(private readonly farmerService: FarmerService) {}

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

  @Post('create-hedera-wallet')
  @UseGuards(JwtAuthGuard)
  async createHederaWallet(@Request() req) {
    console.log(
      '🔧 Request to create Hedera wallet for farmer ID:',
      req.user.sub,
    );
    try {
      const result = await this.farmerService.createHederaWalletForFarmer(
        req.user.sub,
      );
      console.log('✅ Wallet creation result:', result);
      return result;
    } catch (error) {
      console.error('❌ Failed to create wallet:', error);
      throw error;
    }
  }

  @Post('collateral/deposit')
  @UseGuards(JwtAuthGuard)
  async depositCollateral(
    @Request() req,
    @Body() body: { grainType: string; amount: number },
  ) {
    const farmerId = req.user.sub as number;
    const depositDto: DepositCollateralDto = {
      farmerId,
      cropType: body.grainType,
      amount: body.amount,
    };
    return this.farmerService.depositCollateral(depositDto);
  }

  @Get('borrow/allowance/:grainType')
  @UseGuards(JwtAuthGuard)
  async getBorrowAllowance(
    @Request() req,
    @Param('grainType') grainType: string,
  ) {
    const farmerId = req.user.sub as number;
    return this.farmerService.getBorrowAllowance(farmerId, grainType);
  }

  @Post('borrow/funds')
  @UseGuards(JwtAuthGuard)
  async borrowFunds(
    @Request() req,
    @Body() body: { grainType: string; amount: number },
  ) {
    const farmerId = req.user.sub as number;
    const borrowDto: BorrowFundsDto = {
      farmerId,
      cropType: body.grainType,
      amount: body.amount,
    };
    return this.farmerService.borrowFunds(borrowDto);
  }

  @Post('fix-wallet-by-email')
  async fixWalletByEmail(@Body() body: { email: string }) {
    console.log('🔧 Admin request to fix wallet for email:', body.email);
    try {
      const farmer = await this.farmerService.getFarmerByEmail(body.email);

      if (farmer.hederaAccountId) {
        return {
          success: true,
          message: 'Farmer already has Hedera account',
          hederaAccountId: farmer.hederaAccountId,
        };
      }

      const result = await this.farmerService.createHederaWalletForFarmer(
        farmer.id,
      );
      console.log('✅ Wallet fixed for farmer:', body.email, result);
      return result;
    } catch (error) {
      console.error('❌ Failed to fix wallet:', error);
      return { success: false, error: error.message || 'Unknown error' };
    }
  }

  @Get(':id')
  async getFarmerById(@Param('id', ParseIntPipe) id: number) {}

  @Post('register-with-auth')
  async registerWithAuth(@Body() registerDto: FarmerRegisterDto) {
    return this.farmerService.registerFarmerWithAuth(registerDto);
  }

  @Post('login')
  async login(@Body() loginDto: FarmerLoginDto) {
    return this.farmerService.loginFarmer(loginDto);
  }
}
