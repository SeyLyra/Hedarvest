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
      // Get all pools info from contract service
      this.logger.log('Calling contractService.getAllPoolsInfo()...');
      const allPoolsInfo = await this.contractService.getAllPoolsInfo();
      
      this.logger.log(`Retrieved ${allPoolsInfo.length} pools from blockchain`);
      this.logger.log('Pools info:', JSON.stringify(allPoolsInfo, null, 2));
      
      // Format pools for investor display with real smart contract data
      const formattedPools: any[] = [];
      for (let i = 0; i < allPoolsInfo.length; i++) {
        const poolInfo = allPoolsInfo[i];
        
        try {
          // Get real pool statistics from smart contract
          this.logger.log(`Getting stats for ${poolInfo.assetType} pool at ${poolInfo.poolAddress}`);
          const poolStats = await this.contractService.getPoolInfoFromAddress(poolInfo.poolAddress);
          
          formattedPools.push({
            id: i + 1,
            assetType: poolInfo.assetType,
            address: poolInfo.poolAddress,
            lendingTokenAddress: poolInfo.lendingToken, // Add the lending token address
            availableLiquidity: poolStats.availableLiquidity || "0",
            totalBorrows: poolStats.totalBorrows || "0",
            utilizationRate: poolStats.utilizationRate || "0",
            currentAPR: poolStats.currentAPR || "0",
            createdAt: new Date(),
          });
        } catch (poolError) {
          this.logger.error(`Failed to get stats for pool ${poolInfo.assetType}:`, poolError);
          this.logger.error(`Pool address: ${poolInfo.poolAddress}`);
          // Fallback to basic info if stats fail
          formattedPools.push({
            id: i + 1,
            assetType: poolInfo.assetType,
            address: poolInfo.poolAddress,
            availableLiquidity: "0",
            totalBorrows: "0",
            utilizationRate: "0",
            currentAPR: "0",
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
        totalAssets: poolStats.totalAssets,
      };
    } catch (error) {
      this.logger.error(`Failed to get pool stats for ${assetType}:`, error);
      throw new NotFoundException(`Pool not found for asset type: ${assetType}`);
    }
  }

  async getInvestorPortfolio(address: string) {
    this.logger.log(`Getting portfolio for investor: ${address}`);
    
    try {
      // Get all pools info from smart contracts
      const allPoolsInfo = await this.contractService.getAllPoolsInfo();
      
      const positions: any[] = [];
      let totalValue = 0;
      let totalYield = 0;
      let totalDeposits = 0;
      
      // First, get all deposit/withdraw transactions for this address to track deposit amounts
      const allTransactions = await this.transactionService.getTransactionsByEntityAndAddress(
        'Investor',
        address,
        1000 // Get all transactions to calculate total deposits
      );

      // Calculate total deposit amount per pool from transaction history
      const depositsByPool = new Map<string, number>();
      for (const tx of allTransactions) {
        const meta = tx.meta as any || {};
        const poolAddress = meta.poolAddress;
        if (!poolAddress) continue;

        if (tx.kind === 'investor_deposit') {
          const currentDeposits = depositsByPool.get(poolAddress) || 0;
          depositsByPool.set(poolAddress, currentDeposits + (meta.amount || 0));
        } else if (tx.kind === 'investor_withdraw') {
          // Withdrawals reduce the deposited amount proportionally
          const currentDeposits = depositsByPool.get(poolAddress) || 0;
          const withdrawnAmount = meta.amount || 0;
          depositsByPool.set(poolAddress, Math.max(0, currentDeposits - withdrawnAmount));
        }
      }

      // Get investor's position in each pool
      for (const poolInfo of allPoolsInfo) {
        try {
          // Get investor's LP shares
          const lpShares = await this.contractService.getLPShares(poolInfo.poolAddress, address);

          if (Number(lpShares) > 0) {
            // Get current pool stats and liquidity index
            const poolStats = await this.contractService.getPoolInfoFromAddress(poolInfo.poolAddress);
            const liquidityIndex = await this.contractService.getLiquidityIndex(poolInfo.poolAddress);

            // Calculate REAL position value using liquidity index
            // Formula: (LP shares × liquidityIndex) / 1e27 / 1e18 = value in USDT (6 decimals already converted)
            const lpSharesBigInt = BigInt(lpShares);
            const liquidityIndexBigInt = BigInt(liquidityIndex);
            const positionValueInTokenUnits = (lpSharesBigInt * liquidityIndexBigInt) / BigInt(1e27);
            const positionValue = Number(positionValueInTokenUnits) / 1e18; // Convert from 18 decimals to human-readable

            // Get total deposits from transaction history
            const totalDeposited = depositsByPool.get(poolInfo.poolAddress) || 0;

            // Calculate REAL yield earned
            const yieldEarned = Math.max(0, positionValue - totalDeposited);

            this.logger.log(`Portfolio calculation for ${poolInfo.assetType}:`);
            this.logger.log(`  LP Shares: ${lpShares}`);
            this.logger.log(`  Liquidity Index: ${liquidityIndex}`);
            this.logger.log(`  Position Value: ${positionValue}`);
            this.logger.log(`  Total Deposited: ${totalDeposited}`);
            this.logger.log(`  Yield Earned: ${yieldEarned}`);

            positions.push({
              assetType: poolInfo.assetType,
              poolAddress: poolInfo.poolAddress,
              shares: lpShares,
              positionValue: positionValue,
              yieldEarned: yieldEarned,
              apr: Number(poolStats.currentAPR) / 100, // Convert basis points to percentage
              utilizationRate: poolStats.utilizationRate,
              totalDeposited: totalDeposited,
              createdAt: new Date()
            });

            totalValue += positionValue;
            totalYield += yieldEarned;
            totalDeposits += totalDeposited;
          }
        } catch (poolError) {
          this.logger.warn(`Failed to get position for ${poolInfo.assetType}:`, poolError);
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
      
      // Get recent transactions from database (HCS-logged transactions)
      const recentTransactions = await this.transactionService.getTransactionsByEntityAndAddress(
        'Investor',
        address,
        20 // Increased limit for transaction history
      );

      // Transform transactions to include transaction history details
      const transactionHistory = recentTransactions.map(tx => {
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
        })),
        transactionHistory: transactionHistory // Add formatted transaction history for portfolio display
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
