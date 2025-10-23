import { Injectable, Logger } from '@nestjs/common';
import {
  Client,
  TokenMintTransaction,
  TransferTransaction,
  AccountId,
  TokenId,
  PrivateKey,
  AccountBalanceQuery,
  TokenInfoQuery,
} from '@hashgraph/sdk';

// Hedera Token ID for USDC (from deployed contracts)
const USDC_TOKEN_ID = process.env.USDC_TOKEN_ID || '0.0.7115536';


@Injectable()
export class FaucetService {
  private readonly logger = new Logger(FaucetService.name);
  private hederaClient: Client;
  private hederaAccountId: AccountId;
  private hederaPrivateKey: PrivateKey;

  constructor() {
    // Initialize Hedera client - make it optional for now
    try {
      const accountId = process.env.HEDERA_OPERATOR_ID;
      const privateKey = process.env.HEDERA_OPERATOR_KEY;
      const network = process.env.HEDERA_NETWORK || 'testnet';

      if (!accountId || !privateKey) {
        this.logger.warn(
          'HEDERA_OPERATOR_ID and HEDERA_OPERATOR_KEY not set - faucet will work in mock mode',
        );
        return;
      }

      this.hederaAccountId = AccountId.fromString(accountId);
      this.hederaPrivateKey = PrivateKey.fromString(privateKey);

      // Create Hedera client
      this.hederaClient = Client.forName(network);
      this.hederaClient.setOperator(
        this.hederaAccountId,
        this.hederaPrivateKey,
      );
      
      this.logger.log(
        `Hedera faucet service initialized with account: ${this.hederaAccountId.toString()}`,
      );
    } catch (error) {
      this.logger.warn(
        'Failed to initialize Hedera client - faucet will work in mock mode:',
        error,
      );
    }
  }

  async mintTokens(address: string, amount: string) {
    this.logger.log(`Minting ${amount} USDC to ${address}`);
    
    // Check if Hedera client is initialized
    if (!this.hederaClient) {
      this.logger.error('Hedera client not initialized - cannot mint tokens');
      throw new Error(
        'Faucet service not properly configured. Hedera client not initialized.',
      );
    }
    
    // Transfer existing tokens from faucet account
    this.logger.log(
      `Attempting to transfer ${amount} USDC to ${address}`,
    );
    
    try {
      return await this.transferUSDC(address, amount);
    } catch (error: any) {
      // If minting fails due to association, return instructions
      if (
        error.message &&
        error.message.includes('TOKEN_NOT_ASSOCIATED_TO_ACCOUNT')
      ) {
        this.logger.warn(
          `Token not associated for ${address} - returning association instructions`,
        );
        return {
          success: false,
          needsAssociation: true,
          message: `Please associate USDC token (${USDC_TOKEN_ID}) with your account first using HashPack wallet. Go to the token page and click "Associate Token".`,
          tokenId: USDC_TOKEN_ID,
          address: address,
        };
      }
      throw error;
    }
  }

  async associateToken(
    address: string,
  ): Promise<{ success: boolean; message: string; transactionId?: string }> {
    try {
      if (!this.hederaClient) {
        throw new Error(
          'Faucet service not properly configured. Hedera client not initialized.',
        );
      }

      const tokenId = TokenId.fromString(USDC_TOKEN_ID);

      this.logger.log(
        `Attempting to associate token ${tokenId.toString()} with account ${address}`,
      );

      // Note: Token association requires the user's private key
      // Since we don't have that, we'll return instructions for the user
      return {
        success: false,
        message: `To receive USDC tokens, you need to associate token ${tokenId.toString()} with your account using your HashPack wallet. This is a one-time operation that costs a small amount of HBAR (~$0.05).`,
      };
    } catch (error: any) {
      this.logger.error(`Failed to associate token:`, error);
      throw new Error(
        `Failed to associate token: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  async getTokenBalance(
    address: string,
  ): Promise<{
    balance: string;
    tokenId: string;
    hbarBalance?: string;
    isAssociated?: boolean;
  }> {
    try {
      this.logger.log(
        `Getting token balance for ${address}, USDC_TOKEN_ID: ${USDC_TOKEN_ID}`,
      );
      
      if (!this.hederaClient) {
        this.logger.error('Hedera client not initialized - cannot get token balance');
        throw new Error(
          'Faucet service not properly configured. Hedera client not initialized.',
        );
      }

      const tokenId = TokenId.fromString(USDC_TOKEN_ID);
      const accountId = AccountId.fromString(address);

      this.logger.log(`Fetching balance for ${address}`);

      // Query account balance using AccountBalanceQuery
      const query = new AccountBalanceQuery().setAccountId(accountId);
      
      const accountBalance = await query.execute(this.hederaClient);
      
      this.logger.log(`Account balance query executed for ${address}`);
      
      // Get HBAR balance
      const hbarBalance = accountBalance.hbars.toString();
      
      // Get the balance for our specific token
      const tokenBalance = accountBalance.tokens?.get(tokenId);
      
      // Token is associated if it exists in the map (even with 0 balance)
      const isAssociated = tokenBalance !== null && tokenBalance !== undefined;
      
      if (!isAssociated) {
        this.logger.log(
          `Token ${tokenId.toString()} - NOT associated for ${address}`,
        );
        return {
          balance: '0',
          tokenId: tokenId.toString(),
          hbarBalance: hbarBalance,
          isAssociated: false,
        };
      }

      // Convert from smallest unit (6 decimals for USDC)
      const balance = (Number(tokenBalance.toString()) / 1000000).toFixed(2);
      
      this.logger.log(
        `✅ Balance for ${address} - HBAR: ${hbarBalance}, USDC: ${balance}, Associated: YES`,
      );
      
      return {
        balance: balance,
        tokenId: tokenId.toString(),
        hbarBalance: hbarBalance,
        isAssociated: true,
      };
    } catch (error: any) {
      this.logger.error(
        `Failed to get token balance for ${address}:`,
        error.message || error,
      );
      throw new Error(
        `Failed to get token balance: ${error.message || 'Unknown error'}`,
      );
    }
  }

  private mockMintResponse(address: string, amount: string) {
    const mockTxId = `0.0.${Math.floor(Math.random() * 1000000)}@${Date.now() / 1000}`;
    
    this.logger.log(`[MOCK] Minted ${amount} USDC to ${address}`);
    
    return {
      transactionHash: mockTxId,
      mintTransactionId: mockTxId,
      transferTransactionId: mockTxId,
      amount: amount,
      address: address,
      mock: true,
      message: 'Mock mint - Hedera client not configured'
    };
  }

  private async transferUSDC(address: string, amount: string) {
    try {
      const tokenId = TokenId.fromString(USDC_TOKEN_ID);
      const recipientAccountId = AccountId.fromString(address);

      this.logger.log(`Attempting to transfer ${amount} USDC to ${address}`);
      this.logger.log(
        `Token ID: ${tokenId.toString()}, Recipient: ${recipientAccountId.toString()}`,
      );

      const transferAmount = parseInt(amount) * 1000000; // 6 decimals for USDC

      // Check faucet account balance first
      const faucetBalance = await this.getTokenBalance(this.hederaAccountId.toString());
      const faucetBalanceAmount = parseFloat(faucetBalance.balance) * 1000000; // Convert to smallest units

      if (faucetBalanceAmount < transferAmount) {
        this.logger.error(`⚠️ Faucet account has insufficient balance. Available: ${faucetBalance.balance}, Required: ${amount}`);
        throw new Error(
          `Faucet account has insufficient USDC balance. Available: ${faucetBalance.balance}, Required: ${amount}`,
        );
      }

      // Transfer existing tokens from faucet account to recipient
      const transferTx = new TransferTransaction()
        .addTokenTransfer(tokenId, this.hederaAccountId, -transferAmount) // From faucet account
        .addTokenTransfer(tokenId, recipientAccountId, transferAmount); // To recipient

      const transferResponse = await transferTx.execute(this.hederaClient);
      await transferResponse.getReceipt(this.hederaClient);

      this.logger.log(
        `✅ Transfer transaction successful: ${transferResponse.transactionId.toString()}`,
      );

      return {
        transactionHash: transferResponse.transactionId.toString(),
        transferTransactionId: transferResponse.transactionId.toString(),
        amount: amount,
        address: address,
      };
      
    } catch (error: any) {
      this.logger.error('❌ Failed to transfer USDC:', error);
      
      // Check if it's a TOKEN_NOT_ASSOCIATED_TO_ACCOUNT error
      if (
        error.message &&
        error.message.includes('TOKEN_NOT_ASSOCIATED_TO_ACCOUNT')
      ) {
        this.logger.warn(
          '⚠️  Token not associated with account. User needs to associate token first.',
        );
        throw new Error(
          `Please associate USDC token (${USDC_TOKEN_ID}) with your account first using HashPack wallet. Go to the token page and click "Associate Token".`,
        );
      }
      
      // Check if it's an INVALID_TOKEN_ID error
      if (error.message && error.message.includes('INVALID_TOKEN_ID')) {
        this.logger.error('⚠️  Token ID is invalid or token cannot be transferred');
        throw new Error(
          `Invalid token ID: ${USDC_TOKEN_ID}. Please check the token configuration.`,
        );
      }
      
      // Re-throw the original error instead of returning mock response
      this.logger.error(
        '❌ Transfer failed with error:',
        error.message || error,
      );
      throw error;
    }
  }

}