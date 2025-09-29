import { Injectable, Logger } from '@nestjs/common';
import {
  Client,
  TokenMintTransaction,
  TransferTransaction,
  AccountId,
  TokenId,
  PrivateKey,
  Hbar
} from '@hashgraph/sdk';

// Hedera Token ID for USDT (you'll need to set this in your .env)
const USDT_TOKEN_ID = process.env.USDT_TOKEN_ID;

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
        this.logger.warn('HEDERA_OPERATOR_ID and HEDERA_OPERATOR_KEY not set - faucet will work in mock mode');
        return;
      }

      this.hederaAccountId = AccountId.fromString(accountId);
      this.hederaPrivateKey = PrivateKey.fromString(privateKey);

      // Create Hedera client
      this.hederaClient = Client.forName(network);
      this.hederaClient.setOperator(this.hederaAccountId, this.hederaPrivateKey);
      
      this.logger.log(`Hedera faucet service initialized with account: ${this.hederaAccountId.toString()}`);
    } catch (error) {
      this.logger.warn('Failed to initialize Hedera client - faucet will work in mock mode:', error);
    }
  }

  async mintTokens(address: string, amount: string) {
    this.logger.log(`Minting ${amount} USDT to ${address}`);
    return await this.mintAndTransferUSDT(address, amount);
  }

  private async mintAndTransferUSDT(address: string, amount: string) {
    try {
      const tokenId = TokenId.fromString(process.env.USDT_TOKEN_ID || '0.0.6914768');
      const recipientAccountId = AccountId.fromString(address);
      const mintAmount = parseInt(amount) * 1000000; // Assuming 6 decimals for USDT

      this.logger.log(`Minting ${amount} USDT (${mintAmount} units) to ${address}`);

      // Step 1: Mint tokens to the faucet account
      const mintTx = new TokenMintTransaction()
        .setTokenId(tokenId)
        .setAmount(mintAmount);

      const mintResponse = await mintTx.execute(this.hederaClient);
      const mintReceipt = await mintResponse.getReceipt(this.hederaClient);

      this.logger.log(`Mint transaction successful: ${mintResponse.transactionId.toString()}`);

             // Step 2: Transfer minted tokens to the recipient
             const transferTx = new TransferTransaction()
               .addTokenTransfer(tokenId, this.hederaAccountId, -mintAmount) // From faucet account
               .addTokenTransfer(tokenId, recipientAccountId, mintAmount);   // To recipient

      const transferResponse = await transferTx.execute(this.hederaClient);
      const transferReceipt = await transferResponse.getReceipt(this.hederaClient);

      this.logger.log(`Transfer transaction successful: ${transferResponse.transactionId.toString()}`);

      return {
        transactionHash: transferResponse.transactionId.toString(),
        mintTransactionId: mintResponse.transactionId.toString(),
        transferTransactionId: transferResponse.transactionId.toString(),
        amount: amount,
        address: address
      };
      
    } catch (error) {
      this.logger.error('Failed to mint and transfer USDT:', error);
      throw new Error(`Failed to mint and transfer USDT: ${error.message}`);
    }
  }

}