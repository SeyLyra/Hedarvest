import { Injectable, Logger } from '@nestjs/common';
import {
  Client,
  TransferTransaction,
  AccountId,
  TokenId,
  PrivateKey,
  AccountBalanceQuery,
  TokenMintTransaction,
} from '@hashgraph/sdk';

// Hedera Token IDs for different tokens
const USDC_TOKEN_ID = process.env.USDC_TOKEN_ID || '0.0.7115536';
const WHEAT_TOKEN_ID = process.env.WHEAT_TOKEN_ID || '0.0.7121333';
const RICE_TOKEN_ID = process.env.RICE_TOKEN_ID || '0.0.7121334';
const CORN_TOKEN_ID = process.env.CORN_TOKEN_ID || '0.0.7121335';

// Token configuration
const TOKEN_CONFIG = {
  usdc: {
    id: USDC_TOKEN_ID,
    decimals: 6,
    name: 'USDC',
    symbol: 'USDC',
  },
  wheat: {
    id: WHEAT_TOKEN_ID,
    decimals: 8,
    name: 'Wheat Token',
    symbol: 'WHEAT',
  },
  rice: {
    id: RICE_TOKEN_ID,
    decimals: 8,
    name: 'Rice Token',
    symbol: 'RICE',
  },
  corn: {
    id: CORN_TOKEN_ID,
    decimals: 8,
    name: 'Corn Token',
    symbol: 'CORN',
  },
};

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

  async mintTokens(
    address: string,
    amount: string,
    tokenType: string = 'usdc',
  ) {
    this.logger.log(
      `Minting ${amount} ${tokenType.toUpperCase()} to ${address}`,
    );

    // Validate token type
    if (!TOKEN_CONFIG[tokenType as keyof typeof TOKEN_CONFIG]) {
      throw new Error(
        `Invalid token type: ${tokenType}. Supported types: usdc, wheat, rice, corn`,
      );
    }

    const tokenConfig = TOKEN_CONFIG[tokenType as keyof typeof TOKEN_CONFIG];

    // Check if Hedera client is initialized
    if (!this.hederaClient) {
      this.logger.error('Hedera client not initialized - cannot mint tokens');
      throw new Error(
        'Faucet service not properly configured. Hedera client not initialized.',
      );
    }

    // Mint new tokens and transfer to recipient
    this.logger.log(
      `Attempting to mint ${amount} ${tokenConfig.symbol} to ${address}`,
    );

    try {
      return await this.transferTokens(address, amount, tokenType);
    } catch (error: any) {
      // If minting fails due to association, return instructions
      if (
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        error.message &&
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        error.message.includes('TOKEN_NOT_ASSOCIATED_TO_ACCOUNT')
      ) {
        this.logger.warn(
          `${tokenConfig.symbol} token not associated for ${address} - returning association instructions`,
        );
        return {
          success: false,
          needsAssociation: true,
          message: `Please associate ${tokenConfig.symbol} token (${tokenConfig.id}) with your account first using HashPack wallet. Go to the token page and click "Associate Token".`,
          tokenId: tokenConfig.id,
          address: address,
        };
      }
      throw error;
    }
  }

  // eslint-disable-next-line @typescript-eslint/require-await
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
    tokenType: string = 'usdc',
  ): Promise<{
    balance: string;
    tokenId: string;
    hbarBalance?: string;
    isAssociated?: boolean;
  }> {
    try {
      const tokenConfig = TOKEN_CONFIG[tokenType as keyof typeof TOKEN_CONFIG];

      this.logger.log(
        `Getting ${tokenConfig.symbol} balance for ${address}, Token ID: ${tokenConfig.id}`,
      );

      if (!this.hederaClient) {
        this.logger.error(
          'Hedera client not initialized - cannot get token balance',
        );
        throw new Error(
          'Faucet service not properly configured. Hedera client not initialized.',
        );
      }

      const tokenId = TokenId.fromString(tokenConfig.id);
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

      // Convert from smallest unit based on token decimals
      const balance = (
        Number(tokenBalance.toString()) / Math.pow(10, tokenConfig.decimals)
      ).toFixed(2);

      this.logger.log(
        `✅ Balance for ${address} - HBAR: ${hbarBalance}, ${tokenConfig.symbol}: ${balance}, Associated: YES`,
      );

      return {
        balance: balance,
        tokenId: tokenId.toString(),
        hbarBalance: hbarBalance,
        isAssociated: true,
      };
    } catch (error: any) {
      this.logger.error(
        `Failed to get ${tokenType} balance for ${address}:`,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        error.message || error,
      );
      throw new Error(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
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
      message: 'Mock mint - Hedera client not configured',
    };
  }

  private async transferTokens(
    address: string,
    amount: string,
    tokenType: string,
  ) {
    try {
      const tokenConfig = TOKEN_CONFIG[tokenType as keyof typeof TOKEN_CONFIG];
      const tokenId = TokenId.fromString(tokenConfig.id);
      const recipientAccountId = AccountId.fromString(address);

      this.logger.log(
        `Attempting to mint and transfer ${amount} ${tokenConfig.symbol} to ${address}`,
      );
      this.logger.log(
        `Token ID: ${tokenId.toString()}, Recipient: ${recipientAccountId.toString()}`,
      );

      const mintAmount = parseInt(amount) * Math.pow(10, tokenConfig.decimals);

      // Step 1: Mint new tokens to the faucet account
      this.logger.log(`Minting ${mintAmount} ${tokenConfig.symbol} tokens...`);
      const mintTx = new TokenMintTransaction()
        .setTokenId(tokenId)
        .setAmount(mintAmount);

      const mintResponse = await mintTx.execute(this.hederaClient);
      await mintResponse.getReceipt(this.hederaClient);

      this.logger.log(
        `✅ Mint transaction successful: ${mintResponse.transactionId.toString()}`,
      );

      // Step 2: Transfer the newly minted tokens to the recipient
      this.logger.log(
        `Transferring ${mintAmount} ${tokenConfig.symbol} to ${address}...`,
      );
      const transferTx = new TransferTransaction()
        .addTokenTransfer(tokenId, this.hederaAccountId, -mintAmount) // From faucet account
        .addTokenTransfer(tokenId, recipientAccountId, mintAmount); // To recipient

      const transferResponse = await transferTx.execute(this.hederaClient);
      await transferResponse.getReceipt(this.hederaClient);

      this.logger.log(
        `✅ Transfer transaction successful: ${transferResponse.transactionId.toString()}`,
      );

      return {
        transactionHash: transferResponse.transactionId.toString(),
        mintTransactionId: mintResponse.transactionId.toString(),
        transferTransactionId: transferResponse.transactionId.toString(),
        amount: amount,
        address: address,
        tokenType: tokenType,
        tokenSymbol: tokenConfig.symbol,
      };
    } catch (error: any) {
      this.logger.error(
        `❌ Failed to mint and transfer ${tokenType.toUpperCase()}:`,
        error,
      );

      // Check if it's a TOKEN_NOT_ASSOCIATED_TO_ACCOUNT error
      if (
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        error.message &&
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        error.message.includes('TOKEN_NOT_ASSOCIATED_TO_ACCOUNT')
      ) {
        this.logger.warn(
          '⚠️  Token not associated with account. User needs to associate token first.',
        );
        const tokenConfig =
          TOKEN_CONFIG[tokenType as keyof typeof TOKEN_CONFIG];
        throw new Error(
          `Please associate ${tokenConfig.symbol} token (${tokenConfig.id}) with your account first using HashPack wallet. Go to the token page and click "Associate Token".`,
        );
      }

      // Check if it's an INVALID_TOKEN_ID error
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
      if (error.message && error.message.includes('INVALID_TOKEN_ID')) {
        this.logger.error(
          '⚠️  Token ID is invalid or token cannot be transferred',
        );
        const tokenConfig =
          TOKEN_CONFIG[tokenType as keyof typeof TOKEN_CONFIG];
        throw new Error(
          `Invalid token ID: ${tokenConfig.id}. Please check the token configuration.`,
        );
      }

      // Re-throw the original error instead of returning mock response
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      throw new Error(`Token minting and transfer failed: ${error.message}`);
    }
  }
}
