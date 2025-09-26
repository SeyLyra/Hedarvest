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
} from '@hashgraph/sdk';
import { ethers } from 'ethers';
import { ContractService } from './contract.service';
import { HcsService } from '../hcs/hcs.service';
// Using process.env directly

@Injectable()
export class HederaService {
  private readonly logger = new Logger(HederaService.name);
  private client: Client;

  constructor(
    private readonly contractService: ContractService,
    private readonly hcsService: HcsService
  ) {
    this.initializeClient();
  }

  private initializeClient() {
    try {
      const operatorId = AccountId.fromString(process.env.HEDERA_OPERATOR_ID!);
      const operatorKey = PrivateKey.fromString(process.env.HEDERA_OPERATOR_KEY!);

      this.client = Client.forName(process.env.HEDERA_NETWORK! as any);
      this.client.setOperator(operatorId, operatorKey);

      this.logger.log(`Hedera client initialized for ${process.env.HEDERA_NETWORK}`);
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

  // ===================
  // Contract Integration Methods
  // ===================

  async getAllDeployedPools(): Promise<string[]> {
    try {
      const pools = await this.contractService.getAllPools();
      return pools.map(pool => pool.poolAddress);
    } catch (error) {
      this.logger.error('Failed to get deployed pools:', error);
      throw new Error(`Failed to get deployed pools: ${error.message}`);
    }
  }

  async getPoolInfo(grainType: string): Promise<{
    grainType: string;
    lendingToken: string;
    collateralToken: string;
    oracle: string;
    baseLTV: number;
    riskPremium: number;
    debtCeiling: string;
    protocolFee: number;
    totalBorrows: string;
    totalReserves: string;
    availableLiquidity: string;
    exchangeRate: string;
  }> {
    try {
       const poolAddress = await this.contractService.getPoolAddress(grainType);
      return await this.contractService.getPoolInfo(poolAddress);
    } catch (error) {
      this.logger.error(`Failed to get pool info for ${grainType}:`, error);
      throw new Error(`Failed to get pool info for ${grainType}: ${error.message}`);
    }
  }

  async getPoolStats(grainType: string): Promise<{
    availableLiquidity: string;
    totalBorrows: string;
    utilizationRate: number;
  }> {
    try {
       const poolAddress = await this.contractService.getPoolAddress(grainType);
      const balance = await this.contractService.getPoolBalance(poolAddress);
      const totalLiquidity = BigInt(balance.availableLiquidity) + BigInt(balance.totalBorrows);
      const utilizationRate = totalLiquidity > 0 
        ? Number(BigInt(balance.totalBorrows) * 10000n / totalLiquidity) / 100 
        : 0;

      return {
        availableLiquidity: balance.availableLiquidity,
        totalBorrows: balance.totalBorrows,
        utilizationRate
      };
    } catch (error) {
      this.logger.error(`Failed to get pool stats for ${grainType}:`, error);
      throw new Error(`Failed to get pool stats for ${grainType}: ${error.message}`);
    }
  }

  async getGrainPrice(grainType: string): Promise<string> {
    try {
       const oracleAddress = await this.contractService.getOracleAddress(grainType);
      return await this.contractService.getPrice(oracleAddress);
    } catch (error) {
      this.logger.error(`Failed to get price for ${grainType}:`, error);
      throw new Error(`Failed to get price for ${grainType}: ${error.message}`);
    }
  }

  // Investor operations
  async depositToPool(grainType: string, amount: string, investorAddress: string): Promise<{
    transactionId: string;
    contractTxHash: string;
  }> {
    try {
       const poolAddress = await this.contractService.getPoolAddress(grainType);
      const contractTxHash = await this.contractService.depositToPool(poolAddress, amount);
      
      // Log the operation in Hedera for audit trail
      const operatorAccountId = this.client.operatorAccountId?.toString() || '';
      
      // Publish HCS event
      try {
        await this.hcsService.publishInvestorDeposit({
          poolAddress,
          grainType,
          amount: parseFloat(amount),
          depositorAddress: investorAddress,
          contractTxHash,
        });
      } catch (hcsError) {
        this.logger.warn('Failed to publish HCS event for investor deposit:', hcsError);
      }
      
      return {
        transactionId: `pool-deposit-${Date.now()}`,
        contractTxHash
      };
    } catch (error) {
      this.logger.error(`Failed to deposit to ${grainType} pool:`, error);
      throw new Error(`Failed to deposit to pool: ${error.message}`);
    }
  }

  async withdrawFromPool(grainType: string, shares: string, investorAddress: string): Promise<{
    transactionId: string;
    contractTxHash: string;
  }> {
    try {
       const poolAddress = await this.contractService.getPoolAddress(grainType);
      const contractTxHash = await this.contractService.withdrawFromPool(poolAddress, shares);
      
      // Publish HCS event
      try {
        await this.hcsService.publishInvestorWithdraw({
          poolAddress,
          grainType,
          shares: parseFloat(shares),
          depositorAddress: investorAddress,
          contractTxHash,
          withdrawalAmount: parseFloat(shares), // Simplified - should calculate based on exchange rate
        });
      } catch (hcsError) {
        this.logger.warn('Failed to publish HCS event for investor withdraw:', hcsError);
      }
      
      return {
        transactionId: `pool-withdraw-${Date.now()}`,
        contractTxHash
      };
    } catch (error) {
      this.logger.error(`Failed to withdraw from ${grainType} pool:`, error);
      throw new Error(`Failed to withdraw from pool: ${error.message}`);
    }
  }

  // Farmer operations
  async depositGrainCollateral(grainType: string, amount: string, farmerAddress: string): Promise<{
    transactionId: string;
    contractTxHash: string;
  }> {
    try {
       const poolAddress = await this.contractService.getPoolAddress(grainType);
      const contractTxHash = await this.contractService.depositCollateral(poolAddress, amount);
      
      // Publish HCS event
      try {
        await this.hcsService.publishCollateralDeposited({
          poolAddress,
          grainType,
          farmerAddress,
          collateralAmount: parseFloat(amount),
          contractTxHash,
        });
      } catch (hcsError) {
        this.logger.warn('Failed to publish HCS event for collateral deposit:', hcsError);
      }
      
      return {
        transactionId: `collateral-deposit-${Date.now()}`,
        contractTxHash
      };
    } catch (error) {
      this.logger.error(`Failed to deposit collateral for ${grainType}:`, error);
      throw new Error(`Failed to deposit collateral: ${error.message}`);
    }
  }

  async createFarmerLoan(grainType: string, farmerAddress: string, amount: string): Promise<{
    transactionId: string;
    contractTxHash: string;
  }> {
    try {
       const poolAddress = await this.contractService.getPoolAddress(grainType);
      const contractTxHash = await this.contractService.createLoan(poolAddress, farmerAddress, amount);
      
      // Publish HCS event
      try {
        await this.hcsService.publishLoanCreated({
          poolAddress,
          grainType,
          farmerAddress,
          loanAmount: parseFloat(amount),
          collateralAmount: 0, // Would need to get actual collateral amount
          contractTxHash,
        });
      } catch (hcsError) {
        this.logger.warn('Failed to publish HCS event for loan creation:', hcsError);
      }
      
      return {
        transactionId: `loan-create-${Date.now()}`,
        contractTxHash
      };
    } catch (error) {
      this.logger.error(`Failed to create loan for farmer ${farmerAddress}:`, error);
      throw new Error(`Failed to create loan: ${error.message}`);
    }
  }

  async repayFarmerLoan(grainType: string, amount: string, farmerAddress: string): Promise<{
    transactionId: string;
    contractTxHash: string;
  }> {
    try {
       const poolAddress = await this.contractService.getPoolAddress(grainType);
      const contractTxHash = await this.contractService.repayLoan(poolAddress, amount);
      
      // Publish HCS event
      try {
        await this.hcsService.publishLoanRepaid({
          poolAddress,
          grainType,
          farmerAddress,
          repaymentAmount: parseFloat(amount),
          contractTxHash,
        });
      } catch (hcsError) {
        this.logger.warn('Failed to publish HCS event for loan repayment:', hcsError);
      }
      
      return {
        transactionId: `loan-repay-${Date.now()}`,
        contractTxHash
      };
    } catch (error) {
      this.logger.error(`Failed to repay loan for farmer ${farmerAddress}:`, error);
      throw new Error(`Failed to repay loan: ${error.message}`);
    }
  }

  async getFarmerPosition(grainType: string, farmerAddress: string): Promise<{
    collateral: string;
    borrows: string;
    collateralValueUSD: string;
    maxBorrow: string;
  }> {
    try {
       const poolAddress = await this.contractService.getPoolAddress(grainType);
      const pool = new ethers.Contract(poolAddress, [
        'function borrows(address) external view returns (uint256)',
        'function collateral(address) external view returns (uint256)',
        'function baseLTV() external view returns (uint256)',
        'function priceOracle() external view returns (address)'
      ], this.contractService['wallet']);
      
      const [collateral, borrows, baseLTV, oracleAddress] = await Promise.all([
        pool.collateral(farmerAddress),
        pool.borrows(farmerAddress),
        pool.baseLTV(),
        pool.priceOracle()
      ]);

      const price = await this.contractService.getPrice(oracleAddress);
      const collateralValueUSD = (BigInt(collateral) * BigInt(price)) / BigInt(10**18);
      const maxBorrow = (collateralValueUSD * BigInt(baseLTV)) / 10000n;

      return {
        collateral: collateral.toString(),
        borrows: borrows.toString(),
        collateralValueUSD: collateralValueUSD.toString(),
        maxBorrow: maxBorrow.toString()
      };
    } catch (error) {
      this.logger.error(`Failed to get farmer position for ${farmerAddress}:`, error);
      throw new Error(`Failed to get farmer position: ${error.message}`);
    }
  }
}
