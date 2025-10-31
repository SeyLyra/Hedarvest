import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../lib/prisma';
import { WalletConnectDto } from './dto';
import { ethers } from 'ethers';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async walletConnect(walletConnectDto: WalletConnectDto) {
    const { walletAddress, signature, message } = walletConnectDto;

    // Verify signature
    const recoveredAddress = ethers.verifyMessage(message, signature);
    if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
      throw new UnauthorizedException('Invalid signature');
    }

    // Find or create user
    let user = await this.prisma.farmer.findUnique({
      where: { walletAddress },
    });

    if (!user) {
      user = await this.prisma.farmer.create({
        data: { walletAddress, phoneNumber: 'N/A', memberNumber: `MBR-${Date.now()}` },
      });
    }

    // Generate JWT
    const payload = { sub: user.id, walletAddress: user.walletAddress };
    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        walletAddress: user.walletAddress,
      },
    };
  }

  async verifyToken(token: string) {
    try {
      const payload = this.jwtService.verify(token);
      return payload;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}