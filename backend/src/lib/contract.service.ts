import { Injectable, Logger } from '@nestjs/common';
import { ethers } from 'ethers';
// Using process.env directly

// Simplified contract ABIs
const POOL_FACTORY_ABI = [
  'function getAllPools() external view returns (tuple(address poolAddress, address oracleAddress, string grainType)[])',
  'function getPool(string) external view returns (tuple(address poolAddress, address oracleAddress, string grainType))',
  'function getPoolStats() external view returns (tuple(address pool, string grainType, uint256 totalAssets, uint256 totalBorrows, uint256 availableLiquidity)[])',
];

const GRAIN_POOL_ABI = [
  'function grainType() external view returns (string)',
  'function lendingToken() external view returns (address)',
  'function priceOracle() external view returns (address)',
  'function baseLTV() external view returns (uint256)',
  'function riskPremium() external view returns (uint256)',
  'function debtCeiling() external view returns (uint256)',
  'function protocolFee() external view returns (uint256)',
  'function totalAssets() external view returns (uint256)',
  'function totalBorrows() external view returns (uint256)',
  'function totalReserves() external view returns (uint256)',
  'function availableLiquidity() external view returns (uint256)',
  'function exchangeRate() external view returns (uint256)',
  'function borrows(address) external view returns (uint256)',
  'function collateral(address) external view returns (uint256)',
  'function deposit(uint256 amount) external',
  'function withdraw(uint256 shares) external',
  'function depositCollateral(uint256 amount) external',
  'function createLoan(uint256 amount) external',
  'function repayLoan(uint256 amount) external',
  'function repayFullLoan() external',
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

const ORACLE_ABI = [
  'function getPrice() external view returns (uint256)',
];

@Injectable()
export class ContractService {
  private readonly logger = new Logger(ContractService.name);
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet;

  constructor() {
    this.initializeProvider();
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
  async getAllPools(): Promise<Array<{poolAddress: string, oracleAddress: string, grainType: string}>> {
    try {
      const factoryAddress = process.env.POOL_FACTORY_ADDRESS;
       console.log("factoryAddress", factoryAddress);
      this.logger.log(`Attempting to get pools from factory at: ${factoryAddress}`);
      
      if (!factoryAddress || factoryAddress.includes('XXXX')) {
        this.logger.warn('POOL_FACTORY_ADDRESS not set or using placeholder value');
        return [];
      }
      
      const factory = new ethers.Contract(
        factoryAddress,
        POOL_FACTORY_ABI,
        this.wallet
      );
      
      const pools = await factory.getAllPools();
      this.logger.log(`Successfully retrieved ${pools.length} pools from factory`);
      return pools;
    } catch (error) {
      this.logger.error('Failed to get all pools:', error);
      throw new Error(`Failed to get all pools: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // New method: Get all pools with stats directly from factory
  async getAllPoolsWithStats(): Promise<Array<{
    poolAddress: string;
    grainType: string;
    totalAssets: string;
    totalBorrows: string;
    availableLiquidity: string;
  }>> {
    try {
      const factory = new ethers.Contract(
        process.env.POOL_FACTORY_ADDRESS!,
        POOL_FACTORY_ABI,
        this.wallet
      );
      
      const poolStats = await factory.getPoolStats();
      
      return poolStats.map((stat: any) => ({
        poolAddress: stat.pool,
        grainType: stat.grainType,
        totalAssets: stat.totalAssets.toString(),
        totalBorrows: stat.totalBorrows.toString(),
        availableLiquidity: stat.availableLiquidity.toString(),
      }));
    } catch (error) {
      this.logger.error('Failed to get pools with stats:', error);
      throw new Error(`Failed to get pools with stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Enhanced method: Get all pools with full details
  async getAllPoolsFromFactory(): Promise<Array<{
    grainType: string;
    poolAddress: string;
    oracleAddress: string;
    lendingTokenAddress: string;
    baseLtv: number;
    riskPremium: number;
    debtCeiling: string;
    protocolFee: number;
    availableLiquidity: string;
    totalBorrows: string;
    totalReserves: string;
    utilizationRate: number;
  }>> {
    try {
      const poolInfos = await this.getAllPools();
      this.logger.log(`Fetching details for ${poolInfos.length} pools from blockchain`);
      
      const pools: any[] = [];
      for (const poolInfo of poolInfos) {
        try {
          // Handle both array and object formats
          const poolAddress = Array.isArray(poolInfo) ? poolInfo[0] : poolInfo.poolAddress;
          const oracleAddress = Array.isArray(poolInfo) ? poolInfo[1] : poolInfo.oracleAddress;
          const grainType = Array.isArray(poolInfo) ? poolInfo[2] : poolInfo.grainType;
          
          this.logger.log(`Processing pool: ${grainType} at ${poolAddress}`);
          
          const detailedPoolInfo = await this.getPoolInfo(poolAddress);
          const poolBalance = await this.getPoolBalance(poolAddress);
          
          const utilizationRate = this.calculateUtilization(
            poolBalance.availableLiquidity,
            poolBalance.totalBorrows
          );
          
          pools.push({
            grainType: grainType,
            poolAddress: poolAddress,
            oracleAddress: oracleAddress,
            lendingTokenAddress: detailedPoolInfo.lendingToken,
            baseLtv: detailedPoolInfo.baseLTV,
            riskPremium: detailedPoolInfo.riskPremium,
            debtCeiling: detailedPoolInfo.debtCeiling,
            protocolFee: detailedPoolInfo.protocolFee,
            availableLiquidity: poolBalance.availableLiquidity,
            totalBorrows: poolBalance.totalBorrows,
            totalReserves: detailedPoolInfo.totalReserves,
            utilizationRate,
          });
        } catch (poolError) {
          const poolAddress = Array.isArray(poolInfo) ? poolInfo[0] : poolInfo.poolAddress;
          this.logger.warn(`Failed to get info for pool ${poolAddress}:`, poolError);
        }
      }
      
      return pools;
    } catch (error) {
      this.logger.error('Failed to get pools from factory:', error);
      throw new Error(`Failed to get pools from factory: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private calculateUtilization(availableLiquidity: string, totalBorrows: string): number {
    const liquidity = parseFloat(availableLiquidity);
    const borrows = parseFloat(totalBorrows);
    const totalSupply = liquidity + borrows;
    
    return totalSupply > 0 ? Math.round((borrows / totalSupply) * 100) : 0;
  }

  async getPoolByGrainType(grainType: string): Promise<string> {
    try {
      const factory = new ethers.Contract(
        process.env.POOL_FACTORY_ADDRESS!,
        POOL_FACTORY_ABI,
        this.wallet
      );
      return await factory.grainToPool(grainType);
    } catch (error) {
      this.logger.error(`Failed to get pool for ${grainType}:`, error);
      throw new Error(`Failed to get pool for ${grainType}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get pool info directly from blockchain
  async getPoolInfo(poolAddress: string): Promise<{
    grainType: string;
    lendingToken: string;
    collateralToken: string;
    oracle: string;
    baseLTV: number;
    riskPremium: number;
    debtCeiling: string;
    protocolFee: number;
    totalAssets: string;
    totalBorrows: string;
    totalReserves: string;
    availableLiquidity: string;
    exchangeRate: string;
  }> {
    try {
      const pool = new ethers.Contract(poolAddress, GRAIN_POOL_ABI, this.wallet);
      
      const [
        grainType,
        lendingToken,
        oracle,
        baseLTV,
        riskPremium,
        debtCeiling,
        protocolFee,
        totalAssets,
        totalBorrows,
        totalReserves,
        availableLiquidity,
        exchangeRate
      ] = await Promise.all([
        pool.grainType(),
        pool.lendingToken(),
        pool.priceOracle(),
        pool.baseLTV(),
        pool.riskPremium(),
        pool.debtCeiling(),
        pool.protocolFee(),
        pool.totalAssets(),
        pool.totalBorrows(),
        pool.totalReserves(),
        pool.availableLiquidity(),
        pool.exchangeRate()
      ]);

      // For now, use the pool address as collateral token (since the contract doesn't have a separate collateral token)
      const collateralToken = poolAddress; // This is a placeholder - in a real implementation, you'd get this from the contract

      return {
        grainType,
        lendingToken,
        collateralToken,
        oracle,
        baseLTV: Number(baseLTV),
        riskPremium: Number(riskPremium),
        debtCeiling: debtCeiling.toString(),
        protocolFee: Number(protocolFee),
        totalAssets: totalAssets.toString(),
        totalBorrows: totalBorrows.toString(),
        totalReserves: totalReserves.toString(),
        availableLiquidity: availableLiquidity.toString(),
        exchangeRate: exchangeRate.toString()
      };
    } catch (error) {
      this.logger.error(`Failed to get pool info for ${poolAddress}:`, error);
      throw new Error(`Failed to get pool info: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get pool balance directly from blockchain
  async getPoolBalance(poolAddress: string): Promise<{
    availableLiquidity: string;
    totalBorrows: string;
  }> {
    try {
      const pool = new ethers.Contract(poolAddress, GRAIN_POOL_ABI, this.wallet);
      const [availableLiquidity, totalBorrows] = await Promise.all([
        pool.availableLiquidity(),
        pool.totalBorrows()
      ]);
      
      return {
        availableLiquidity: availableLiquidity.toString(),
        totalBorrows: totalBorrows.toString()
      };
    } catch (error) {
      this.logger.error(`Failed to get pool balance for ${poolAddress}:`, error);
      throw new Error(`Failed to get pool balance: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // New method: Get pool stats by grain type
  async getPoolStatsByGrainType(grainType: string): Promise<{
    grainType: string;
    poolAddress: string;
    oracleAddress: string;
    lendingTokenAddress: string;
    baseLtv: number;
    riskPremium: number;
    debtCeiling: string;
    protocolFee: number;
    availableLiquidity: string;
    totalBorrows: string;
    totalReserves: string;
    utilizationRate: number;
    exchangeRate: string;
  }> {
    try {
      const poolAddress = await this.getPoolByGrainType(grainType);
      const poolInfo = await this.getPoolInfo(poolAddress);
      const poolBalance = await this.getPoolBalance(poolAddress);
      
      const utilizationRate = this.calculateUtilization(
        poolBalance.availableLiquidity,
        poolBalance.totalBorrows
      );
      
      return {
        grainType: poolInfo.grainType,
        poolAddress,
        oracleAddress: poolInfo.oracle,
        lendingTokenAddress: poolInfo.lendingToken,
        baseLtv: poolInfo.baseLTV,
        riskPremium: poolInfo.riskPremium,
        debtCeiling: poolInfo.debtCeiling,
        protocolFee: poolInfo.protocolFee,
        availableLiquidity: poolBalance.availableLiquidity,
        totalBorrows: poolBalance.totalBorrows,
        totalReserves: poolInfo.totalReserves,
        utilizationRate,
        exchangeRate: poolInfo.exchangeRate,
      };
    } catch (error) {
      this.logger.error(`Failed to get pool stats for ${grainType}:`, error);
      throw new Error(`Failed to get pool stats for ${grainType}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }


  // Investor functions
  async depositToPool(poolAddress: string, amount: string): Promise<string> {
    try {
      const pool = new ethers.Contract(poolAddress, GRAIN_POOL_ABI, this.wallet);
      const tx = await pool.deposit(amount);
      await tx.wait();
      
      this.logger.log(`Deposited ${amount} to pool ${poolAddress}`);
      return tx.hash;
    } catch (error) {
      this.logger.error(`Failed to deposit to pool ${poolAddress}:`, error);
      throw new Error(`Failed to deposit: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async withdrawFromPool(poolAddress: string, shares: string): Promise<string> {
    try {
      const pool = new ethers.Contract(poolAddress, GRAIN_POOL_ABI, this.wallet);
      const tx = await pool.withdraw(shares);
      await tx.wait();
      
      this.logger.log(`Withdrew ${shares} shares from pool ${poolAddress}`);
      return tx.hash;
    } catch (error) {
      this.logger.error(`Failed to withdraw from pool ${poolAddress}:`, error);
      throw new Error(`Failed to withdraw: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Farmer functions
  async depositCollateral(poolAddress: string, amount: string): Promise<string> {
    try {
      const pool = new ethers.Contract(poolAddress, GRAIN_POOL_ABI, this.wallet);
      const tx = await pool.depositCollateral(amount);
      await tx.wait();
      
      this.logger.log(`Deposited ${amount} collateral to pool ${poolAddress}`);
      return tx.hash;
    } catch (error) {
      this.logger.error(`Failed to deposit collateral to pool ${poolAddress}:`, error);
      throw new Error(`Failed to deposit collateral: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async withdrawCollateral(poolAddress: string, amount: string): Promise<string> {
    try {
      const pool = new ethers.Contract(poolAddress, GRAIN_POOL_ABI, this.wallet);
      const tx = await pool.withdrawCollateral(amount);
      await tx.wait();
      
      this.logger.log(`Withdrew ${amount} collateral from pool ${poolAddress}`);
      return tx.hash;
    } catch (error) {
      this.logger.error(`Failed to withdraw collateral from pool ${poolAddress}:`, error);
      throw new Error(`Failed to withdraw collateral: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async createLoan(poolAddress: string, farmerAddress: string, amount: string): Promise<string> {
    try {
      const pool = new ethers.Contract(poolAddress, GRAIN_POOL_ABI, this.wallet);
      const tx = await pool.createLoan(farmerAddress, amount);
      await tx.wait();
      
      this.logger.log(`Created loan of ${amount} for farmer ${farmerAddress}`);
      return tx.hash;
    } catch (error) {
      this.logger.error(`Failed to create loan for farmer ${farmerAddress}:`, error);
      throw new Error(`Failed to create loan: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async repayLoan(poolAddress: string, amount: string): Promise<string> {
    try {
      const pool = new ethers.Contract(poolAddress, GRAIN_POOL_ABI, this.wallet);
      const tx = await pool.repayLoan(amount);
      await tx.wait();
      
      this.logger.log(`Repaid loan of ${amount} in pool ${poolAddress}`);
      return tx.hash;
    } catch (error) {
      this.logger.error(`Failed to repay loan in pool ${poolAddress}:`, error);
      throw new Error(`Failed to repay loan: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
      const token = new ethers.Contract(tokenAddress, MOCK_TOKEN_ABI, this.wallet);
      
      const [name, symbol, decimals, totalSupply] = await Promise.all([
        token.name(),
        token.symbol(),
        token.decimals(),
        token.totalSupply()
      ]);

      return {
        name,
        symbol,
        decimals: Number(decimals),
        totalSupply: totalSupply.toString()
      };
    } catch (error) {
      this.logger.error(`Failed to get token info for ${tokenAddress}:`, error);
      throw new Error(`Failed to get token info: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getTokenBalance(tokenAddress: string, holderAddress: string): Promise<string> {
    try {
      const token = new ethers.Contract(tokenAddress, MOCK_TOKEN_ABI, this.wallet);
      const balance = await token.balanceOf(holderAddress);
      return balance.toString();
    } catch (error) {
      this.logger.error(`Failed to get token balance for ${holderAddress}:`, error);
      throw new Error(`Failed to get token balance: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Oracle interactions
  async getPrice(oracleAddress: string): Promise<string> {
    try {
      const oracle = new ethers.Contract(oracleAddress, ORACLE_ABI, this.wallet);
      const price = await oracle.getPrice();
      return price.toString();
    } catch (error) {
      this.logger.error(`Failed to get price from oracle ${oracleAddress}:`, error);
      throw new Error(`Failed to get price: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Helper methods to get contract addresses by grain type
  async getPoolAddress(grainType: string): Promise<string> {
    try {
      return await this.getPoolByGrainType(grainType);
    } catch (error) {
      this.logger.error(`Failed to get pool address for ${grainType}:`, error);
      throw new Error(`Failed to get pool address for ${grainType}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getCollateralTokenAddress(grainType: string): Promise<string> {
    try {
      const poolAddress = await this.getPoolAddress(grainType);
      const pool = new ethers.Contract(poolAddress, GRAIN_POOL_ABI, this.wallet);
      return await pool.collateralToken();
    } catch (error) {
      this.logger.error(`Failed to get collateral token address for ${grainType}:`, error);
      throw new Error(`Failed to get collateral token address for ${grainType}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getOracleAddress(grainType: string): Promise<string> {
    try {
      const poolAddress = await this.getPoolAddress(grainType);
      const pool = new ethers.Contract(poolAddress, GRAIN_POOL_ABI, this.wallet);
      return await pool.priceOracle();
    } catch (error) {
      this.logger.error(`Failed to get oracle address for ${grainType}:`, error);
      throw new Error(`Failed to get oracle address for ${grainType}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}