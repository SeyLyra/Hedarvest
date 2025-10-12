"use client";

import { useState, useCallback } from 'react';
import { useHashPackDirect } from './useHashPackDirect';

interface HashPackWalletState {
  isConnected: boolean;
  address: string | null;
  accountId: string | null;
  isConnecting: boolean;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  sendHederaTransaction: (to: string, amount: string) => Promise<string | null>;
  signMessage: (message: string) => Promise<string | null>;
  isHashPackAvailable: boolean;
  hbarBalance: string | null;
  fetchBalance: () => Promise<void>;
  hashconnect: any;
}

export const useWalletConnect = (): HashPackWalletState => {
  const { connect: connectHashPack, disconnect: disconnectHashPack, isConnected, accountId, isLoading, error, hbarBalance, fetchBalance, hashconnect } = useHashPackDirect();
  const [isConnecting, setIsConnecting] = useState(false);

  const connect = useCallback(async () => {
    setIsConnecting(true);
    try {
      await connectHashPack();
    } catch (err) {
      console.error('Connection failed:', err);
    } finally {
      setIsConnecting(false);
    }
  }, [connectHashPack]);

  const disconnect = useCallback(async () => {
    try {
      // Use the proper disconnect method from HashPack
      await disconnectHashPack();
    } catch (err) {
      console.error('Disconnect failed:', err);
      // Fallback: clear storage if disconnect fails
      localStorage.removeItem('hashpack_account');
    }
  }, [disconnectHashPack]);

  const sendHederaTransaction = useCallback(async (to: string, amount: string): Promise<string | null> => {
    console.log('Transaction not implemented in simple version:', { to, amount });
    return null;
  }, []);

  const signMessage = useCallback(async (message: string): Promise<string | null> => {
    console.log('Message signing not implemented in simple version:', message);
    return null;
  }, []);

  const isHashPackAvailable = useCallback(() => {
    if (typeof window === 'undefined') return false;
    return !!(window as any).hashconnect || !!(window as any).HashPack;
  }, []);

  return {
    isConnected,
    address: accountId || null,
    accountId: accountId || null,
    isConnecting: isConnecting || isLoading,
    error,
    connect,
    disconnect,
    sendHederaTransaction,
    signMessage,
    isHashPackAvailable: isHashPackAvailable(),
    hbarBalance,
    fetchBalance,
    hashconnect
  };
};