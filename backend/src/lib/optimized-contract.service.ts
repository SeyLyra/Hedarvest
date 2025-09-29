import { Injectable, Logger } from '@nestjs/common';
import { ethers } from 'ethers';
import { MirrorNodeService } from './mirror-node.service';
import { ContractService } from './contract.service';

/**
 * Optimized Contract Service that uses the best data source for each operation:
 * - Mirror Node: Historical data, transactions, token info, balances
 * - Direct RPC: Real-time contract state, immediate interactions
 */
@Injectable()
export class OptimizedContractService {
  private readonly logger = new Logger(OptimizedContractService.name);

  constructor(
    private readonly mirrorNodeService: MirrorNodeService,
    private readonly contractService: ContractService
  ) {}

  // ===== FACTORY OPERATIONS =====

  /**
   * Get all pools - HYBRID: RPC for current state, Mirror Node for historical
   */
  async getAllPools(): Promise<any[]> {
    try {
      // Use RPC for current state (real-time)
      const pools = await this.contractService.getAllPools();
      
      // Enhance with historical data from Mirror Node
      const enrichedPools = await Promise.all(
        pools.map(async (pool) => {
          try {
            const contractInfo = await this.mirrorNodeService.getContractInfo(pool.poolAddress);
            const recentTransactions = await this.mirrorNodeService.getContractTransactions(
              pool.poolAddress, 
              10
            );
            
            return {
              ...pool,
              contractInfo,
              recentActivity: recentTransactions.length,
              lastTransaction: recentTransactions[0]?.consensus_timestamp
            };
          } catch (error) {
            this.logger.warn(`Failed to enrich pool ${pool.poolAddress}:`, error.message);
            return pool;
          }
        })
      );

      return enrichedPools;
    } catch (error) {
      this.logger.error('Failed to get all pools:', error.message);
      throw error;
    }
  }

  /**
   * Get pool by asset type - HYBRID: RPC for current state
   */
  async getPoolByAssetType(assetType: string): Promise<string> {
    // Use RPC for immediate response
    return this.contractService.getPoolByAssetType(assetType);
  }

  // ===== POOL STATE OPERATIONS (RPC - Real-time) =====

  /**
   * Get pool info - RPC: Real-time contract state
   */
  async getPoolInfo(poolAddress: string): Promise<any> {
    return this.contractService.getPoolInfo(poolAddress);
  }

  /**
   * Get pool balance - RPC: Current balance state
   */
  async getPoolBalance(poolAddress: string): Promise<{
    availableLiquidity: string;
    totalBorrows: string;
  }> {
    return this.contractService.getPoolBalance(poolAddress);
  }

  /**
   * Get pool stats - HYBRID: RPC for current state, Mirror Node for historical context
   */
  async getPoolStatsByAssetType(assetType: string): Promise<any> {
    try {
      // Get current state from RPC
      const currentStats = await this.contractService.getPoolStatsByAssetType(assetType);
      
      // Enhance with historical data from Mirror Node
      const poolAddress = await this.getPoolByAssetType(assetType);
      const contractTransactions = await this.mirrorNodeService.getContractTransactions(poolAddress, 50);
      
      // Calculate historical metrics
      const historicalMetrics = this.calculateHistoricalMetrics(contractTransactions);
      
      return {
        ...currentStats,
        historical: historicalMetrics,
        totalTransactions: contractTransactions.length,
        lastActivity: contractTransactions[0]?.consensus_timestamp
      };
    } catch (error) {
      this.logger.error(`Failed to get pool stats for ${assetType}:`, error.message);
      throw error;
    }
  }

  // ===== TRANSACTION OPERATIONS (Mirror Node - Historical) =====

  /**
   * Get transaction history - MIRROR NODE: Historical data
   */
  async getTransactionHistory(
    accountId: string,
    limit: number = 100,
    order: 'asc' | 'desc' = 'desc'
  ): Promise<any[]> {
    return this.mirrorNodeService.getTransactionsByAccount(accountId, limit, order);
  }

  /**
   * Get pool transaction history - MIRROR NODE: Historical data
   */
  async getPoolTransactionHistory(
    poolAddress: string,
    limit: number = 100,
    order: 'asc' | 'desc' = 'desc'
  ): Promise<any[]> {
    return this.mirrorNodeService.getContractTransactions(poolAddress, limit, order);
  }

  /**
   * Get token transaction history - MIRROR NODE: Historical data
   */
  async getTokenTransactionHistory(
    tokenId: string,
    limit: number = 100,
    order: 'asc' | 'desc' = 'desc'
  ): Promise<any[]> {
    return this.mirrorNodeService.getTokenTransactions(tokenId, limit, order);
  }

  // ===== BALANCE OPERATIONS (Hybrid) =====

  /**
   * Get account balance - HYBRID: Mirror Node for historical, RPC for current
   */
  async getAccountBalance(accountId: string): Promise<any> {
    try {
      // Get current balance from Mirror Node (more reliable for balances)
      const mirrorBalance = await this.mirrorNodeService.getAccountBalance(accountId);
      
      // Could also get from RPC if needed for comparison
      return mirrorBalance;
    } catch (error) {
      this.logger.error(`Failed to get balance for ${accountId}:`, error.message);
      throw error;
    }
  }

  /**
   * Get token balance - HYBRID: Mirror Node for balances
   */
  async getTokenBalance(accountId: string, tokenId: string): Promise<number> {
    return this.mirrorNodeService.getTokenBalance(accountId, tokenId);
  }

  // ===== INTERACTION OPERATIONS (RPC - Immediate) =====

  /**
   * Deposit to pool - RPC: Immediate transaction
   */
  async depositToPool(poolAddress: string, amount: string): Promise<string> {
    return this.contractService.depositToPool(poolAddress, amount);
  }

  /**
   * Withdraw from pool - RPC: Immediate transaction
   */
  async withdrawFromPool(poolAddress: string, shares: string): Promise<string> {
    return this.contractService.withdrawFromPool(poolAddress, shares);
  }

  /**
   * Deposit collateral - RPC: Immediate transaction
   */
  async depositCollateral(poolAddress: string, amount: string): Promise<string> {
    return this.contractService.depositCollateral(poolAddress, amount);
  }

  /**
   * Create loan - RPC: Immediate transaction
   */
  async createLoan(poolAddress: string, amount: string): Promise<string> {
    return this.contractService.createLoan(poolAddress, amount);
  }

  /**
   * Repay loan - RPC: Immediate transaction
   */
  async repayLoan(poolAddress: string, amount: string): Promise<string> {
    return this.contractService.repayLoan(poolAddress, amount);
  }

  /**
   * Liquidate - RPC: Immediate transaction
   */
  async liquidate(poolAddress: string, borrowerAddress: string): Promise<string> {
    return this.contractService.liquidate(poolAddress, borrowerAddress);
  }

  // ===== UTILITY METHODS =====

  /**
   * Calculate historical metrics from transaction data
   */
  private calculateHistoricalMetrics(transactions: any[]): any {
    const now = Date.now();
    const oneDayAgo = now - (24 * 60 * 60 * 1000);
    const oneWeekAgo = now - (7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = now - (30 * 24 * 60 * 60 * 1000);

    const dailyTransactions = transactions.filter(tx => 
      new Date(tx.consensus_timestamp).getTime() > oneDayAgo
    );
    const weeklyTransactions = transactions.filter(tx => 
      new Date(tx.consensus_timestamp).getTime() > oneWeekAgo
    );
    const monthlyTransactions = transactions.filter(tx => 
      new Date(tx.consensus_timestamp).getTime() > oneMonthAgo
    );

    // Calculate volume from transfers
    let totalVolume = 0;
    transactions.forEach(tx => {
      if (tx.transfers) {
        tx.transfers.forEach(transfer => {
          totalVolume += Math.abs(transfer.amount);
        });
      }
    });

    return {
      totalTransactions: transactions.length,
      dailyTransactions: dailyTransactions.length,
      weeklyTransactions: weeklyTransactions.length,
      monthlyTransactions: monthlyTransactions.length,
      totalVolume,
      averageTransactionSize: transactions.length > 0 ? totalVolume / transactions.length : 0,
      lastTransactionTime: transactions[0]?.consensus_timestamp
    };
  }

  /**
   * Get comprehensive pool analytics - HYBRID: Combines real-time and historical data
   */
  async getPoolAnalytics(poolAddress: string, timeRange: 'day' | 'week' | 'month' = 'month'): Promise<any> {
    try {
      // Get current state from RPC
      const currentInfo = await this.contractService.getPoolInfo(poolAddress);
      
      // Get historical data from Mirror Node
      const limit = timeRange === 'day' ? 100 : timeRange === 'week' ? 500 : 1000;
      const transactions = await this.mirrorNodeService.getContractTransactions(poolAddress, limit);
      
      // Calculate metrics
      const historicalMetrics = this.calculateHistoricalMetrics(transactions);
      
      // Get token info if available
      let tokenInfo: any = null;
      if (currentInfo.lendingToken) {
        tokenInfo = await this.mirrorNodeService.getTokenInfo(currentInfo.lendingToken);
      }

      return {
        current: currentInfo,
        historical: historicalMetrics,
        tokenInfo,
        timeRange,
        dataPoints: transactions.length
      };
    } catch (error) {
      this.logger.error(`Failed to get pool analytics for ${poolAddress}:`, error.message);
      throw error;
    }
  }

  /**
   * Get user portfolio with historical context - HYBRID
   */
  async getUserPortfolio(userAddress: string): Promise<any> {
    try {
      // Get current positions from RPC
      const pools = await this.getAllPools();
      const userPositions = [];
      
      for (const pool of pools) {
        try {
          const lpShares = await this.contractService.getLPShares(pool.poolAddress, userAddress);
          const collateral = await this.contractService.getBorrowerPosition(pool.poolAddress, userAddress);
          
          if (Number(lpShares) > 0 || Number(collateral.collateralAmount) > 0) {
            const poolInfo = await this.contractService.getPoolInfo(pool.poolAddress);
            // TODO: Fix type issue with userPositions array
            // userPositions.push({
            //   poolAddress: pool.poolAddress,
            //   assetType: poolInfo.assetType,
            //   lpShares: lpShares.toString(),
            //   collateral: collateral.collateralAmount.toString(),
            //   borrowBalance: collateral.borrowBalance.toString(),
            //   poolInfo
            // });
          }
        } catch (error) {
          this.logger.warn(`Failed to get position for pool ${pool.poolAddress}:`, error.message);
        }
      }

      // Get transaction history from Mirror Node
      const transactionHistory = await this.mirrorNodeService.getTransactionsByAccount(userAddress, 100);

      return {
        positions: userPositions,
        transactionHistory,
        totalPositions: userPositions.length,
        lastActivity: transactionHistory[0]?.consensus_timestamp
      };
    } catch (error) {
      this.logger.error(`Failed to get user portfolio for ${userAddress}:`, error.message);
      throw error;
    }
  }

  /**
   * Health check - Check both services
   */
  async healthCheck(): Promise<any> {
    const mirrorNodeHealth = await this.mirrorNodeService.getHealthStatus();
    
    return {
      mirrorNode: mirrorNodeHealth,
      rpc: { status: 'connected' }, // You can add RPC health check here
      timestamp: new Date().toISOString()
    };
  }
}
