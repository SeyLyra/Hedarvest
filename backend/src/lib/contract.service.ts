import { Injectable, Logger } from '@nestjs/common';
import { ethers } from 'ethers';
import {
  Client,
  AccountId,
  PrivateKey,
  TokenId,
  TokenAssociateTransaction,
  ContractExecuteTransaction,
  ContractFunctionParameters,
  ContractId,
  Hbar,
  Long,
} from '@hashgraph/sdk';

/**
 * Contract ABIs - Updated 2025-10-23
 * Contracts now use share accounting (no lpToken/debtToken)
 * Includes price precision fix
 */

// Gas configuration for Hedera contract calls
const CONTRACT_GAS_LIMIT = 500000; // Increased gas limit to prevent INSUFFICIENT_GAS errors
const MAX_TRANSACTION_FEE = new Hbar(2); // Maximum transaction fee

const POOL_FACTORY_ABI = [
  'function getAllPools() external view returns (address[])',
  'function getAllPoolsWithDetails() external view returns (tuple(address underlyingToken, address collateralToken, uint256 totalCash, uint256 totalBorrowed, uint256 totalReserves, uint256 totalLPShares, uint256 borrowIndex, uint256 liquidityIndex, uint256 utilization, uint256 borrowRate, uint256 loanToValue, uint256 liquidationThreshold, uint256 liquidationBonus)[])',
];

const LENDING_POOL_ABI = [
  // Core pool information
  'function underlyingToken() external view returns (address)',
  'function collateralToken() external view returns (address)',
  'function underlyingTokenDecimals() external view returns (uint8)',
  'function collateralTokenDecimals() external view returns (uint8)',

  // Pool statistics
  'function totalCash() external view returns (uint256)',
  'function totalBorrowed() external view returns (uint256)',
  'function totalReserves() external view returns (uint256)',
  'function totalAssets() external view returns (uint256)',
  'function totalLPShares() external view returns (uint256)',

  // Interest rate functions
  'function borrowIndex() external view returns (uint256)',
  'function liquidityIndex() external view returns (uint256)',
  'function accrueInterest() external',
  'function utilizationRate() external view returns (uint256)',

  // Core lending functions
  'function deposit(uint256 amount) external',
  'function withdraw(uint256 shares) external',
  'function depositCollateral(uint256 amount) external',
  'function withdrawCollateral(uint256 amount) external',
  'function borrow(uint256 amount) external',
  'function repay(uint256 amount) external',
  'function liquidate(address borrower, uint256 repayAmount) external',

  // User share balances
  'function userLPShares(address user) external view returns (uint256)',
  'function userCollateral(address user) external view returns (uint256)',
  'function userDebtShares(address user) external view returns (uint256)',

  // Token association (HTS specific)
  'function associateTokens() external',
  'function initialize() external',

  // Health factor and risk functions
  'function getHealthFactor(address user) external view returns (uint256)',
  'function getHealthFactorWithAccrual(address user) external view returns (uint256)',
  'function getBorrowValue(address user) external view returns (uint256)',
  'function getBorrowValueWithAccrual(address user) external view returns (uint256)',
  'function getCollateralValue(address user) external view returns (uint256)',

  // Pool configuration
  'function loanToValue() external view returns (uint256)',
  'function liquidationThreshold() external view returns (uint256)',
  'function liquidationBonus() external view returns (uint256)',
  'function reserveFactor() external view returns (uint256)',

  // Pool details struct
  'function getPoolDetails() external view returns (tuple(address underlyingToken, address collateralToken, uint256 totalCash, uint256 totalBorrowed, uint256 totalReserves, uint256 totalLPShares, uint256 borrowIndex, uint256 liquidityIndex, uint256 utilization, uint256 borrowRate, uint256 loanToValue, uint256 liquidationThreshold, uint256 liquidationBonus))',
];

const MOCK_TOKEN_ABI = [
  'function name() external view returns (string)',
  'function symbol() external view returns (string)',
  'function decimals() external view returns (uint8)',
  'function totalSupply() external view returns (uint256)',
  'function balanceOf(address) external view returns (uint256)',
  'function transfer(address to, uint256 amount) external returns (bool)',
  'function transferFrom(address from, address to, uint256 amount) external returns (bool)',
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function allowance(address owner, address spender) external view returns (uint256)',
];

const ORACLE_ABI = ['function getPrice() external view returns (uint256)'];

@Injectable()
export class ContractService {
  private readonly logger = new Logger(ContractService.name);
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet;
  private hederaClient: Client;
  private hederaAccountId: AccountId;
  private hederaPrivateKey: PrivateKey;

  constructor() {
    this.initializeProvider();
    this.initializeHederaClient();
  }

  private initializeHederaClient(): void {
    try {
      const accountId = process.env.HEDERA_OPERATOR_ID;
      const privateKey = process.env.HEDERA_OPERATOR_KEY;
      const network = process.env.HEDERA_NETWORK || 'testnet';

      if (!accountId || !privateKey) {
        this.logger.warn(
          'HEDERA_OPERATOR_ID and HEDERA_OPERATOR_KEY not set - Hedera operations will fail',
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
      
      this.logger.log('Hedera client initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Hedera client:', error);
    }
  }

  // Get contract addresses from deployment data
  getFactoryAddress(): string {
    return process.env.POOL_FACTORY_ADDRESS || '';
  }

  getOracleAddress(): string {
    return process.env.ORACLE_ADDRESS || '';
  }

  getLendingTokenAddress(): string {
    return process.env.LENDING_TOKEN_ADDRESS || '';
  }


  // Get all pools with complete information dynamically from PoolFactory
  async getAllPoolsInfo(): Promise<Array<{
    assetType: string;
    poolAddress: string;
    lendingToken: string;
    collateralToken: string;
    baseLTV: number;
    liquidationThreshold: number;
    liquidationBonus: number;
  }>> {
    try {
      const factory = new ethers.Contract(
        this.getFactoryAddress(),
        POOL_FACTORY_ABI,
        this.wallet,
      );
      
      // Get both pool addresses and details
      const [allPools, allPoolsDetails] = await Promise.all([
        factory.getAllPools(),
        factory.getAllPoolsWithDetails()
      ]);
      
      this.logger.log(`Found ${allPools.length} pools with details from factory`);
      
      // Process each pool detail and determine asset type
      const poolsInfo = await Promise.all(
        allPoolsDetails.map(async (poolDetail: any, index: number) => {
          try {
            const poolAddress = allPools[index];
            
            // Determine asset type from collateral token
            let assetType = 'unknown';
            try {
              const tokenInfo = await this.getTokenInfoFromHedera(poolDetail.collateralToken);
              if (tokenInfo && tokenInfo.symbol) {
                assetType = tokenInfo.symbol.toLowerCase();
              }
            } catch (tokenError) {
              this.logger.warn(`Could not determine asset type for pool ${poolAddress}:`, tokenError);
              assetType = `token_${poolDetail.collateralToken.slice(-4)}`;
            }
            
            return {
              assetType: assetType,
              poolAddress: poolAddress,
              lendingToken: poolDetail.underlyingToken,
              collateralToken: poolDetail.collateralToken,
              baseLTV: Number(poolDetail.loanToValue) / 1e18, // Convert from wei
              liquidationThreshold: Number(poolDetail.liquidationThreshold) / 1e18, // Convert from wei
              liquidationBonus: Number(poolDetail.liquidationBonus) / 1e18, // Convert from wei
            };
          } catch (poolError) {
            this.logger.warn(`Failed to process pool details at index ${index}:`, poolError);
            return null;
          }
        })
      );
      
      // Filter out null results
      return poolsInfo.filter((pool): pool is NonNullable<typeof pool> => pool !== null);
    } catch (error) {
      this.logger.error('Failed to get all pools info from factory:', error);
      
      // Return empty array if factory lookup fails
      this.logger.log('No fallback available - returning empty pools list');
      return [];
    }
  }

  private initializeProvider(): void {
    try {
      this.provider = new ethers.JsonRpcProvider(
        process.env.HEDERA_JSON_RPC_URL || 'https://testnet.hashio.io/api',
      );
      this.wallet = new ethers.Wallet(
        process.env.EVM_PRIVATE_KEY!,
        this.provider,
      );
      this.logger.log('Hedera EVM provider and wallet initialized');
    } catch (error) {
      this.logger.error('Failed to initialize Hedera EVM provider:', error);
      throw new Error('Hedera EVM provider initialization failed');
    }
  }

  // PoolFactory interactions
  async getAllPools(): Promise<string[]> {
    const maxRetries = 3;
    const baseDelay = 1000; // 1 second

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const factoryAddress = this.getFactoryAddress();
        this.logger.log(
          `Attempt ${attempt}: Attempting to get pools from factory at: ${factoryAddress}`,
        );

        if (!factoryAddress || factoryAddress.includes('XXXX')) {
          this.logger.warn(
            'POOL_FACTORY_ADDRESS not set or using placeholder value',
          );
          return [];
        }

        const factory = new ethers.Contract(
          factoryAddress,
          POOL_FACTORY_ABI,
          this.wallet,
        );

        const pools = await factory.getAllPools();
        this.logger.log(
          `Successfully retrieved ${pools.length} pools from factory`,
        );
        return pools;
      } catch (error) {
        this.logger.error(`Attempt ${attempt} failed to get all pools:`, error);

        if (attempt === maxRetries) {
          throw new Error(
            `Failed to get all pools after ${maxRetries} attempts: ${
              error instanceof Error ? error.message : 'Unknown error'
            }`,
          );
        }

        // Wait before retrying with exponential backoff
        const delay = baseDelay * Math.pow(2, attempt - 1);
        this.logger.log(`Waiting ${delay}ms before retry...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    return [];
  }

  async getPoolInfo(assetType: string): Promise<{
    poolAddress: string;
    assetType: string;
    lendingToken: string;
    collateralToken: string;
    baseLTV: number;
    liquidationThreshold: number;
    liquidationBonus: number;
    exists: boolean;
  }> {
    try {
      const allPoolsInfo = await this.getAllPoolsInfo();
      const poolInfo = allPoolsInfo.find(pool => 
        pool.assetType.toLowerCase() === assetType.toLowerCase()
      );
      
      if (!poolInfo) {
        return {
          poolAddress: '',
          assetType,
          lendingToken: '',
          collateralToken: '',
          baseLTV: 0,
          liquidationThreshold: 0,
          liquidationBonus: 0,
          exists: false,
        };
      }
      
      return {
        poolAddress: poolInfo.poolAddress,
        assetType: poolInfo.assetType,
        lendingToken: poolInfo.lendingToken,
        collateralToken: poolInfo.collateralToken,
        baseLTV: poolInfo.baseLTV,
        liquidationThreshold: poolInfo.liquidationThreshold,
        liquidationBonus: poolInfo.liquidationBonus,
        exists: true,
      };
    } catch (error) {
      this.logger.error(`Failed to get pool info for ${assetType}:`, error);
      throw new Error(
        `Failed to get pool info for ${assetType}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }


  private calculateUtilization(
    availableLiquidity: string,
    totalBorrows: string,
  ): number {
    const liquidity = parseFloat(availableLiquidity);
    const borrows = parseFloat(totalBorrows);
    const totalSupply = liquidity + borrows;

    return totalSupply > 0 ? Math.round((borrows / totalSupply) * 100) : 0;
  }

  async getPoolByAssetType(assetType: string): Promise<string> {
    try {
      // Get all pools and find the one with matching asset type
      const allPoolsInfo = await this.getAllPoolsInfo();
      const poolInfo = allPoolsInfo.find(pool => 
        pool.assetType.toLowerCase() === assetType.toLowerCase()
      );
      
      if (poolInfo) {
        return poolInfo.poolAddress;
      }
      
      // If not found, try factory contract as fallback
      const factory = new ethers.Contract(
        this.getFactoryAddress(),
        POOL_FACTORY_ABI,
        this.wallet,
      );
      return await factory.getPool(assetType);
    } catch (error) {
      this.logger.error(`Failed to get pool for ${assetType}:`, error);
      throw new Error(
        `Failed to get pool for ${assetType}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  // Get pool info directly from blockchain
  async getTokenInfoFromHedera(tokenAddress: string): Promise<{ symbol: string; name: string } | null> {
    try {
      // Use Hedera mirror node API to get token info
      const response = await fetch(`https://testnet.mirrornode.hedera.com/api/v1/tokens/${tokenAddress}`);
      
      if (!response.ok) {
        this.logger.warn(`Failed to fetch token info for ${tokenAddress}: ${response.status}`);
        return null;
      }
      
      const tokenData = await response.json();
      
      if (tokenData.symbol && tokenData.name) {
        return {
          symbol: tokenData.symbol,
          name: tokenData.name
        };
      }
      
      return null;
    } catch (error) {
      this.logger.warn(`Error fetching token info for ${tokenAddress}:`, error);
      return null;
    }
  }

  async getPoolInfoFromAddress(poolAddress: string): Promise<{
    assetType: string;
    lendingToken: string;
    collateralToken: string;
    totalAssets: string;
    totalBorrows: string;
    totalReserves: string;
    availableLiquidity: string;
    utilizationRate: string;
    currentAPR: string;
    activePositions: string;
  }> {
    try {
      const pool = new ethers.Contract(
        poolAddress,
        LENDING_POOL_ABI,
        this.wallet,
      );

      const [underlyingToken, collateralToken, totalCash, totalBorrowed, totalReserves] =
        await Promise.all([
          pool.underlyingToken(),
          pool.collateralToken(),
          pool.totalCash(),
          pool.totalBorrowed(),
          pool.totalReserves(),
        ]);

      // Calculate derived values
      const totalAssets = totalCash + totalBorrowed;
      // Convert from token units to human-readable (USDC has 6 decimals)
      const availableLiquidity = (Number(totalCash) / 1e6).toString();
      const totalBorrowsHuman = (Number(totalBorrowed) / 1e6).toString();
      // Calculate utilization rate as percentage (0-100)
      const utilizationRate = totalAssets > 0 ? ((Number(totalBorrowed) * 100) / Number(totalAssets)).toFixed(2) : '0';
      
      // Fetch borrow rate and calculate supply APR (what investors earn)
      // Supply APR = Borrow Rate * Utilization * (1 - Reserve Factor)
      let currentAPR = '5'; // Default fallback
      try {
        const poolDetails = await pool.getPoolDetails();
        const borrowRate = poolDetails.borrowRate;
        const borrowRateNumber = Number(borrowRate);
        
        // Get reserve factor if available, default to 10% (0.1)
        let reserveFactor = 0.1; // 10% default
        try {
          const rf = await pool.reserveFactor();
          reserveFactor = Number(rf) / 1e18;
        } catch (rfError) {
          this.logger.warn('Could not fetch reserve factor, using default 10%');
        }
        
        // Check if borrowRate is valid (non-zero and reasonable)
        if (borrowRateNumber > 0 && borrowRateNumber < 1e30) {
          const borrowRatePercent = borrowRateNumber / 1e18;
          const utilizationDecimal = parseFloat(utilizationRate) / 100;
          
          // Calculate supply APR: Borrow Rate * Utilization * (1 - Reserve Factor)
          // This represents what investors earn from lending
          const supplyAPR = (borrowRatePercent * utilizationDecimal * (1 - reserveFactor)) * 100;
          
          // Ensure APR is reasonable (between 0.01% and 100%)
          if (supplyAPR >= 0.01 && supplyAPR <= 100) {
            currentAPR = supplyAPR.toFixed(2);
            this.logger.log(`Supply APR calculated: ${currentAPR}% (borrowRate: ${(borrowRatePercent * 100).toFixed(4)}%, utilization: ${utilizationRate}%, reserveFactor: ${(reserveFactor * 100).toFixed(1)}%)`);
          } else {
            // APR calculation resulted in invalid value, use dynamic calculation
            this.logger.warn(`Calculated supply APR ${supplyAPR}% is out of valid range, using dynamic calculation`);
            throw new Error('Invalid supply APR calculated');
          }
        } else {
          // Borrow rate is 0 or invalid, use dynamic calculation
          this.logger.warn(`Borrow rate from contract is ${borrowRateNumber}, using dynamic APR calculation`);
          throw new Error('Borrow rate is zero or invalid');
        }
      } catch (rateError) {
        this.logger.warn('Could not fetch valid borrow rate, calculating dynamic APR:', rateError);

        // Calculate dynamic APR based on utilization rate
        // Base APR: 3%, increases with utilization up to 15%
        const utilizationPercent = parseFloat(utilizationRate) / 100; // Convert to decimal
        const baseAPR = 3.0;
        const maxAPR = 15.0;

        // Linear scaling: 3% + (utilization * 12%)
        const dynamicAPR = Math.min(baseAPR + (utilizationPercent * 12), maxAPR);
        currentAPR = dynamicAPR.toFixed(2);

        this.logger.log(`Dynamic APR calculated: ${currentAPR}% (utilization: ${utilizationRate}%)`);
      }

      // Determine asset type dynamically by getting token info from Hedera
      let assetType = 'unknown';
      try {
        // Get token info from Hedera to determine the asset type
        const tokenInfo = await this.getTokenInfoFromHedera(collateralToken);
        if (tokenInfo && tokenInfo.symbol) {
          // Convert symbol to lowercase for consistency
          assetType = tokenInfo.symbol.toLowerCase();
          this.logger.log(`Determined asset type: ${assetType} from token symbol: ${tokenInfo.symbol}`);
        }
      } catch (typeError) {
        this.logger.warn('Could not determine asset type from Hedera token info:', typeError);
        // Fallback: try to extract from token address or use a generic name
        assetType = `token_${collateralToken.slice(-4)}`;
      }

      return {
        assetType: assetType,
        lendingToken: underlyingToken,
        collateralToken: collateralToken,
        totalAssets: ((Number(totalAssets) / 1e6)).toString(),
        totalBorrows: totalBorrowsHuman,
        totalReserves: (Number(totalReserves) / 1e6).toString(),
        availableLiquidity: availableLiquidity,
        utilizationRate: utilizationRate,
        currentAPR: currentAPR,
        activePositions: '0', // Not tracked in our current implementation
      };
    } catch (error) {
      this.logger.error(`Failed to get pool info for ${poolAddress}:`, error);
      throw new Error(
        `Failed to get pool info: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  // Get pool balance directly from blockchain
  async getPoolBalance(poolAddress: string): Promise<{
    availableLiquidity: string;
    totalBorrows: string;
  }> {
    try {
      const pool = new ethers.Contract(
        poolAddress,
        LENDING_POOL_ABI,
        this.wallet,
      );
      const [totalCash, totalBorrowed] = await Promise.all([
        pool.totalCash(),
        pool.totalBorrowed(),
      ]);

      return {
        availableLiquidity: (Number(totalCash) / 1e6).toString(),
        totalBorrows: (Number(totalBorrowed) / 1e6).toString(),
      };
    } catch (error) {
      this.logger.error(
        `Failed to get pool balance for ${poolAddress}:`,
        error,
      );
      throw new Error(
        `Failed to get pool balance: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  // Get pool stats by asset type
  async getPoolStatsByAssetType(assetType: string): Promise<{
    assetType: string;
    poolAddress: string;
    lendingTokenAddress: string;
    baseLtv: number;
    availableLiquidity: string;
    totalBorrows: string;
    totalReserves: string;
    utilizationRate: string;
    currentAPR: string;
  }> {
    try {
      const poolAddress = await this.getPoolByAssetType(assetType);
      const poolInfo = await this.getPoolInfoFromAddress(poolAddress);

      return {
        assetType: poolInfo.assetType,
        poolAddress,
        lendingTokenAddress: poolInfo.lendingToken,
        baseLtv: 0, // Will be fetched from risk parameters if needed
        availableLiquidity: poolInfo.availableLiquidity,
        totalBorrows: poolInfo.totalBorrows,
        totalReserves: poolInfo.totalReserves,
        utilizationRate: poolInfo.utilizationRate,
        currentAPR: poolInfo.currentAPR,
      };
    } catch (error) {
      this.logger.error(`Failed to get pool stats for ${assetType}:`, error);
      throw new Error(
        `Failed to get pool stats for ${assetType}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  // Helper method to ensure pool is associated with underlying token
  async ensurePoolTokenAssociation(poolAddress: string): Promise<void> {
    try {
      const underlyingTokenId = '0.0.7115536'; // USDC token ID
      
      this.logger.log(`Ensuring pool ${poolAddress} is associated with token ${underlyingTokenId}`);
      
      // Create token association transaction
      const associateTx = new TokenAssociateTransaction()
        .setAccountId(AccountId.fromEvmAddress(0, 0, poolAddress))
        .setTokenIds([TokenId.fromString(underlyingTokenId)])
        .freezeWith(this.hederaClient);
      
      // Sign and execute the transaction
      const associateTxSigned = await associateTx.sign(this.hederaPrivateKey);
      const associateTxResponse = await associateTxSigned.execute(this.hederaClient);
      
      // Wait for the transaction to be processed
      const associateReceipt = await associateTxResponse.getReceipt(this.hederaClient);
      
      this.logger.log(`Pool ${poolAddress} successfully associated with token ${underlyingTokenId}`);
      
    } catch (error: any) {
      // If association already exists, that's fine
      if (error.message && error.message.includes('TOKEN_ALREADY_ASSOCIATED_TO_ACCOUNT')) {
        this.logger.log(`Pool ${poolAddress} already associated with token`);
        return;
      }
      
      this.logger.error(`Failed to associate pool with token:`, error);
      throw new Error(`Failed to associate pool with token: ${error.message}`);
    }
  }

  // Investor functions
  async depositToPool(poolAddress: string, amount: string): Promise<string> {
    try {
      // Convert amount to token decimals (USDC has 6 decimals)
      // If amount is "100", convert to "100000000" (100 * 10^6)
      const tokenDecimals = 6; // USDC has 6 decimals
      const amountInSmallestUnits = ethers.parseUnits(amount, tokenDecimals);
      
      this.logger.log(`Depositing ${amount} USDC (${amountInSmallestUnits.toString()} smallest units) to pool ${poolAddress}`);
      
      // Create Hedera contract execution transaction
      const contractExecuteTx = new ContractExecuteTransaction()
        .setContractId(ContractId.fromString(poolAddress))
        .setGas(CONTRACT_GAS_LIMIT)
        .setMaxTransactionFee(MAX_TRANSACTION_FEE)
        .setFunction(
          'deposit',
          new ContractFunctionParameters().addUint256(Long.fromString(amountInSmallestUnits.toString()))
        );

      // Sign and execute the transaction
      const contractExecuteTxSigned = await contractExecuteTx.sign(this.hederaPrivateKey);
      const contractExecuteTxResponse = await contractExecuteTxSigned.execute(this.hederaClient);
      
      // Wait for the transaction to be processed
      const contractExecuteReceipt = await contractExecuteTxResponse.getReceipt(this.hederaClient);

      if (contractExecuteReceipt.status.toString() !== 'SUCCESS') {
        throw new Error(`Contract execution failed with status: ${contractExecuteReceipt.status.toString()}`);
      }

      this.logger.log(`Successfully deposited ${amount} USDC to pool ${poolAddress}`);
      return contractExecuteTxResponse.transactionId.toString();
    } catch (error) {
      this.logger.error(`Failed to deposit to pool ${poolAddress}:`, error);
      throw new Error(
        `Failed to deposit: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  async withdrawFromPool(poolAddress: string, shares: string): Promise<string> {
    try {
      this.logger.log(`Withdrawing ${shares} shares from pool ${poolAddress}`);
      
      // Create Hedera contract execution transaction
      const contractExecuteTx = new ContractExecuteTransaction()
        .setContractId(ContractId.fromString(poolAddress))
        .setGas(CONTRACT_GAS_LIMIT)
        .setMaxTransactionFee(MAX_TRANSACTION_FEE)
        .setFunction(
          'withdraw',
          new ContractFunctionParameters().addUint256(Long.fromString(shares))
        );

      // Sign and execute the transaction
      const contractExecuteTxSigned = await contractExecuteTx.sign(this.hederaPrivateKey);
      const contractExecuteTxResponse = await contractExecuteTxSigned.execute(this.hederaClient);
      
      // Wait for the transaction to be processed
      const contractExecuteReceipt = await contractExecuteTxResponse.getReceipt(this.hederaClient);

      if (contractExecuteReceipt.status.toString() !== 'SUCCESS') {
        throw new Error(`Contract execution failed with status: ${contractExecuteReceipt.status.toString()}`);
      }

      this.logger.log(`Successfully withdrew ${shares} shares from pool ${poolAddress}`);
      return contractExecuteTxResponse.transactionId.toString();
    } catch (error) {
      this.logger.error(`Failed to withdraw from pool ${poolAddress}:`, error);
      throw new Error(
        `Failed to withdraw: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }


  // Deposit collateral to pool
  async depositCollateral(
    poolAddress: string,
    amount: string,
  ): Promise<string> {
    try {
      this.logger.log(`Depositing ${amount} collateral to pool ${poolAddress}`);
      
      // Create Hedera contract execution transaction
      const contractExecuteTx = new ContractExecuteTransaction()
        .setContractId(ContractId.fromString(poolAddress))
        .setGas(CONTRACT_GAS_LIMIT)
        .setMaxTransactionFee(MAX_TRANSACTION_FEE)
        .setFunction(
          'depositCollateral',
          new ContractFunctionParameters().addUint256(Long.fromString(amount))
        );

      // Sign and execute the transaction
      const contractExecuteTxSigned = await contractExecuteTx.sign(this.hederaPrivateKey);
      const contractExecuteTxResponse = await contractExecuteTxSigned.execute(this.hederaClient);
      
      // Wait for the transaction to be processed
      const contractExecuteReceipt = await contractExecuteTxResponse.getReceipt(this.hederaClient);

      if (contractExecuteReceipt.status.toString() !== 'SUCCESS') {
        throw new Error(`Contract execution failed with status: ${contractExecuteReceipt.status.toString()}`);
      }

      this.logger.log(`Successfully deposited ${amount} collateral to pool ${poolAddress}`);
      return contractExecuteTxResponse.transactionId.toString();
    } catch (error) {
      this.logger.error(
        `Failed to deposit collateral to pool ${poolAddress}:`,
        error,
      );
      throw new Error(
        `Failed to deposit collateral: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }


  // Borrow from pool
  async createLoan(poolAddress: string, amount: string): Promise<string> {
    try {
      this.logger.log(`Borrowing ${amount} from pool ${poolAddress}`);
      
      // Create Hedera contract execution transaction
      const contractExecuteTx = new ContractExecuteTransaction()
        .setContractId(ContractId.fromString(poolAddress))
        .setGas(CONTRACT_GAS_LIMIT)
        .setMaxTransactionFee(MAX_TRANSACTION_FEE)
        .setFunction(
          'borrow',
          new ContractFunctionParameters().addUint256(Long.fromString(amount))
        );

      // Sign and execute the transaction
      const contractExecuteTxSigned = await contractExecuteTx.sign(this.hederaPrivateKey);
      const contractExecuteTxResponse = await contractExecuteTxSigned.execute(this.hederaClient);
      
      // Wait for the transaction to be processed
      const contractExecuteReceipt = await contractExecuteTxResponse.getReceipt(this.hederaClient);

      if (contractExecuteReceipt.status.toString() !== 'SUCCESS') {
        throw new Error(`Contract execution failed with status: ${contractExecuteReceipt.status.toString()}`);
      }

      this.logger.log(`Successfully borrowed ${amount} from pool ${poolAddress}`);
      return contractExecuteTxResponse.transactionId.toString();
    } catch (error) {
      this.logger.error(`Failed to borrow from pool ${poolAddress}:`, error);
      throw new Error(
        `Failed to borrow: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  // Repay loan to pool
  async repayLoan(poolAddress: string, amount: string): Promise<string> {
    try {
      this.logger.log(`Repaying ${amount} to pool ${poolAddress}`);
      
      // Create Hedera contract execution transaction
      const contractExecuteTx = new ContractExecuteTransaction()
        .setContractId(ContractId.fromString(poolAddress))
        .setGas(CONTRACT_GAS_LIMIT)
        .setMaxTransactionFee(MAX_TRANSACTION_FEE)
        .setFunction(
          'repay',
          new ContractFunctionParameters().addUint256(Long.fromString(amount))
        );

      // Sign and execute the transaction
      const contractExecuteTxSigned = await contractExecuteTx.sign(this.hederaPrivateKey);
      const contractExecuteTxResponse = await contractExecuteTxSigned.execute(this.hederaClient);
      
      // Wait for the transaction to be processed
      const contractExecuteReceipt = await contractExecuteTxResponse.getReceipt(this.hederaClient);

      if (contractExecuteReceipt.status.toString() !== 'SUCCESS') {
        throw new Error(`Contract execution failed with status: ${contractExecuteReceipt.status.toString()}`);
      }

      this.logger.log(`Successfully repaid ${amount} to pool ${poolAddress}`);
      return contractExecuteTxResponse.transactionId.toString();
    } catch (error) {
      this.logger.error(`Failed to repay to pool ${poolAddress}:`, error);
      throw new Error(
        `Failed to repay: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }



  async liquidate(
    poolAddress: string,
    borrowerAddress: string,
  ): Promise<string> {
    try {
      this.logger.log(
        `Liquidating borrower ${borrowerAddress} in pool ${poolAddress}`,
      );
      
      // Create Hedera contract execution transaction
      const contractExecuteTx = new ContractExecuteTransaction()
        .setContractId(ContractId.fromString(poolAddress))
        .setGas(CONTRACT_GAS_LIMIT)
        .setMaxTransactionFee(MAX_TRANSACTION_FEE)
        .setFunction(
          'liquidate',
          new ContractFunctionParameters().addAddress(borrowerAddress)
        );

      // Sign and execute the transaction
      const contractExecuteTxSigned = await contractExecuteTx.sign(this.hederaPrivateKey);
      const contractExecuteTxResponse = await contractExecuteTxSigned.execute(this.hederaClient);
      
      // Wait for the transaction to be processed
      const contractExecuteReceipt = await contractExecuteTxResponse.getReceipt(this.hederaClient);

      if (contractExecuteReceipt.status.toString() !== 'SUCCESS') {
        throw new Error(`Contract execution failed with status: ${contractExecuteReceipt.status.toString()}`);
      }

      this.logger.log(
        `Successfully liquidated borrower ${borrowerAddress} in pool ${poolAddress}`,
      );
      return contractExecuteTxResponse.transactionId.toString();
    } catch (error) {
      this.logger.error(
        `Failed to liquidate borrower ${borrowerAddress}:`,
        error,
      );
      throw new Error(
        `Failed to liquidate: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }






  /**
   * Convert Hedera account ID to EVM address
   * Hedera account ID format: 0.0.123456
   * EVM address format: 0x...
   */
  private convertHederaAccountIdToEvmAddress(accountId: string): string {
    // If it's already an EVM address, return as-is
    if (accountId.startsWith('0x')) {
      return accountId;
    }

    // If it's a Hedera account ID format (0.0.123456), convert to EVM address
    if (accountId.match(/^\d+\.\d+\.\d+$/)) {
      try {
        const hederaAccountId = AccountId.fromString(accountId);
        const evmAddress = hederaAccountId.toSolidityAddress();
        this.logger.log(`Converted Hedera account ID ${accountId} to EVM address: 0x${evmAddress}`);
        return `0x${evmAddress}`;
      } catch (error) {
        this.logger.error(`Failed to convert Hedera account ID ${accountId}:`, error);
        throw new Error(`Invalid Hedera account ID format: ${accountId}`);
      }
    }

    throw new Error(`Invalid address format: ${accountId}`);
  }

  // Legacy method - get LP shares
  async getLPShares(
    poolAddress: string,
    investorAddress: string,
  ): Promise<string> {
    try {
      // Convert Hedera account ID to EVM address if needed
      const evmAddress = this.convertHederaAccountIdToEvmAddress(investorAddress);

      const pool = new ethers.Contract(
        poolAddress,
        LENDING_POOL_ABI,
        this.wallet,
      );
      const balance = await pool.userLPShares(evmAddress);
      return balance.toString();
    } catch (error) {
      this.logger.error(
        `Failed to get LP shares for ${investorAddress}:`,
        error,
      );
      throw new Error(
        `Failed to get LP shares: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  /**
   * Get the liquidity index for a pool (tracks LP share appreciation)
   */
  async getLiquidityIndex(poolAddress: string): Promise<string> {
    try {
      const pool = new ethers.Contract(
        poolAddress,
        LENDING_POOL_ABI,
        this.wallet,
      );
      const liquidityIndex = await pool.liquidityIndex();
      return liquidityIndex.toString();
    } catch (error) {
      this.logger.error(
        `Failed to get liquidity index for pool ${poolAddress}:`,
        error,
      );
      throw new Error(
        `Failed to get liquidity index: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  /**
   * Get underlying token decimals for a pool
   */
  async getUnderlyingTokenDecimals(poolAddress: string): Promise<number> {
    try {
      const pool = new ethers.Contract(
        poolAddress,
        LENDING_POOL_ABI,
        this.wallet,
      );
      const decimals = await pool.underlyingTokenDecimals();
      return Number(decimals);
    } catch (error) {
      this.logger.error(
        `Failed to get underlying token decimals for pool ${poolAddress}:`,
        error,
      );
      throw new Error(
        `Failed to get underlying token decimals: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }






  // Token interactions
  async getTokenInfo(tokenAddress: string): Promise<{
    name: string;
    symbol: string;
    decimals: number;
    totalSupply: string;
  }> {
    try {
      const token = new ethers.Contract(
        tokenAddress,
        MOCK_TOKEN_ABI,
        this.wallet,
      );

      const [name, symbol, decimals, totalSupply] = await Promise.all([
        token.name(),
        token.symbol(),
        token.decimals(),
        token.totalSupply(),
      ]);

      return {
        name,
        symbol,
        decimals: Number(decimals),
        totalSupply: totalSupply.toString(),
      };
    } catch (error) {
      this.logger.error(`Failed to get token info for ${tokenAddress}:`, error);
      throw new Error(
        `Failed to get token info: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  async getTokenBalance(
    tokenAddress: string,
    holderAddress: string,
  ): Promise<string> {
    try {
      const token = new ethers.Contract(
        tokenAddress,
        MOCK_TOKEN_ABI,
        this.wallet,
      );
      const balance = await token.balanceOf(holderAddress);
      return balance.toString();
    } catch (error) {
      this.logger.error(
        `Failed to get token balance for ${holderAddress}:`,
        error,
      );
      throw new Error(
        `Failed to get token balance: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  // Get lending token balance
  async getLendingTokenBalance(userAddress: string): Promise<string> {
    const lendingTokenAddress = this.getLendingTokenAddress();
    if (!lendingTokenAddress) {
      throw new Error('Lending token address not configured');
    }
    return this.getTokenBalance(lendingTokenAddress, userAddress);
  }

  // Get collateral token balance
  async getCollateralTokenBalance(userAddress: string): Promise<string> {
    const collateralTokenAddress = process.env.COLLATERAL_TOKEN_ADDRESS || '';
    if (!collateralTokenAddress) {
      throw new Error('Collateral token address not configured');
    }
    return this.getTokenBalance(collateralTokenAddress, userAddress);
  }



  // Oracle interactions
  async getPrice(oracleAddress: string): Promise<string> {
    try {
      const oracle = new ethers.Contract(
        oracleAddress,
        ORACLE_ABI,
        this.wallet,
      );
      const price = await oracle.getPrice();
      return price.toString();
    } catch (error) {
      this.logger.error(
        `Failed to get price from oracle ${oracleAddress}:`,
        error,
      );
      throw new Error(
        `Failed to get price: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  // Helper methods to get contract addresses by asset type
  async getPoolAddress(assetType: string): Promise<string> {
    try {
      return await this.getPoolByAssetType(assetType);
    } catch (error) {
      this.logger.error(`Failed to get pool address for ${assetType}:`, error);
      throw new Error(
        `Failed to get pool address for ${assetType}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  async getCollateralTokenAddress(assetType: string): Promise<string> {
    try {
      const poolAddress = await this.getPoolAddress(assetType);
      const pool = new ethers.Contract(
        poolAddress,
        LENDING_POOL_ABI,
        this.wallet,
      );
      return await pool.getCollateralToken();
    } catch (error) {
      this.logger.error(
        `Failed to get collateral token address for ${assetType}:`,
        error,
      );
      throw new Error(
        `Failed to get collateral token address for ${assetType}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }




}