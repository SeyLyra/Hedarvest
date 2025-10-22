import { Injectable, Logger } from '@nestjs/common';
import { ethers } from 'ethers';
import {
  Client,
  AccountId,
  PrivateKey,
  TokenId,
  TokenAssociateTransaction,
  TokenInfoQuery,
} from '@hashgraph/sdk';

// Updated contract ABIs for PoolFactory and LendingPool based on new smart contracts
const POOL_FACTORY_ABI = [
  'function getAllPools() external view returns (address[])',
  'function getAllPoolsWithDetails() external view returns (tuple(address underlyingToken, address collateralToken, address lpToken, address debtToken, uint256 totalCash, uint256 totalBorrowed, uint256 totalReserves, uint256 borrowIndex, uint256 liquidityIndex)[])',
];

const LENDING_POOL_ABI = [
  // Core pool information
  'function underlyingToken() external view returns (address)',
  'function collateralToken() external view returns (address)',
  'function lpToken() external view returns (address)',
  'function debtToken() external view returns (address)',
  
  // Pool statistics
  'function totalCash() external view returns (uint256)',
  'function totalBorrowed() external view returns (uint256)',
  'function totalReserves() external view returns (uint256)',
  'function totalAssets() external view returns (uint256)',
  
  // Interest rate functions
  'function borrowIndex() external view returns (uint256)',
  'function liquidityIndex() external view returns (uint256)',
  'function getBorrowRate() external view returns (uint256)',
  'function accrueInterest() external',
  
  // Core lending functions
  'function deposit(uint256 amount) external',
  'function withdraw(uint256 shares) external',
  'function depositCollateral(uint256 amount) external',
  'function withdrawCollateral(uint256 amount) external',
  'function borrow(uint256 amount) external',
  'function repay(uint256 amount) external',
  'function liquidate(address borrower, uint256 repayAmount) external',
  
  // User functions
  'function userCollateral(address user) external view returns (uint256)',
  'function userDebtShares(address user) external view returns (uint256)',
  'function associateTokensForUser(address user, address[] calldata tokens) external',
  
  // Health factor and risk functions
  'function getHealthFactor(address user) external view returns (uint256)',
  'function getBorrowValue(address user) external view returns (uint256)',
  'function getCollateralValue(address user) external view returns (uint256)',
  
  // Pool details
  'function getPoolDetails() external view returns (tuple(address underlyingToken, address collateralToken, address lpToken, address debtToken, uint256 totalCash, uint256 totalBorrowed, uint256 totalReserves, uint256 borrowIndex, uint256 liquidityIndex))',
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
    lpToken: string;
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
              lpToken: poolDetail.lpToken,
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
    lpToken: string;
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
          lpToken: '',
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
        lpToken: poolInfo.lpToken,
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
    lpToken: string;
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

      const [underlyingToken, collateralToken, lpToken, debtToken, totalCash, totalBorrowed, totalReserves] =
        await Promise.all([
          pool.underlyingToken(),
          pool.collateralToken(),
          pool.lpToken(),
          pool.debtToken(),
          pool.totalCash(),
          pool.totalBorrowed(),
          pool.totalReserves(),
        ]);

      // Calculate derived values
      const totalAssets = totalCash + totalBorrowed;
      const availableLiquidity = totalCash.toString();
      const utilizationRate = totalAssets > 0 ? ((totalBorrowed * 10000n) / totalAssets).toString() : '0';
      
      // Calculate dynamic APR based on utilization rate
      let currentAPR = '5'; // Default fallback
      try {
        const borrowRate = await pool.getBorrowRate();
        currentAPR = ((Number(borrowRate) / 1e18) * 100).toFixed(2);
      } catch (rateError) {
        this.logger.warn('Could not fetch borrow rate, calculating dynamic APR:', rateError);
        
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
        lpToken: lpToken,
        totalAssets: totalAssets.toString(),
        totalBorrows: totalBorrowed.toString(),
        totalReserves: totalReserves.toString(),
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
        availableLiquidity: totalCash.toString(),
        totalBorrows: totalBorrowed.toString(),
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
      const underlyingTokenId = '0.0.7101034'; // USDC token ID
      
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
      const pool = new ethers.Contract(
        poolAddress,
        LENDING_POOL_ABI,
        this.wallet,
      );
      
      // Convert amount to token decimals (USDC has 6 decimals)
      // If amount is "100", convert to "100000000" (100 * 10^6)
      const tokenDecimals = 6; // USDC has 6 decimals
      const amountInSmallestUnits = ethers.parseUnits(amount, tokenDecimals);
      
      this.logger.log(`Depositing ${amount} USDC (${amountInSmallestUnits.toString()} smallest units) to pool ${poolAddress}`);
      
      const tx = await pool.deposit(amountInSmallestUnits);
      await tx.wait();

      this.logger.log(`Successfully deposited ${amount} USDC to pool ${poolAddress}`);
      return tx.hash;
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
      const pool = new ethers.Contract(
        poolAddress,
        LENDING_POOL_ABI,
        this.wallet,
      );
      const tx = await pool.withdraw(shares);
      await tx.wait();

      this.logger.log(`Withdrew ${shares} shares from pool ${poolAddress}`);
      return tx.hash;
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
      const pool = new ethers.Contract(
        poolAddress,
        LENDING_POOL_ABI,
        this.wallet,
      );
      
      const tx = await pool.depositCollateral(amount);
      await tx.wait();

      this.logger.log(`Deposited ${amount} collateral to pool ${poolAddress}`);
      return tx.hash;
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
      const pool = new ethers.Contract(
        poolAddress,
        LENDING_POOL_ABI,
        this.wallet,
      );
      const tx = await pool.borrow(amount);
      await tx.wait();

      this.logger.log(`Borrowed ${amount} from pool ${poolAddress}`);
      return tx.hash;
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
      const pool = new ethers.Contract(
        poolAddress,
        LENDING_POOL_ABI,
        this.wallet,
      );
      const tx = await pool.repay(amount);
      await tx.wait();

      this.logger.log(`Repaid ${amount} to pool ${poolAddress}`);
      return tx.hash;
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
      const pool = new ethers.Contract(
        poolAddress,
        LENDING_POOL_ABI,
        this.wallet,
      );
      const tx = await pool.liquidate(borrowerAddress);
      await tx.wait();

      this.logger.log(
        `Liquidated borrower ${borrowerAddress} in pool ${poolAddress}`,
      );
      return tx.hash;
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






  // Legacy method - get LP shares
  async getLPShares(
    poolAddress: string,
    investorAddress: string,
  ): Promise<string> {
    try {
      const pool = new ethers.Contract(
        poolAddress,
        LENDING_POOL_ABI,
        this.wallet,
      );
      const balance = await pool.getLPBalance(investorAddress);
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