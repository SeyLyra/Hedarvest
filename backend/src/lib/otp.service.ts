import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from './prisma';

function generateSixDigit(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

@Injectable()
export class OtpService {
  constructor(private prisma: PrismaService) {}

  async requestOtpForFarmer(farmerId: number, phoneNumber: string) {
    const code = generateSixDigit();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await this.prisma.otpRequest.upsert({
      where: { farmerId },
      update: { code, expiresAt },
      create: { farmerId, code, expiresAt },
    });

    await this.sendSms(phoneNumber, 'Your verification code was sent.');

    return { success: true };
  }

  async verifyOtpForFarmer(farmerId: number, code: string) {
    const record = await this.prisma.otpRequest.findUnique({ where: { farmerId } });
    if (!record) throw new UnauthorizedException('OTP not found');
    if (record.expiresAt < new Date()) {
      await this.prisma.otpRequest.delete({ where: { farmerId } });
      throw new UnauthorizedException('OTP expired');
    }
    if (record.code !== code) {
      throw new UnauthorizedException('Invalid OTP');
    }
    await this.prisma.otpRequest.delete({ where: { farmerId } });
    return { valid: true };
  }

  private async sendSms(_to: string, _message: string) {
    return;
  }
}


