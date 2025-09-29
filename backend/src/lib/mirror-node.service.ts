import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

export interface MirrorNodeTransaction {
  transaction_id: string;
  consensus_timestamp: string;
  result: string;
  transaction_hash: string;
  name: string;
  memo?: string;
  transfers: Array<{
    account: string;
    amount: number;
    token_id?: string;
  }>;
  token_transfers?: Array<{
    token_id: string;
    account: string;
    amount: number;
    is_approval: boolean;
  }>;
  contract_result?: {
    contract_id: string;
    gas_used: number;
    gas_limit: number;
    created_contract_ids: string[];
    evm_address?: string;
  };
}

export interface MirrorNodeTokenInfo {
  token_id: string;
  symbol: string;
  name: string;
  decimals: number;
  total_supply: string;
  treasury_account_id: string;
  admin_key?: any;
  supply_key?: any;
  freeze_key?: any;
  wipe_key?: any;
  kyc_key?: any;
  pause_key?: any;
  fee_schedule_key?: any;
  custom_fees?: any[];
  auto_renew_account?: string;
  auto_renew_period: number;
  expiry_timestamp?: string;
  memo?: string;
  pause_status: string;
  supply_type: string;
  max_supply?: string;
  deleted: boolean;
  default_freeze_status: boolean;
  default_kyc_status: boolean;
}

export interface MirrorNodeAccountBalance {
  account: string;
  balance: number;
  tokens: Array<{
    token_id: string;
    balance: number;
    decimals: number;
    freeze_status: string;
    kyc_status: string;
    automatic_association: boolean;
  }>;
}

@Injectable()
export class MirrorNodeService {
  private readonly logger = new Logger(MirrorNodeService.name);
  private readonly baseUrl: string;

  constructor(private readonly httpService: HttpService) {
    this.baseUrl = process.env.HEDERA_MIRROR_NODE_URL || 'https://mainnet-public.mirrornode.hedera.com';
    this.logger.log(`Mirror Node service initialized with URL: ${this.baseUrl}`);
  }

  // ===== TRANSACTION DATA (Mirror Node - Historical) =====
  
  /**
   * Get transaction details by ID - BEST FOR MIRROR NODE
   */
  async getTransactionById(transactionId: string): Promise<MirrorNodeTransaction | null> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/api/v1/transactions/${transactionId}`)
      );
      return response.data;
    } catch (error: any) {
      this.logger.error(`Failed to get transaction ${transactionId}:`, error.message);
      return null;
    }
  }

  /**
   * Get transactions by account - BEST FOR MIRROR NODE
   */
  async getTransactionsByAccount(
    accountId: string,
    limit: number = 100,
    order: 'asc' | 'desc' = 'desc'
  ): Promise<MirrorNodeTransaction[]> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/api/v1/accounts/${accountId}/transactions`, {
          params: { limit, order }
        })
      );
      return response.data.transactions || [];
    } catch (error: any) {
      this.logger.error(`Failed to get transactions for account ${accountId}:`, error.message);
      return [];
    }
  }

  /**
   * Get transactions by token - BEST FOR MIRROR NODE
   */
  async getTokenTransactions(
    tokenId: string,
    limit: number = 100,
    order: 'asc' | 'desc' = 'desc'
  ): Promise<MirrorNodeTransaction[]> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/api/v1/tokens/${tokenId}/transactions`, {
          params: { limit, order }
        })
      );
      return response.data.transactions || [];
    } catch (error: any) {
      this.logger.error(`Failed to get transactions for token ${tokenId}:`, error.message);
      return [];
    }
  }

  /**
   * Get contract transactions - BEST FOR MIRROR NODE
   */
  async getContractTransactions(
    contractId: string,
    limit: number = 100,
    order: 'asc' | 'desc' = 'desc'
  ): Promise<MirrorNodeTransaction[]> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/api/v1/contracts/${contractId}/transactions`, {
          params: { limit, order }
        })
      );
      return response.data.transactions || [];
    } catch (error: any) {
      this.logger.error(`Failed to get transactions for contract ${contractId}:`, error.message);
      return [];
    }
  }

  // ===== TOKEN DATA (Mirror Node - Static Info) =====
  
  /**
   * Get token information - BEST FOR MIRROR NODE
   */
  async getTokenInfo(tokenId: string): Promise<MirrorNodeTokenInfo | null> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/api/v1/tokens/${tokenId}`)
      );
      return response.data;
    } catch (error: any) {
      this.logger.error(`Failed to get token info for ${tokenId}:`, error.message);
      return null;
    }
  }

  /**
   * Get all tokens - BEST FOR MIRROR NODE
   */
  async getAllTokens(limit: number = 100): Promise<MirrorNodeTokenInfo[]> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/api/v1/tokens`, {
          params: { limit }
        })
      );
      return response.data.tokens || [];
    } catch (error: any) {
      this.logger.error('Failed to get all tokens:', error.message);
      return [];
    }
  }

  // ===== BALANCE DATA (Hybrid - Mirror Node for Historical, RPC for Current) =====
  
  /**
   * Get account balance - HYBRID APPROACH
   */
  async getAccountBalance(accountId: string): Promise<MirrorNodeAccountBalance | null> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/api/v1/accounts/${accountId}/balance`)
      );
      return response.data;
    } catch (error: any) {
      this.logger.error(`Failed to get balance for account ${accountId}:`, error.message);
      return null;
    }
  }

  /**
   * Get token balance for account - HYBRID APPROACH
   */
  async getTokenBalance(accountId: string, tokenId: string): Promise<number> {
    try {
      const balance = await this.getAccountBalance(accountId);
      const tokenBalance = balance?.tokens.find(token => token.token_id === tokenId);
      return tokenBalance?.balance || 0;
    } catch (error: any) {
      this.logger.error(`Failed to get token balance for ${accountId}, ${tokenId}:`, error.message);
      return 0;
    }
  }

  // ===== CONTRACT DATA (Hybrid - Mirror Node for Deployed Info, RPC for State) =====
  
  /**
   * Get contract information - BEST FOR MIRROR NODE
   */
  async getContractInfo(contractId: string): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/api/v1/contracts/${contractId}`)
      );
      return response.data;
    } catch (error: any) {
      this.logger.error(`Failed to get contract info for ${contractId}:`, error.message);
      return null;
    }
  }

  /**
   * Get contract results - BEST FOR MIRROR NODE
   */
  async getContractResults(contractId: string, limit: number = 100): Promise<any[]> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/api/v1/contracts/${contractId}/results`, {
          params: { limit }
        })
      );
      return response.data.results || [];
    } catch (error: any) {
      this.logger.error(`Failed to get contract results for ${contractId}:`, error.message);
      return [];
    }
  }

  // ===== NETWORK DATA (Mirror Node - Network Stats) =====
  
  /**
   * Get network statistics - BEST FOR MIRROR NODE
   */
  async getNetworkStats(): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/api/v1/network/stats`)
      );
      return response.data;
    } catch (error: any) {
      this.logger.error('Failed to get network stats:', error.message);
      return null;
    }
  }

  /**
   * Get blocks information - BEST FOR MIRROR NODE
   */
  async getBlocks(limit: number = 100, order: 'asc' | 'desc' = 'desc'): Promise<any[]> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/api/v1/blocks`, {
          params: { limit, order }
        })
      );
      return response.data.blocks || [];
    } catch (error: any) {
      this.logger.error('Failed to get blocks:', error.message);
      return [];
    }
  }

  // ===== UTILITY METHODS =====
  
  /**
   * Check if mirror node is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/api/v1/network/stats`)
      );
      return true;
    } catch (error: any) {
      this.logger.warn('Mirror node is not available:', error.message);
      return false;
    }
  }

  /**
   * Get mirror node health status
   */
  async getHealthStatus(): Promise<any> {
    try {
      await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/api/v1/network/stats`)
      );
      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        mirrorNodeUrl: this.baseUrl
      };
    } catch (error: any) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString(),
        mirrorNodeUrl: this.baseUrl
      };
    }
  }
}