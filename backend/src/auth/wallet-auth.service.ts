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
      if (walletAuthDto.walletType === WalletType.METAMASK) {
        return await this.verifyMetaMaskSignature(walletAuthDto);
      } else if (walletAuthDto.walletType === WalletType.HASHPACK) {
        return await this.verifyHashPackSignature(walletAuthDto);
      }
      
      return false;
    } catch (error) {
      this.logger.error(`Signature verification failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Verify MetaMask signature using ethers.js
   */
  private async verifyMetaMaskSignature(walletAuthDto: WalletAuthDto): Promise<boolean> {
    try {
      // Recover the address from the signature
      const recoveredAddress = ethers.verifyMessage(walletAuthDto.message, walletAuthDto.signature);
      
      // Check if the recovered address matches the provided address
      const isValid = recoveredAddress.toLowerCase() === walletAuthDto.address.toLowerCase();
      
      this.logger.log(`MetaMask signature verification: ${isValid ? 'valid' : 'invalid'}`);
      return isValid;
    } catch (error) {
      this.logger.error(`MetaMask signature verification error: ${error.message}`);
      return false;
    }
  }

  /**
   * Verify HashPack signature
   * Note: HashPack signature verification is more complex and depends on the specific implementation
   * This is a simplified version - in production, you'd need to implement proper HashPack signature verification
   */
  private async verifyHashPackSignature(walletAuthDto: WalletAuthDto): Promise<boolean> {
    try {
      // For HashPack, we'll do a basic validation
      // In production, you'd need to implement proper HashPack signature verification
      // This might involve checking against Hedera's signature verification methods
      
      // Basic validation: check if the address format is valid for Hedera
      const isHederaAddress = this.isValidHederaAddress(walletAuthDto.address);
      
      if (!isHederaAddress) {
        this.logger.warn(`Invalid Hedera address format: ${walletAuthDto.address}`);
        return false;
      }

      // For now, we'll accept HashPack signatures as valid if the address format is correct
      // In production, implement proper signature verification
      this.logger.log(`HashPack signature verification: accepted (simplified validation)`);
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
