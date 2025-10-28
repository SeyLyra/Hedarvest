import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { HcsService } from './hcs.service';
import { TransactionService } from '../transaction/transaction.service';

@Controller('hcs')
export class HcsController {
  constructor(
    private readonly hcsService: HcsService,
    private readonly transactionService: TransactionService,
  ) {}

  @Get('events/stream')
  async getEventStream(@Query('address') address?: string) {
    // For now, return mock events since HCS is in mock mode
    // In production, this would stream real-time HCS events
    return {
      success: true,
      message: 'HCS event stream endpoint',
      mode: 'mock',
      topicId: this.hcsService.getTopicId(),
      events: await this.getMockEvents(address)
    };
  }

  @Get('events')
  async getEvents(
    @Query('address') address?: string,
    @Query('limit') limit: string = '50',
    @Query('offset') offset: string = '0'
  ) {
    try {
      // Get events from TransactionService (HCS-backed)
      const allEvents = await this.transactionService.getAllTransactions(
        parseInt(limit),
        parseInt(offset)
      );

      // Filter by address if provided
      const events = address
        ? allEvents.filter((event) => {
            const meta = event.meta || {};
            return (
              meta.depositorAddress === address ||
              meta.farmerAddress === address
            );
          })
        : allEvents;

      // Transform to HCS-like format
      const hcsEvents = events.map((event) => ({
        hcsMessageId: event.hcsMessageId,
        eventType: this.mapTransactionKindToEventType(event.kind),
        payload: {
          ...(event.meta || {}),
          transactionId: event.ref,
          timestamp: event.timestamp.toISOString(),
        },
        timestamp: event.timestamp.toISOString(),
        transactionId: event.ref,
      }));

      return {
        success: true,
        events: hcsEvents,
        total: events.length,
        limit: parseInt(limit),
        offset: parseInt(offset)
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        events: []
      };
    }
  }

  @Get('events/:eventType')
  async getEventsByType(
    @Param('eventType') eventType: string,
    @Query('address') address?: string,
    @Query('limit') limit: string = '50'
  ) {
    try {
      const kindFilter = this.mapEventTypeToTransactionKind(eventType);

      // Get events from TransactionService (HCS-backed)
      const allEvents = await this.transactionService.getTransactionsByKind(
        kindFilter
      );

      // Filter by address if provided
      const events = address
        ? allEvents.filter((event) => {
            const meta = event.meta || {};
            return (
              meta.depositorAddress === address ||
              meta.farmerAddress === address
            );
          })
        : allEvents;

      // Take limit
      const limitedEvents = events.slice(0, parseInt(limit));

      const hcsEvents = limitedEvents.map((event) => ({
        hcsMessageId: event.hcsMessageId,
        eventType: this.mapTransactionKindToEventType(event.kind),
        payload: {
          ...(event.meta || {}),
          transactionId: event.ref,
          timestamp: event.timestamp.toISOString(),
        },
        timestamp: event.timestamp.toISOString(),
        transactionId: event.ref,
      }));

      return {
        success: true,
        eventType,
        events: hcsEvents,
        total: events.length
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        eventType,
        events: []
      };
    }
  }

  @Get('status')
  async getStatus() {
    return {
      success: true,
      mode: this.hcsService.getTopicId() === 'MOCK_TOPIC_ID' ? 'mock' : 'live',
      topicId: this.hcsService.getTopicId(),
      status: 'operational'
    };
  }

  @Post('log-deposit')
  async logDeposit(@Body() depositData: {
    poolAddress: string;
    amount: number;
    depositorAddress: string;
    contractTxHash: string;
    timestamp: string;
  }) {
    try {
      const txId = await this.hcsService.publishInvestorDeposit({
        poolAddress: depositData.poolAddress,
        grainType: 'USDT', // We can enhance this later
        amount: depositData.amount,
        depositorAddress: depositData.depositorAddress,
        contractTxHash: depositData.contractTxHash
      });

      return {
        success: true,
        transactionId: txId,
        message: 'Deposit logged to HCS'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  @Post('log-withdraw')
  async logWithdraw(@Body() withdrawData: {
    poolAddress: string;
    shares: number;
    depositorAddress: string;
    contractTxHash: string;
    timestamp: string;
  }) {
    try {
      const txId = await this.hcsService.publishInvestorWithdraw({
        poolAddress: withdrawData.poolAddress,
        grainType: 'USDT',
        shares: withdrawData.shares,
        depositorAddress: withdrawData.depositorAddress,
        contractTxHash: withdrawData.contractTxHash,
        withdrawalAmount: 0 // Will be calculated by backend if needed
      });

      return {
        success: true,
        transactionId: txId,
        message: 'Withdrawal logged to HCS'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  private async getMockEvents(address?: string) {
    // Return mock events for demonstration
    const mockEvents = [
      {
        eventType: 'InvestorDeposit',
        payload: {
          poolAddress: '0x84565EEAE3ddD89325bB5726C912b5478B8078Af',
          grainType: 'Rice',
          amount: 1000,
          depositorAddress: address || '0x1234567890123456789012345678901234567890',
          contractTxHash: '0xabc123...',
          timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString() // 30 minutes ago
        },
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        transactionId: 'mock_investor_deposit_1'
      },
      {
        eventType: 'LoanCreated',
        payload: {
          poolAddress: '0xE7CAc2F391BA5f839D4145219BA50D5D5635aB56',
          grainType: 'Corn',
          farmerAddress: '0x9876543210987654321098765432109876543210',
          loanAmount: 500,
          collateralAmount: 750,
          contractTxHash: '0xdef456...',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() // 2 hours ago
        },
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        transactionId: 'mock_loan_created_1'
      }
    ];

    return address ? mockEvents.filter(event => 
      event.payload.depositorAddress === address || 
      event.payload.farmerAddress === address
    ) : mockEvents;
  }

  private mapTransactionKindToEventType(kind: string): string {
    const mapping: Record<string, string> = {
      'investor_deposit': 'InvestorDeposit',
      'investor_withdraw': 'InvestorWithdraw',
      'investor_deposit_failed': 'InvestorDepositFailed',
      'investor_withdraw_failed': 'InvestorWithdrawFailed',
      'farmer_deposit': 'CollateralDeposited',
      'farmer_loan': 'LoanCreated',
      'farmer_repay': 'LoanRepaid',
      'farmer_redeem': 'CollateralWithdrawn'
    };
    return mapping[kind] || kind;
  }

  private mapEventTypeToTransactionKind(eventType: string): string {
    const mapping: Record<string, string> = {
      'InvestorDeposit': 'investor_deposit',
      'InvestorWithdraw': 'investor_withdraw',
      'InvestorDepositFailed': 'investor_deposit_failed',
      'InvestorWithdrawFailed': 'investor_withdraw_failed',
      'CollateralDeposited': 'farmer_deposit',
      'LoanCreated': 'farmer_loan',
      'LoanRepaid': 'farmer_repay',
      'CollateralWithdrawn': 'farmer_redeem'
    };
    return mapping[eventType] || eventType.toLowerCase();
  }
}
