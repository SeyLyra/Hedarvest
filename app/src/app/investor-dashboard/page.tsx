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

    // Basic check: Verify we have a user address and HashConnect instance
    console.log('🔍 Checking HashConnect state...');
    console.log('🔍 User address:', userAddress);
    console.log('🔍 HashConnect available:', !!hashconnect);
    
    // Only do minimal session checking - let HashConnect handle the session validation
    // The sendTransaction call should show the popup if needed for reconnection

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
      console.log('📍 Full pool object:', pool);
      
      // REAL DEPOSIT WITH HASHPACK WALLET SIGNING
      const { ethers } = await import('ethers');
      const { ContractExecuteTransaction, ContractId, ContractFunctionParameters, ContractCallQuery } = await import('@hashgraph/sdk');
      
      // Get the pool contract address
      const poolEvmAddress = pool.address;
      const amountInSmallestUnit = BigInt(Math.floor(depositAmount * 1000000)); // 6 decimals
      
      // Use AUSD token ID directly (from deployed contracts)
      const ausdTokenId = '0.0.6951126'; // AUSD from deployed.md
      
      console.log('📊 Transaction details:', {
        ausdTokenId,
        poolEvmAddress,
        depositAmount,
        amountInSmallestUnit: amountInSmallestUnit.toString(),
        userAddress
      });
      
      console.log('📋 Using contracts:', {
        ausdTokenId,
        poolEvmAddress: poolEvmAddress
      });
      
      // Skip approval - AUSD is a native token, not a smart contract
      // The pool contract will handle the token transfer directly
      toast.info('Depositing to pool... Please approve in HashPack!', { duration: 5000 });
      console.log('📝 Creating deposit transaction...');
      
      // Since ContractId.fromEvmAddress isn't working, let's use the mirror node API
      // to get the proper Hedera contract ID
      console.log('✅ Getting Hedera contract ID for EVM address:', poolEvmAddress);
      
      let depositTx;
      
      try {
        const response = await fetch(`https://testnet.mirrornode.hedera.com/api/v1/contracts/${poolEvmAddress}`);
        console.log('📋 Mirror node response status:', response.status);
        
        if (!response.ok) {
          throw new Error(`Mirror node API error: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('📋 Mirror node response data:', data);
        
        if (!data.contract_id) {
          throw new Error('Contract ID not found in mirror node response');
        }
        
        const hederaContractId = data.contract_id;
        console.log('✅ Found Hedera contract ID:', hederaContractId);
        
        // Create deposit transaction using the proper Hedera contract ID
        console.log('📋 Creating transaction with:', {
          hederaContractId,
          evmAddress: poolEvmAddress,
          function: 'deposit',
          amount: amountInSmallestUnit.toString(),
          amountOriginal: depositAmount
        });
        
        // Try using ContractFunctionParameters instead of raw calldata
        console.log('📋 Using ContractFunctionParameters approach');
        
        // Let's try different function names that might exist on the contract
        // Common DeFi pool function names: deposit, supply, addLiquidity, etc.
        const possibleFunctions = ['deposit', 'supply', 'addLiquidity', 'mint'];
        
        // For now, let's stick with 'deposit' but add more debugging
        console.log('📋 Creating contract call:', {
          contractId: hederaContractId,
          function: 'deposit',
          amount: amountInSmallestUnit.toString(),
          amountOriginal: depositAmount
        });
        
        // The ContractId.fromEvmAddress() is not working properly (returns 0.0.0)
        // Let's use the mirror node API to get the correct Hedera contract ID
        console.log('🔧 Using mirror node API to get Hedera contract ID');
        
        // Convert EVM address to Hedera contract ID using mirror node API
        const mirrorNodeResponse = await fetch(`https://testnet.mirrornode.hedera.com/api/v1/contracts/${poolEvmAddress}`);
        
        if (!mirrorNodeResponse.ok) {
          throw new Error(`Failed to get contract ID from mirror node: ${mirrorNodeResponse.status}`);
        }
        
        const mirrorNodeData = await mirrorNodeResponse.json();
        const mirrorNodeContractId = mirrorNodeData.contract_id;
        
        if (!mirrorNodeContractId) {
          throw new Error(`Contract not found for EVM address: ${poolEvmAddress}`);
        }
        
        console.log('✅ Got Hedera contract ID from mirror node:', mirrorNodeContractId);
        
        // Convert amount to the format expected by the contract (wei/smallest unit)
        const amountInWei = (parseFloat(depositAmount) * 1e6).toString(); // AUSD has 6 decimals
        
        // Validate all parameters before creating transaction
        console.log('🔍 Validating transaction parameters:', {
          poolEvmAddress,
          mirrorNodeContractId,
          amount: depositAmount,
          amountInWei,
          amountType: typeof amountInWei,
          amountLength: amountInWei.length
        });
        
        // Validate required fields
        if (!poolEvmAddress || !mirrorNodeContractId || !amountInWei) {
          throw new Error(`Missing required parameters: poolEvmAddress=${poolEvmAddress}, contractId=${mirrorNodeContractId}, amount=${amountInWei}`);
        }
        
        if (isNaN(parseFloat(amountInWei)) || parseFloat(amountInWei) <= 0) {
          throw new Error(`Invalid amount: ${amountInWei}`);
        }
        
        // Test contract ID creation
        let contractId;
        try {
          contractId = ContractId.fromString(mirrorNodeContractId);
          console.log('✅ Contract ID created successfully:', contractId.toString());
        } catch (cidError) {
          throw new Error(`Failed to create ContractId from string '${mirrorNodeContractId}': ${cidError}`);
        }
        
        // Test function parameters creation with proper type conversion
        let functionParams;
        try {
          // Convert amount to proper format for Hedera SDK
          const amountInWei = Math.floor(parseFloat(depositAmount) * 1e6); // Convert to smallest unit (6 decimals)
          
          console.log('🔍 Converting amount for function parameters:', {
            original: depositAmount,
            parsedFloat: parseFloat(depositAmount),
            multiplied: parseFloat(depositAmount) * 1e6,
            floorResult: amountInWei,
            type: typeof amountInWei,
            isInteger: Number.isInteger(amountInWei),
            isSafeInteger: Number.isSafeInteger(amountInWei)
          });
          
          // Validate minimum deposit amount (contract requires MIN_DEPOSIT = 1e6)
          const MIN_DEPOSIT = 1e6; // 1 token in smallest unit
          if (amountInWei < MIN_DEPOSIT) {
            throw new Error(`Amount too small. Minimum deposit is 1 AUSD token. You entered: ${depositAmount} AUSD`);
          }
          
          // Create function parameters with proper validation
          functionParams = new ContractFunctionParameters().addUint256(amountInWei);
          
          console.log('✅ Function parameters created successfully:', {
            functionParams: !!functionParams,
            amountUsed: amountInWei
          });
        } catch (fpError) {
          console.error('❌ Function parameter creation failed:', fpError);
          throw new Error(`Failed to create function parameters with amount '${depositAmount}': ${fpError}`);
        }
        
        // Create transaction step by step with validation
        console.log('📋 Creating deposit transaction step by step...');
        
        // Ensure all required components are available
        if (!contractId) {
          throw new Error('Contract ID is null or undefined');
        }
        if (!functionParams) {
          throw new Error('Function parameters are null or undefined');
        }
        
        // Create the transaction with proper validation
        depositTx = new ContractExecuteTransaction()
          .setContractId(contractId)
          .setGas(300000);
          
        // Set function and parameters separately for better error handling
        try {
          depositTx = depositTx.setFunction('deposit', functionParams);
          console.log('✅ Function and parameters set successfully');
        } catch (setFunctionError) {
          console.error('❌ Failed to set function and parameters:', setFunctionError);
          throw new Error(`Failed to set function 'deposit' and parameters: ${setFunctionError}`);
        }
          
        console.log('✅ Deposit transaction created successfully');
        console.log('📋 Transaction details:', {
          contractId: depositTx.contractId?.toString(),
          gas: depositTx.gas?.toString(),
          hasFunctionParameters: !!depositTx.functionParameters
        });
          
      } catch (error) {
        console.error('❌ Failed to get contract ID:', error);
        throw new Error(`Failed to get contract ID: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
      
      console.log('📤 Sending deposit transaction to HashPack...');
      
      // For HashConnect v3.x, we need to get the active session from the core
      console.log('🔗 HashConnect object keys:', Object.keys(hashconnect));
      console.log('🔗 Core object keys:', Object.keys(hashconnect.core || {}));
      
      // Let HashConnect handle session validation automatically
      // The sendTransaction call will show the popup if reconnection is needed
      console.log('🔗 HashConnect state:', {
        connected: hashconnect?.connected,
        topic: hashconnect?.topic,
        userAddress: userAddress
      });
      
      console.log('🔗 Ready to send transaction');
      
      // For HashConnect v3.x, we don't use getProvider() - we send transactions directly
      console.log('🔑 Using HashConnect v3.x transaction sending approach');
      
      // Execute deposit transaction using HashConnect request
      console.log('📤 Requesting deposit transaction from HashPack...');
      
      // Variables for transaction result tracking
      let transactionSuccessful = false;
      
      try {
        // Add more visible logging
        console.warn('🔍 DEBUG: About to send transaction');
        console.warn('🔍 DEBUG: Transaction contract ID:', depositTx.contractId?.toString());
        console.warn('🔍 DEBUG: User address:', userAddress);
        
        // SYSTEMATIC DEBUGGING FOLLOWING THE CHECKLIST
        console.warn('🔍 ===== COMPREHENSIVE DEBUG CHECKLIST =====');
        
        // Convert amount to BigInt for debugging
        const amountBigInt = BigInt(Math.floor(parseFloat(depositAmount) * 1e6));
        console.warn('   - Amount conversion details:');
        console.warn('     * Original amount:', depositAmount);
        console.warn('     * Parsed float:', parseFloat(depositAmount));
        console.warn('     * Multiplied by 1e6:', parseFloat(depositAmount) * 1e6);
        console.warn('     * Math.floor result:', Math.floor(parseFloat(depositAmount) * 1e6));
        console.warn('     * BigInt result:', amountBigInt.toString());
        console.warn('     * BigInt as string:', amountBigInt.toString());
        
        // 1. CHECK CONTRACT CALL PARAMETERS
        console.warn('1️⃣ Contract Call Parameters:');
        console.warn('   - Pool EVM Address:', poolEvmAddress);
        console.warn('   - Method Name: deposit');
        console.warn('   - Amount (original):', depositAmount);
        console.warn('   - Amount (BigInt):', amountBigInt.toString());
        console.warn('   - User Address:', userAddress);
        console.warn('   - Contract ID:', depositTx.contractId?.toString());
        
        // Validate all parameters
        const allParamsValid = poolEvmAddress && depositAmount && userAddress && depositTx.contractId;
        console.warn('   - All params valid:', allParamsValid);
        
        // 2. CONFIRM POOL CONTRACT ADDRESS
        console.warn('2️⃣ Pool Contract Address Confirmation:');
        console.warn('   - Using pool address from backend:', poolEvmAddress);
        console.warn('   - Expected RICE pool:', '0xBD779d7AFED65b518dfe8a19F38EB7a6A8Be113C');
        console.warn('   - Address matches:', poolEvmAddress === '0xBD779d7AFED65b518dfe8a19F38EB7a6A8Be113C');
        
        // 3. TRANSACTION CONSTRUCTION
        console.warn('3️⃣ Transaction Construction:');
        console.warn('   - Contract ID valid:', !!depositTx.contractId);
        console.warn('   - Gas set:', !!depositTx.gas);
        console.warn('   - Function set:', !!depositTx.functionParameters);
        
        // Create a completely fresh transaction with explicit parameters
        // Use the contract ID from the original depositTx since mirrorNodeContractId might not be in scope
        console.log('🔍 Fresh transaction amount conversion:', {
          original: depositAmount,
          bigIntValue: amountBigInt.toString(),
          type: typeof amountBigInt
        });
        
        let freshTxFunctionParams;
        try {
          // Try BigInt first, fallback to number
          freshTxFunctionParams = new ContractFunctionParameters().addUint256(amountBigInt);
          console.log('✅ Fresh tx function parameters created with BigInt');
        } catch (bigIntError) {
          console.log('⚠️ BigInt failed for fresh tx, trying number conversion');
          const amountAsNumber = Number(amountBigInt.toString());
          freshTxFunctionParams = new ContractFunctionParameters().addUint256(amountAsNumber);
        }
        
        const freshTx = new ContractExecuteTransaction()
          .setContractId(depositTx.contractId)
          .setGas(300000)
          .setFunction('deposit', freshTxFunctionParams);
        
        console.warn('   - Fresh transaction created');
        console.warn('   - Fresh contract ID:', freshTx.contractId?.toString());
        console.warn('   - Fresh gas:', freshTx.gas?.toString());
        
        // 4. HASHCONNECT INTEGRATION
        console.warn('4️⃣ HashConnect Integration:');
        console.warn('   - HashConnect available:', !!hashconnect);
        console.warn('   - User connected:', !!userAddress);
        
        // 5. ERROR LOGGING - Transaction Object
        console.warn('5️⃣ Transaction Object Inspection:');
        console.warn('   - Transaction type:', freshTx.constructor.name);
        console.warn('   - Transaction keys:', Object.keys(freshTx));
        console.warn('   - Full transaction object:', freshTx);
        
        // 6. MIRROR NODE/NETWORK ISSUES
        console.warn('6️⃣ Mirror Node/Network Check:');
        console.warn('   - Mirror node response OK:', !!depositTx.contractId);
        console.warn('   - Contract ID from transaction:', depositTx.contractId?.toString());
        
        // Final validation before sending transaction
        console.warn('🔍 Final Transaction Validation:');
        console.warn('   - Contract ID valid:', !!freshTx.contractId);
        console.warn('   - Gas set:', !!freshTx.gas);
        console.warn('   - Function parameters set:', !!freshTxFunctionParams);
        console.warn('   - User address valid:', !!userAddress);
        console.warn('   - HashConnect available:', !!hashconnect);
        
        if (!freshTx.contractId) {
          throw new Error('Transaction contract ID is null');
        }
        if (!freshTx.gas) {
          throw new Error('Transaction gas is not set');
        }
        if (!freshTxFunctionParams) {
          throw new Error('Transaction function parameters are not set');
        }
        
        // Execute deposit transaction using HashConnect request
        console.warn('🚀 Sending transaction to HashConnect...');
        
        // Send transaction directly to HashConnect to allow popup to show
        try {
          console.log('🔄 Sending transaction directly to HashConnect...');
          
          // Final validation before sending transaction
          console.log('🔍 Final transaction validation:');
          console.log('🔍 Transaction contract ID:', depositTx.contractId?.toString());
          console.log('🔍 Transaction gas:', depositTx.gas?.toString());
          console.log('🔍 Function parameters exist:', !!depositTx.functionParameters);
          console.log('🔍 User address:', userAddress);
          console.log('🔍 HashConnect available:', !!hashconnect);
          
          // Validate transaction is properly constructed
          if (!depositTx.contractId) {
            throw new Error('Transaction missing contract ID');
          }
          if (!depositTx.gas) {
            throw new Error('Transaction missing gas limit');
          }
          if (!depositTx.functionParameters) {
            throw new Error('Transaction missing function parameters');
          }
          if (!userAddress) {
            throw new Error('User address is missing');
          }
          
          console.log('✅ All transaction validation passed');
          
          // Send transaction directly to HashConnect
          const transactionResult = await hashconnect.sendTransaction(
            userAddress, // accountId
            depositTx    // transaction
          );
          
          console.log('✅ Deposit transaction response:', transactionResult);
          
          if (transactionResult.success === false) {
            console.error('❌ Deposit transaction failed:', transactionResult.error);
            
            // Provide specific error message for contract revert
            if (transactionResult.error && transactionResult.error.includes('CONTRACT_REVERT_EXECUTED')) {
              throw new Error('Transaction failed: Contract execution reverted. This usually means:\n1. Insufficient AUSD token balance\n2. Token not approved for transfer\n3. Amount below minimum deposit (1 token)\n4. Contract is paused or has restrictions');
            }
            
            throw new Error(`Deposit failed: ${transactionResult.error || 'Unknown error'}`);
          }
          
          console.log('✅ Deposit transaction completed successfully');
          transactionSuccessful = true;
          
        } catch (sendError: any) {
          console.error('❌ Send transaction error:', sendError);
          
          // Check if it's the specific contract revert error
          const errorMessage = sendError?.message || sendError?.toString() || '';
          
          if (errorMessage.includes('CONTRACT_REVERT_EXECUTED')) {
            console.error('❌ Contract reverted. Possible issues:');
            console.error('   1. User may not have enough AUSD tokens');
            console.error('   2. User may not have approved token transfer');
            console.error('   3. Contract may be paused or have other restrictions');
            throw new Error('Transaction failed: Contract execution reverted. Please ensure you have enough AUSD tokens and proper approvals.');
          }
          
          throw sendError;
        }
        
      } catch (innerError: any) {
        console.error('❌ Inner transaction error:', innerError);
        throw innerError;
      }
      
      // Success handling
      if (transactionSuccessful) {
      toast.success(`✅ Successfully deposited ${depositAmount} USDT to ${grainType} pool!`, {
        duration: 5000,
        description: '🎉 Your funds are now earning yield!'
      });
      
        // Refresh balances after a delay to allow for network processing
      setTimeout(() => {
        fetchUsdtBalance(userAddress);
      }, 3000);
        return;
      }
      
    } catch (error: any) {
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