import { useState, useCallback } from 'react';
import { ManualHashPack } from '@/lib/manual-hashpack';

export function useManualHashPack() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'connected' | 'error'>('idle');
  const [account, setAccount] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const connect = useCallback(async (): Promise<string> => {
    setStatus('loading');
    setError(null);

    try {
      const hashPack = new ManualHashPack();
      const accountId = await hashPack.connect();
      
      setStatus('connected');
      setAccount(accountId);
      
      // Redirect on success
      setTimeout(() => {
        window.location.href = '/dashboard/investor';
      }, 2000);
      
      return accountId;
    } catch (err: any) {
      setStatus('error');
      setError(err.message);
      throw err;
    }
  }, []);

  const disconnect = useCallback(() => {
    const hashPack = new ManualHashPack();
    hashPack.disconnect();
    setStatus('idle');
    setAccount(null);
    setError(null);
  }, []);

  const checkConnection = useCallback(() => {
    const hashPack = new ManualHashPack();
    const isConnected = hashPack.isConnected();
    if (isConnected) {
      setStatus('connected');
      setAccount(hashPack.getAccount());
    }
    return isConnected;
  }, []);

  return {
    connect,
    disconnect,
    checkConnection,
    status,
    account,
    error,
    isLoading: status === 'loading',
    isConnected: status === 'connected'
  };
}
