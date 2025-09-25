import { Injectable, Logger } from '@nestjs/common';
import { ethers } from 'ethers';
// Using process.env directly

// Simplified contract ABIs
const POOL_FACTORY_ABI = [
  'function getAllPools() external view returns (address[])',
  'function grainToPool(string) external view returns (address)',
];

const GRAIN_POOL_ABI = [
  'function grainType() external view returns (string)',
  'function lendingToken() external view returns (address)',
  'function collateralToken() external view returns (address)',
  'function priceOracle() external view returns (address)',
  'function baseLTV() external view returns (uint256)',
  'function riskPremium() external view returns (uint256)',
  'function debtCeiling() external view returns (uint256)',
  'function protocolFee() external view returns (uint256)',
  'function totalBorrows() external view returns (uint256)',
  'function totalReserves() external view returns (uint256)',
  'function availableLiquidity() external view returns (uint256)',
  'function getPoolBalance() external view returns (uint256, uint256)',
  'function getExchangeRate() external view returns (uint256)',
  'function deposit(uint256 amount) external',
  'function withdraw(uint256 shares) external',
  'function depositCollateral(uint256 amount) external',
  'function withdrawCollateral(uint256 amount) external',
  'function createLoan(address farmer, uint256 amount) external',
  'function repayLoan(uint256 amount) external',
  'function borrows(address) external view returns (uint256)',
  'function collateral(address) external view returns (uint256)',
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
  async getAllPools(): Promise<string[]> {
    try {
      const factory = new ethers.Contract(
        process.env.POOL_FACTORY_ADDRESS!,
        POOL_FACTORY_ABI,
        this.wallet
      );
      return await factory.getAllPools();
    } catch (error) {
      this.logger.error('Failed to get all pools:', error);
      throw new Error(`Failed to get all pools: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
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

  // GrainPool interactions
  async getPoolInfo(poolAddress: string): Promise<{
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
      const pool = new ethers.Contract(poolAddress, GRAIN_POOL_ABI, this.wallet);
      
      const [
        grainType,
        lendingToken,
        collateralToken,
        oracle,
        baseLTV,
        riskPremium,
        debtCeiling,
        protocolFee,
        totalBorrows,
        totalReserves,
        availableLiquidity,
        exchangeRate
      ] = await Promise.all([
        pool.grainType(),
        pool.lendingToken(),
        pool.collateralToken(),
        pool.priceOracle(),
        pool.baseLTV(),
        pool.riskPremium(),
        pool.debtCeiling(),
        pool.protocolFee(),
        pool.totalBorrows(),
        pool.totalReserves(),
        pool.availableLiquidity(),
        pool.getExchangeRate()
      ]);

      return {
        grainType,
        lendingToken,
        collateralToken,
        oracle,
        baseLTV: Number(baseLTV),
        riskPremium: Number(riskPremium),
        debtCeiling: debtCeiling.toString(),
        protocolFee: Number(protocolFee),
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

  async getPoolBalance(poolAddress: string): Promise<{
    availableLiquidity: string;
    totalBorrows: string;
  }> {
    try {
      const pool = new ethers.Contract(poolAddress, GRAIN_POOL_ABI, this.wallet);
      const [availableLiquidity, totalBorrows] = await pool.getPoolBalance();
      
      return {
        availableLiquidity: availableLiquidity.toString(),
        totalBorrows: totalBorrows.toString()
      };
    } catch (error) {
      this.logger.error(`Failed to get pool balance for ${poolAddress}:`, error);
      throw new Error(`Failed to get pool balance: ${error instanceof Error ? error.message : 'Unknown error'}`);
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