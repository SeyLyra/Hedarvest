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
}

export default function FaucetPage({ userAddress }: FaucetPageProps) {
  const [amount, setAmount] = useState<string>("1000");
  const [isMinting, setIsMinting] = useState(false);
  const [lastMintTime, setLastMintTime] = useState<Date | null>(null);
  const [mintHistory, setMintHistory] = useState<Array<{
    id: string;
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
      toast.error('Maximum mint amount is 10,000 USDT');
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
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock transaction hash
      const txHash = `0x${Math.random().toString(16).substr(2, 64)}`;
      
      // Update last mint time
      setLastMintTime(new Date());
      
      // Add to history
      const newMint = {
        id: Date.now().toString(),
        amount: mintAmount,
        timestamp: new Date(),
        txHash
      };
      setMintHistory(prev => [newMint, ...prev.slice(0, 9)]); // Keep last 10
      
      toast.success(`Successfully minted ${mintAmount} USDT!`);
      
    } catch (error) {
      console.error('Mint failed:', error);
      toast.error('Failed to mint USDT. Please try again.');
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


      {/* Mint Form */}
      <Card className="bg-white/80 backdrop-blur-sm border-emerald-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-emerald-800">
            <Droplets className="w-6 h-6" />
            Mint Test Tokens
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
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium">Test Token Information:</p>
                <ul className="mt-1 space-y-1 text-xs">
                  <li>• These are mock tokens for testing only</li>
                  <li>• No real value or monetary worth</li>
                  <li>• 5-minute cooldown between mints</li>
                  <li>• Maximum 10,000 USDT per transaction</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mint History */}
      {mintHistory.length > 0 && (
        <Card className="bg-white/80 backdrop-blur-sm border-emerald-200">
          <CardHeader>
            <CardTitle className="text-emerald-800">Recent Mints</CardTitle>
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
