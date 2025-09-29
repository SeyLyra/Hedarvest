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
      const poolInfo = await this.contractService.getPoolInfo(poolAddress);

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
          newTotalAssets: poolInfo.totalAssets,
        },
      });

      return {
        success: true,
        pool: {
          assetType: poolInfo.assetType,
          address: poolAddress,
          totalAssets: poolInfo.totalAssets,
        },
        deposit: {
          amount,
          depositorAddress,
        },
        transactions: {
          contractTxHash: contractTxHash,
          dbTransactionId: transaction.id,
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
      const poolInfo = await this.contractService.getPoolInfo(poolAddress);

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
          newTotalAssets: poolInfo.totalAssets,
        },
      });

      return {
        success: true,
        pool: {
          assetType: poolInfo.assetType,
          address: poolAddress,
          totalAssets: poolInfo.totalAssets,
        },
        withdrawal: {
          shares,
          depositorAddress,
        },
        transactions: {
          contractTxHash: contractTxHash,
          dbTransactionId: transaction.id,
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
      // Get pools directly from contract service
      const pools = await this.contractService.getAllPools();
      
      this.logger.log(`Retrieved ${pools.length} pools from blockchain`);
      
      // Format pools for investor display with real smart contract data
      const formattedPools: any[] = [];
      for (let i = 0; i < pools.length; i++) {
        const pool = pools[i];
        
        try {
          // Get real pool statistics from smart contract
          this.logger.log(`Getting stats for ${pool.assetType} pool at ${pool.poolAddress}`);
          const poolStats = await this.contractService.getPoolInfo(pool.poolAddress);
          
          formattedPools.push({
            id: i + 1,
            assetType: pool.assetType,
            address: pool.poolAddress,
            availableLiquidity: poolStats.availableLiquidity || "0",
            totalBorrows: poolStats.totalBorrows || "0",
            utilizationRate: poolStats.utilizationRate || "0",
            currentAPR: poolStats.currentAPR || "0",
            exchangeRate: poolStats.exchangeRate || "0",
            createdAt: new Date(),
          });
        } catch (poolError) {
          this.logger.error(`Failed to get stats for pool ${pool.assetType}:`, poolError);
          this.logger.error(`Pool address: ${pool.poolAddress}`);
          // Fallback to basic info if stats fail
          formattedPools.push({
            id: i + 1,
            assetType: pool.assetType,
            address: pool.poolAddress,
            availableLiquidity: "0",
            totalBorrows: "0",
            utilizationRate: "0",
            currentAPR: "0",
            exchangeRate: "0",
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
        totalAssets: (parseFloat(poolStats.availableLiquidity) + parseFloat(poolStats.totalBorrows)).toString(),
        exchangeRate: poolStats.exchangeRate,
      };
    } catch (error) {
      this.logger.error(`Failed to get pool stats for ${assetType}:`, error);
      throw new NotFoundException(`Pool not found for asset type: ${assetType}`);
    }
  }

  async getInvestorPortfolio(address: string) {
    this.logger.log(`Getting portfolio for investor: ${address}`);
    
    try {
      // Get all pools from smart contracts
      const pools = await this.contractService.getAllPools();
      
      const positions: any[] = [];
      let totalValue = 0;
      let totalYield = 0;
      let totalDeposits = 0;
      
      // Get investor's position in each pool
      for (const pool of pools) {
        try {
          // Get investor's LP shares
          const lpShares = await this.contractService.getLPShares(pool.poolAddress, address);
          
          if (Number(lpShares) > 0) {
            // Get current pool info
            const poolInfo = await this.contractService.getPoolInfo(pool.poolAddress);
            
            // Calculate position value using exchange rate
            const exchangeRate = Number(poolInfo.exchangeRate) / 1e18;
            const positionValue = (Number(lpShares) * exchangeRate) / 1e18;
            const yieldEarned = positionValue - (Number(lpShares) / 1e18); // Simplified yield calculation
            
            positions.push({
              assetType: pool.assetType,
              poolAddress: pool.poolAddress,
              shares: lpShares,
              shareValue: exchangeRate,
              positionValue: positionValue,
              yieldEarned: yieldEarned,
              apr: Number(poolInfo.currentAPR) / 100, // Convert basis points to percentage
              utilizationRate: poolInfo.utilizationRate,
              createdAt: new Date()
            });
            
            totalValue += positionValue;
            totalYield += yieldEarned;
            totalDeposits += Number(lpShares) / 1e18;
          }
        } catch (poolError) {
          this.logger.warn(`Failed to get position for ${pool.assetType}:`, poolError);
        }
      }
      
      // Calculate average APR
      const averageAPR = positions.length > 0 
        ? positions.reduce((sum, pos) => sum + pos.apr, 0) / positions.length 
        : 0;
      
      // Calculate risk score (simplified - based on utilization rates)
      const riskScore = positions.length > 0
        ? Math.round(positions.reduce((sum, pos) => sum + Number(pos.utilizationRate), 0) / positions.length)
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
