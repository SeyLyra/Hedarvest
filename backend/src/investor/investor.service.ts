import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../lib/prisma';
import { InvestorDepositDto, InvestorWithdrawDto } from './dto';
import { TransactionService } from '../transaction/transaction.service';
import { HederaService } from '../lib/hedera.service';
import { ContractService } from '../lib/contract.service';
import { BlockchainPoolsService } from '../pools/blockchain-pools.service';

@Injectable()
export class InvestorService {
  private readonly logger = new Logger(InvestorService.name);
  private portfolioCache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly PORTFOLIO_CACHE_DURATION = 15000; // 15 seconds cache

  constructor(
    private prisma: PrismaService,
    private transactionService: TransactionService,
    private hederaService: HederaService,
    private contractService: ContractService,
    private blockchainPoolsService: BlockchainPoolsService,
  ) {}

  async deposit(investorDepositDto: InvestorDepositDto) {
    const { grainType, amount, depositorAddress } = investorDepositDto;

    // Get pool address from blockchain
    const poolAddress = await this.contractService.getPoolByAssetType(grainType);
    
    if (!poolAddress) {
      throw new NotFoundException(`Pool not found for asset type: ${grainType}`);
    }

    if (amount <= 0) {
      throw new BadRequestException('Amount must be greater than 0');
    }

    try {
      // Process deposit through smart contract
      const contractTxHash = await this.contractService.depositToPool(
        poolAddress,
        amount.toString()
      );

      // Get updated pool info
      const poolInfo = await this.contractService.getPoolInfoFromAddress(poolAddress);

      // Calculate total assets
      const totalAssets = (parseFloat(poolInfo.availableLiquidity) + parseFloat(poolInfo.totalBorrows)).toString();

      // Log transaction in database
      const transaction = await this.transactionService.logTransaction({
        kind: 'investor_deposit',
        ref: `investor_deposit_${poolAddress}_${Date.now()}`,
        entity: 'Investor',
        meta: {
          poolAddress,
          assetType: grainType,
          amount,
          depositorAddress,
          contractTxHash: contractTxHash,
          newTotalAssets: totalAssets,
        },
      });

      // Invalidate portfolio cache for this investor
      this.portfolioCache.delete(depositorAddress);
      this.logger.log(`Invalidated portfolio cache for ${depositorAddress}`);

      return {
        success: true,
        pool: {
          assetType: poolInfo.assetType,
          address: poolAddress,
          totalAssets: totalAssets,
        },
        deposit: {
          amount,
          depositorAddress,
        },
        transactions: {
          contractTxHash: contractTxHash,
          hcsMessageId: transaction.hcsMessageId,
        },
      };
    } catch (error) {
      // Log failed transaction
      await this.transactionService.logTransaction({
        kind: 'investor_deposit_failed',
        ref: `investor_deposit_failed_${poolAddress}_${Date.now()}`,
        entity: 'Investor',
        meta: {
          poolAddress,
          assetType: grainType,
          amount,
          depositorAddress,
          error: error.message,
        },
      });

      throw new BadRequestException(`Deposit failed: ${error.message}`);
    }
  }

  async withdraw(investorWithdrawDto: InvestorWithdrawDto) {
    const { grainType, shares, depositorAddress } = investorWithdrawDto;

    // Get pool address from blockchain
    const poolAddress = await this.contractService.getPoolByAssetType(grainType);
    
    if (!poolAddress) {
      throw new NotFoundException(`Pool not found for asset type: ${grainType}`);
    }

    if (shares <= 0) {
      throw new BadRequestException('Shares must be greater than 0');
    }

    try {
      // Process withdrawal through smart contract
      const contractTxHash = await this.contractService.withdrawFromPool(
        poolAddress,
        shares.toString()
      );

      // Get updated pool info
      const poolInfo = await this.contractService.getPoolInfoFromAddress(poolAddress);

      // Calculate total assets
      const totalAssets = (parseFloat(poolInfo.availableLiquidity) + parseFloat(poolInfo.totalBorrows)).toString();

      // Log transaction in database
      const transaction = await this.transactionService.logTransaction({
        kind: 'investor_withdraw',
        ref: `investor_withdraw_${poolAddress}_${Date.now()}`,
        entity: 'Investor',
        meta: {
          poolAddress,
          assetType: grainType,
          shares,
          depositorAddress,
          contractTxHash: contractTxHash,
          newTotalAssets: totalAssets,
        },
      });

      // Invalidate portfolio cache for this investor
      this.portfolioCache.delete(depositorAddress);
      this.logger.log(`Invalidated portfolio cache for ${depositorAddress}`);

      return {
        success: true,
        pool: {
          assetType: poolInfo.assetType,
          address: poolAddress,
          totalAssets: totalAssets,
        },
        withdrawal: {
          shares,
          depositorAddress,
        },
        transactions: {
          contractTxHash: contractTxHash,
          hcsMessageId: transaction.hcsMessageId,
        },
      };
    } catch (error) {
      // Log failed transaction
      await this.transactionService.logTransaction({
        kind: 'investor_withdraw_failed',
        ref: `investor_withdraw_failed_${poolAddress}_${Date.now()}`,
        entity: 'Investor',
        meta: {
          poolAddress,
          assetType: grainType,
          shares,
          depositorAddress,
          error: error.message,
        },
      });

      throw new BadRequestException(`Withdrawal failed: ${error.message}`);
    }
  }

  async getAvailablePools() {
    this.logger.log('Getting available pools from blockchain...');
    
    try {
      // Get all pools info from contract service
      this.logger.log('Calling contractService.getAllPoolsInfo()...');
      const allPoolsInfo = await this.contractService.getAllPoolsInfo();
      
      this.logger.log(`Retrieved ${allPoolsInfo.length} pools from blockchain`);
      this.logger.log('Pools info:', JSON.stringify(allPoolsInfo, null, 2));

      // Format pools for investor display with real smart contract data
      // Fetch all pool stats in parallel for better performance
      const poolStatsPromises = allPoolsInfo.map(async (poolInfo, i) => {
        try {
          // Get real pool statistics from smart contract
          this.logger.log(`Getting stats for ${poolInfo.assetType} pool at ${poolInfo.poolAddress}`);
          const poolStats = await this.contractService.getPoolInfoFromAddress(poolInfo.poolAddress);

          return {
            id: i + 1,
            assetType: poolInfo.assetType,
            address: poolInfo.poolAddress,
            lendingTokenAddress: poolInfo.lendingToken,
            availableLiquidity: poolStats.availableLiquidity || "0",
            totalBorrows: poolStats.totalBorrows || "0",
            utilizationRate: poolStats.utilizationRate || "0",
            currentAPR: poolStats.currentAPR || "0",
            createdAt: new Date(),
          };
        } catch (poolError) {
          this.logger.error(`Failed to get stats for pool ${poolInfo.assetType}:`, poolError);
          this.logger.error(`Pool address: ${poolInfo.poolAddress}`);
          // Fallback to basic info if stats fail
          return {
            id: i + 1,
            assetType: poolInfo.assetType,
            address: poolInfo.poolAddress,
            availableLiquidity: "0",
            totalBorrows: "0",
            utilizationRate: "0",
            currentAPR: "0",
            createdAt: new Date(),
          };
        }
      });

      const formattedPools = await Promise.all(poolStatsPromises);

      return formattedPools;
      
    } catch (error) {
      this.logger.error('Failed to get pools from blockchain:', error);
      // Return empty pools array instead of throwing error
      // This prevents 500 errors when RPC is rate limited
      return [];
    }
  }



  async getPoolStatsByAssetType(assetType: string) {
    try {
      // Get pool stats directly from blockchain
      const poolStats = await this.blockchainPoolsService.getPoolStats(assetType);
      
      return {
        poolId: poolStats.poolAddress, // Use pool address as ID
        assetType: poolStats.assetType,
        address: poolStats.poolAddress,
        currentAPR: poolStats.currentAPR,
        liquidity: poolStats.availableLiquidity,
        totalBorrows: poolStats.totalBorrows,
        utilizationRate: poolStats.utilizationRate,
        totalAssets: poolStats.totalAssets,
      };
    } catch (error) {
      this.logger.error(`Failed to get pool stats for ${assetType}:`, error);
      throw new NotFoundException(`Pool not found for asset type: ${assetType}`);
    }
  }

  async getInvestorPortfolio(address: string) {
    this.logger.log(`Getting portfolio for investor: ${address}`);

    // TEMPORARILY DISABLED CACHE FOR DEBUGGING
    // Check cache first
    // const cached = this.portfolioCache.get(address);
    // const now = Date.now();
    // if (cached && now - cached.timestamp < this.PORTFOLIO_CACHE_DURATION) {
    //   this.logger.log(`Returning cached portfolio for ${address}`);
    //   return cached.data;
    // }

    try {
      // Get all pools info from smart contracts
      const allPoolsInfo = await this.contractService.getAllPoolsInfo();

      let positions: any[] = [];
      let totalValue = 0;
      let totalYield = 0;
      let totalDeposits = 0;

      // Get investor's position in each pool - PARALLELIZED for better performance
      const positionPromises = allPoolsInfo.map(async (poolInfo) => {
        try {
          // Fetch all data in parallel instead of sequentially (5-10x faster!)
          const [lpShares, poolStats, liquidityIndex, underlyingDecimals] = await Promise.all([
            this.contractService.getLPShares(poolInfo.poolAddress, address),
            this.contractService.getPoolInfoFromAddress(poolInfo.poolAddress),
            this.contractService.getLiquidityIndex(poolInfo.poolAddress),
            this.contractService.getUnderlyingTokenDecimals(poolInfo.poolAddress),
          ]);

          this.logger.log(`Checking pool ${poolInfo.assetType} for address ${address}: LP Shares = ${lpShares}`);

          if (Number(lpShares) > 0) {
            // Calculate REAL position value using liquidity index
            // Formula: (LP shares × liquidityIndex) / 1e27 / 10^decimals = value in underlying token (human-readable)
            // LP shares are in the same decimals as the underlying token (e.g., USDC = 6 decimals)

            this.logger.log(`=== DETAILED CALCULATION DEBUG ===`);
            this.logger.log(`LP Shares (raw string): "${lpShares}"`);
            this.logger.log(`Liquidity Index (raw string): "${liquidityIndex}"`);
            this.logger.log(`Underlying Token Decimals: ${underlyingDecimals}`);

            const lpSharesBigInt = BigInt(lpShares);
            const liquidityIndexBigInt = BigInt(liquidityIndex);

            this.logger.log(`LP Shares (BigInt): ${lpSharesBigInt.toString()}`);
            this.logger.log(`Liquidity Index (BigInt): ${liquidityIndexBigInt.toString()}`);

            // LP shares are in underlying token decimals, liquidityIndex is in 27 decimals (RAY)
            // Result after dividing by 1e27 is in underlying token decimals
            const product = lpSharesBigInt * liquidityIndexBigInt;
            this.logger.log(`Product (lpShares × liquidityIndex): ${product.toString()}`);

            const positionValueInSmallestUnits = product / BigInt(1e27);
            this.logger.log(`After dividing by 1e27: ${positionValueInSmallestUnits.toString()}`);

            // Convert to human-readable using actual token decimals (e.g., USDC has 6 decimals)
            const decimalDivisor = Math.pow(10, underlyingDecimals);
            this.logger.log(`Decimal divisor (10^${underlyingDecimals}): ${decimalDivisor}`);

            const positionValue = Number(positionValueInSmallestUnits) / decimalDivisor;
            this.logger.log(`Final Position Value: ${positionValue}`);

            // Calculate total deposited from LP shares
            // When you deposit, you get LP shares at liquidity index ≈ 1e27 (initial)
            // So: total deposited ≈ LP shares / 10^decimals
            const totalDeposited = Number(lpShares) / decimalDivisor;

            // Calculate REAL yield earned from smart contract data
            const yieldEarned = Math.max(0, positionValue - totalDeposited);

            this.logger.log(`\n=== Portfolio calculation for ${poolInfo.assetType} ===`);
            this.logger.log(`LP Shares (raw): ${lpShares}`);
            this.logger.log(`Number(lpShares): ${Number(lpShares)}`);
            this.logger.log(`decimalDivisor: ${decimalDivisor}`);
            this.logger.log(`LP Shares (human-readable): ${Number(lpShares) / decimalDivisor}`);
            this.logger.log(`Liquidity Index (raw): ${liquidityIndex}`);
            this.logger.log(`Position Value (smallest units): ${positionValueInSmallestUnits.toString()}`);
            this.logger.log(`Position Value (human-readable): ${positionValue}`);
            this.logger.log(`Total Deposited calculation: Number(${lpShares}) / ${decimalDivisor} = ${totalDeposited}`);
            this.logger.log(`Yield Earned: ${yieldEarned}`);

            return {
              assetType: poolInfo.assetType,
              poolAddress: poolInfo.poolAddress,
              shares: lpShares,
              sharesFormatted: Number(lpShares) / decimalDivisor, // Human-readable LP shares
              positionValue: positionValue,
              yieldEarned: yieldEarned,
              apr: Number(poolStats.currentAPR) / 100, // Convert percentage string (e.g. "8.50") to decimal (e.g. 0.085)
              utilizationRate: poolStats.utilizationRate,
              totalDeposited: totalDeposited,
              createdAt: new Date()
            };
          }
          return null;
        } catch (poolError) {
          this.logger.warn(`Failed to get position for ${poolInfo.assetType}:`, poolError);
          return null;
        }
      });

      // Wait for all positions to be fetched in parallel
      const allPositions = await Promise.all(positionPromises);

      // Filter out null results and calculate totals
      positions = allPositions.filter((pos): pos is NonNullable<typeof pos> => pos !== null);

      for (const position of positions) {
        totalValue += position.positionValue;
        totalYield += position.yieldEarned;
        totalDeposits += position.totalDeposited;
      }
      
      // Calculate average APR
      const averageAPR = positions.length > 0 
        ? positions.reduce((sum, pos) => sum + pos.apr, 0) / positions.length 
        : 0;
      
      // Calculate risk score (simplified - based on utilization rates)
      const riskScore = positions.length > 0
        ? Math.round(positions.reduce((sum, pos) => sum + Number(pos.utilizationRate), 0) / positions.length)
        : 0;
      
      // Transaction history is optional - if we can't get it from database, just skip it
      let recentTransactions: any[] = [];
      let transactionHistory: any[] = [];

      try {
        const allInvestorTxs = await this.transactionService.getTransactionsByEntity('Investor');
        recentTransactions = allInvestorTxs.slice(0, 20);

        transactionHistory = recentTransactions.map(tx => {
          const meta = tx.meta as any || {};
          return {
            id: tx.id,
            type: this.mapTransactionKindToType(tx.kind),
            grainType: meta.assetType || meta.grainType || 'Unknown',
            amount: meta.amount || 0,
            shares: meta.shares || 0,
            timestamp: tx.createdAt.toISOString(),
            status: tx.kind.includes('_failed') ? 'failed' : 'completed',
            transactionHash: meta.contractTxHash || tx.ref,
            poolAddress: meta.poolAddress || '',
            depositorAddress: meta.depositorAddress || address
          };
        });
      } catch (txError) {
        this.logger.warn('Failed to fetch transaction history from database:', txError);
      }

      const portfolioData = {
        investorAddress: address,
        totalDeposits: totalDeposits,
        totalValue: totalValue,
        totalYield: totalYield,
        averageAPR: averageAPR,
        riskScore: riskScore,
        positions: positions,
        totalTransactions: recentTransactions.length,
        recentTransactions: recentTransactions.map(tx => ({
          id: tx.id,
          kind: tx.kind,
          ref: tx.ref,
          createdAt: tx.createdAt,
          meta: tx.meta
        })),
        transactionHistory: transactionHistory // Add formatted transaction history for portfolio display
      };

      // Cache the result
      this.portfolioCache.set(address, { data: portfolioData, timestamp: Date.now() });

      return portfolioData;

    } catch (error) {
      this.logger.error(`Failed to get portfolio for ${address}:`, error);
      
      // Return mock data as fallback
      return {
        investorAddress: address,
        totalDeposits: 0,
        totalValue: 0,
        totalYield: 0,
        averageAPR: 0,
        riskScore: 0,
        positions: [],
        totalTransactions: 0,
        recentTransactions: [],
        message: 'Failed to fetch portfolio data from smart contracts. Please try again later.'
      };
    }
  }

  /**
   * Maps transaction kind to user-friendly type for display
   */
  private mapTransactionKindToType(kind: string): string {
    const mapping: Record<string, string> = {
      'investor_deposit': 'deposit',
      'investor_withdraw': 'withdraw',
      'investor_deposit_failed': 'deposit_failed',
      'investor_withdraw_failed': 'withdraw_failed'
    };
    return mapping[kind] || kind;
  }
}
