"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Droplets, 
  CheckCircle,
  Loader2,
  Copy,
  ExternalLink
} from "lucide-react";
import { toast } from "sonner";

export default function FaucetRoute() {
  const [address, setAddress] = useState("");
  const [amount, setAmount] = useState("1000");
  const [isMinting, setIsMinting] = useState(false);
  const [lastMintTime, setLastMintTime] = useState<Date | null>(null);
  const [mintHistory, setMintHistory] = useState<Array<{
    id: string;
    address: string;
    amount: number;
    timestamp: Date;
    txHash: string;
  }>>([]);

  const handleMint = async () => {
    const mintAmount = parseFloat(amount);
    
    if (!mintAmount || mintAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (mintAmount > 10000) {
      toast.error('Maximum mint amount is 10,000 USDC');
      return;
    }

    if (!address || !address.startsWith('0.0.')) {
      toast.error('Please enter a valid Hedera address (format: 0.0.xxxxxxx)');
      return;
    }

    // Check cooldown (5 minutes)
    if (lastMintTime && Date.now() - lastMintTime.getTime() < 5 * 60 * 1000) {
      const remainingTime = Math.ceil((5 * 60 * 1000 - (Date.now() - lastMintTime.getTime())) / 1000);
      toast.error(`Please wait ${remainingTime} seconds before minting again`);
      return;
    }

    setIsMinting(true);
    
    try {
      // Call real faucet API
      const response = await fetch('/api/faucet/mint', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address: address,
          amount: mintAmount,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || result.error || 'Mint failed');
      }

      // Update last mint time
      setLastMintTime(new Date());
      
      // Add to history
      const newMint = {
        id: Date.now().toString(),
        address: address,
        amount: mintAmount,
        timestamp: new Date(),
        txHash: result.transactionHash || result.transferTransactionId || 'pending'
      };
      setMintHistory(prev => [newMint, ...prev.slice(0, 9)]); // Keep last 10
      
      toast.success(`Successfully minted ${mintAmount} USDC to ${address}!`, {
        description: `Transaction: ${result.transactionHash?.substring(0, 20)}...`
      });
      
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to mint USDC. Please try again.');
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
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-green-50 dark:from-emerald-950 dark:via-teal-950 dark:to-green-950">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-700 via-teal-600 to-green-700 dark:from-emerald-400 dark:via-teal-400 dark:to-green-500 bg-clip-text text-transparent mb-4">
              Test Token Faucet
            </h1>
            <p className="text-xl text-emerald-600/80 dark:text-emerald-300/70 mb-6">
              Get free USDC tokens for testing on Hedera testnet
            </p>
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-emerald-400 dark:bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-emerald-600/80 dark:text-emerald-300/80 font-medium">Connected to Hedera Testnet</span>
            </div>
          </div>

          {/* Token Info */}
          <Card className="bg-gradient-to-br from-emerald-50/70 to-teal-50/70 dark:from-emerald-500/10 dark:to-teal-500/10 border-emerald-200/50 dark:border-emerald-500/15 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Droplets className="w-6 h-6 text-emerald-500 dark:text-emerald-400" />
                  <div>
                    <h3 className="text-lg font-bold text-emerald-800 dark:text-emerald-200">USDC Test Token</h3>
                    <p className="text-sm text-emerald-600/80 dark:text-emerald-300/80">Token ID: 0.0.7115536</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText('0.0.7115536');
                    toast.success('Token ID copied to clipboard!');
                  }}
                  className="text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Token ID
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Mint Form */}
          <Card className="bg-white/95 dark:bg-[#121a16]/90 backdrop-blur-sm border-emerald-200 dark:border-emerald-500/15 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-emerald-800 dark:text-emerald-200">
                <Droplets className="w-6 h-6" />
                Mint Test USDC Tokens
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="block text-sm font-medium text-emerald-700 mb-2">
                    Hedera Address
                  </Label>
                  <Input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="0.0.1234567"
                    className="text-lg font-mono"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter the Hedera account ID to receive tokens
                  </p>
                </div>
                
                <div>
                  <Label className="block text-sm font-medium text-emerald-700 mb-2">
                    Amount to Mint
                  </Label>
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
                    Maximum: 10,000 USDC per transaction
                  </p>
                </div>
              </div>

              {/* Quick Amounts */}
              <div>
                <Label className="block text-sm font-medium text-emerald-700 mb-2">
                  Quick Amounts
                </Label>
                <div className="flex gap-2 flex-wrap">
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

              {/* Cooldown Warning */}
              {cooldownTime && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-yellow-600" />
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
                    Mint {formatCurrency(parseFloat(amount) || 0)} USDC
                  </>
                )}
              </Button>

              {/* Info */}
              <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/15 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div className="text-sm text-blue-800 dark:text-blue-200">
                    <p className="font-medium">Test Token Information:</p>
                    <ul className="mt-1 space-y-1 text-xs text-blue-700 dark:text-blue-300">
                      <li>• Real Hedera testnet USDC tokens (Token ID: 0.0.7115536)</li>
                      <li>• Uses Hedera SDK for minting & transfer</li>
                      <li>• 5-minute cooldown between mints</li>
                      <li>• Maximum 10,000 USDC per transaction</li>
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
                      className="flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
                          <CheckCircle className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-emerald-800 dark:text-emerald-200">
                            {formatCurrency(mint.amount)} USDC
                          </p>
                          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-mono">
                            {mint.address}
                          </p>
                          <p className="text-xs text-emerald-600 dark:text-emerald-400">
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
      </div>
    </div>
  );
}
