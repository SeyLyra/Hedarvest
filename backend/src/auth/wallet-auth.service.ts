import { Injectable, Logger } from '@nestjs/common';
import { ethers } from 'ethers';
import { WalletAuthDto, WalletType } from './dto/wallet-auth.dto';

@Injectable()
export class WalletAuthService {
  private readonly logger = new Logger(WalletAuthService.name);

  /**
   * Verify wallet signature and authenticate user
   */
  async authenticateWallet(walletAuthDto: WalletAuthDto): Promise<{ success: boolean; token?: string; user?: any }> {
    try {
      this.logger.log(`Authenticating wallet: ${walletAuthDto.walletType} - ${walletAuthDto.address}`);

      // Verify signature based on wallet type
      const isValidSignature = await this.verifySignature(walletAuthDto);
      
      if (!isValidSignature) {
        this.logger.warn(`Invalid signature for wallet: ${walletAuthDto.address}`);
        return {
          success: false
        };
      }

      // Generate JWT token for authenticated user
      const token = this.generateJWTToken(walletAuthDto.address, walletAuthDto.walletType);
      
      // Store user session (in production, you'd store this in a database)
      const user = {
        address: walletAuthDto.address,
        walletType: walletAuthDto.walletType,
        authenticatedAt: new Date(),
        token
      };

      this.logger.log(`Wallet authenticated successfully: ${walletAuthDto.address}`);
      
      return {
        success: true,
        token,
        user
      };
    } catch (error) {
      this.logger.error(`Wallet authentication failed: ${error.message}`, error.stack);
      return {
        success: false
      };
    }
  }

  /**
   * Verify signature based on wallet type
   */
  private async verifySignature(walletAuthDto: WalletAuthDto): Promise<boolean> {
    try {
      if (walletAuthDto.walletType === WalletType.HASHPACK) {
        return await this.verifyHashPackSignature(walletAuthDto);
      }
      
      this.logger.warn(`Unsupported wallet type: ${walletAuthDto.walletType}`);
      return false;
    } catch (error) {
      this.logger.error(`Signature verification failed: ${error.message}`);
      return false;
    }
  }


  /**
   * Verify HashPack signature
   * For HashPack, we validate the Hedera account format and basic signature structure
   */
  private async verifyHashPackSignature(walletAuthDto: WalletAuthDto): Promise<boolean> {
    try {
      // Basic validation: check if the address format is valid for Hedera
      const isHederaAddress = this.isValidHederaAddress(walletAuthDto.address);
      
      if (!isHederaAddress) {
        this.logger.warn(`Invalid Hedera address format: ${walletAuthDto.address}`);
        return false;
      }

      // Check if signature is provided and has expected format
      if (!walletAuthDto.signature || walletAuthDto.signature.length === 0) {
        this.logger.warn(`No signature provided for HashPack authentication`);
        return false;
      }

      // Check if message is provided
      if (!walletAuthDto.message || walletAuthDto.message.length === 0) {
        this.logger.warn(`No message provided for HashPack authentication`);
        return false;
      }

      // For HashPack, we accept the signature if:
      // 1. Address format is valid Hedera account ID
      // 2. Signature and message are provided
      // In production, you'd implement proper HashPack signature verification
      this.logger.log(`HashPack signature verification: accepted for account ${walletAuthDto.address}`);
      return true;
    } catch (error) {
      this.logger.error(`HashPack signature verification error: ${error.message}`);
      return false;
    }
  }

  /**
   * Check if address is a valid Hedera address format
   */
  private isValidHederaAddress(address: string): boolean {
    // Hedera addresses are typically in format: 0.0.12345
    const hederaAddressRegex = /^\d+\.\d+\.\d+$/;
    return hederaAddressRegex.test(address);
  }

  /**
   * Generate JWT token for authenticated user
   */
  private generateJWTToken(address: string, walletType: WalletType): string {
    // In production, use a proper JWT library like @nestjs/jwt
    // For now, we'll create a simple token
    const payload = {
      address,
      walletType,
      timestamp: Date.now(),
      exp: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
    };
    
    // Simple base64 encoding (not secure for production)
    return Buffer.from(JSON.stringify(payload)).toString('base64');
  }

  /**
   * Validate JWT token
   */
  validateToken(token: string): { valid: boolean; payload?: any } {
    try {
      const payload = JSON.parse(Buffer.from(token, 'base64').toString());
      
      // Check if token is expired
      if (payload.exp && Date.now() > payload.exp) {
        return { valid: false };
      }
      
      return { valid: true, payload };
    } catch (error) {
      this.logger.error(`Token validation error: ${error.message}`);
      return { valid: false };
    }
  }
}
