import { Injectable, Logger } from '@nestjs/common';
import { ethers } from 'ethers';

// Updated contract ABIs for LendingFactory and LendingPool
const LENDING_FACTORY_ABI = [
  'function getAllPools() external view returns (tuple(address poolAddress, address oracleAddress, string assetType)[])',
  'function getPool(string) external view returns (tuple(address poolAddress, address oracleAddress, string assetType))',
];

const LENDING_POOL_ABI = [
  'function assetType() external view returns (string)',
  'function lendingToken() external view returns (address)',
  'function collateralToken() external view returns (address)',
  'function lpToken() external view returns (address)',
  'function priceOracle() external view returns (address)',
  'function baseLTV() external view returns (uint256)',
  'function protocolFee() external view returns (uint256)',
  'function totalAssets() external view returns (uint256)',
  'function totalBorrows() external view returns (uint256)',
  'function totalReserves() external view returns (uint256)',
  'function availableLiquidity() external view returns (uint256)',
  'function exchangeRate() external view returns (uint256)',
  'function utilizationRate() external view returns (uint256)',
  'function currentAPR() external view returns (uint256)',
  'function borrows(address) external view returns (uint256)',
  'function collateral(address) external view returns (uint256)',
  'function lpShares(address) external view returns (uint256)',
  'function deposit(uint256 amount) external',
  'function withdraw(uint256 shares) external',
  'function depositCollateral(uint256 amount) external',
  'function createLoan(uint256 amount) external',
  'function repayLoan(uint256 amount) external',
  'function liquidate(address borrower) external',
  'function getCurrentBorrowBalance(address borrower) external view returns (uint256)',
  'function accrueInterest() external',
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

  // Get token addresses from environment
  getLendingTokenAddress(): string {
    return process.env.LENDING_TOKEN_ADDRESS || '';
  }

  // Get specific pool addresses
  getPoolAddresses(): { [key: string]: string } {
    return {
      rice: process.env.RICE_POOL_ADDRESS || '',
      corn: process.env.CORN_POOL_ADDRESS || '',
      wheat: process.env.WHEAT_POOL_ADDRESS || '',
      soybean: process.env.SOYBEAN_POOL_ADDRESS || '',
    };
  }

  // Get specific oracle addresses
  getOracleAddresses(): { [key: string]: string } {
    return {
      rice: process.env.RICE_ORACLE_ADDRESS || '',
      corn: process.env.CORN_ORACLE_ADDRESS || '',
      wheat: process.env.WHEAT_ORACLE_ADDRESS || '',
      soybean: process.env.SOYBEAN_ORACLE_ADDRESS || '',
    };
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

  // LendingFactory interactions
  async getAllPools(): Promise<
    Array<{ poolAddress: string; oracleAddress: string; assetType: string }>
  > {
    const maxRetries = 3;
    const baseDelay = 1000; // 1 second

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const factoryAddress = process.env.LENDING_FACTORY_ADDRESS;
        this.logger.log(
          `Attempt ${attempt}: Attempting to get pools from factory at: ${factoryAddress}`,
        );

        if (!factoryAddress || factoryAddress.includes('XXXX')) {
          this.logger.warn(
            'LENDING_FACTORY_ADDRESS not set or using placeholder value',
          );
          return [];
        }

        const factory = new ethers.Contract(
          factoryAddress,
          LENDING_FACTORY_ABI,
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
        process.env.LENDING_FACTORY_ADDRESS!,
        LENDING_FACTORY_ABI,
        this.wallet,
      );
      const poolInfo = await factory.getPool(assetType);
      return poolInfo.poolAddress;
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
  async getPoolInfo(poolAddress: string): Promise<{
    assetType: string;
    lendingToken: string;
    collateralToken: string;
    lpToken: string;
    oracle: string;
    baseLTV: number;
    protocolFee: number;
    totalAssets: string;
    totalBorrows: string;
    totalReserves: string;
    availableLiquidity: string;
    exchangeRate: string;
    utilizationRate: string;
    currentAPR: string;
  }> {
    try {
      const pool = new ethers.Contract(
        poolAddress,
        LENDING_POOL_ABI,
        this.wallet,
      );

      const [
        assetType,
        lendingToken,
        collateralToken,
        lpToken,
        oracle,
        baseLTV,
        protocolFee,
        totalAssets,
        totalBorrows,
        totalReserves,
        availableLiquidity,
        exchangeRate,
        utilizationRate,
        currentAPR,
      ] = await Promise.all([
        pool.assetType(),
        pool.lendingToken(),
        pool.collateralToken(),
        pool.lpToken(),
        pool.priceOracle(),
        pool.baseLTV(),
        pool.protocolFee(),
        pool.totalAssets(),
        pool.totalBorrows(),
        pool.totalReserves(),
        pool.availableLiquidity(),
        pool.exchangeRate(),
        pool.utilizationRate(),
        pool.currentAPR(),
      ]);

      return {
        assetType,
        lendingToken,
        collateralToken,
        lpToken,
        oracle,
        baseLTV: Number(baseLTV),
        protocolFee: Number(protocolFee),
        totalAssets: totalAssets.toString(),
        totalBorrows: totalBorrows.toString(),
        totalReserves: totalReserves.toString(),
        availableLiquidity: availableLiquidity.toString(),
        exchangeRate: exchangeRate.toString(),
        utilizationRate: utilizationRate.toString(),
        currentAPR: currentAPR.toString(),
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
    oracleAddress: string;
    lendingTokenAddress: string;
    baseLtv: number;
    protocolFee: number;
    availableLiquidity: string;
    totalBorrows: string;
    totalReserves: string;
    utilizationRate: string;
    exchangeRate: string;
    currentAPR: string;
  }> {
    try {
      const poolAddress = await this.getPoolByAssetType(assetType);
      const poolInfo = await this.getPoolInfo(poolAddress);

      return {
        assetType: poolInfo.assetType,
        poolAddress,
        oracleAddress: poolInfo.oracle,
        lendingTokenAddress: poolInfo.lendingToken,
        baseLtv: poolInfo.baseLTV,
        protocolFee: poolInfo.protocolFee,
        availableLiquidity: poolInfo.availableLiquidity,
        totalBorrows: poolInfo.totalBorrows,
        totalReserves: poolInfo.totalReserves,
        utilizationRate: poolInfo.utilizationRate,
        exchangeRate: poolInfo.exchangeRate,
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

  // Farmer functions
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

  async createLoan(poolAddress: string, amount: string): Promise<string> {
    try {
      const pool = new ethers.Contract(
        poolAddress,
        LENDING_POOL_ABI,
        this.wallet,
      );
      const tx = await pool.createLoan(amount);
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

  async repayLoan(poolAddress: string, amount: string): Promise<string> {
    try {
      const pool = new ethers.Contract(
        poolAddress,
        LENDING_POOL_ABI,
        this.wallet,
      );
      const tx = await pool.repayLoan(amount);
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

  // Get borrower position
  async getBorrowerPosition(
    poolAddress: string,
    borrowerAddress: string,
  ): Promise<{
    borrowBalance: string;
    collateralAmount: string;
  }> {
    try {
      const pool = new ethers.Contract(
        poolAddress,
        LENDING_POOL_ABI,
        this.wallet,
      );
      const [borrowBalance, collateralAmount] = await Promise.all([
        pool.getCurrentBorrowBalance(borrowerAddress),
        pool.collateral(borrowerAddress),
      ]);

      return {
        borrowBalance: borrowBalance.toString(),
        collateralAmount: collateralAmount.toString(),
      };
    } catch (error) {
      this.logger.error(
        `Failed to get borrower position for ${borrowerAddress}:`,
        error,
      );
      throw new Error(
        `Failed to get borrower position: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  // Get LP shares for an investor
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
      const shares = await pool.lpShares(investorAddress);
      return shares.toString();
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
      return await pool.collateralToken();
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

  async getOracleAddress(assetType: string): Promise<string> {
    try {
      const poolAddress = await this.getPoolAddress(assetType);
      const pool = new ethers.Contract(
        poolAddress,
        LENDING_POOL_ABI,
        this.wallet,
      );
      return await pool.priceOracle();
    } catch (error) {
      this.logger.error(
        `Failed to get oracle address for ${assetType}:`,
        error,
      );
      throw new Error(
        `Failed to get oracle address for ${assetType}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }
}