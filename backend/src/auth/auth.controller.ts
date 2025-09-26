import { Controller, Post, Body, Get, UseGuards, Request } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { WalletConnectDto } from './dto';
import { WalletAuthDto } from './dto/wallet-auth.dto';
import { WalletAuthService } from './wallet-auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly walletAuthService: WalletAuthService
  ) {}

  @Post('wallet-connect')
  async walletConnect(@Body() walletConnectDto: WalletConnectDto) {
    return this.authService.walletConnect(walletConnectDto);
  }

  @Post('wallet')
  async authenticateWallet(@Body() walletAuthDto: WalletAuthDto) {
    const result = await this.walletAuthService.authenticateWallet(walletAuthDto);
    
    if (!result.success) {
      return {
        success: false,
        message: 'Wallet authentication failed'
      };
    }

    return {
      success: true,
      token: result.token,
      user: result.user,
      message: 'Wallet authenticated successfully'
    };
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Request() req) {
    return {
      user: req.user,
    };
  }
}