import { Injectable, Logger } from '@nestjs/common';
import {
  TopicCreateTransaction,
  TopicMessageSubmitTransaction,
  TopicId,
} from '@hashgraph/sdk';
import { HederaService } from '../lib/hedera.service';

export interface LogTransactionDto {
  kind: string;
  ref: string;
  entity?: string;
  meta?: any;
}

export interface TransactionLog {
  kind: string;
  ref: string;
  entity?: string;
  meta?: any;
  timestamp: Date;
  hcsMessageId?: string;
}

@Injectable()
export class TransactionService {
  private readonly logger = new Logger(TransactionService.name);
  private topicId: TopicId | null = null;
  private transactionCache: TransactionLog[] = []; // In-memory cache

  constructor(private hederaService: HederaService) {
    this.initializeHCSTopic();
  }

  /**
   * Initialize HCS Topic for transaction logs
   */
  private async initializeHCSTopic() {
    try {
      // Use existing topic ID or create a new one
      const existingTopicId = process.env.HCS_TRANSACTION_TOPIC_ID;

      if (existingTopicId) {
        this.topicId = TopicId.fromString(existingTopicId);
        this.logger.log(
          `Using existing HCS topic for transactions: ${existingTopicId}`,
        );
      } else {
        // Create a new topic
        const client = this.hederaService['client'];
        const transaction = await new TopicCreateTransaction()
          .setTopicMemo('Hedarvest Transaction Logs')
          .execute(client);

        const receipt = await transaction.getReceipt(client);
        this.topicId = receipt.topicId!;
      }
    } catch (error) {
      this.logger.error('Failed to initialize HCS topic:', error);
      this.logger.warn('Transaction logging will use in-memory cache only');
    }
  }

  /**
   * Log a transaction to HCS (Hedera Consensus Service)
   */
  async logTransaction(data: LogTransactionDto): Promise<TransactionLog> {
    const transactionLog: TransactionLog = {
      ...data,
      timestamp: new Date(),
    };

    // Add to in-memory cache
    this.transactionCache.push(transactionLog);

    // Keep cache size manageable
    if (this.transactionCache.length > 1000) {
      this.transactionCache = this.transactionCache.slice(-1000);
    }

    // Submit to HCS
    try {
      if (this.topicId) {
        const client = this.hederaService['client'];
        const message = JSON.stringify(transactionLog);

        const transaction = await new TopicMessageSubmitTransaction({
          topicId: this.topicId,
          message: message,
        }).execute(client);

        const receipt = await transaction.getReceipt(client);

        transactionLog.hcsMessageId = `${this.topicId.toString()}@${receipt.topicSequenceNumber?.toString()}`;

        this.logger.log(
          `✅ Transaction logged to HCS: ${transactionLog.hcsMessageId}`,
        );
      }
    } catch (error) {
      this.logger.error('Failed to log transaction to HCS:', error);
      // Continue even if HCS fails - we have in-memory cache
    }

    return transactionLog;
  }

  /**
   * Get transactions by reference
   */
  async getTransactionsByRef(ref: string): Promise<TransactionLog[]> {
    return this.transactionCache
      .filter((tx) => tx.ref === ref)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Get transactions by kind
   */
  async getTransactionsByKind(kind: string): Promise<TransactionLog[]> {
    return this.transactionCache
      .filter((tx) => tx.kind === kind)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Get transactions by entity
   */
  async getTransactionsByEntity(entity: string): Promise<TransactionLog[]> {
    return this.transactionCache
      .filter((tx) => tx.entity === entity)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Get transactions by entity and address
   */
  async getTransactionsByEntityAndAddress(
    entity: string,
    address: string,
    limit: number = 10,
  ): Promise<TransactionLog[]> {
    this.logger.log(`\n[TransactionService] Querying transactions from HCS:`);
    this.logger.log(`  Entity: "${entity}"`);
    this.logger.log(`  Address: "${address}"`);
    this.logger.log(`  Limit: ${limit}`);

    const results = this.transactionCache
      .filter((tx) => {
        if (tx.entity !== entity) return false;
        if (!tx.meta) return false;

        // Check if depositorAddress matches
        const depositorAddress = tx.meta.depositorAddress;
        return depositorAddress === address;
      })
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);

    this.logger.log(`  Found: ${results.length} transactions`);

    return results;
  }

  /**
   * Get all transactions
   */
  async getAllTransactions(
    limit: number = 100,
    offset: number = 0,
  ): Promise<TransactionLog[]> {
    return this.transactionCache
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(offset, offset + limit);
  }

  /**
   * Get HCS Topic ID
   */
  getTopicId(): string | null {
    return this.topicId?.toString() || null;
  }
}