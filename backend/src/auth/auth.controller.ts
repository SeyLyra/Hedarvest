import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Request,
} from '@nestjs/common';
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
    private readonly walletAuthService: WalletAuthService,
  ) {}

  @Post('wallet-connect')
  async walletConnect(@Body() walletConnectDto: WalletConnectDto) {
    return this.authService.walletConnect(walletConnectDto);
  }

  // removed unused wallet and profile endpoints
}
