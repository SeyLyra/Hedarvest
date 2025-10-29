/* eslint-disable */
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
  AccountCreateTransaction,
  ContractCallQuery,
  ContractFunctionParameters,
  ContractId,
  Long,
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
    private readonly hcsService: HcsService,
  ) {
    this.initializeClient();
  }

  private initializeClient() {
    try {
      const operatorId = AccountId.fromString(process.env.HEDERA_OPERATOR_ID!);
      const operatorKey = PrivateKey.fromString(process.env.HEDERA_OPERATOR_KEY!);

      this.client = Client.forName(process.env.HEDERA_NETWORK! as any);
      this.client.setOperator(operatorId, operatorKey);

      this.logger.log(
        `Hedera client initialized for ${process.env.HEDERA_NETWORK}`,
      );
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
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
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

  /**
   * Mint crop tokens to farmer after warehouse verification
   * Uses whitelisted RICE and WHEAT tokens only
   */
  async mintCropTokens(
    cropType: string,
    weightKg: number,
    farmerAccountId: string,
  ): Promise<{ transactionId: string; tokenId: string; amount: number }> {
    try {
      // Map crop type to token ID (only whitelist RICE and WHEAT)
      const tokenIdMap: Record<string, string> = {
        'rice': process.env.RICE_TOKEN_ID || '0.0.7121334',
        'wheat': process.env.WHEAT_TOKEN_ID || '0.0.7121333',
      };

      const tokenId = tokenIdMap[cropType.toLowerCase()];
      if (!tokenId) {
        throw new Error(`Crop type ${cropType} is not whitelisted. Only RICE and WHEAT are supported.`);
      }

      // Convert weight to token amount (1 kg = 1 token with 6 decimals)
      const tokenAmount = Math.floor(weightKg * 1e6);

      this.logger.log(`Minting ${weightKg} kg (${tokenAmount} smallest units) of ${cropType} tokens (${tokenId}) for farmer ${farmerAccountId}`);

      // Mint tokens to treasury first
      const mintResult = await this.mintToken(tokenId, tokenAmount);

      // Transfer tokens from treasury to farmer
      const treasuryAccount = this.client.operatorAccountId?.toString() || '';
      const transferResult = await this.transferToken(
        tokenId,
        treasuryAccount,
        farmerAccountId,
        tokenAmount,
      );

      this.logger.log(`Successfully minted and transferred ${weightKg} ${cropType} tokens to farmer ${farmerAccountId}`);

      return {
        transactionId: transferResult.transactionId,
        tokenId,
        amount: tokenAmount,
      };
    } catch (error) {
      this.logger.error('Failed to mint crop tokens:', error);
      throw new Error(`Crop token minting failed: ${error.message}`);
    }
  }

  /**
   * Transfer tokens from treasury (operator) to a specific account
   * Used for minting tokens to farmers after warehouse verification
   */
  async transferTokenToAccount(
    tokenId: string,
    toAccountId: string,
    amount: number,
  ): Promise<{ transactionId: string }> {
    const operatorAccountId = this.client.operatorAccountId?.toString();
    if (!operatorAccountId) {
      throw new Error('Operator account ID not set');
    }

    this.logger.log(`Transferring ${amount} tokens of ${tokenId} to ${toAccountId}`);

    return this.transferToken(tokenId, operatorAccountId, toAccountId, amount);
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
      
      // Parse the private key - support DER and raw hex formats
      const parseKey = (keyStr: string): PrivateKey => {
        const trimmed = (keyStr || '').trim();
        // Try standard parse
        try {
          return PrivateKey.fromString(trimmed);
      } catch {
          // Try raw hex (ED25519)
          const hexOnly = trimmed.replace(/^0x/i, '');
          const isHex64 = /^[0-9a-fA-F]{64}$/.test(hexOnly);
          if (isHex64 && typeof (PrivateKey as any).fromStringED25519 === 'function') {
            return (PrivateKey as any).fromStringED25519(hexOnly);
          }
          if (isHex64) {
            return PrivateKey.fromString(`0x${hexOnly}`);
          }
          throw new Error('Unsupported private key format');
        }
      };

      const userPrivateKey: PrivateKey = parseKey(privateKey);

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
      const accountIdObj = accountId.startsWith('0x')
        ? AccountId.fromSolidityAddress(accountId)
        : AccountId.fromString(accountId);
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
      this.logger.log(`🔍 Getting farmer position for ${grainType}, address: ${farmerAddress}`);
       const poolAddress = await this.contractService.getPoolAddress(grainType);
      this.logger.log(`📍 Pool address for ${grainType}: ${poolAddress}`);
      
      // For rice, expected pool: 0x8298E55ddFA89Ec942cE7C7e81DD4BbD0d69f00a
      // For wheat, expected pool: 0x5CCA4F0F0e4e79b5D3B701B214F502183D3f903a
      if (grainType.toLowerCase() === 'rice') {
        this.logger.log(`   ⚠️ Rice pool should be: 0x8298E55ddFA89Ec942cE7C7e81DD4BbD0d69f00a`);
        this.logger.log(`   ⚠️ Querying pool: ${poolAddress}`);
        if (poolAddress.toLowerCase() !== '0x8298E55ddFA89Ec942cE7C7e81DD4BbD0d69f00a') {
          this.logger.warn(`   ⚠️ POOL ADDRESS MISMATCH! Expected rice pool but got different address!`);
        }
      }
      
      if (!poolAddress || poolAddress === '0x0000000000000000000000000000000000000000') {
        throw new Error(`Pool address not found for ${grainType}`);
      }
      
      // Convert EVM address to ContractId if needed
      const contractId = poolAddress.startsWith('0x')
        ? ContractId.fromSolidityAddress(poolAddress)
        : ContractId.fromString(poolAddress);

      // Ensure address has 0x prefix (ContractFunctionParameters.addAddress expects it)
      const normalizedAddress = farmerAddress.startsWith('0x') ? farmerAddress : `0x${farmerAddress}`;
      this.logger.log(`📞 Calling contract methods using Hedera SDK for ${grainType} pool...`);
      this.logger.log(`   Farmer address (received): ${farmerAddress}`);
      this.logger.log(`   Farmer address (normalized): ${normalizedAddress}`);
      this.logger.log(`   Contract ID: ${contractId.toString()}`);
      this.logger.log(`   Pool address (original): ${poolAddress}`);
      
      // Verify the address format by trying to create an AccountId from it
      // This helps debug address format issues
      try {
        if (normalizedAddress.startsWith('0x')) {
          // Try to convert EVM address back to Hedera Account ID to verify
          const testAccountId = AccountId.fromSolidityAddress(normalizedAddress);
          this.logger.log(`   Address verification: ${normalizedAddress} -> ${testAccountId.toString()}`);
        }
      } catch (verifyErr) {
        this.logger.warn(`   Address verification failed (may be normal for EVM-only addresses):`, verifyErr);
      }

      // Call userCollateral(address)
      const userCollateralParams = new ContractFunctionParameters().addAddress(normalizedAddress);
      const userCollateralQuery = new ContractCallQuery()
        .setContractId(contractId)
        .setGas(100000)
        .setFunction('userCollateral', userCollateralParams);
      
      // Call getCollateralValue(address)
      const getCollateralValueParams = new ContractFunctionParameters().addAddress(normalizedAddress);
      const getCollateralValueQuery = new ContractCallQuery()
        .setContractId(contractId)
        .setGas(100000)
        .setFunction('getCollateralValue', getCollateralValueParams);
      
      // Call getBorrowValue(address)
      const getBorrowValueParams = new ContractFunctionParameters().addAddress(normalizedAddress);
      const getBorrowValueQuery = new ContractCallQuery()
        .setContractId(contractId)
        .setGas(100000)
        .setFunction('getBorrowValue', getBorrowValueParams);
      
      // Call loanToValue() - no parameters
      const loanToValueQuery = new ContractCallQuery()
        .setContractId(contractId)
        .setGas(100000)
        .setFunction('loanToValue', new ContractFunctionParameters());

      // Execute all queries with error handling
      this.logger.log(`   Executing ContractCallQuery for userCollateral...`);
      let rawCollateralResponse;
      try {
        rawCollateralResponse = await userCollateralQuery.execute(this.client);
        this.logger.log(`   ✅ userCollateral query succeeded`);
      } catch (err: any) {
        this.logger.error(`   ❌ userCollateral query failed:`, err);
        throw new Error(`Failed to query userCollateral: ${err.message}`);
      }

      this.logger.log(`   Executing ContractCallQuery for getCollateralValue...`);
      let collateralValueResponse;
      try {
        collateralValueResponse = await getCollateralValueQuery.execute(this.client);
        this.logger.log(`   ✅ getCollateralValue query succeeded`);
      } catch (err: any) {
        this.logger.error(`   ❌ getCollateralValue query failed:`, err);
        throw new Error(`Failed to query getCollateralValue: ${err.message}`);
      }

      this.logger.log(`   Executing ContractCallQuery for getBorrowValue...`);
      let borrowsResponse;
      try {
        borrowsResponse = await getBorrowValueQuery.execute(this.client);
        this.logger.log(`   ✅ getBorrowValue query succeeded`);
      } catch (err: any) {
        this.logger.error(`   ❌ getBorrowValue query failed:`, err);
        throw new Error(`Failed to query getBorrowValue: ${err.message}`);
      }

      this.logger.log(`   Executing ContractCallQuery for loanToValue...`);
      let loanToValueResponse;
      try {
        loanToValueResponse = await loanToValueQuery.execute(this.client);
        this.logger.log(`   ✅ loanToValue query succeeded`);
      } catch (err: any) {
        this.logger.error(`   ❌ loanToValue query failed:`, err);
        throw new Error(`Failed to query loanToValue: ${err.message}`);
      }

      // Log raw response bytes for debugging
      this.logger.log(`   Raw response bytes length: userCollateral=${rawCollateralResponse.bytes.length}, collateralValue=${collateralValueResponse.bytes.length}, borrows=${borrowsResponse.bytes.length}, loanToValue=${loanToValueResponse.bytes.length}`);
      
      // Log first few bytes to verify we're getting data
      if (rawCollateralResponse.bytes.length > 0) {
        this.logger.log(`   userCollateral first 32 bytes (hex): ${Buffer.from(rawCollateralResponse.bytes.slice(0, 32)).toString('hex')}`);
      } else {
        this.logger.warn(`   ⚠️ userCollateral response is empty!`);
      }

      // Decode results - all return uint256
      this.logger.log(`   Decoding responses...`);
      let rawCollateral: Long;
      let collateralValueUSD: Long;
      let borrows: Long;
      let loanToValue: Long;

      try {
        rawCollateral = rawCollateralResponse.getUint256(0);
        collateralValueUSD = collateralValueResponse.getUint256(0);
        borrows = borrowsResponse.getUint256(0);
        loanToValue = loanToValueResponse.getUint256(0);
      } catch (decodeErr: any) {
        this.logger.error(`   ❌ Failed to decode response:`, decodeErr);
        this.logger.error(`   Response bytes (hex): userCollateral=${Buffer.from(rawCollateralResponse.bytes).toString('hex')}`);
        throw new Error(`Failed to decode contract response: ${decodeErr.message}`);
      }

      this.logger.log(`   Raw response values before conversion:`);
      this.logger.log(`     rawCollateral: ${rawCollateral.toString()}`);
      this.logger.log(`     collateralValueUSD: ${collateralValueUSD.toString()}`);
      this.logger.log(`     borrows: ${borrows.toString()}`);
      this.logger.log(`     loanToValue: ${loanToValue.toString()}`);

      // Calculate max borrow: (collateralValueUSD * loanToValue) / 1e18
      // loanToValue is in 18 decimals (e.g., 0.6e18 = 60%)
      // Convert Long to string without scientific notation for BigInt conversion
      const collateralValueStr = collateralValueUSD.toString(10);
      const loanToValueStr = loanToValue.toString(10);
      const maxBorrow = (BigInt(collateralValueStr) * BigInt(loanToValueStr)) / BigInt(10**18);

      this.logger.log(`✅ Contract call results for ${farmerAddress}:`);
      this.logger.log(`   Raw collateral: ${rawCollateral.toString()}`);
      this.logger.log(`   Collateral value (USD): ${collateralValueUSD.toString()}`);
      this.logger.log(`   Borrows: ${borrows.toString()}`);
      this.logger.log(`   Loan to Value: ${loanToValue.toString()} (${Number(loanToValue.toString()) / 1e18 * 100}%)`);
      this.logger.log(`   Max borrow: ${maxBorrow.toString()}`);

      // Convert Long values to strings without scientific notation
      return {
        collateral: rawCollateral.toString(10),
        borrows: borrows.toString(10),
        collateralValueUSD: collateralValueUSD.toString(10),
        maxBorrow: maxBorrow.toString()
      };
    } catch (error: any) {
      const errorMsg = error?.message || String(error);
      this.logger.error(`❌ Failed to get farmer position for ${farmerAddress} (${grainType}):`, errorMsg);
      this.logger.error(`   Full error:`, error);
      throw new Error(`Failed to get farmer position: ${errorMsg}`);
    }
  }

  /**
   * Create a custodial Hedera account for farmers who don't understand wallets
   * Returns both the Hedera account ID and the EVM address
   */
  async createCustodialAccount(farmerEmail: string): Promise<{
    accountId: string;
    evmAddress: string;
    privateKey: string; // IMPORTANT: Must be encrypted before storing in database
  }> {
    try {
      // Generate a new private key for the farmer's account
      const newAccountPrivateKey = PrivateKey.generateED25519();
      const newAccountPublicKey = newAccountPrivateKey.publicKey;

      // Create the account with auto-association enabled for automatic token acceptance
      const newAccountTx = new AccountCreateTransaction()
        .setKey(newAccountPublicKey)
        .setInitialBalance(new Hbar(1)) // 1 HBAR to cover transaction fees
        .setMaxAutomaticTokenAssociations(100); // Auto-associate up to 100 tokens

      const txResponse = await newAccountTx.execute(this.client);
      const receipt = await txResponse.getReceipt(this.client);
      const newAccountId = receipt.accountId;

      if (!newAccountId) {
        throw new Error('Failed to get account ID from receipt');
      }

      // Convert to EVM address format
      const evmAddress = `0x${newAccountId.toSolidityAddress()}`;

      this.logger.log(
        `✅ Created custodial account with auto-association for ${farmerEmail}: ${newAccountId.toString()} (${evmAddress})`
      );

      return {
        accountId: newAccountId.toString(),
        evmAddress,
        privateKey: newAccountPrivateKey.toString(), // WARNING: Must be encrypted before storing!
      };
    } catch (error) {
      this.logger.error(`Failed to create custodial account for ${farmerEmail}:`, error);
      throw new Error(`Failed to create custodial account: ${error.message}`);
    }
  }
}
