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
  
  constructor(
    private prisma: PrismaService,
    private transactionService: TransactionService,
    private hederaService: HederaService,
    private contractService: ContractService,
    private blockchainPoolsService: BlockchainPoolsService,
  ) {}

  async deposit(investorDepositDto: InvestorDepositDto) {
    const { grainType, amount, depositorAddress } = investorDepositDto;

    // Find pool by grain type
    const pool = await this.prisma.pool.findUnique({
      where: { grainType: grainType },
    });

    if (!pool) {
      throw new NotFoundException(`Pool not found for grain type: ${grainType}`);
    }

    if (amount <= 0) {
      throw new BadRequestException('Amount must be greater than 0');
    }

    try {
      // Process deposit through smart contract (USDT only)
      const contractTxHash = await this.contractService.depositToPool(
        pool.poolAddress,
        amount.toString()
      );

      // Process deposit through Hedera
      const hederaResult = await this.hederaService.depositToPool(grainType, amount.toString(), depositorAddress);

      // Update pool liquidity
      const updatedPool = await this.prisma.pool.update({
        where: { id: pool.id },
        data: {
          liquidity: Number(pool.liquidity) + amount,
        },
      });

      // Log transaction in database
      const transaction = await this.transactionService.logTransaction({
        kind: 'investor_deposit',
        ref: `investor_deposit_${pool.id}_${Date.now()}`,
        entity: 'Investor',
        meta: {
          poolId: pool.id,
          grainType,
          amount,
          tokenType: 'USDT',
          depositorAddress,
          contractTxHash: contractTxHash,
          hederaTxId: hederaResult.transactionId,
          newLiquidity: updatedPool.liquidity,
        },
      });

      return {
        success: true,
        pool: {
          id: updatedPool.id,
          grainType: updatedPool.grainType,
          address: updatedPool.poolAddress,
          newLiquidity: updatedPool.liquidity,
        },
        deposit: {
          amount,
          tokenType: 'USDT',
          depositorAddress,
        },
        transactions: {
          contractTxHash: contractTxHash,
          hederaTxId: hederaResult.transactionId,
          dbTransactionId: transaction.id,
        },
      };
    } catch (error) {
      // Log failed transaction
      await this.transactionService.logTransaction({
        kind: 'investor_deposit_failed',
        ref: `investor_deposit_failed_${pool.id}_${Date.now()}`,
        entity: 'Investor',
        meta: {
          poolId: pool.id,
          grainType,
          amount,
          tokenType: 'USDT',
          depositorAddress,
          error: error.message,
        },
      });

      throw new BadRequestException(`Deposit failed: ${error.message}`);
    }
  }

  async withdraw(investorWithdrawDto: InvestorWithdrawDto) {
    const { grainType, shares, depositorAddress } = investorWithdrawDto;

    // Find pool by grain type
    const pool = await this.prisma.pool.findUnique({
      where: { grainType: grainType },
    });

    if (!pool) {
      throw new NotFoundException(`Pool not found for grain type: ${grainType}`);
    }

    if (shares <= 0) {
      throw new BadRequestException('Shares must be greater than 0');
    }

    try {
      // Process withdrawal through smart contract
      const contractTxHash = await this.contractService.withdrawFromPool(
        pool.poolAddress,
        shares.toString()
      );

      // Process withdrawal through Hedera
      const hederaResult = await this.hederaService.withdrawFromPool(grainType, shares.toString(), depositorAddress);

      // Calculate withdrawal amount (simplified - should check actual pool shares)
      const withdrawalAmount = shares; // This should be calculated based on pool share price

      // Update pool liquidity
      const updatedPool = await this.prisma.pool.update({
        where: { id: pool.id },
        data: {
          liquidity: Math.max(0, Number(pool.liquidity) - withdrawalAmount),
        },
      });

      // Log transaction in database
      const transaction = await this.transactionService.logTransaction({
        kind: 'investor_withdraw',
        ref: `investor_withdraw_${pool.id}_${Date.now()}`,
        entity: 'Investor',
        meta: {
          poolId: pool.id,
          grainType,
          shares,
          withdrawalAmount,
          depositorAddress,
          contractTxHash: contractTxHash,
          hederaTxId: hederaResult.transactionId,
          newLiquidity: updatedPool.liquidity,
        },
      });

      return {
        success: true,
        pool: {
          id: updatedPool.id,
          grainType: updatedPool.grainType,
          address: updatedPool.poolAddress,
          newLiquidity: updatedPool.liquidity,
        },
        withdrawal: {
          shares,
          withdrawalAmount,
          depositorAddress,
        },
        transactions: {
          contractTxHash: contractTxHash,
          hederaTxId: hederaResult.transactionId,
          dbTransactionId: transaction.id,
        },
      };
    } catch (error) {
      // Log failed transaction
      await this.transactionService.logTransaction({
        kind: 'investor_withdraw_failed',
        ref: `investor_withdraw_failed_${pool.id}_${Date.now()}`,
        entity: 'Investor',
        meta: {
          poolId: pool.id,
          grainType,
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
      // Get pools directly from contract service (same as debug endpoint)
      const contractService = this.contractService;
      const pools = await contractService.getAllPools();
      
      this.logger.log(`Retrieved ${pools.length} pools from blockchain`);
      
      // Format pools for investor display with real smart contract data
      const formattedPools: any[] = [];
      for (let i = 0; i < pools.length; i++) {
        const pool = pools[i];
        const poolAddress = Array.isArray(pool) ? pool[0] : pool.poolAddress;
        const oracleAddress = Array.isArray(pool) ? pool[1] : pool.oracleAddress;
        const grainType = Array.isArray(pool) ? pool[2] : pool.grainType;
        
        try {
          // Get real pool statistics from smart contract
          this.logger.log(`Getting stats for ${grainType} pool at ${poolAddress}`);
          const poolStats = await this.contractService.getPoolInfo(poolAddress);
          const poolBalance = await this.contractService.getPoolBalance(poolAddress);
          this.logger.log(`Got stats for ${grainType}:`, { riskPremium: poolStats.riskPremium, totalAssets: poolStats.totalAssets, totalBorrows: poolStats.totalBorrows });
          
          // Calculate utilization rate from actual data
          const totalAssets = Number(poolStats.totalAssets);
          const totalBorrows = Number(poolStats.totalBorrows);
          const utilizationRate = totalAssets > 0 ? (totalBorrows / totalAssets) * 100 : 0;
          
          formattedPools.push({
            id: i + 1,
            grainType: grainType,
            address: poolAddress,
            price: 200, // Default price since oracle price might not be set
            availableLiquidity: poolStats.availableLiquidity || "0",
            totalBorrows: poolStats.totalBorrows || "0",
            utilizationRate: Math.round(utilizationRate * 100) / 100, // Round to 2 decimal places
            apr: Number(poolStats.riskPremium) / 100, // Convert basis points to percentage
            createdAt: new Date(),
          });
        } catch (poolError) {
          this.logger.error(`Failed to get stats for pool ${grainType}:`, poolError);
          this.logger.error(`Pool address: ${poolAddress}`);
          // Fallback to basic info if stats fail
          formattedPools.push({
            id: i + 1,
            grainType: grainType,
            address: poolAddress,
            price: 200,
            availableLiquidity: "0",
            totalBorrows: "0",
            utilizationRate: 0,
            apr: 0,
            createdAt: new Date(),
          });
        }
      }
      
      return formattedPools;
      
    } catch (error) {
      this.logger.error('Failed to get pools from blockchain:', error);
      // Return empty pools array instead of throwing error
      // This prevents 500 errors when RPC is rate limited
      return [];
    }
  }

  private formatPoolsForInvestor(pools: any[]) {
    return pools.map((pool, index) => ({
      id: pool.id || index + 1,
      grainType: pool.grainType,
      address: pool.poolAddress,
      price: 200, // You might calculate this from oracle
      availableLiquidity: pool.availableLiquidity,
      totalBorrows: pool.totalBorrows,
      utilizationRate: Math.round(Number(pool.utilizationRate)),
      apr: parseFloat(pool.apr),
      createdAt: pool.createdAt,
    }));
  }

  private async getPoolsFromContracts() {
    try {
      const poolInfos = await this.contractService.getAllPools();
      this.logger.log(`Found ${poolInfos.length} pools from contract factory`);
      
      const pools: any[] = [];
      for (let i = 0; i < poolInfos.length; i++) {
        const poolInfo = poolInfos[i];
        try {
          const detailedPoolInfo = await this.contractService.getPoolInfo(poolInfo.poolAddress);
          const poolBalance = await this.contractService.getPoolBalance(poolInfo.poolAddress);
          
          pools.push({
            id: i + 1,
            grainType: poolInfo.grainType,
            address: poolInfo.poolAddress,
            price: 200, // You might get this from oracle
            availableLiquidity: poolBalance.availableLiquidity,
            totalBorrows: poolBalance.totalBorrows,
            utilizationRate: this.calculateUtilization(poolBalance.availableLiquidity, poolBalance.totalBorrows),
            apr: 8.5, // You might calculate this from pool data
            createdAt: new Date(),
          });
        } catch (poolError) {
          this.logger.warn(`Failed to get info for pool ${poolInfo.poolAddress}:`, poolError);
        }
      }
      
      this.logger.log(`Successfully loaded ${pools.length} pools from contracts`);
      return pools;
    } catch (error) {
      this.logger.error('Failed to fetch pools from contract factory:', error);
      throw error;
    }
  }

  private calculateUtilization(availableLiquidity: string, totalBorrows: string): number {
    const liquidity = Number(availableLiquidity);
    const borrows = Number(totalBorrows);
    const totalSupply = liquidity + borrows;
    
    return totalSupply > 0 ? Math.round((borrows / totalSupply) * 100) : 0;
  }


  async getPoolStatsByGrainType(grainType: string) {
    try {
      // Get pool stats directly from blockchain
      const poolStats = await this.blockchainPoolsService.getPoolStats(grainType);
      
      return {
        poolId: poolStats.poolAddress, // Use pool address as ID
        grainType: poolStats.grainType,
        address: poolStats.poolAddress,
        apr: poolStats.apr,
        liquidity: poolStats.availableLiquidity,
        totalBorrows: poolStats.totalBorrows,
        utilizationRate: Math.round(Number(poolStats.utilizationRate)),
        price: Number(poolStats.apr) * 10, // Mock price calculation
        totalAssets: poolStats.totalAssets,
        exchangeRate: poolStats.exchangeRate,
      };
    } catch (error) {
      this.logger.error(`Failed to get pool stats for ${grainType}:`, error);
      throw new NotFoundException(`Pool not found for grain type: ${grainType}`);
    }
  }

  async getInvestorPortfolio(address: string) {
    this.logger.log(`Getting portfolio for investor: ${address}`);
    
    try {
      // Get all pools from smart contracts
      const pools = await this.contractService.getAllPoolsFromFactory();
      
      const positions: any[] = [];
      let totalValue = 0;
      let totalYield = 0;
      let totalDeposits = 0;
      
      // Get investor's position in each pool
      for (const pool of pools) {
        try {
          // Get investor's LP token balance (shares)
          const lpTokenBalance = await this.contractService.getTokenBalance(
            pool.poolAddress, // The pool contract itself is the LP token
            address
          );
          
          if (Number(lpTokenBalance) > 0) {
            // Get current exchange rate to calculate value
            const poolInfo = await this.contractService.getPoolInfo(pool.poolAddress);
            const exchangeRate = Number(poolInfo.exchangeRate) / 1e18;
            
            // Calculate position value
            const positionValue = (Number(lpTokenBalance) * exchangeRate) / 1e18;
            const yieldEarned = positionValue - (Number(lpTokenBalance) / 1e18); // Simplified yield calculation
            
            positions.push({
              grainType: pool.grainType,
              poolAddress: pool.poolAddress,
              shares: lpTokenBalance,
              shareValue: exchangeRate,
              positionValue: positionValue,
              yieldEarned: yieldEarned,
              apr: pool.riskPremium / 100, // Convert basis points to percentage
              utilizationRate: pool.utilizationRate,
              createdAt: new Date()
            });
            
            totalValue += positionValue;
            totalYield += yieldEarned;
            totalDeposits += Number(lpTokenBalance) / 1e18;
          }
        } catch (poolError) {
          this.logger.warn(`Failed to get position for ${pool.grainType}:`, poolError);
        }
      }
      
      // Calculate average APR
      const averageAPR = positions.length > 0 
        ? positions.reduce((sum, pos) => sum + pos.apr, 0) / positions.length 
        : 0;
      
      // Calculate risk score (simplified - based on utilization rates)
      const riskScore = positions.length > 0
        ? Math.round(positions.reduce((sum, pos) => sum + pos.utilizationRate, 0) / positions.length)
        : 0;
      
      // Get recent transactions from database
      const recentTransactions = await this.transactionService.getTransactionsByEntityAndAddress(
        'Investor',
        address,
        10
      );
      
      return {
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
        }))
      };
      
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
}
