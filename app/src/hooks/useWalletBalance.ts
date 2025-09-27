'use client';

import { useState, useEffect } from 'react';

interface WalletBalance {
  hbarBalance: string;
  usdtBalance: string;
  hbarBalanceFormatted: string;
  usdtBalanceFormatted: string;
  loading: boolean;
  error: string | null;
}

// Mock USDT contract address (deployed contract)
const MOCK_USDT_ADDRESS = '0xBefF2B9Eaa47d1892D211486Cf83c441409020e3';

// ERC20 ABI for balance checking
const ERC20_ABI = [
  {
    "constant": true,
    "inputs": [{"name": "_owner", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"name": "balance", "type": "uint256"}],
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "decimals",
    "outputs": [{"name": "", "type": "uint8"}],
    "type": "function"
  }
];

export const useWalletBalance = (address: string | null) => {
  const [balance, setBalance] = useState<WalletBalance>({
    hbarBalance: '0',
    usdtBalance: '0',
    hbarBalanceFormatted: '0',
    usdtBalanceFormatted: '0',
    loading: false,
    error: null
  });

  const fetchBalance = async () => {
    if (!address || !window.ethereum) {
      setBalance(prev => ({ ...prev, loading: false, error: 'No wallet connected' }));
      return;
    }

    setBalance(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Step 2: Get HBAR balance using eth_getBalance
      const hbarBalanceWei = await window.ethereum.request({
        method: 'eth_getBalance',
        params: [address, 'latest']
      });
      
      // Convert from wei to HBAR (divide by 1e18)
      const hbarBalanceBigInt = BigInt(hbarBalanceWei);
      const hbarBalanceFormatted = (Number(hbarBalanceBigInt) / 1e18).toFixed(4);

      // Step 3: Get USDT balance from deployed contract
      let usdtBalance = '0';
      let usdtBalanceFormatted = '0';
      
      try {
        // Create contract instance
        const usdtContract = new (window as any).ethers.Contract(
          MOCK_USDT_ADDRESS,
          ERC20_ABI,
          new (window as any).ethers.BrowserProvider(window.ethereum)
        );
        
        // Get balance and decimals
        const [usdtBalanceBigInt, decimals] = await Promise.all([
          usdtContract.balanceOf(address),
          usdtContract.decimals()
        ]);
        
        usdtBalance = usdtBalanceBigInt.toString();
        // Convert from smallest unit to human-readable format
        usdtBalanceFormatted = (Number(usdtBalanceBigInt) / Math.pow(10, decimals)).toFixed(2);
        
      } catch (usdtError) {
        console.warn('Failed to get USDT balance:', usdtError);
        // Continue with HBAR balance even if USDT fails
      }

      setBalance({
        hbarBalance: hbarBalanceBigInt.toString(),
        usdtBalance,
        hbarBalanceFormatted,
        usdtBalanceFormatted,
        loading: false,
        error: null
      });

    } catch (error) {
      console.error('Failed to fetch wallet balance:', error);
      setBalance(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch balance'
      }));
    }
  };

  useEffect(() => {
    if (address) {
      fetchBalance();
      
      // Step 6: Auto-refresh when account/network changes
      const handleAccountsChanged = () => {
        fetchBalance();
      };
      
      const handleChainChanged = () => {
        fetchBalance();
      };

      window.ethereum?.on('accountsChanged', handleAccountsChanged);
      window.ethereum?.on('chainChanged', handleChainChanged);

      return () => {
        window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum?.removeListener('chainChanged', handleChainChanged);
      };
    } else {
      setBalance({
        hbarBalance: '0',
        usdtBalance: '0',
        hbarBalanceFormatted: '0',
        usdtBalanceFormatted: '0',
        loading: false,
        error: null
      });
    }
  }, [address]);

  return {
    ...balance,
    refetch: fetchBalance
  };
};
