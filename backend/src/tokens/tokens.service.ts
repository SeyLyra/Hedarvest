import { Injectable, Logger } from '@nestjs/common';
import { HederaService } from '../lib/hedera.service';

@Injectable()
export class TokensService {
  private readonly logger = new Logger(TokensService.name);

  constructor(private readonly hederaService: HederaService) {}

  /**
   * Associate a token with an account
   */
  async associateToken(
    accountId: string,
    tokenId: string,
    userPrivateKey?: string,
  ): Promise<{ transactionId?: string; status: string; alreadyAssociated: boolean }> {
    try {
      this.logger.log(`Associating token ${tokenId} with account ${accountId}`);

      let result;
      if (userPrivateKey) {
        // Use user's private key for association
        const associationResult = await this.hederaService.associateTokenWithUserKey(
          accountId,
          userPrivateKey,
          tokenId,
        );
        result = {
          transactionId: associationResult.transactionId,
          status: associationResult.status,
          alreadyAssociated: false,
        };
      } else {
        // Use operator credentials for association
        result = await this.hederaService.ensureTokenAssociation(accountId, tokenId);
      }

      this.logger.log(`Token association result for ${accountId}:`, result);
      return result;
    } catch (error) {
      this.logger.error(`Failed to associate token ${tokenId} with account ${accountId}:`, error);
      throw error;
    }
  }

  /**
   * Check if a token is associated with an account
   */
  async checkTokenAssociation(
    accountId: string,
    tokenId: string,
  ): Promise<{ isAssociated: boolean; tokenInfo?: any }> {
    try {
      this.logger.log(`Checking token association for account ${accountId} and token ${tokenId}`);
      
      const result = await this.hederaService.checkTokenAssociation(accountId, tokenId);
      
      this.logger.log(`Token association check result:`, result);
      return result;
    } catch (error) {
      this.logger.error(`Failed to check token association for account ${accountId} and token ${tokenId}:`, error);
      throw error;
    }
  }

  /**
   * Ensure token association (associate if needed)
   */
  async ensureTokenAssociation(
    accountId: string,
    tokenId: string,
    userPrivateKey?: string,
  ): Promise<{ transactionId?: string; status: string; alreadyAssociated: boolean }> {
    try {
      this.logger.log(`Ensuring token association for account ${accountId} and token ${tokenId}`);
      
      const result = await this.hederaService.ensureTokenAssociation(accountId, tokenId, userPrivateKey);
      
      this.logger.log(`Token association ensure result:`, result);
      return result;
    } catch (error) {
      this.logger.error(`Failed to ensure token association for account ${accountId} and token ${tokenId}:`, error);
      throw error;
    }
  }

  /**
   * Associate a token with a contract address
   */
  async associateTokenWithContract(
    contractAddress: string,
    tokenId: string,
  ): Promise<{ transactionId?: string; status: string; alreadyAssociated: boolean }> {
    try {
      this.logger.log(`Associating token ${tokenId} with contract ${contractAddress}`);
      
      const result = await this.hederaService.associateTokenWithContract(contractAddress, tokenId);
      
      this.logger.log(`Contract token association result:`, result);
      return result;
    } catch (error) {
      this.logger.error(`Failed to associate token ${tokenId} with contract ${contractAddress}:`, error);
      throw error;
    }
  }

  /**
   * Ensure token association for both user and contract addresses
   */
  async ensureTokenAssociationForUserAndContract(
    userAccountId: string,
    contractAddress: string,
    tokenId: string,
    userPrivateKey?: string,
  ): Promise<{
    userAssociation: { transactionId?: string; status: string; alreadyAssociated: boolean };
    contractAssociation: { transactionId?: string; status: string; alreadyAssociated: boolean };
  }> {
    try {
      this.logger.log(`Ensuring token association for user ${userAccountId} and contract ${contractAddress}`);
      
      const result = await this.hederaService.ensureTokenAssociationForUserAndContract(
        userAccountId,
        contractAddress,
        tokenId,
        userPrivateKey,
      );
      
      this.logger.log(`User and contract token association result:`, result);
      return result;
    } catch (error) {
      this.logger.error(`Failed to ensure token association for user and contract:`, error);
      throw error;
    }
  }

  /**
   * Get token information
   */
  async getTokenInfo(tokenId: string) {
    try {
      this.logger.log(`Getting token info for ${tokenId}`);
      
      const tokenInfo = await this.hederaService.getTokenInfo(tokenId);
      
      this.logger.log(`Token info retrieved:`, tokenInfo);
      return tokenInfo;
    } catch (error) {
      this.logger.error(`Failed to get token info for ${tokenId}:`, error);
      throw error;
    }
  }
}
