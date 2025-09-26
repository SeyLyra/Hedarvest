import { useState, useEffect, useCallback } from 'react';
import { WalletService, WalletInfo, WalletType } from '@/lib/wallet';

export interface UseWalletReturn {
  // State
  walletType: WalletType | null;
  address: string | null;
  accountId: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;

  // Methods
  connectMetaMask: () => Promise<void>;
  connectHashPack: () => Promise<void>;
  disconnect: () => void;
  signMessage: (message: string) => Promise<string>;
  authenticateWithBackend: (apiBaseUrl: string) => Promise<{ success: boolean; token?: string; error?: string }>;

  // Utilities
  isMetaMaskAvailable: boolean;
  isHashPackAvailable: boolean;
}

export const useWallet = (): UseWalletReturn => {
  const [walletType, setWalletType] = useState<WalletType | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const walletService = WalletService.getInstance();

  // Check wallet availability (only on client side)
  const isMetaMaskAvailable = typeof window !== 'undefined' ? walletService.isMetaMaskAvailable() : false;
  const isHashPackAvailable = typeof window !== 'undefined' ? walletService.isHashPackAvailable() : false;

  // Auto-restore session from localStorage on mount
  useEffect(() => {
    const restoreSession = () => {
      const connectedWallet = walletService.getConnectedWallet();
      if (connectedWallet) {
        setWalletType(connectedWallet.walletType);
        setAddress(connectedWallet.address);
        setAccountId(connectedWallet.accountId || null);
        setIsConnected(true);
      }
    };

    restoreSession();
  }, [walletService]);

  // Connect to MetaMask
  const connectMetaMask = useCallback(async () => {
    console.log('connectMetaMask called');
    if (!isMetaMaskAvailable) {
      console.log('MetaMask not available');
      setError('MetaMask is not installed or not available');
      return;
    }

    console.log('Starting MetaMask connection...');
    setIsConnecting(true);
    setError(null);

    try {
      const result = await walletService.connectMetaMask();
      console.log('MetaMask connection result:', result);
      
      if (result.success && result.walletInfo) {
        console.log('MetaMask connection successful:', result.walletInfo);
        setWalletType(result.walletInfo.walletType);
        setAddress(result.walletInfo.address);
        setAccountId(result.walletInfo.accountId || null);
        setIsConnected(true);
        setError(null);
        console.log('Wallet state updated successfully');
      } else {
        console.log('MetaMask connection failed:', result.error);
        setError(result.error || 'Failed to connect to MetaMask');
      }
    } catch (err) {
      console.error('MetaMask connection error:', err);
      setError(err instanceof Error ? err.message : 'Failed to connect to MetaMask');
    } finally {
      console.log('Setting isConnecting to false');
      setIsConnecting(false);
    }
  }, [walletService, isMetaMaskAvailable]);

  // Connect to HashPack
  const connectHashPack = useCallback(async () => {
    if (!isHashPackAvailable) {
      setError('HashPack is not installed or not available');
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      const result = await walletService.connectHashPack();
      
      if (result.success && result.walletInfo) {
        setWalletType(result.walletInfo.walletType);
        setAddress(result.walletInfo.address);
        setAccountId(result.walletInfo.accountId || null);
        setIsConnected(true);
        setError(null);
      } else {
        setError(result.error || 'Failed to connect to HashPack');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect to HashPack');
    } finally {
      setIsConnecting(false);
    }
  }, [walletService, isHashPackAvailable]);

  // Disconnect wallet
  const disconnect = useCallback(() => {
    walletService.disconnect();
    setWalletType(null);
    setAddress(null);
    setAccountId(null);
    setIsConnected(false);
    setError(null);
  }, [walletService]);

  // Sign message
  const signMessage = useCallback(async (message: string): Promise<string> => {
    if (!isConnected) {
      throw new Error('No wallet connected');
    }

    try {
      return await walletService.signMessage(message);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign message');
      throw err;
    }
  }, [walletService, isConnected]);

  // Authenticate with backend
  const authenticateWithBackend = useCallback(async (apiBaseUrl: string) => {
    if (!isConnected) {
      return {
        success: false,
        error: 'No wallet connected'
      };
    }

    try {
      return await walletService.authenticateWithBackend(apiBaseUrl);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Authentication failed';
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage
      };
    }
  }, [walletService, isConnected]);

  return {
    // State
    walletType,
    address,
    accountId,
    isConnected,
    isConnecting,
    error,

    // Methods
    connectMetaMask,
    connectHashPack,
    disconnect,
    signMessage,
    authenticateWithBackend,

    // Utilities
    isMetaMaskAvailable,
    isHashPackAvailable,
  };
};
