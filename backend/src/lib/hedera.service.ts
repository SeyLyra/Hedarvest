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
  TokenAssociateTransaction,
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

  /**
   * Associate a token with an account using the operator's credentials
   * @param accountId The account ID to associate the token with
   * @param tokenId The token ID to associate
   * @returns Transaction result with status
   */
  async associateToken(
    accountId: string,
    tokenId: string,
  ): Promise<{ transactionId: string; status: string }> {
    try {
      const accountIdObj = AccountId.fromString(accountId);
      const tokenIdObj = TokenId.fromString(tokenId);

      // Create token association transaction using operator's credentials
      const transaction = new TokenAssociateTransaction()
        .setAccountId(accountIdObj)
        .setTokenIds([tokenIdObj]);

      // Sign with operator private key (this service is using operator credentials)
      const operatorKey = PrivateKey.fromString(process.env.HEDERA_OPERATOR_KEY!);
      const signedTx = await transaction.freezeWith(this.client).sign(operatorKey);

      // Submit and get receipt
      const executeResult = await signedTx.execute(this.client);
      const receipt = await executeResult.getReceipt(this.client);

      if (receipt.status.toString() === 'SUCCESS') {
        this.logger.log(`Association SUCCESS for ${accountId} with token ${tokenId}`);
        return {
          transactionId: executeResult.transactionId.toString(),
          status: receipt.status.toString(),
        };
      } else {
        this.logger.warn(`Association FAILED for ${accountId} with token ${tokenId}: ${receipt.status.toString()}`);
        return {
          transactionId: executeResult.transactionId.toString(),
          status: receipt.status.toString(),
        };
      }
    } catch (error) {
      this.logger.error(`Failed to associate token ${tokenId} with account ${accountId}:`, error);
      throw new Error(`Token association failed: ${error.message}`);
    }
  }

  /**
   * Associate a token with an account using user's private key
   * @param accountId The account ID to associate the token with
   * @param privateKey The user's private key (PEM format or hex string)
   * @param tokenId The token ID to associate
   * @returns Transaction result with status
   */
  async associateTokenWithUserKey(
    accountId: string,
    privateKey: string,
    tokenId: string,
  ): Promise<{ transactionId: string; status: string }> {
    try {
      const accountIdObj = AccountId.fromString(accountId);
      const tokenIdObj = TokenId.fromString(tokenId);
      
      // Parse the private key - handle both hex and PEM formats
      let userPrivateKey: PrivateKey;
      try {
        // Try as hex string first (most common format)
        userPrivateKey = PrivateKey.fromString(privateKey);
      } catch {
        // If that fails, might be PEM format or other, let SDK handle it
        userPrivateKey = PrivateKey.fromString(privateKey);
      }

      // Create token association transaction
      const transaction = new TokenAssociateTransaction()
        .setAccountId(accountIdObj)
        .setTokenIds([tokenIdObj]);

      // Sign with user's private key
      const signedTx = await transaction.freezeWith(this.client).sign(userPrivateKey);

      // Submit and get receipt
      const executeResult = await signedTx.execute(this.client);
      const receipt = await executeResult.getReceipt(this.client);

      if (receipt.status.toString() === 'SUCCESS') {
        this.logger.log(`Association SUCCESS for ${accountId} with token ${tokenId}`);
        return {
          transactionId: executeResult.transactionId.toString(),
          status: receipt.status.toString(),
        };
      } else {
        this.logger.warn(`Association FAILED for ${accountId} with token ${tokenId}: ${receipt.status.toString()}`);
        return {
          transactionId: executeResult.transactionId.toString(),
          status: receipt.status.toString(),
        };
      }
    } catch (error) {
      this.logger.error(`Failed to associate token ${tokenId} with account ${accountId} using user key:`, error);
      throw new Error(`Token association with user key failed: ${error.message}`);
    }
  }

  /**
   * Check if an account is associated with a token
   * @param accountId The account ID to check
   * @param tokenId The token ID to check
   * @returns Association status and token info if associated
   */
  async checkTokenAssociation(
    accountId: string,
    tokenId: string,
  ): Promise<{ isAssociated: boolean; tokenInfo?: any }> {
    try {
      const accountIdObj = AccountId.fromString(accountId);
      const balanceQuery = new AccountBalanceQuery().setAccountId(accountIdObj);
      const balance = await balanceQuery.execute(this.client);

      // Check if the token exists in the account's token balances
      const tokenIdObj = TokenId.fromString(tokenId);
      const isAssociated = balance.tokens ? balance.tokens.get(tokenIdObj) !== undefined : false;

      let tokenInfo: any = undefined;
      if (isAssociated) {
        try {
          tokenInfo = await this.getTokenInfo(tokenId);
        } catch (err) {
          this.logger.warn(`Could not get token info for ${tokenId}`, err);
        }
      }

      return {
        isAssociated: isAssociated || false,
        tokenInfo,
      };
    } catch (error) {
      this.logger.error(`Failed to check token association for account ${accountId} and token ${tokenId}:`, error);
      throw new Error(`Token association check failed: ${error.message}`);
    }
  }

  /**
   * Helper to ensure token association before operations
   * @param accountId The account ID
   * @param tokenId The token ID
   * @param userPrivateKey Optional user private key - if provided, will use user key for association
   * @returns Association result
   */
  async ensureTokenAssociation(
    accountId: string,
    tokenId: string,
    userPrivateKey?: string,
  ): Promise<{ transactionId?: string; status: string; alreadyAssociated: boolean }> {
    try {
      // First check if already associated
      const associationCheck = await this.checkTokenAssociation(accountId, tokenId);
      
      if (associationCheck.isAssociated) {
        return {
          status: 'SUCCESS',
          alreadyAssociated: true,
        };
      }

      // If not associated, attempt association
      let associationResult;
      if (userPrivateKey) {
        // Use user's private key if provided
        associationResult = await this.associateTokenWithUserKey(accountId, userPrivateKey, tokenId);
      } else {
        // Use operator credentials
        associationResult = await this.associateToken(accountId, tokenId);
      }

      return {
        transactionId: associationResult.transactionId,
        status: associationResult.status,
        alreadyAssociated: false,
      };
    } catch (error) {
      this.logger.error(`Failed to ensure token association for account ${accountId} and token ${tokenId}:`, error);
      throw new Error(`Token association ensure failed: ${error.message}`);
    }
  }

  /**
   * Associate a token with a contract address
   * This is needed when contracts need to interact with tokens
   * @param contractAddress The contract address to associate the token with
   * @param tokenId The token ID to associate
   * @returns Association result
   */
  async associateTokenWithContract(
    contractAddress: string,
    tokenId: string,
  ): Promise<{ transactionId?: string; status: string; alreadyAssociated: boolean }> {
    try {
      this.logger.log(`Associating token ${tokenId} with contract ${contractAddress}`);
      
      // First check if already associated
      const associationCheck = await this.checkTokenAssociation(contractAddress, tokenId);
      
      if (associationCheck.isAssociated) {
        this.logger.log(`Token ${tokenId} already associated with contract ${contractAddress}`);
        return {
          status: 'SUCCESS',
          alreadyAssociated: true,
        };
      }

      // Associate token with contract using operator credentials
      const associationResult = await this.associateToken(contractAddress, tokenId);

      this.logger.log(`Token association result for contract ${contractAddress}:`, associationResult);
      return {
        transactionId: associationResult.transactionId,
        status: associationResult.status,
        alreadyAssociated: false,
      };
    } catch (error) {
      this.logger.error(`Failed to associate token ${tokenId} with contract ${contractAddress}:`, error);
      throw new Error(`Contract token association failed: ${error.message}`);
    }
  }

  /**
   * Ensure token association for both user and contract addresses
   * This helper method handles the common case where both user and contract need token association
   * @param userAccountId User account ID
   * @param contractAddress Contract address
   * @param tokenId Token ID
   * @param userPrivateKey Optional user private key for user association
   * @returns Association results for both user and contract
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
      this.logger.log(`Ensuring token ${tokenId} association for user ${userAccountId} and contract ${contractAddress}`);
      
      // Associate token with user account
      const userAssociationResult = await this.ensureTokenAssociation(
        userAccountId,
        tokenId,
        userPrivateKey,
      );

      // Associate token with contract address
      const contractAssociationResult = await this.associateTokenWithContract(
        contractAddress,
        tokenId,
      );

      this.logger.log('Token association results:', {
        user: userAssociationResult,
        contract: contractAssociationResult,
      });

      return {
        userAssociation: userAssociationResult,
        contractAssociation: contractAssociationResult,
      };
    } catch (error) {
      this.logger.error(`Failed to ensure token association for user and contract:`, error);
      throw new Error(`User and contract token association failed: ${error.message}`);
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
      const poolAddresses = await this.contractService.getAllPools();
      return poolAddresses;
    } catch (error) {
      this.logger.error('Failed to get deployed pools:', error);
      throw new Error(`Failed to get deployed pools: ${error.message}`);
    }
  }

  async getPoolInfo(grainType: string): Promise<{
    assetType: string;
    lendingToken: string;
    collateralToken: string;
    lpToken: string;
    totalAssets: string;
    totalBorrows: string;
    totalReserves: string;
    availableLiquidity: string;
    utilizationRate: string;
    currentAPR: string;
  }> {
    try {
      const poolAddress = await this.contractService.getPoolByAssetType(grainType);
      const poolInfo = await this.contractService.getPoolInfoFromAddress(poolAddress);
      const totalAssets = (parseFloat(poolInfo.availableLiquidity) + parseFloat(poolInfo.totalBorrows)).toString();
      
      return {
        assetType: poolInfo.assetType,
        lendingToken: poolInfo.lendingToken,
        collateralToken: poolInfo.collateralToken,
        lpToken: poolInfo.lpToken,
        totalAssets: totalAssets,
        totalBorrows: poolInfo.totalBorrows,
        totalReserves: poolInfo.totalReserves,
        availableLiquidity: poolInfo.availableLiquidity,
        utilizationRate: poolInfo.utilizationRate,
        currentAPR: poolInfo.currentAPR,
      };
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
      // Get pool address first, then oracle address from pool info
      const poolAddress = await this.contractService.getPoolByAssetType(grainType);
      // For now, return a placeholder price until oracle integration is complete
      return "100"; // $100 per unit placeholder
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
      const contractTxHash = await this.contractService.createLoan(poolAddress, amount);
      
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
