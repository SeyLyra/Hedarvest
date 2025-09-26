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
      
      // Format pools for investor display
      return pools.map((pool, index) => {
        const poolAddress = Array.isArray(pool) ? pool[0] : pool.poolAddress;
        const oracleAddress = Array.isArray(pool) ? pool[1] : pool.oracleAddress;
        const grainType = Array.isArray(pool) ? pool[2] : pool.grainType;
        
        return {
          id: index + 1,
          grainType: grainType,
          address: poolAddress,
          price: 200, // Default price
          availableLiquidity: "100000", // Default values since we can't get detailed info
          totalBorrows: "40000",
          utilizationRate: 40,
          apr: 8.5,
          createdAt: new Date(),
        };
      });
      
    } catch (error) {
      this.logger.warn('Failed to get pools from blockchain, using mock data:', error);
      return this.getMockPools();
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

  private getMockPools() {
    this.logger.log('Using mock pool data with real contract addresses');
    return [
      {
        id: 1,
        grainType: "Rice",
        address: process.env.RICE_POOL_ADDRESS || "0x84565EEAE3ddD89325bB5726C912b5478B8078Af",
        price: 200,
        availableLiquidity: "100000",
        totalBorrows: "40000",
        utilizationRate: 40,
        apr: 8.5,
        createdAt: new Date(),
      },
      {
        id: 2,
        grainType: "Corn", 
        address: process.env.CORN_POOL_ADDRESS || "0xE7CAc2F391BA5f839D4145219BA50D5D5635aB56",
        price: 180,
        availableLiquidity: "85000",
        totalBorrows: "35000",
        utilizationRate: 41,
        apr: 8.2,
        createdAt: new Date(),
      },
      {
        id: 3,
        grainType: "Wheat",
        address: process.env.WHEAT_POOL_ADDRESS || "0xcC54Dd59FCC4dF32bb1e5C2390aD8e2d35bD6aF8",
        price: 220,
        availableLiquidity: "120000",
        totalBorrows: "50000",
        utilizationRate: 42,
        apr: 8.8,
        createdAt: new Date(),
      },
      {
        id: 4,
        grainType: "Soybean",
        address: process.env.SOYBEAN_POOL_ADDRESS || "0x6cbB47e0cE71Ad3a7ef0d42B4B6b735583BF60c7",
        price: 190,
        availableLiquidity: "95000",
        totalBorrows: "38000", 
        utilizationRate: 40,
        apr: 8.0,
        createdAt: new Date(),
      },
    ];
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
    // For now, return a mock portfolio until transaction service is fully integrated
    return {
      investorAddress: address,
      positions: [],
      totalTransactions: 0,
      recentTransactions: [],
      message: 'Portfolio tracking will be available once transaction service is fully integrated'
    };
  }
}
