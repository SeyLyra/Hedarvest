import { ethers } from 'ethers';

export type WalletType = 'metamask' | 'hashpack';

export interface WalletInfo {
  walletType: WalletType;
  address: string;
  accountId?: string; // For HashPack
}

export interface WalletConnectionResult {
  success: boolean;
  walletInfo?: WalletInfo;
  error?: string;
}

export class WalletService {
  private static instance: WalletService;
  private hashConnect: any | null = null; // HashConnect temporarily disabled
  private isHashConnectInitialized = false;

  private constructor() {}

  public static getInstance(): WalletService {
    if (!WalletService.instance) {
      WalletService.instance = new WalletService();
    }
    return WalletService.instance;
  }

  /**
   * Check if MetaMask is available in the browser
   */
  public isMetaMaskAvailable(): boolean {
    if (typeof window === 'undefined') {
      console.log('MetaMask check: window is undefined (SSR)');
      return false;
    }
    
    const hasEthereum = typeof window.ethereum !== 'undefined';
    const isMetaMask = window.ethereum?.isMetaMask;
    // Also check for MetaMask in the provider list
    const hasMetaMaskProvider = window.ethereum?.providers?.some((provider: any) => provider.isMetaMask);
    const isAvailable = hasEthereum && (isMetaMask || hasMetaMaskProvider);
    
    console.log('=== METAMASK AVAILABILITY CHECK ===');
    console.log('hasWindow:', typeof window !== 'undefined');
    console.log('hasEthereum:', hasEthereum);
    console.log('isMetaMask:', isMetaMask);
    console.log('hasMetaMaskProvider:', hasMetaMaskProvider);
    console.log('window.ethereum:', window.ethereum);
    console.log('window.ethereum.providers:', window.ethereum?.providers);
    console.log('isAvailable:', isAvailable);
    
    return isAvailable;
  }

  /**
   * Force refresh MetaMask connection
   */
  public async refreshMetaMaskConnection(): Promise<boolean> {
    try {
      console.log('Refreshing MetaMask connection...');
      
      // Try to disconnect first
      if (window.ethereum?.disconnect) {
        await window.ethereum.disconnect();
      }
      
      // Wait a bit for the disconnect to process
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Check if MetaMask is still available
      return this.isMetaMaskAvailable();
    } catch (error) {
      console.error('Failed to refresh MetaMask connection:', error);
      return false;
    }
  }

  /**
   * Check if HashPack is available in the browser
   */
  public isHashPackAvailable(): boolean {
    // Temporarily disable HashPack due to connection issues
    return false;
  }

  /**
   * Initialize HashConnect for HashPack integration
   */
  private async initializeHashConnect(): Promise<void> {
    if (this.isHashConnectInitialized) return;

    try {
      // HashConnect initialization temporarily disabled due to API changes
      // this.hashConnect = new HashConnect(true);
      this.isHashConnectInitialized = true;
    } catch (error) {
      console.error('Failed to initialize HashConnect:', error);
      throw new Error('Failed to initialize HashConnect');
    }
  }

  /**
   * Connect to MetaMask wallet
   */
  public async connectMetaMask(): Promise<WalletConnectionResult> {
    try {
      console.log('=== METAMASK CONNECTION START ===');
      console.log('WalletService.connectMetaMask called');
      
      if (!this.isMetaMaskAvailable()) {
        console.log('❌ MetaMask not available');
        return {
          success: false,
          error: 'MetaMask is not installed or not available. Please install MetaMask browser extension.'
        };
      }

      console.log('✅ MetaMask is available, requesting accounts...');
      console.log('window.ethereum:', window.ethereum);
      
      // Check if MetaMask is locked
      try {
        const isUnlocked = await window.ethereum.request({ method: 'eth_accounts' });
        if (isUnlocked.length === 0) {
          console.log('MetaMask appears to be locked or no accounts available');
        }
      } catch (unlockCheckError) {
        console.log('Could not check MetaMask unlock status:', unlockCheckError);
      }
      
      // Use direct window.ethereum.request instead of ethers provider
      console.log('Requesting accounts from MetaMask using window.ethereum.request...');
      
      let accounts;
      try {
        // First try the standard eth_requestAccounts method
        console.log('Attempting eth_requestAccounts...');
        accounts = await window.ethereum.request({ 
          method: 'eth_requestAccounts' 
        });
        console.log('✅ Accounts received via eth_requestAccounts:', accounts);
      } catch (requestError) {
        console.log('eth_requestAccounts failed, trying alternative method...', requestError);
        
        // Check if it's a user rejection
        if ((requestError as any).code === 4001) {
          throw new Error('User rejected the connection request. Please try again and approve the connection in MetaMask.');
        }
        
        // Fallback: try to get accounts if already connected
        try {
          console.log('Attempting eth_accounts fallback...');
          accounts = await window.ethereum.request({ 
            method: 'eth_accounts' 
          });
          console.log('✅ Accounts received via eth_accounts:', accounts);
          
          if (accounts.length === 0) {
            throw new Error('No accounts available. Please unlock MetaMask and try again.');
          }
        } catch (fallbackError) {
          console.error('Both connection methods failed:', fallbackError);
          
          // Provide more specific error messages
          if ((fallbackError as any).code === 4001) {
            throw new Error('User rejected the connection request.');
          } else if ((fallbackError as any).code === -32002) {
            throw new Error('MetaMask connection request is already pending. Please check MetaMask and approve the request.');
          } else {
            throw new Error('Failed to connect to MetaMask. Please make sure MetaMask is installed, unlocked, and try again.');
          }
        }
      }
    
      if (accounts.length === 0) {
        console.log('❌ No accounts found');
        return {
          success: false,
          error: 'No accounts found. Please make sure you have accounts in MetaMask.'
        };
      }

      // Check current chain ID and force Hedera network
      console.log('Checking current chain ID...');
      const currentChainId = await window.ethereum.request({ method: 'eth_chainId' });
      console.log('Current chain ID:', currentChainId);
      const hederaTestnetChainId = '0x128'; // 296 decimal
      const hederaMainnetChainId = '0x127'; // 295 decimal

      if (currentChainId !== hederaTestnetChainId && currentChainId !== hederaMainnetChainId) {
        console.log('🔄 Switching to Hedera network...');
        // Prompt user to switch to Hedera Testnet
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: hederaTestnetChainId,
              chainName: 'Hedera Testnet',
              nativeCurrency: { 
                name: 'HBAR', 
                symbol: 'HBAR', 
                decimals: 18 
              },
              rpcUrls: ['https://testnet.hashio.io/api'],
              blockExplorerUrls: ['https://hashscan.io/testnet'],
            }]
          });
          console.log('✅ Network switch successful');
        } catch (switchError) {
          console.log('❌ Network switch failed:', switchError);
          return {
            success: false,
            error: 'Please switch to Hedera Testnet in MetaMask to continue'
          };
        }
      }

      const address = accounts[0];
      console.log('✅ Wallet address:', address);
      const walletInfo: WalletInfo = {
        walletType: 'metamask',
        address
      };

      // Store in localStorage
      this.saveWalletInfo(walletInfo);
      console.log('✅ Wallet info saved to localStorage');

      console.log('=== METAMASK CONNECTION SUCCESS ===');
      return {
        success: true,
        walletInfo
      };
    } catch (error) {
      console.error('❌ MetaMask connection error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to connect to MetaMask'
      };
    }
  }

  /**
   * Connect to HashPack wallet
   */
  public async connectHashPack(): Promise<WalletConnectionResult> {
    try {
      if (!this.isHashPackAvailable()) {
        return {
          success: false,
          error: 'HashPack is not installed or not available'
        };
      }

      // For now, return a placeholder implementation
      // HashConnect API integration needs to be updated based on current SDK version
      return {
        success: false,
        error: 'HashPack integration is temporarily unavailable. Please use MetaMask for now.'
      };
    } catch (error) {
      console.error('HashPack connection error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to connect to HashPack'
      };
    }
  }

  /**
   * Sign a message with the currently connected wallet
   */
  public async signMessage(message: string): Promise<string> {
    const walletInfo = this.getStoredWalletInfo();
    
    if (!walletInfo) {
      throw new Error('No wallet connected');
    }

    try {
      if (walletInfo.walletType === 'metamask') {
        return await this.signMessageWithMetaMask(message);
      } else if (walletInfo.walletType === 'hashpack') {
        return await this.signMessageWithHashPack(message);
      } else {
        throw new Error('Unsupported wallet type');
      }
    } catch (error) {
      console.error('Message signing error:', error);
      throw new Error(`Failed to sign message: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Sign message with MetaMask
   */
  private async signMessageWithMetaMask(message: string): Promise<string> {
    if (!this.isMetaMaskAvailable()) {
      throw new Error('MetaMask not available');
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const signature = await signer.signMessage(message);
    return signature;
  }

  /**
   * Sign message with HashPack
   */
  private async signMessageWithHashPack(message: string): Promise<string> {
    // HashPack integration temporarily disabled
    throw new Error('HashPack signing is temporarily unavailable. Please use MetaMask for now.');
  }

  /**
   * Get currently connected wallet info
   */
  public getConnectedWallet(): WalletInfo | null {
    return this.getStoredWalletInfo();
  }

  /**
   * Disconnect wallet and clear stored data
   */
  public disconnect(): void {
    if (typeof window === 'undefined') return;
    
    localStorage.removeItem('hedarvest_wallet_type');
    localStorage.removeItem('hedarvest_wallet_address');
    localStorage.removeItem('hedarvest_wallet_account_id');
  }

  /**
   * Check if wallet is connected
   */
  public isConnected(): boolean {
    return this.getStoredWalletInfo() !== null;
  }

  /**
   * Save wallet info to localStorage
   */
  private saveWalletInfo(walletInfo: WalletInfo): void {
    if (typeof window === 'undefined') return;
    
    localStorage.setItem('hedarvest_wallet_type', walletInfo.walletType);
    localStorage.setItem('hedarvest_wallet_address', walletInfo.address);
    if (walletInfo.accountId) {
      localStorage.setItem('hedarvest_wallet_account_id', walletInfo.accountId);
    }
  }

  /**
   * Get stored wallet info from localStorage
   */
  private getStoredWalletInfo(): WalletInfo | null {
    if (typeof window === 'undefined') return null;

    const walletType = localStorage.getItem('hedarvest_wallet_type') as WalletType;
    const address = localStorage.getItem('hedarvest_wallet_address');
    const accountId = localStorage.getItem('hedarvest_wallet_account_id');

    if (!walletType || !address) return null;

    return {
      walletType,
      address,
      accountId: accountId || undefined
    };
  }

  /**
   * Authenticate with backend using wallet signature
   */
  public async authenticateWithBackend(apiBaseUrl: string): Promise<{ success: boolean; token?: string; error?: string }> {
    try {
      const walletInfo = this.getConnectedWallet();
      if (!walletInfo) {
        return {
          success: false,
          error: 'No wallet connected'
        };
      }

      // Create authentication message
      const timestamp = Date.now();
      const message = `Hedarvest Authentication\nTimestamp: ${timestamp}\nWallet: ${walletInfo.address}`;
      
      // Sign the message
      const signature = await this.signMessage(message);

      // Send to backend
      const response = await fetch(`${apiBaseUrl}/auth/wallet`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletType: walletInfo.walletType,
          address: walletInfo.address,
          signature,
          message,
          timestamp
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        return {
          success: false,
          error: errorData.message || 'Authentication failed'
        };
      }

      const data = await response.json();
      return {
        success: true,
        token: data.token
      };
    } catch (error) {
      console.error('Backend authentication error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Authentication failed'
      };
    }
  }
}

// Global type declarations for window objects
declare global {
  interface Window {
    ethereum?: any;
    hashconnect?: any;
  }
}
