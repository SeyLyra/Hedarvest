import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import {
  Client,
  TopicId,
  TopicMessageSubmitTransaction,
  TopicMessageQuery,
  TransactionId,
} from '@hashgraph/sdk';

export interface HcsEvent {
  eventType: string;
  payload: any;
  timestamp: string;
  transactionId?: string;
}

export interface HcsEventCallback {
  (event: HcsEvent): void;
}

@Injectable()
export class HcsService implements OnModuleInit {
  private readonly logger = new Logger(HcsService.name);
  private client: Client;
  private topicId: TopicId;
  private eventCallbacks: HcsEventCallback[] = [];

  constructor() {
    this.initializeClient();
  }

  async onModuleInit() {
    // Start listening for events when the module initializes
    await this.subscribeToEvents();
    
    // Set up pool event handlers
    this.setupPoolEventHandlers();
  }

  private setupPoolEventHandlers() {
    this.onEvent((event) => {
      // We'll handle pool events here once the PoolsService is available
      // For now, just log them
      if (event.eventType === 'PoolCreated') {
        this.logger.log('PoolCreated event received:', event.payload);
      }
    });
  }

  private initializeClient(): void {
    try {
      // Check for required environment variables
      const accountId = process.env.HEDERA_ACCOUNT_ID;
      const privateKey = process.env.HEDERA_PRIVATE_KEY;
      const topicId = process.env.HEDERA_TOPIC_ID;

      if (!topicId) {
        this.logger.warn('HEDERA_TOPIC_ID not found - HCS will run in mock mode');
        return;
      }

      if (!accountId || !privateKey) {
        this.logger.warn('Hedera credentials not found - HCS will run in mock mode');
        return;
      }

      // Initialize Hedera client
      this.client = Client.forTestnet();
      this.client.setOperator(accountId, privateKey);

      // Initialize topic ID
      this.topicId = TopicId.fromString(topicId);
      this.logger.log(`Initialized HCS with topic ID: ${this.topicId.toString()}`);
    } catch (error) {
      this.logger.warn('Failed to initialize HCS client - running in mock mode:', error);
      // Don't throw error, just log warning and continue in mock mode
    }
  }

  /**
   * Publishes an event to the HCS topic
   * @param eventType - Type of event (e.g., "InvestorDeposit", "LoanCreated")
   * @param payload - Event payload data
   * @returns Promise<string> - Transaction ID
   */
  async publishEvent(eventType: string, payload: any): Promise<string> {
    try {
      const event: HcsEvent = {
        eventType,
        payload,
        timestamp: new Date().toISOString(),
      };

      // Check if running in mock mode (no client or topic configured)
      if (!this.client || !this.topicId) {
        const mockTransactionId = `mock_${eventType.toLowerCase()}_${Date.now()}`;
        event.transactionId = mockTransactionId;
        
        this.logger.log(`[MOCK MODE] Published HCS event: ${eventType}`, {
          eventType,
          transactionId: mockTransactionId,
          timestamp: event.timestamp,
          payload: payload,
        });

        return mockTransactionId;
      }

      // Create and submit the topic message transaction
      const transaction = new TopicMessageSubmitTransaction({
        topicId: this.topicId,
        message: JSON.stringify(event),
      });

      const txResponse = await transaction.execute(this.client);
      const receipt = await txResponse.getReceipt(this.client);
      const transactionId = txResponse.transactionId.toString();

      // Add transaction ID to the event for logging
      event.transactionId = transactionId;

      this.logger.log(`Published HCS event: ${eventType}`, {
        eventType,
        transactionId,
        timestamp: event.timestamp,
      });

      return transactionId;
    } catch (error) {
      this.logger.error(`Failed to publish HCS event: ${eventType}`, error);
      // Return mock transaction ID instead of throwing error to prevent service disruption
      const mockTransactionId = `error_${eventType.toLowerCase()}_${Date.now()}`;
      return mockTransactionId;
    }
  }

  /**
   * Subscribes to HCS topic messages and processes them
   */
  async subscribeToEvents(): Promise<void> {
    try {
      // Check if running in mock mode
      if (!this.client || !this.topicId) {
        this.logger.log('[MOCK MODE] HCS subscription disabled - no client/topic configured');
        return;
      }

      const query = new TopicMessageQuery()
        .setTopicId(this.topicId)
        .setStartTime(0); // Start from the beginning or use a specific timestamp

      query.subscribe(
        this.client,
        (message) => {
          try {
            if (!message) {
              this.logger.warn('Received null message from HCS topic');
              return;
            }

            // Decode the message
            const messageString = Buffer.from(message.contents).toString('utf8');
            const event: HcsEvent = JSON.parse(messageString);

            this.logger.log(`Received HCS event: ${event.eventType}`, {
              eventType: event.eventType,
              timestamp: event.timestamp,
              consensusTimestamp: message.consensusTimestamp.toDate().toISOString(),
              sequenceNumber: message.sequenceNumber.toString(),
            });

            // Trigger all registered callbacks
            this.eventCallbacks.forEach(callback => {
              try {
                callback(event);
              } catch (callbackError) {
                this.logger.error('Error in HCS event callback:', callbackError);
              }
            });

          } catch (parseError) {
            this.logger.error('Failed to parse HCS message:', parseError);
          }
        },
        (error) => {
          this.logger.error('HCS subscription error:', error);
        }
      );

      this.logger.log('Successfully subscribed to HCS topic messages');
    } catch (error) {
      this.logger.warn('Failed to subscribe to HCS events - continuing in mock mode:', error);
      // Don't throw error, just log warning and continue
    }
  }

  /**
   * Registers a callback to be called when HCS events are received
   * @param callback - Function to call when events are received
   */
  onEvent(callback: HcsEventCallback): void {
    this.eventCallbacks.push(callback);
    this.logger.log('Registered new HCS event callback');
  }

  /**
   * Publishes investor deposit event
   */
  async publishInvestorDeposit(data: {
    poolAddress: string;
    grainType: string;
    amount: number;
    depositorAddress: string;
    contractTxHash: string;
  }): Promise<string> {
    return this.publishEvent('InvestorDeposit', data);
  }

  /**
   * Publishes investor withdrawal event
   */
  async publishInvestorWithdraw(data: {
    poolAddress: string;
    grainType: string;
    shares: number;
    depositorAddress: string;
    contractTxHash: string;
    withdrawalAmount: number;
  }): Promise<string> {
    return this.publishEvent('InvestorWithdraw', data);
  }

  /**
   * Publishes loan creation event
   */
  async publishLoanCreated(data: {
    poolAddress: string;
    grainType: string;
    farmerAddress: string;
    loanAmount: number;
    collateralAmount: number;
    contractTxHash: string;
  }): Promise<string> {
    return this.publishEvent('LoanCreated', data);
  }

  /**
   * Publishes loan repayment event
   */
  async publishLoanRepaid(data: {
    poolAddress: string;
    grainType: string;
    farmerAddress: string;
    repaymentAmount: number;
    contractTxHash: string;
  }): Promise<string> {
    return this.publishEvent('LoanRepaid', data);
  }

  /**
   * Publishes collateral deposit event
   */
  async publishCollateralDeposited(data: {
    poolAddress: string;
    grainType: string;
    farmerAddress: string;
    collateralAmount: number;
    contractTxHash: string;
  }): Promise<string> {
    return this.publishEvent('CollateralDeposited', data);
  }

  /**
   * Gets the current topic ID
   */
  getTopicId(): string {
    return this.topicId ? this.topicId.toString() : 'MOCK_TOPIC_ID';
  }

  /**
   * Closes the HCS client connection
   */
  async close(): Promise<void> {
    try {
      if (this.client) {
        this.client.close();
        this.logger.log('HCS client connection closed');
      } else {
        this.logger.log('[MOCK MODE] No HCS client to close');
      }
    } catch (error) {
      this.logger.error('Error closing HCS client:', error);
    }
  }
}
