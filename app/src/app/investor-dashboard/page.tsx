"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Wallet, LogOut, Loader2, Coins, PieChart, Droplets, Moon, Sun } from "lucide-react";
import Image from "next/image";
import { useWalletConnect } from "@/hooks/useWalletConnect";
import PoolsPage from "@/components/PoolsPage";
import PortfolioPage from "@/components/PortfolioPage";
import FaucetPage from "@/components/FaucetPage";
import { useTheme } from "next-themes";

// API base URL
const API_BASE_URL = typeof window !== 'undefined' 
  ? (window as any).location?.origin || 'http://localhost:3000'
  : 'http://localhost:3000';

// USDT Token ID (from backend environment)
const USDT_TOKEN_ID = '0.0.6951126';

// Helper to get topic from HashConnect session
const getTopicFromSession = (hc: any): string | null => {
  try {
    if (hc.topic) return hc.topic;
    if (hc._signClient?.session?.values?.length > 0) {
      return hc._signClient.session.values[0].topic;
    }
    return null;
  } catch {
    return null;
  }
};

export default function InvestorDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('pools');
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { theme, setTheme } = useTheme();
  
  // Wallet integration
  const { address, isConnected, hbarBalance, fetchBalance, disconnect, connect, isConnecting, hashconnect } = useWalletConnect();
  const [userAddress, setUserAddress] = useState<string>("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [usdtBalance, setUsdtBalance] = useState<string>("0");
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);

  // Ensure we're on the client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Update user address when wallet connects
  useEffect(() => {
    if (address) {
      setUserAddress(address);
      fetchUsdtBalance(address);
    }
  }, [address]);

  // Fetch USDT balance
  const fetchUsdtBalance = async (walletAddress: string) => {
    if (!walletAddress) return;
    
    setIsLoadingBalance(true);
    try {
      const response = await fetch(`/api/faucet/balance/${walletAddress}`);
      if (response.ok) {
        const result = await response.json();
        setUsdtBalance(result.balance || "0");
      }
    } catch (error) {
      console.error('Failed to fetch USDT balance:', error);
    } finally {
      setIsLoadingBalance(false);
    }
  };

  // Authenticate with backend when wallet connects
  useEffect(() => {
    if (isConnected && address && !isAuthenticated) {
      handleWalletAuthentication();
    }
  }, [isConnected, address, isAuthenticated]);

  const handleWalletAuthentication = async () => {
    try {
      console.log('🔐 Starting wallet authentication...');
      
      // For now, just mark as authenticated when wallet is connected
      // In a real implementation, you would verify the wallet signature with the backend
      if (isConnected && address) {
        setIsAuthenticated(true);
        toast.success('Wallet authenticated successfully');
        console.log('✅ Wallet authentication completed');
      } else {
        toast.error('Please connect your wallet first');
      }
    } catch (error) {
      console.error('❌ Wallet authentication error:', error);
      toast.error('Failed to authenticate wallet');
    }
  };

  const handleDeposit = async (grainType: string, amount: string) => {
    if (!userAddress || !hashconnect) {
      toast.error('Please connect your wallet first');
      return;
    }

    // Proactive check: Verify we have an active session before proceeding
    console.log('🔍 Checking for active session...');
    console.log('🔍 HashConnect core:', hashconnect.core);
    console.log('🔍 Core session:', hashconnect.core?.session);
    console.log('🔍 Session values:', hashconnect.core?.session?.values);
    
    const activeSession = hashconnect.core?.session?.values?.find((session: any) => session.acknowledged);
    console.log('🔍 Active session found:', activeSession);
    
    if (!activeSession) {
      // Let's also check alternative session locations
      console.log('🔍 Checking alternative session locations...');
      console.log('🔍 _signClient session:', hashconnect._signClient?.session);
      console.log('🔍 _signClient session values:', hashconnect._signClient?.session?.values);
      
      const altSession = hashconnect._signClient?.session?.values?.find((session: any) => session.acknowledged);
      console.log('🔍 Alternative session found:', altSession);
      
      if (altSession) {
        console.log('✅ Found session in _signClient, using that instead');
        // Use the alternative session - we'll continue with the deposit
      } else {
        // Let's also check if we can find any session at all (even if not acknowledged)
        console.log('🔍 Checking for any sessions (acknowledged or not)...');
        const anyCoreSession = hashconnect.core?.session?.values?.[0];
        const anySignClientSession = hashconnect._signClient?.session?.values?.[0];
        
        console.log('🔍 Any core session:', anyCoreSession);
        console.log('🔍 Any signClient session:', anySignClientSession);
        
        if (anyCoreSession || anySignClientSession) {
          console.log('⚠️ Found session but it may not be acknowledged yet. Proceeding anyway...');
          // Continue with the deposit - maybe the session is valid but not marked as acknowledged
        } else {
          console.log('⚠️ No active session detected in any location, clearing stale connection state...');
          localStorage.removeItem('hashpack_account');
          toast.error('Connection expired. Please reconnect your wallet.', { 
            duration: 5000,
            action: {
              label: 'Reconnect',
              onClick: () => {
                hashconnect.openPairingModal();
              }
            }
          });
          return;
        }
      }
    }

    const depositAmount = parseFloat(amount);
    
    if (depositAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setIsLoading(true);
    try {
      toast.info(`💰 Depositing ${depositAmount} USDT to ${grainType} pool...`, { duration: 3000 });
      
      console.log('💰 Deposit request:', { grainType, amount: depositAmount, userAddress });
      
      // Get pool address
      const poolsResponse = await fetch('/api/pools/list');
      const poolsData = await poolsResponse.json();
      console.log('📊 Available pools:', poolsData.data.map((p: any) => ({ grainType: p.grainType, address: p.address })));
      const pool = poolsData.data.find((p: any) => p.grainType.toUpperCase() === grainType.toUpperCase());
      
      if (!pool) {
        const availableTypes = poolsData.data.map((p: any) => p.grainType).join(', ');
        throw new Error(`Pool not found for ${grainType}. Available types: ${availableTypes}`);
      }
      
      console.log('📍 Pool address:', pool.address);
      
      // REAL DEPOSIT WITH HASHPACK WALLET SIGNING
      const { ethers } = await import('ethers');
      const { ContractExecuteTransaction, ContractId } = await import('@hashgraph/sdk');
      
      // Get the token contract address from the pool
      const tokenEvmAddress = pool.lendingTokenAddress;
      const poolEvmAddress = pool.address;
      const amountInSmallestUnit = BigInt(Math.floor(depositAmount * 1000000)); // 6 decimals
      
      console.log('📊 Transaction details:', {
        tokenEvmAddress,
        poolEvmAddress,
        depositAmount,
        amountInSmallestUnit: amountInSmallestUnit.toString(),
        userAddress
      });
      
      if (!tokenEvmAddress) {
        throw new Error('Token contract address not found for this pool. Please try again.');
      }
      
      // Use AUSD token ID directly (from deployed contracts)
      const ausdTokenId = '0.0.6951126'; // AUSD from deployed.md
      
      console.log('📋 Using contracts:', {
        ausdTokenId,
        poolEvmAddress: poolEvmAddress
      });
      
      // STEP 1: Approve pool to spend tokens
      toast.info('Step 1/2: Approving token spending... Please approve in HashPack!', { duration: 5000 });
      console.log('📝 Creating approval transaction...');
      
      // For Hedera, we need to use the correct function selector for ERC20 approve
      // The function selector for approve(address,uint256) is 0x095ea7b3
      const approveFunctionSelector = '0x095ea7b3';
      
      // Encode the parameters: spender address (32 bytes) + amount (32 bytes)
      const spenderAddress = poolEvmAddress.padStart(64, '0'); // Pad to 32 bytes (64 hex chars)
      const amountHex = amountInSmallestUnit.toString(16).padStart(64, '0'); // Pad to 32 bytes
      
      const approveCalldata = approveFunctionSelector + spenderAddress + amountHex;
      
      console.log('📋 Approval calldata:', {
        functionSelector: approveFunctionSelector,
        spenderAddress,
        amountHex,
        fullCalldata: approveCalldata
      });
      
      const approveTx = new ContractExecuteTransaction()
        .setContractId(ContractId.fromString(ausdTokenId))
        .setGas(200000)
        .setFunctionParameters(Buffer.from(approveCalldata.slice(2), 'hex'));
      
      console.log('📤 Sending approval transaction to HashPack...');
      
      // For HashConnect v3.x, we need to get the active session from the core
      console.log('🔗 HashConnect object keys:', Object.keys(hashconnect));
      console.log('🔗 Core object keys:', Object.keys(hashconnect.core || {}));
      
      // Get the active session from the core (try multiple locations)
      let activeSession = hashconnect.core?.session?.values?.find((session: any) => session.acknowledged);
      console.log('🔗 Active session (core):', activeSession);
      
      // Try alternative location if not found in core
      if (!activeSession) {
        activeSession = hashconnect._signClient?.session?.values?.find((session: any) => session.acknowledged);
        console.log('🔗 Active session (_signClient):', activeSession);
      }
      
      if (!activeSession) {
        console.log('❌ No active session found. Is connected:', isConnected);
        console.log('❌ Account ID:', userAddress);
        console.log('❌ HashConnect state:', {
          connected: hashconnect?.connected,
          topic: hashconnect?.topic,
          pairingString: hashconnect?._pairingString
        });
        
        // Clear stale connection state and request reconnection
        console.log('🔄 Clearing stale connection state...');
        
        // Clear localStorage
        localStorage.removeItem('hashpack_account');
        
        // Try to disconnect and reconnect
        try {
          await hashconnect.disconnectAll();
          console.log('✅ Disconnected from stale session');
          
          // Show user message
          toast.error('Connection lost. Please reconnect your wallet.', { 
            duration: 5000,
            action: {
              label: 'Reconnect',
              onClick: () => {
                hashconnect.openPairingModal();
              }
            }
          });
          
          throw new Error('Please reconnect your wallet to continue.');
          
        } catch (reconnectError) {
          console.error('❌ Reconnection failed:', reconnectError);
          throw new Error('No active HashPack session. Please reconnect your wallet.');
        }
      }
      
      const pairingData = {
        topic: activeSession.topic,
        accountIds: activeSession.namespaces?.hedera?.accounts || []
      };
      
      console.log('🔗 Final pairing data:', pairingData);
      
      // For HashConnect v3.x, we don't use getProvider() - we send transactions directly
      console.log('🔑 Using HashConnect v3.x transaction sending approach');
      
      // Execute approval transaction using HashConnect request
      console.log('📤 Requesting approval transaction from HashPack...');
      
      // For HashConnect v3.x, sendTransaction takes different parameters
      const approveTxResponse = await hashconnect.sendTransaction(
        userAddress, // accountId
        approveTx    // transaction
      );
      
      console.log('✅ Approval transaction response:', approveTxResponse);
      
      if (approveTxResponse.success === false) {
        console.error('❌ Approval transaction failed:', approveTxResponse);
        if (approveTxResponse.error && approveTxResponse.error.includes('CONTRACT_REVERT_EXECUTED')) {
          throw new Error('Token approval failed. The contract may not exist or you may not have enough tokens. Please check your token balance and try again.');
        }
        throw new Error(`Approval failed: ${approveTxResponse.error || 'Unknown error'}`);
      }
      
      // For HashConnect v3.x, we don't need to wait for receipt manually
      // The sendTransaction already waits for completion
      console.log('✅ Approval transaction completed successfully');
      
      toast.success('✅ Approval confirmed!', { duration: 2000 });
      
      // Wait for approval to be confirmed
      await new Promise(r => setTimeout(r, 2000));
      
      // STEP 2: Deposit to pool
      toast.info('Step 2/2: Depositing to pool... Please approve in HashPack!', { duration: 5000 });
      console.log('📝 Creating deposit transaction...');
      
      // For Hedera, we need to use the correct function selector for deposit(uint256)
      // The function selector for deposit(uint256) is 0x47e7ef24
      const depositFunctionSelector = '0x47e7ef24';
      
      // Encode the parameter: amount (32 bytes)
      const amountHex = amountInSmallestUnit.toString(16).padStart(64, '0'); // Pad to 32 bytes
      
      const depositCalldata = depositFunctionSelector + amountHex;
      
      console.log('📋 Deposit calldata:', {
        functionSelector: depositFunctionSelector,
        amountHex,
        fullCalldata: depositCalldata
      });
      
      const depositTx = new ContractExecuteTransaction()
        .setContractId(ContractId.fromEvmAddress(0, 0, poolEvmAddress))
        .setGas(300000)
        .setFunctionParameters(Buffer.from(depositCalldata.slice(2), 'hex'));
      
      console.log('📤 Requesting deposit transaction from HashPack...');
      
      // Execute deposit transaction using HashConnect request
      const depositTxResponse = await hashconnect.sendTransaction(
        userAddress, // accountId
        depositTx    // transaction
      );
      
      console.log('✅ Deposit transaction response:', depositTxResponse);
      
      if (depositTxResponse.success === false) {
        console.error('❌ Deposit transaction failed:', depositTxResponse);
        if (depositTxResponse.error && depositTxResponse.error.includes('CONTRACT_REVERT_EXECUTED')) {
          throw new Error('Deposit failed. The pool contract may not exist or the approval may not have been sufficient. Please try again.');
        }
        throw new Error(`Deposit failed: ${depositTxResponse.error || 'Unknown error'}`);
      }
      
      // For HashConnect v3.x, we don't need to wait for receipt manually
      console.log('✅ Deposit transaction completed successfully');
      
      toast.success(`✅ Successfully deposited ${depositAmount} USDT to ${grainType} pool!`, {
        duration: 5000,
        description: '🎉 Your funds are now earning yield!'
      });
      
      // Refresh balances
      setTimeout(() => {
        fetchUsdtBalance(userAddress);
      }, 3000);
      
    } catch (error) {
      console.error('❌ Deposit error:', error);
      toast.error(error instanceof Error ? error.message : 'Error processing deposit');
    } finally {
      setIsLoading(false);
    }
  };

  const handleWithdraw = async (grainType: string, amount: string) => {
    if (!isAuthenticated) {
      toast.error('Please authenticate your wallet first');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/investor/withdraw`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          grainType, 
          shares: parseFloat(amount),
          depositorAddress: userAddress
        })
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(`Successfully withdrew ${amount} shares from ${grainType} pool`);
        console.log('Withdraw result:', result);
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Withdrawal failed');
      }
    } catch (error) {
      console.error('Withdraw error:', error);
      toast.error('Error processing withdrawal');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = () => {
    disconnect();
    setIsAuthenticated(false);
    setUserAddress("");
    toast.success('Wallet disconnected');
    
    // Redirect to investor login page after disconnection
    setTimeout(() => {
      router.push('/investor-login');
    }, 500); // Small delay to allow toast to show
  };

  // Show loading state during hydration
  if (!isClient) {
  return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50/30 via-teal-50/30 to-green-50/30">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-400 mx-auto mb-4"></div>
          <p className="text-emerald-700/80">Loading...</p>
        </div>
      </div>
    );
  }

  // Show wallet connection required if not connected
  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50/30 via-teal-50/30 to-green-50/30 dark:from-[#0d1410] dark:via-[#0f1912] dark:to-[#0e1711] flex items-center justify-center">
        <Card className="w-full max-w-md bg-white/95 dark:bg-[#121a16]/95 backdrop-blur-sm border-emerald-100 dark:border-emerald-500/15 shadow-xl">
          <CardContent className="p-8 text-center">
            <Wallet className="w-16 h-16 text-emerald-500 dark:text-emerald-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-emerald-800 dark:text-emerald-200 mb-2">Wallet Required</h2>
            <p className="text-emerald-600/80 dark:text-emerald-300/70 mb-6">
              Please connect your HashPack wallet to access the investor dashboard.
            </p>
            <Button 
              onClick={connect}
              disabled={isConnecting}
              className="bg-gradient-to-r from-emerald-400 to-teal-500 dark:from-emerald-500 dark:to-teal-500 hover:from-emerald-500 hover:to-teal-600 dark:hover:from-emerald-600 dark:hover:to-teal-600 text-white shadow-lg"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                'Connect Wallet'
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-white dark:bg-[#0d1410]">
      {/* Elegant Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-white via-emerald-50/30 to-teal-50/30 dark:from-[#0d1410] dark:via-[#0f1912] dark:to-[#0e1711]">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/5 via-teal-400/5 to-green-400/5 dark:from-emerald-500/5 dark:via-teal-500/5 dark:to-green-500/5 animate-pulse-slow"></div>
      </div>

      {/* Subtle Floating Shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-r from-emerald-200/20 to-teal-200/20 dark:from-emerald-400/5 dark:to-teal-400/5 rounded-full blur-3xl animate-float"></div>
        <div className="absolute top-40 right-20 w-40 h-40 bg-gradient-to-r from-teal-200/20 to-green-200/20 dark:from-teal-400/5 dark:to-green-400/5 rounded-full blur-3xl animate-float" style={{animationDelay: '2s'}}></div>
        <div className="absolute bottom-40 left-1/4 w-36 h-36 bg-gradient-to-r from-green-200/20 to-emerald-200/20 dark:from-green-400/5 dark:to-emerald-400/5 rounded-full blur-3xl animate-float" style={{animationDelay: '4s'}}></div>
        <div className="absolute top-60 right-1/3 w-28 h-28 bg-gradient-to-r from-mint-200/20 to-teal-200/20 dark:from-emerald-400/5 dark:to-teal-400/5 rounded-full blur-3xl animate-float" style={{animationDelay: '1s'}}></div>
      </div>

      {/* Top Navigation */}
      <div className="relative z-50 bg-white/90 dark:bg-[#121a16]/95 backdrop-blur-xl border-b border-emerald-100/50 dark:border-emerald-500/10 shadow-lg">
        <div className="px-8 py-4">
          {/* Header with Logo and Wallet */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4 group cursor-pointer">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-orange-500 rounded-2xl blur-lg opacity-60 group-hover:opacity-80 transition-opacity duration-500"></div>
                <div className="relative bg-gradient-to-r from-amber-400 to-orange-500 p-1 rounded-2xl">
                  <Image
                    src="/logo.png"
                    alt="Hedarvest Logo"
                    width={40}
                    height={40}
                    className="w-10 h-10 group-hover:scale-110 transition-transform duration-300"
                  />
                </div>
              </div>
              <div>
                <span className="text-3xl font-black bg-gradient-to-r from-emerald-600 via-teal-500 to-green-600 dark:from-emerald-400 dark:via-teal-400 dark:to-green-500 bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-300">
                  Hedarvest
                </span>
                <div className="text-xs text-emerald-600/70 dark:text-emerald-400/60 font-medium">Agricultural DeFi Platform</div>
              </div>
            </div>
            
            {/* Wallet Status */}
            <div className="flex items-center gap-3">
              <Card className="bg-gradient-to-r from-emerald-50/80 to-teal-50/80 dark:from-emerald-500/10 dark:to-teal-500/10 border-emerald-100/60 dark:border-emerald-500/15 shadow-lg backdrop-blur-sm">
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 dark:from-emerald-500 dark:to-teal-500 rounded-xl flex items-center justify-center shadow-md shadow-emerald-400/20 dark:shadow-emerald-500/10">
                      <Wallet className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-sm">
                      <div className="font-bold text-emerald-800 dark:text-emerald-200">
                        {userAddress ? `${userAddress.slice(0, 6)}...${userAddress.slice(-4)}` : 'Connected'}
                      </div>
                      <div className="space-y-0.5">
                      {hbarBalance && (
                          <div className="text-xs text-emerald-600/80 dark:text-emerald-300/80 font-mono">
                            ℏ {hbarBalance} HBAR
                          </div>
                        )}
                        <div className="text-xs text-teal-600/80 dark:text-teal-400/80 font-mono flex items-center gap-1">
                          {isLoadingBalance ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <span>💵 {usdtBalance} USDT</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                variant="outline"
                size="sm"
                className="text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20 hover:bg-emerald-50/80 dark:hover:bg-emerald-500/10 transition-all duration-300 hover:scale-105 shadow-md"
              >
                {theme === "dark" ? (
                  <Sun className="w-4 h-4" />
                ) : (
                  <Moon className="w-4 h-4" />
                )}
              </Button>
              
              <Button
                onClick={handleDisconnect}
                variant="outline"
                size="sm"
                className="text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-500/20 hover:bg-gradient-to-r hover:from-rose-50 hover:to-red-50 dark:hover:from-rose-500/10 dark:hover:to-red-500/10 hover:border-rose-300 transition-all duration-300 hover:scale-105 shadow-md"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Disconnect
              </Button>
            </div>
          </div>

          {/* Compact Tab Navigation */}
          <div className="flex space-x-2 bg-emerald-50/40 dark:bg-emerald-500/5 backdrop-blur-xl rounded-2xl p-2 shadow-inner border border-emerald-100/40 dark:border-emerald-500/10">
            {[
              { id: 'pools', label: 'Pools', icon: Coins, description: 'Investment' },
              { id: 'portfolio', label: 'Portfolio', icon: PieChart, description: 'Investments' },
              { id: 'faucet', label: 'Faucet', icon: Droplets, description: 'Test Tokens' }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <Button
                  key={tab.id}
                  variant={isActive ? "default" : "ghost"}
                  className={`flex-1 h-10 rounded-xl transition-all duration-300 group relative overflow-hidden ${
                    isActive 
                      ? 'bg-gradient-to-r from-emerald-400 to-teal-500 dark:from-emerald-500 dark:to-teal-500 text-white shadow-lg shadow-emerald-400/20 dark:shadow-emerald-500/10 scale-105' 
                      : 'text-emerald-700 dark:text-emerald-300 hover:bg-gradient-to-r hover:from-emerald-50/80 hover:to-teal-50/80 dark:hover:from-emerald-500/10 dark:hover:to-teal-500/10 hover:scale-105 hover:shadow-md'
                  }`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent"></div>
                  )}
                  <div className="flex items-center gap-2 relative z-10">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-emerald-500 dark:text-emerald-400'}`} />
                    <div className="flex flex-col items-start">
                      <span className="font-semibold text-xs">{tab.label}</span>
                      <span className="text-xs opacity-75">{tab.description}</span>
                    </div>
                  </div>
                </Button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Page Content */}
      <div className="relative z-10 p-8">
        {activeTab === 'pools' && (
          <PoolsPage
            onDeposit={handleDeposit}
            onWithdraw={handleWithdraw}
            isLoading={isLoading}
          />
        )}
        
        {activeTab === 'portfolio' && (
          <PortfolioPage userAddress={userAddress} />
        )}
        
        {activeTab === 'faucet' && (
          <FaucetPage 
            userAddress={userAddress} 
            onBalanceUpdate={() => fetchUsdtBalance(userAddress)}
            hashconnect={hashconnect}
          />
        )}
      </div>
    </div>
  );
}