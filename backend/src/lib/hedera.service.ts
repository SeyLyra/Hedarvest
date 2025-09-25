import { Injectable, Logger } from '@nestjs/common';
import {
  Client,
  PrivateKey,
  AccountId,
  TokenCreateTransaction,
  TokenMintTransaction,
  TransferTransaction,
  Hbar,
  TokenId,
  AccountBalanceQuery,
  TokenInfoQuery,
  TransactionReceipt,
  TransactionResponse,
} from '@hashgraph/sdk';
import { env } from './env';

@Injectable()
export class HederaService {
  private readonly logger = new Logger(HederaService.name);
  private client: Client;

  constructor() {
    this.initializeClient();
  }

  private initializeClient() {
    try {
      const operatorId = AccountId.fromString(env.HEDERA_OPERATOR_ID);
      const operatorKey = PrivateKey.fromString(env.HEDERA_OPERATOR_KEY);

      this.client = Client.forName(env.HEDERA_NETWORK);
      this.client.setOperator(operatorId, operatorKey);

      this.logger.log(`Hedera client initialized for ${env.HEDERA_NETWORK}`);
    } catch (error) {
      this.logger.error('Failed to initialize Hedera client:', error);
      throw new Error('Hedera client initialization failed');
    }
  }

  async createToken(
    name: string,
    symbol: string,
    decimals: number = 8,
    initialSupply: number = 1000000,
    treasuryAccountId?: string,
  ): Promise<{ tokenId: string; transactionId: string }> {
    try {
      const treasuryId = treasuryAccountId 
        ? AccountId.fromString(treasuryAccountId)
        : this.client.operatorAccountId || AccountId.fromString('0.0.0');

      const tokenCreateTx = new TokenCreateTransaction()
        .setTokenName(name)
        .setTokenSymbol(symbol)
        .setDecimals(decimals)
        .setInitialSupply(initialSupply)
        .setTreasuryAccountId(treasuryId)
        .setFreezeDefault(false);

      if (this.client.operatorPublicKey) {
        tokenCreateTx
          .setAdminKey(this.client.operatorPublicKey)
          .setSupplyKey(this.client.operatorPublicKey);
      }

      const tokenCreateResponse = await tokenCreateTx.execute(this.client);
      const tokenCreateReceipt = await tokenCreateResponse.getReceipt(this.client);
      const tokenId = tokenCreateReceipt.tokenId;

      this.logger.log(`Token created: ${tokenId?.toString()}`);

      return {
        tokenId: tokenId?.toString() || '',
        transactionId: tokenCreateResponse.transactionId.toString(),
      };
    } catch (error) {
      this.logger.error('Failed to create token:', error);
      throw new Error(`Token creation failed: ${error.message}`);
    }
  }

  async mintToken(
    tokenId: string,
    amount: number,
    toAccountId?: string,
  ): Promise<{ transactionId: string; newTotalSupply: number }> {
    try {
      const tokenIdObj = TokenId.fromString(tokenId);
      const toAccount = toAccountId 
        ? AccountId.fromString(toAccountId)
        : this.client.operatorAccountId;

      const tokenMintTx = new TokenMintTransaction()
        .setTokenId(tokenIdObj)
        .setAmount(amount);

      const tokenMintResponse = await tokenMintTx.execute(this.client);
      const tokenMintReceipt = await tokenMintResponse.getReceipt(this.client);

      this.logger.log(`Token minted: ${amount} tokens of ${tokenId}`);

      return {
        transactionId: tokenMintResponse.transactionId.toString(),
        newTotalSupply: tokenMintReceipt.totalSupply?.toNumber() || 0,
      };
    } catch (error) {
      this.logger.error('Failed to mint token:', error);
      throw new Error(`Token minting failed: ${error.message}`);
    }
  }

  async transferToken(
    tokenId: string,
    fromAccountId: string,
    toAccountId: string,
    amount: number,
  ): Promise<{ transactionId: string }> {
    try {
      const tokenIdObj = TokenId.fromString(tokenId);
      const fromAccount = AccountId.fromString(fromAccountId);
      const toAccount = AccountId.fromString(toAccountId);

      const tokenTransferTx = new TransferTransaction()
        .addTokenTransfer(tokenIdObj, fromAccount, -amount)
        .addTokenTransfer(tokenIdObj, toAccount, amount);

      const tokenTransferResponse = await tokenTransferTx.execute(this.client);
      const tokenTransferReceipt = await tokenTransferResponse.getReceipt(this.client);

      this.logger.log(`Token transferred: ${amount} from ${fromAccountId} to ${toAccountId}`);

      return {
        transactionId: tokenTransferResponse.transactionId.toString(),
      };
    } catch (error) {
      this.logger.error('Failed to transfer token:', error);
      throw new Error(`Token transfer failed: ${error.message}`);
    }
  }

  async transferHbar(
    fromAccountId: string,
    toAccountId: string,
    amount: number,
  ): Promise<{ transactionId: string }> {
    try {
      const fromAccount = AccountId.fromString(fromAccountId);
      const toAccount = AccountId.fromString(toAccountId);

      const transferTx = new TransferTransaction()
        .addHbarTransfer(fromAccount, Hbar.fromTinybars(-amount))
        .addHbarTransfer(toAccount, Hbar.fromTinybars(amount));

      const transferResponse = await transferTx.execute(this.client);
      const transferReceipt = await transferResponse.getReceipt(this.client);

      this.logger.log(`HBAR transferred: ${amount} tinybars from ${fromAccountId} to ${toAccountId}`);

      return {
        transactionId: transferResponse.transactionId.toString(),
      };
    } catch (error) {
      this.logger.error('Failed to transfer HBAR:', error);
      throw new Error(`HBAR transfer failed: ${error.message}`);
    }
  }

  async getAccountBalance(accountId: string): Promise<{
    hbarBalance: number;
    tokenBalances: { tokenId: string; balance: number }[];
  }> {
    try {
      const account = AccountId.fromString(accountId);
      const balanceQuery = new AccountBalanceQuery().setAccountId(account);
      const balance = await balanceQuery.execute(this.client);

      const tokenBalances = balance.tokens ? Object.values(balance.tokens).map((tokenBalance) => ({
        tokenId: tokenBalance.tokenId.toString(),
        balance: tokenBalance.balance.toNumber(),
      })) : [];

      return {
        hbarBalance: balance.hbars.toTinybars().toNumber(),
        tokenBalances,
      };
    } catch (error) {
      this.logger.error('Failed to get account balance:', error);
      throw new Error(`Balance query failed: ${error.message}`);
    }
  }

  async getTokenInfo(tokenId: string): Promise<{
    tokenId: string;
    name: string;
    symbol: string;
    decimals: number;
    totalSupply: number;
  }> {
    try {
      const tokenIdObj = TokenId.fromString(tokenId);
      const tokenInfoQuery = new TokenInfoQuery().setTokenId(tokenIdObj);
      const tokenInfo = await tokenInfoQuery.execute(this.client);

      return {
        tokenId: tokenInfo.tokenId.toString(),
        name: tokenInfo.name || '',
        symbol: tokenInfo.symbol || '',
        decimals: tokenInfo.decimals || 0,
        totalSupply: tokenInfo.totalSupply?.toNumber() || 0,
      };
    } catch (error) {
      this.logger.error('Failed to get token info:', error);
      throw new Error(`Token info query failed: ${error.message}`);
    }
  }

  async createPoolToken(
    grainType: string,
    poolId: number,
  ): Promise<{ tokenId: string; transactionId: string }> {
    const tokenName = `Hedarvest ${grainType} Pool ${poolId}`;
    const tokenSymbol = `HDP${poolId}`;
    
    return this.createToken(tokenName, tokenSymbol, 8, 0);
  }

  async processPoolDeposit(
    poolTokenId: string,
    depositorAccountId: string,
    amount: number,
  ): Promise<{ transactionId: string }> {
    // Mint tokens to the depositor
    const mintResult = await this.mintToken(poolTokenId, amount, depositorAccountId);
    
    return {
      transactionId: mintResult.transactionId,
    };
  }

  async processFarmerLoan(
    farmerAccountId: string,
    amount: number,
  ): Promise<{ transactionId: string }> {
    // Transfer HBAR to farmer as loan
    const operatorAccountId = this.client.operatorAccountId?.toString() || '';
    
    return this.transferHbar(operatorAccountId, farmerAccountId, amount);
  }

  async processGrainDeposit(
    agentAccountId: string,
    amount: number,
  ): Promise<{ transactionId: string }> {
    // Transfer HBAR to agent for grain purchase
    const operatorAccountId = this.client.operatorAccountId?.toString() || '';
    
    return this.transferHbar(operatorAccountId, agentAccountId, amount);
  }
}
