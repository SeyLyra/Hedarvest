import { Injectable, Logger } from '@nestjs/common';
import { ethers } from 'ethers';

// Updated contract ABIs for PoolFactory and LendingPool based on new smart contracts
const POOL_FACTORY_ABI = [
  'function getAllPools() external view returns (address[])',
  'function getPool(string) external view returns (address)',
  'function isPoolExists(string) external view returns (bool)',
  'function getPoolInfo(string) external view returns (tuple(address poolAddress, string assetType, address lendingToken, address collateralToken, address lpToken, uint256 baseLTV, uint256 liquidationThreshold, uint256 liquidationBonus, bool exists))',
  'function getAllPoolsInfo() external view returns (tuple(address poolAddress, string assetType, address lendingToken, address collateralToken, address lpToken, uint256 baseLTV, uint256 liquidationThreshold, uint256 liquidationBonus, bool exists)[])',
  'function getPoolStatsByAsset(string) external view returns (tuple(address poolAddress, string assetType, uint256 totalAssets, uint256 totalBorrows, uint256 totalReserves, uint256 availableLiquidity, uint256 utilizationRate, uint256 borrowRate, uint256 supplyRate, uint256 activePositions))',
  'function getBorrowerPositions(string, address) external view returns (uint256[])',
  'function getAllBorrowerPositions(address) external view returns (tuple(string assetType, address poolAddress, uint256[] positionIds, uint256 totalCollateral, uint256 totalDebt, uint256 averageHealthFactor)[])',
  'function getPositionDetails(string, address, uint256) external view returns (uint256 collateral, uint256 debt, uint256 healthFactor, bool active, uint256 maxBorrowCapacity, uint256 availableToBorrow)',
  'function isAssetConfigured(string) external view returns (bool)',
  'function getAssetConfig(string) external view returns (uint256 baseLTV, uint256 liquidationThreshold, uint256 liquidationBonus, bool configured)',
];

const LENDING_POOL_ABI = [
  // Core pool information
  'function getAssetType() external view returns (string)',
  'function getCollateralToken() external view returns (address)',
  'function lendingToken() external view returns (address)',
  'function collateralToken() external view returns (address)',
  'function lpToken() external view returns (address)',
  
  // Pool statistics
  'function getPoolStats() external view returns (uint256 totalAssets, uint256 totalBorrows, uint256 totalReserves, uint256 utilizationRate, uint256 borrowRate, uint256 supplyRate, uint256 activePositions, uint256 availableLiquidity)',
  'function availableLiquidity() external view returns (uint256)',
  'function utilizationRate() external view returns (uint256)',
  'function currentAPR() external view returns (uint256)',
  'function getTVL() external view returns (uint256)',
  
  // Interest rate functions
  'function getUtilizationRate() external view returns (uint256)',
  'function getBorrowRate() external view returns (uint256)',
  'function getSupplyRate() external view returns (uint256)',
  'function accrueInterest() external',
  
  // Liquidity provider functions
  'function deposit(uint256 amount) external',
  'function withdraw(uint256 lpAmount) external',
  'function getLPBalance(address user) external view returns (uint256)',
  
  // Position management functions
  'function createPosition() external returns (uint256)',
  'function depositCollateral(uint256 positionId, uint256 amount) external',
  'function depositCollateralWithToken(uint256 positionId, address tokenAddress, uint256 amount) external',
  'function borrow(uint256 positionId, uint256 amount) external',
  'function repay(uint256 positionId, uint256 amount) external',
  'function withdrawCollateral(uint256 positionId, uint256 amount) external',
  'function closePosition(uint256 positionId) external',
  
  // Position query functions
  'function getUserPositions(address user) external view returns (uint256[])',
  'function getPositionDetails(address borrower, uint256 positionId) external view returns (uint256 collateral, uint256 debt, uint256 healthFactor, bool active, uint256 maxBorrowCapacity, uint256 availableToBorrow)',
  'function getPositionDebt(address borrower, uint256 positionId) external view returns (uint256)',
  'function getHealthFactor(address borrower, uint256 positionId) external view returns (uint256)',
  'function getUserTotalCollateral(address user) external view returns (uint256)',
  'function getUserSummary(address user) external view returns (uint256 totalCollateral, uint256 totalDebt, uint256 totalPositions, uint256 activePositions, uint256 lpBalance, uint256 averageHealthFactor)',
  
  // Collateral validation functions
  'function isValidCollateral(address tokenAddress) external view returns (bool)',
  'function validateCollateralDeposit(address tokenAddress, uint256 amount) external view returns (bool valid, string memory reason)',
  'function getCollateralTokenInfo() external view returns (address tokenAddress, string memory assetName, bool isAssociated)',
  'function canUserDepositToken(address user, address tokenAddress) external view returns (bool canDeposit, string memory reason)',
  'function getValidCollateralTokens() external view returns (address[] memory tokens, string[] memory names)',
  
  // Risk parameters
  'function getRiskParameters() external view returns (uint256 baseLTV, uint256 liquidationThreshold, uint256 liquidationBonus, uint256 minHealthFactor)',
  'function getInterestRateModel() external view returns (uint256 baseRate, uint256 slope1, uint256 slope2, uint256 optimalUtilization, uint256 reserveFactor)',
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

  constructor() {
    this.initializeProvider();
  }

  // Get contract addresses from deployment data
  getFactoryAddress(): string {
    return (
      process.env.POOL_FACTORY_ADDRESS ||
      '0x5Cd3acdbfc7DDd2f61Cb07Bb15C8B12Bb62375D5'
    );
  }

  getOracleAddress(): string {
    return (
      process.env.PRICE_ORACLE_ADDRESS ||
      '0x022968dd00b5F11932AF0794a533e049c983bD6F'
    );
  }

  getLendingTokenAddress(): string {
    return (
      process.env.LENDING_TOKEN_ADDRESS ||
      '0x00000000000000000000000000000000006a10d6'
    );
  }


  // Get all pools with complete information dynamically
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
      
      const allPoolsInfo = await factory.getAllPoolsInfo();
      
      return allPoolsInfo.map((poolInfo: any) => ({
        assetType: poolInfo.assetType,
        poolAddress: poolInfo.poolAddress,
        lendingToken: poolInfo.lendingToken,
        collateralToken: poolInfo.collateralToken,
        lpToken: poolInfo.lpToken,
        baseLTV: Number(poolInfo.baseLTV),
        liquidationThreshold: Number(poolInfo.liquidationThreshold),
        liquidationBonus: Number(poolInfo.liquidationBonus),
      }));
    } catch (error) {
      this.logger.error('Failed to get all pools info:', error);
      throw new Error(
        `Failed to get all pools info: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  private initializeProvider(): void {
    try {
      this.provider = new ethers.JsonRpcProvider(
        process.env.HEDERA_JSON_RPC_URL,
      );
      this.wallet = new ethers.Wallet(
        process.env.EVM_PRIVATE_KEY!,
        this.provider,
      );
      this.logger.log('EVM provider and wallet initialized');
    } catch (error) {
      this.logger.error('Failed to initialize EVM provider:', error);
      throw new Error('EVM provider initialization failed');
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

      const [assetType, lendingToken, collateralToken, lpToken, poolStats] =
        await Promise.all([
          pool.getAssetType(),
          pool.lendingToken(),
          pool.getCollateralToken(),
          pool.lpToken(),
          pool.getPoolStats(),
        ]);

      return {
        assetType,
        lendingToken,
        collateralToken,
        lpToken,
        totalAssets: poolStats.totalAssets.toString(),
        totalBorrows: poolStats.totalBorrows.toString(),
        totalReserves: poolStats.totalReserves.toString(),
        availableLiquidity: poolStats.availableLiquidity.toString(),
        utilizationRate: poolStats.utilizationRate.toString(),
        currentAPR: poolStats.borrowRate.toString(),
        activePositions: poolStats.activePositions.toString(),
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
      const [availableLiquidity, totalBorrows] = await Promise.all([
        pool.availableLiquidity(),
        pool.totalBorrows(),
      ]);

      return {
        availableLiquidity: availableLiquidity.toString(),
        totalBorrows: totalBorrows.toString(),
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

  // Investor functions
  async depositToPool(poolAddress: string, amount: string): Promise<string> {
    try {
      const pool = new ethers.Contract(
        poolAddress,
        LENDING_POOL_ABI,
        this.wallet,
      );
      const tx = await pool.deposit(amount);
      await tx.wait();

      this.logger.log(`Deposited ${amount} to pool ${poolAddress}`);
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


  // Legacy method - creates position and deposits collateral
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
      
      // Create position first
      const createTx = await pool.createPosition();
      await createTx.wait();
      
      // Get the position ID from the transaction receipt
      const receipt = await createTx.wait();
      const positionId = receipt.logs[0].args.positionId || 1; // Fallback to 1 if not found
      
      // Deposit collateral to the position
      const tx = await pool.depositCollateral(positionId, amount);
      await tx.wait();

      this.logger.log(`Deposited ${amount} collateral to position ${positionId} in pool ${poolAddress}`);
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


  // Legacy method - creates loan (borrows from position 1)
  async createLoan(poolAddress: string, amount: string): Promise<string> {
    try {
      const pool = new ethers.Contract(
        poolAddress,
        LENDING_POOL_ABI,
        this.wallet,
      );
      const tx = await pool.borrow(1, amount); // Use position 1 as default
      await tx.wait();

      this.logger.log(`Created loan of ${amount} in pool ${poolAddress}`);
      return tx.hash;
    } catch (error) {
      this.logger.error(`Failed to create loan in pool ${poolAddress}:`, error);
      throw new Error(
        `Failed to create loan: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  // Legacy method - repays loan (repays position 1)
  async repayLoan(poolAddress: string, amount: string): Promise<string> {
    try {
      const pool = new ethers.Contract(
        poolAddress,
        LENDING_POOL_ABI,
        this.wallet,
      );
      const tx = await pool.repay(1, amount); // Use position 1 as default
      await tx.wait();

      this.logger.log(`Repaid loan of ${amount} in pool ${poolAddress}`);
      return tx.hash;
    } catch (error) {
      this.logger.error(`Failed to repay loan in pool ${poolAddress}:`, error);
      throw new Error(
        `Failed to repay loan: ${
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