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

  @Post('login')
  async loginFarmer(@Body() farmerLoginDto: FarmerLoginDto) {
    return this.farmerService.loginFarmer(farmerLoginDto);
  }

  @Get('loans')
  @UseGuards(JwtAuthGuard)
  async getLoans(@Request() req) {
    return this.farmerService.getFarmerLoans(req.user.sub);
  }

  @Post('create-hedera-wallet')
  @UseGuards(JwtAuthGuard)
  async createHederaWallet(@Request() req) {
    return this.farmerService.createHederaWalletForFarmer(req.user.sub);
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
    const farmer = await this.farmerService.getFarmerByEmail(body.email);
    if (farmer.hederaAccountId) {
      return {
        success: true,
        message: 'Farmer already has Hedera account',
        hederaAccountId: farmer.hederaAccountId,
      };
    }
    return this.farmerService.createHederaWalletForFarmer(farmer.id);
  }
}
