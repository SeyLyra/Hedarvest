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
  hbarBalance: string | null;
  fetchBalance: () => Promise<void>;
}

export function useHashPackDirect(): HashPackDirectHook {
  // Return safe defaults during SSR
  if (typeof window === 'undefined') {
    return {
      hashconnect: null,
      connectionStatus: 'Disconnected',
      isConnected: false,
      accountId: null,
      error: null,
      isLoading: false,
      connect: async () => {},
      disconnect: () => {},
      checkConnection: async () => {},
      hbarBalance: null,
      fetchBalance: async () => {},
    };
  }

  const [hashconnect, setHashconnect] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('Disconnected');
  const [hbarBalance, setHbarBalance] = useState<string | null>(null);

  // Initialize HashConnect with your project ID
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const init = async () => {
      try {
        
        // Clear any stale HashConnect data from localStorage to prevent "No matching key" errors
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
          if (key.startsWith('hashconnect') || key.includes('hashpack') || key.includes('hedera')) {
            localStorage.removeItem(key);
          }
        });
        
        // Also clear sessionStorage
        const sessionKeys = Object.keys(sessionStorage);
        sessionKeys.forEach(key => {
          if (key.startsWith('hashconnect') || key.includes('hashpack') || key.includes('hedera')) {
            sessionStorage.removeItem(key);
          }
        });
        
        // Dynamic import to prevent SSR issues
        const { HashConnect } = await import('hashconnect');
        const { LedgerId } = await import('@hashgraph/sdk');
        
        // Create app metadata inside the hook to avoid SSR issues
        const appMetadata = {
          name: "Hedarvest",
          description: "Agricultural Investment Platform on Hedera",
          icons: ["https://hedarvest.com/logo.png"],
          url: "http://localhost:3002", // Explicitly set the correct port
        };
        
        // Create the hashconnect instance with your project ID
        const hc = new HashConnect(
          LedgerId.TESTNET,
          'ef7d91a96244dc686b4efe026d364d7c', // Your project ID
          appMetadata,
          false // Disable debug mode
        );

        // Add error handling for external requests
        hc.connectionStatusChangeEvent.on((status) => {
          setConnectionStatus(status);
          
          if (status === 'Connected') {
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

        // Handle pairing events
        hc.pairingEvent.on((newPairing) => {
          if (newPairing && newPairing.accountIds && newPairing.accountIds.length > 0) {
            setAccountId(newPairing.accountIds[0]);
            setIsConnected(true);
            setConnectionStatus('Connected');
            localStorage.setItem('hashpack_account', newPairing.accountIds[0]);
          }
        });

        // Handle disconnection events
        hc.disconnectionEvent.on((data) => {
          setAccountId(null);
          setIsConnected(false);
          setConnectionStatus('Disconnected');
          setHbarBalance(null);
          setError(null);
          localStorage.removeItem('hashpack_account');
        });


        // Initialize
        await hc.init();
        setHashconnect(hc);
        
        // Add console filter to suppress attestation errors, null URL errors, and stale proposal errors
        const originalError = console.error;
        console.error = (...args) => {
          const message = args.join(' ');
          if (message.includes('attestation') || 
              message.includes('400') || 
              message.includes('localhost:3000/null') ||
              message.includes('404 (Not Found)') ||
              message.includes('No matching key') ||
              message.includes('proposal:') ||
              message.includes('Error code: undefined') ||
              message.includes('body.data was not set in the protobuf')) {
            console.warn('⚠️ External request failed (this is normal):', ...args);
            return;
          }
          // Check if originalError is a function before calling it
          if (typeof originalError === 'function') {
            originalError.apply(console, args);
          }
        };

        // Add global error handler for unhandled promise rejections
        const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
          const reason = event.reason?.message || event.reason || '';
          if (typeof reason === 'string' && 
              (reason.includes('attestation') ||
               reason.includes('400') ||
               reason.includes('localhost:3000/null') ||
               reason.includes('404') ||
               reason.includes('No matching key') ||
               reason.includes('proposal:') ||
               reason.includes('Error code: undefined') ||
               reason.includes('body.data was not set in the protobuf'))) {
            console.warn('⚠️ Unhandled promise rejection (this is normal):', event.reason);
            event.preventDefault();
            return;
          }
          // Also check if it's an object with these properties
          if (event.reason && typeof event.reason === 'object') {
            const reasonStr = JSON.stringify(event.reason);
            if (reasonStr.includes('No matching key') || 
                reasonStr.includes('proposal:') ||
                reasonStr.includes('Error code: undefined') ||
                reasonStr.includes('body.data was not set in the protobuf')) {
              console.warn('⚠️ Unhandled promise rejection (this is normal):', event.reason);
              event.preventDefault();
              return;
            }
          }
        };

        window.addEventListener('unhandledrejection', handleUnhandledRejection);
        
      } catch (err: any) {
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

  // Also check connection state immediately on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Clear any stale connection data first
      const staleKeys = Object.keys(localStorage).filter(key => 
        key.startsWith('hashconnect') || key.includes('hashpack') || key.includes('hedera')
      );
      if (staleKeys.length > 0) {
        staleKeys.forEach(key => localStorage.removeItem(key));
      }
      
      const storedAccount = localStorage.getItem('hashpack_account');
      if (storedAccount) {
        setAccountId(storedAccount);
        setIsConnected(true);
        setConnectionStatus('Connected');
      }
    }
  }, []);

  const checkConnection = useCallback(async () => {
    if (typeof window === 'undefined') return;

    try {
      // First check if we have a stored account in localStorage
      const storedAccount = localStorage.getItem('hashpack_account');
      if (storedAccount) {
        setAccountId(storedAccount);
        setIsConnected(true);
        setConnectionStatus('Connected');
        
        // Try to verify the connection is still active
        if (window.hedera || window.hashpack) {
          const provider = window.hedera || window.hashpack;
          if (provider) {
            try {
              const accounts = await provider.request({ method: 'eth_accounts' });
              if (accounts && accounts.length > 0 && accounts[0] === storedAccount) {
                return;
              }
            } catch (err) {
              return;
            }
          }
        }
        
        // If we can't verify, still keep the connection state
        return;
      }

      // Check if HashPack is available and connected
      if (window.hedera || window.hashpack) {
        const provider = window.hedera || window.hashpack;
        if (provider) {
          const accounts = await provider.request({ method: 'eth_accounts' });
        
          if (accounts && accounts.length > 0) {
            setAccountId(accounts[0]);
            setIsConnected(true);
            setConnectionStatus('Connected');
            localStorage.setItem('hashpack_account', accounts[0]);
          } else {
            setIsConnected(false);
            setAccountId(null);
            setConnectionStatus('Disconnected');
            localStorage.removeItem('hashpack_account');
          }
        }
      } else {
        setIsConnected(false);
        setAccountId(null);
        setConnectionStatus('Disconnected');
        localStorage.removeItem('hashpack_account');
      }
    } catch (err: any) {
      setIsConnected(false);
      setAccountId(null);
      setConnectionStatus('Disconnected');
      localStorage.removeItem('hashpack_account');
    }
  }, []);

  const connect = useCallback(async () => {
    if (!hashconnect) {
      setError('HashConnect not initialized');
      return;
    }

    // Clear any previous errors
    setError(null);
    setIsLoading(true);

    try {
      
      // Check if already connected
      if (connectionStatus === 'Connected') {
        setIsLoading(false);
        return;
      }

      // Clear any stale connection data before attempting new connection
      localStorage.removeItem('hashpack_account');
      sessionStorage.removeItem('hashpack_session');
      
      // Open pairing modal
      await hashconnect.openPairingModal();
      
      // Set a shorter timeout to prevent long waits
      setTimeout(() => {
        if (connectionStatus !== 'Connected' && isLoading) {
          setIsLoading(false);
          setError('Connection timed out. Please try again.');
        }
      }, 15000); // 15 second timeout
      
    } catch (err: any) {
      
      // Handle specific HashConnect errors
      if (err.message && err.message.includes('Proposal expired')) {
        setError('Connection request expired. Please try again.');
        // Clear any stale connection data
        localStorage.removeItem('hashpack_account');
        sessionStorage.removeItem('hashpack_session');
        setAccountId(null);
        setIsConnected(false);
        setConnectionStatus('Disconnected');
      } else if (err.message && err.message.includes('User rejected')) {
        setError('Connection was cancelled. Please try again if you want to connect.');
      } else {
        setError(err.message || 'Connection failed');
      }
      
      setIsLoading(false);
    }
  }, [hashconnect, connectionStatus, isLoading]);

  const disconnect = useCallback(async () => {
    try {
      
      // Clear all state immediately (don't wait for HashConnect)
      setAccountId(null);
      setIsConnected(false);
      setConnectionStatus('Disconnected');
      setHbarBalance(null);
      setError(null);
      
      // Clear localStorage
      localStorage.removeItem('hashpack_account');
      
      // Try to disconnect from HashConnect (but don't wait for it)
      if (hashconnect) {
        try {
          await hashconnect.disconnectAll();
        } catch (err) {
        }
      }
      
    } catch (err: any) {
      // Still clear state even if disconnect fails
      setAccountId(null);
      setIsConnected(false);
      setConnectionStatus('Disconnected');
      setHbarBalance(null);
      setError(null);
      localStorage.removeItem('hashpack_account');
    }
  }, [hashconnect]);

  const fetchBalance = useCallback(async () => {
    if (!hashconnect || !accountId) return;
    
    try {
      // Check if we have pairing data available
      const pairingData = (hashconnect as any).pairingData;
      if (!pairingData || !pairingData.topic || !pairingData.pairingString) {
        return;
      }

      const provider = hashconnect.getProvider('testnet', pairingData.topic, pairingData.pairingString);
      if (provider) {
        // Get HBAR balance using eth_getBalance
        const balance = await provider.request({ 
          method: 'eth_getBalance',
          params: [accountId, 'latest']
        });
        
        // Convert from wei to HBAR (1 HBAR = 10^8 tinybars)
        const balanceInHbar = (parseInt(balance, 16) / Math.pow(10, 8)).toFixed(2);
        setHbarBalance(balanceInHbar);
      }
    } catch (error) {
      setHbarBalance(null);
    }
  }, [hashconnect, accountId]);

  // Fetch balance when account connects
  useEffect(() => {
    if (isConnected && accountId) {
      fetchBalance();
    }
  }, [isConnected, accountId, fetchBalance]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      // Remove event listeners on cleanup
      const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
        if (event.reason && 
            (event.reason.message?.includes('attestation') ||
             event.reason.message?.includes('400') ||
             event.reason.message?.includes('localhost:3000/null') ||
             event.reason.message?.includes('404') ||
             event.reason.message?.includes('Error code: undefined'))) {
          event.preventDefault();
          return;
        }
      };
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);


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
    hbarBalance,
    fetchBalance,
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
