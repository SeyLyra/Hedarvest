"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Droplets, 
  CheckCircle,
  AlertCircle,
  Loader2
} from "lucide-react";
import { toast } from "sonner";

interface FaucetPageProps {
  userAddress: string;
  onBalanceUpdate?: () => void;
  hashconnect: any;
}

export default function FaucetPage({ userAddress, onBalanceUpdate, hashconnect }: FaucetPageProps) {
  const [amount, setAmount] = useState<string>("1000");
  const [isMinting, setIsMinting] = useState(false);
  const [lastMintTime, setLastMintTime] = useState<Date | null>(null);
  const [usdtBalance, setUsdtBalance] = useState<string>("0");
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [isTokenAssociated, setIsTokenAssociated] = useState(false);
  const [mintHistory, setMintHistory] = useState<Array<{
    id: string;
    amount: number;
    timestamp: Date;
    txHash: string;
  }>>([]);

  // Fetch USDT balance
  const fetchUsdtBalance = async () => {
    if (!userAddress) return;
    
    setIsLoadingBalance(true);
    try {
      const response = await fetch(`/api/faucet/balance/${userAddress}`);
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

  // Fetch balance on component mount
  useEffect(() => {
    if (userAddress) {
      fetchUsdtBalance();
      checkTokenAssociation();
    }
  }, [userAddress]);

  // Check if token is already associated
  const checkTokenAssociation = async () => {
    if (!userAddress) return;
    
    try {
      console.log('🔍 Checking token association for:', userAddress);
      const response = await fetch(`/api/faucet/balance/${userAddress}`);
      console.log('   Response status:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        const isAssociated = result.isAssociated === true;
        console.log('🔍 Token association result:', {
          address: userAddress,
          balance: result.balance,
          isAssociated: isAssociated,
          rawResult: result
        });
        setIsTokenAssociated(isAssociated);
        setUsdtBalance(result.balance || "0");
        
        if (isAssociated) {
          toast.success('✅ Token IS associated! You can mint now!', { duration: 3000 });
        } else {
          toast.warning('⚠️ Token NOT associated yet. Follow the instructions above.', { duration: 3000 });
        }
      } else {
        console.error('Balance fetch failed:', response.status);
        setIsTokenAssociated(false);
      }
    } catch (error) {
      console.error('Failed to check token association:', error);
      setIsTokenAssociated(false);
    }
  };

  // Open HashPack extension to tokens page
  const openHashPackForAssociation = () => {
    // Show instructions
    toast.info('👉 Click "Copy Token ID" button below, then follow the 6 simple steps!', { duration: 8000 });
    
    // Auto-copy token ID
    navigator.clipboard.writeText('0.0.6951126');
    toast.success('✅ Token ID copied! Now open HashPack and paste it in the Tokens tab!', { duration: 6000 });
  };

  const handleMint = async () => {
    const mintAmount = parseFloat(amount);
    
    if (!mintAmount || mintAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (mintAmount > 10000) {
      toast.error('Maximum mint amount is 10,000 USDT');
      return;
    }

    if (!userAddress) {
      toast.error('Please connect your wallet first');
      return;
    }

    // Check cooldown (5 minutes)
    if (lastMintTime && Date.now() - lastMintTime.getTime() < 5 * 60 * 1000) {
      const remainingTime = Math.ceil((5 * 60 * 1000 - (Date.now() - lastMintTime.getTime())) / 1000);
      toast.error(`Please wait ${remainingTime} seconds before minting again`);
      return;
    }

    // ✅ FIRST: Check association status by refreshing balance
    console.log('🔍 Checking token association before minting...');
    toast.info('Checking token association...', { duration: 2000 });
    await checkTokenAssociation();
    
    // Wait for state to update
    await new Promise(r => setTimeout(r, 500));
    
    // Now check if associated
    const response = await fetch(`/api/faucet/balance/${userAddress}`);
    if (response.ok) {
      const result = await response.json();
      if (!result.isAssociated) {
        console.log('❌ Token not associated');
        toast.error('⚠️ Token NOT associated! Please follow the instructions above.', { duration: 5000 });
        openHashPackForAssociation();
        return;
      }
    }

    // ✅ Token is associated, proceed with mint
    setIsMinting(true);
    
        try {
      
      console.log('🪙 Calling faucet API...', { address: userAddress, amount: mintAmount });
      
      // Call real faucet API that uses Hedera SDK
      const response = await fetch('/api/faucet/mint', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address: userAddress,
          amount: mintAmount,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Mint failed');
      }

      console.log('✅ Faucet mint successful:', result);
      
      // Update last mint time
      setLastMintTime(new Date());
      
      // Add to history
      const newMint = {
        id: Date.now().toString(),
        amount: mintAmount,
        timestamp: new Date(),
        txHash: result.transactionHash || result.transferTransactionId || 'pending'
      };
      setMintHistory(prev => [newMint, ...prev.slice(0, 9)]); // Keep last 10
      
      toast.success(`Successfully minted ${mintAmount} USDT to your wallet!`, {
        description: `Transaction: ${result.transactionHash?.substring(0, 20)}...`
      });
      
      // Refresh balance after successful mint
      setTimeout(() => {
        fetchUsdtBalance();
        if (onBalanceUpdate) onBalanceUpdate();
      }, 2000); // Wait 2 seconds for transaction to be confirmed
      
    } catch (error) {
      console.error('❌ Mint failed:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to mint USDT. Please try again.');
    } finally {
      setIsMinting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getCooldownTime = () => {
    if (!lastMintTime) return null;
    const remaining = 5 * 60 * 1000 - (Date.now() - lastMintTime.getTime());
    if (remaining <= 0) return null;
    return Math.ceil(remaining / 1000);
  };

  const cooldownTime = getCooldownTime();

  return (
    <div className="space-y-8">


      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-700 via-teal-600 to-green-700 dark:from-emerald-400 dark:via-teal-400 dark:to-green-500 bg-clip-text text-transparent">
            Test Token Faucet
          </h1>
          <p className="text-emerald-600/80 dark:text-emerald-300/70 text-lg">Get free USDT tokens for testing on Hedera testnet</p>
          <div className="flex items-center gap-2 mt-2">
            <div className="w-2 h-2 bg-emerald-400 dark:bg-emerald-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-emerald-600/80 dark:text-emerald-300/80 font-medium">Connected to Hedera Testnet</span>
          </div>
        </div>
      </div>

      {/* Wallet Info */}
      <Card className="bg-gradient-to-br from-emerald-50/70 to-teal-50/70 dark:from-emerald-500/10 dark:to-teal-500/10 border-emerald-200/50 dark:border-emerald-500/15 shadow-md">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Droplets className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
              <div>
                <p className="text-sm text-emerald-600/80 dark:text-emerald-300/80">Your Wallet Address</p>
                <p className="text-lg font-mono font-bold text-emerald-800 dark:text-emerald-200">
                  {userAddress || 'Not connected'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-teal-600/80 dark:text-teal-300/80">USDT Balance</p>
              <p className="text-2xl font-bold text-teal-800 dark:text-teal-200 font-mono flex items-center gap-2">
                {isLoadingBalance ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>💵 {usdtBalance}</>
                )}
              </p>
              <button
                onClick={fetchUsdtBalance}
                className="text-xs text-teal-600 dark:text-teal-400 hover:underline mt-1"
              >
                Refresh
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

          {/* Token Association Warning */}
          {!isTokenAssociated && (
            <Card className="bg-gradient-to-br from-red-50/90 to-orange-50/90 dark:from-red-900/30 dark:to-orange-900/30 border-red-400/60 dark:border-red-600/40 shadow-xl animate-pulse-slow">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 bg-red-100 dark:bg-red-800/40 rounded-xl flex items-center justify-center flex-shrink-0 animate-bounce">
                    <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-red-900 dark:text-red-200 mb-3 text-2xl">🚨 DO THIS FIRST - TAKES 10 SECONDS!</h3>
                    <p className="text-base text-red-800 dark:text-red-300 mb-4 font-semibold">
                      You MUST associate the USDT token in HashPack before you can mint. This is a ONE-TIME Hedera requirement.
                    </p>
                    <div className="bg-gradient-to-br from-red-500 to-orange-500 rounded-2xl p-6 shadow-2xl mb-4">
                      <p className="text-2xl text-white font-black mb-6 text-center animate-pulse">
                        👇 DO THIS NOW - ONLY 6 CLICKS! 👇
                      </p>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText('0.0.6951126');
                          toast.success('✅ STEP 1 DONE! Token ID copied!', { duration: 2000 });
                          setTimeout(() => {
                            toast.info('STEP 2: Open HashPack extension (look for icon in browser toolbar)', { duration: 3000 });
                            setTimeout(() => {
                              toast.info('STEP 3: Click "Tokens" tab in HashPack', { duration: 3000 });
                              setTimeout(() => {
                                toast.info('STEP 4: Click "+" button and paste (Ctrl+V or Cmd+V)', { duration: 3000 });
                                setTimeout(() => {
                                  toast.info('STEP 5: Click "Associate" and approve!', { duration: 3000 });
                                  setTimeout(() => {
                                    toast.success('STEP 6: Come back and click "Refresh" button above!', { duration: 5000 });
                                  }, 3000);
                                }, 3000);
                              }, 3000);
                            }, 3000);
                          }, 2000);
                        }}
                        className="w-full text-2xl bg-white hover:bg-gray-100 text-red-600 px-8 py-8 rounded-xl font-black transition-all hover:scale-105 shadow-2xl"
                      >
                        ✅ CLICK HERE TO START!
                        <div className="text-lg font-bold mt-3 text-orange-600">This copies 0.0.6951126 and shows you step-by-step what to do!</div>
                      </button>
                    </div>

                    <div className="bg-yellow-100/80 dark:bg-yellow-950/40 rounded-xl p-4 border-2 border-yellow-400 dark:border-yellow-700/50">
                      <p className="text-sm text-yellow-900 dark:text-yellow-200 font-bold mb-2 text-center">
                        ⚡ After you click the button above, follow the toast messages that appear!
                      </p>
                      <p className="text-xs text-yellow-800 dark:text-yellow-300 text-center">
                        Each toast will guide you through the next step. Takes 10 seconds total!
                      </p>
                    </div>
                    <p className="text-base text-red-700 dark:text-red-400 mt-4 font-black text-center bg-red-100 dark:bg-red-900/30 p-3 rounded-lg">
                      💡 ONE TIME = 10 SECONDS → Then mint UNLIMITED USDT forever!
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Success Message when Token is Associated */}
          {isTokenAssociated && (
            <Card className="bg-gradient-to-br from-green-50/90 to-emerald-50/90 dark:from-green-900/30 dark:to-emerald-900/30 border-green-400/60 dark:border-green-600/40 shadow-lg">
              <CardContent className="p-5">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-800/40 rounded-xl flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400 animate-pulse" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-green-900 dark:text-green-200 mb-1 text-xl">✅ Perfect! Token is Associated!</h3>
                    <p className="text-sm text-green-800 dark:text-green-300 font-medium">
                      You're all set! You can now mint USDT tokens using the form below. 🎉
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

      {/* Mint Form */}
      <Card className="bg-white/95 dark:bg-[#121a16]/90 backdrop-blur-sm border-emerald-200 dark:border-emerald-500/15 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-emerald-800 dark:text-emerald-200">
            <Droplets className="w-6 h-6" />
            Mint Test USDT Tokens
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-emerald-700 mb-2">
                Amount to Mint
              </label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                min="1"
                max="10000"
                className="text-lg"
              />
              <p className="text-xs text-gray-500 mt-1">
                Maximum: 10,000 USDT per transaction
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-emerald-700 mb-2">
                Quick Amounts
              </label>
              <div className="flex gap-2">
                {[100, 500, 1000, 5000].map((quickAmount) => (
                  <Button
                    key={quickAmount}
                    variant="outline"
                    size="sm"
                    onClick={() => setAmount(quickAmount.toString())}
                    className="text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                  >
                    {quickAmount}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Cooldown Warning */}
          {cooldownTime && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-yellow-600" />
                <span className="text-sm text-yellow-800">
                  Please wait {cooldownTime} seconds before minting again
                </span>
              </div>
            </div>
          )}

          {/* Mint Button */}
          <Button
            onClick={handleMint}
            disabled={isMinting || cooldownTime !== null}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white h-12 text-lg"
          >
            {isMinting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Minting...
              </>
            ) : (
              <>
                <Droplets className="w-5 h-5 mr-2" />
                Mint {formatCurrency(parseFloat(amount) || 0)} USDT
              </>
            )}
          </Button>

          {/* Info */}
          <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/15 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div className="text-sm text-blue-800 dark:text-blue-200">
                <p className="font-medium">Test Token Information:</p>
                <ul className="mt-1 space-y-1 text-xs text-blue-700 dark:text-blue-300">
                  <li>• Real Hedera testnet USDT tokens (Token ID: 0.0.6951126)</li>
                  <li>• Uses Hedera SDK for minting & transfer</li>
                  <li>• 5-minute cooldown between mints</li>
                  <li>• Maximum 10,000 USDT per transaction</li>
                  <li>• Free testnet tokens - no real value</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mint History */}
      {mintHistory.length > 0 && (
        <Card className="bg-white/95 dark:bg-[#121a16]/90 backdrop-blur-sm border-emerald-200 dark:border-emerald-500/15 shadow-md">
          <CardHeader>
            <CardTitle className="text-emerald-800 dark:text-emerald-200">Recent Mints</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {mintHistory.map((mint) => (
                <div
                  key={mint.id}
                  className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-emerald-800">
                        {formatCurrency(mint.amount)} USDT
                      </p>
                      <p className="text-xs text-emerald-600">
                        {formatTime(mint.timestamp)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-mono text-gray-500">
                      {mint.txHash.slice(0, 8)}...{mint.txHash.slice(-8)}
                    </p>
                    <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                      Confirmed
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

    </div>
  );
}
