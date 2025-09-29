'use client';

import { useState, useEffect, useCallback } from 'react';

interface HashPackDirectHook {
  isConnected: boolean;
  accountId: string | null;
  error: string | null;
  isLoading: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  checkConnection: () => Promise<void>;
  hashconnect: any;
  connectionStatus: string;
}

const appMetadata = {
  name: "Hedarvest",
  description: "Agricultural Investment Platform on Hedera",
  icons: ["https://hedarvest.com/logo.png"],
  url: typeof window !== 'undefined' ? window.location.origin : "http://localhost:3000",
};

export function useHashPackDirect(): HashPackDirectHook {
  const [hashconnect, setHashconnect] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('Disconnected');

  // Initialize HashConnect with your project ID
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const init = async () => {
      try {
        console.log('🚀 Initializing HashConnect with project ID...');
        
        // Dynamic import to prevent SSR issues
        const { HashConnect } = await import('hashconnect');
        const { LedgerId } = await import('@hashgraph/sdk');
        
        // Create the hashconnect instance with your project ID
        const hc = new HashConnect(
          LedgerId.TESTNET,
          'ef7d91a96244dc686b4efe026d364d7c', // Your project ID
          appMetadata,
          false // Disable debug mode
        );

        // Register events
        hc.pairingEvent.on((newPairing) => {
          console.log('🔗 New pairing:', newPairing);
          if (newPairing && newPairing.accountIds && newPairing.accountIds.length > 0) {
            setAccountId(newPairing.accountIds[0]);
            setIsConnected(true);
            setConnectionStatus('Connected');
            localStorage.setItem('hashpack_account', newPairing.accountIds[0]);
          }
        });

        hc.disconnectionEvent.on((data) => {
          console.log('🔌 Disconnected:', data);
          setAccountId(null);
          setIsConnected(false);
          setConnectionStatus('Disconnected');
          localStorage.removeItem('hashpack_account');
        });

        hc.connectionStatusChangeEvent.on((status) => {
          console.log('📡 Connection status changed:', status);
          setConnectionStatus(status);
          
          if (status === 'Connected') {
            console.log('✅ Connected! Pairing data:', (hc as any).pairingData);
            if ((hc as any).pairingData && (hc as any).pairingData.accountIds && (hc as any).pairingData.accountIds.length > 0) {
              setAccountId((hc as any).pairingData.accountIds[0]);
              setIsConnected(true);
              localStorage.setItem('hashpack_account', (hc as any).pairingData.accountIds[0]);
            }
          } else if (status === 'Disconnected') {
            setAccountId(null);
            setIsConnected(false);
            localStorage.removeItem('hashpack_account');
          }
        });

        // Initialize
        await hc.init();
        setHashconnect(hc);
        
        console.log('✅ HashConnect initialized successfully with project ID');
      } catch (err: any) {
        console.error('❌ HashConnect initialization failed:', err);
        setError('Failed to initialize HashConnect');
      }
    };

    init();
  }, []);

  // Check for existing connection on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      checkConnection();
    }
  }, [hashconnect]);

  const checkConnection = useCallback(async () => {
    if (typeof window === 'undefined') return;

    try {
      // Check if HashPack is available
      if (window.hedera || window.hashpack) {
        const provider = window.hedera || window.hashpack;
        if (provider) {
          const accounts = await provider.request({ method: 'eth_accounts' });
        
          if (accounts && accounts.length > 0) {
            setAccountId(accounts[0]);
            setIsConnected(true);
            setConnectionStatus('Connected');
            console.log('✅ HashPack already connected:', accounts[0]);
          } else {
            setIsConnected(false);
            setAccountId(null);
            setConnectionStatus('Disconnected');
          }
        }
      } else {
        console.log('❌ HashPack not detected');
        setIsConnected(false);
        setAccountId(null);
        setConnectionStatus('Disconnected');
      }
    } catch (err: any) {
      console.log('Connection check failed:', err);
      setIsConnected(false);
      setAccountId(null);
      setConnectionStatus('Disconnected');
    }
  }, []);

  const connect = useCallback(async () => {
    if (!hashconnect) {
      setError('HashConnect not initialized');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('🔗 Opening HashPack pairing modal...');
      
      // Check if already connected
      if (connectionStatus === 'Connected') {
        console.log('✅ Already connected');
        setIsLoading(false);
        return;
      }

      // Open pairing modal
      await hashconnect.openPairingModal();
      
      // Set a timeout to prevent infinite loading
      setTimeout(() => {
        if (connectionStatus !== 'Connected' && isLoading) {
          console.log('⏰ Connection timeout, stopping loading state');
          setIsLoading(false);
        }
      }, 30000); // 30 second timeout
      
    } catch (err: any) {
      console.error('❌ Connection failed:', err);
      setError(err.message || 'Connection failed');
      setIsLoading(false);
    }
  }, [hashconnect, connectionStatus, isLoading]);

  const disconnect = useCallback(() => {
    if (hashconnect) {
      hashconnect.disconnectAll();
    }
    setAccountId(null);
    setIsConnected(false);
    setConnectionStatus('Disconnected');
    localStorage.removeItem('hashpack_account');
    console.log('🔌 Disconnected from HashPack');
  }, [hashconnect]);

  return {
    hashconnect,
    connectionStatus,
    isConnected,
    accountId,
    error,
    isLoading,
    connect,
    disconnect,
    checkConnection,
  };
}

// Type declarations for window.hedera
declare global {
  interface Window {
    hedera?: {
      request: (args: { method: string }) => Promise<string[]>;
    };
    hashpack?: {
      request: (args: { method: string }) => Promise<string[]>;
    };
  }
}
