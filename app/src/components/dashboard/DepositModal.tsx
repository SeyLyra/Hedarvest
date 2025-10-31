'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ArrowUpRight, DollarSign, TrendingUp, Coins } from 'lucide-react';
import { LoadingButton } from '@/components/shared/LoadingButton';

interface PoolData {
  id: number;
  grainType: string;
  address: string;
  price: number;
  availableLiquidity: string;
  totalBorrows: string;
  utilizationRate: number;
  apr: number;
  tvl: number;
  currentPrice: number;
}

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  pool: PoolData;
  onDeposit: (grainType: string, amount: number) => void;
}

export const DepositModal = ({ isOpen, onClose, pool, onDeposit }: DepositModalProps) => {
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const formatCurrency = (value: string | number) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numValue);
  };

  const handleDeposit = async () => {
    if (!amount || parseFloat(amount) <= 0) return;
    
    setIsLoading(true);
    try {
      await onDeposit(pool.grainType, parseFloat(amount));
      setAmount('');
      onClose();
    } catch (error) {
      console.error('Deposit failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const estimatedShares = amount ? (parseFloat(amount) / pool.currentPrice).toFixed(4) : '0';
  const estimatedYield = amount ? (parseFloat(amount) * pool.apr / 100 / 365).toFixed(2) : '0';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowUpRight className="w-5 h-5 text-green-600" />
            Deposit to {pool.grainType} Pool
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Pool Info */}
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-agricultural-green/20 to-trust-blue/20 flex items-center justify-center">
                <Coins className="h-5 w-5 text-agricultural-green" />
              </div>
              <div>
                <h3 className="font-semibold">{pool.grainType} Pool</h3>
                <p className="text-sm text-muted-foreground">APR: {pool.apr}%</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Current Price</p>
                <p className="font-semibold">${pool.currentPrice}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Available Liquidity</p>
                <p className="font-semibold">{formatCurrency(pool.availableLiquidity)}</p>
              </div>
            </div>
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="amount">Deposit Amount (USDC)</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                id="amount"
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-10"
                min="0"
                step="0.01"
              />
            </div>
          </div>

          {/* Quick Amount Buttons */}
          <div className="grid grid-cols-4 gap-2">
            {[100, 500, 1000, 5000].map((quickAmount) => (
              <Button
                key={quickAmount}
                variant="outline"
                size="sm"
                onClick={() => setAmount(quickAmount.toString())}
                className="text-xs"
              >
                ${quickAmount}
              </Button>
            ))}
          </div>

          {/* Deposit Preview */}
          {amount && parseFloat(amount) > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-semibold text-green-800 mb-2">Deposit Preview</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount:</span>
                  <span className="font-semibold">{formatCurrency(amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Estimated Shares:</span>
                  <span className="font-semibold">{estimatedShares}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Daily Yield:</span>
                  <span className="font-semibold text-green-600">${estimatedYield}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">APR:</span>
                  <span className="font-semibold text-green-600">{pool.apr}%</span>
                </div>
              </div>
            </div>
          )}

          {/* Risk Warning */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <TrendingUp className="w-4 h-4 text-yellow-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-yellow-800">Risk Notice</p>
                <p className="text-yellow-700">
                  Agricultural investments carry inherent risks. Past performance does not guarantee future results.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <LoadingButton
              onClick={handleDeposit}
              disabled={!amount || parseFloat(amount) <= 0}
              isLoading={isLoading}
              loadingText="Depositing..."
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <ArrowUpRight className="w-4 h-4 mr-2" />
              Deposit {amount ? formatCurrency(amount) : ''}
            </LoadingButton>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DepositModal;
