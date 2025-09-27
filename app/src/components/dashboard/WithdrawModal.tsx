'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ArrowDownRight, DollarSign, TrendingUp, Coins } from 'lucide-react';
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

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  pool: PoolData;
  onWithdraw: (grainType: string, shares: number) => void;
}

export const WithdrawModal = ({ isOpen, onClose, pool, onWithdraw }: WithdrawModalProps) => {
  const [shares, setShares] = useState('');
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

  const handleWithdraw = async () => {
    if (!shares || parseFloat(shares) <= 0) return;
    
    setIsLoading(true);
    try {
      await onWithdraw(pool.grainType, parseFloat(shares));
      setShares('');
      onClose();
    } catch (error) {
      console.error('Withdrawal failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const estimatedAmount = shares ? (parseFloat(shares) * pool.currentPrice).toFixed(2) : '0';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowDownRight className="w-5 h-5 text-blue-600" />
            Withdraw from {pool.grainType} Pool
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
                <p className="text-sm text-muted-foreground">Current Price: ${pool.currentPrice}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Available Liquidity</p>
                <p className="font-semibold">{formatCurrency(pool.availableLiquidity)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Utilization Rate</p>
                <p className="font-semibold">{pool.utilizationRate}%</p>
              </div>
            </div>
          </div>

          {/* Shares Input */}
          <div className="space-y-2">
            <Label htmlFor="shares">Shares to Withdraw</Label>
            <div className="relative">
              <Coins className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                id="shares"
                type="number"
                placeholder="0.0000"
                value={shares}
                onChange={(e) => setShares(e.target.value)}
                className="pl-10"
                min="0"
                step="0.0001"
              />
            </div>
          </div>

          {/* Quick Amount Buttons */}
          <div className="grid grid-cols-4 gap-2">
            {[0.1, 0.5, 1.0, 5.0].map((quickShares) => (
              <Button
                key={quickShares}
                variant="outline"
                size="sm"
                onClick={() => setShares(quickShares.toString())}
                className="text-xs"
              >
                {quickShares}
              </Button>
            ))}
          </div>

          {/* Withdrawal Preview */}
          {shares && parseFloat(shares) > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-800 mb-2">Withdrawal Preview</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shares:</span>
                  <span className="font-semibold">{shares}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Estimated Amount:</span>
                  <span className="font-semibold">{formatCurrency(estimatedAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Current Price:</span>
                  <span className="font-semibold">${pool.currentPrice}</span>
                </div>
              </div>
            </div>
          )}

          {/* Withdrawal Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-blue-800">Withdrawal Notice</p>
                <p className="text-blue-700">
                  Withdrawals are processed immediately. You will receive USDT based on current pool price.
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
              onClick={handleWithdraw}
              disabled={!shares || parseFloat(shares) <= 0}
              isLoading={isLoading}
              loadingText="Withdrawing..."
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              <ArrowDownRight className="w-4 h-4 mr-2" />
              Withdraw {shares ? `${shares} shares` : ''}
            </LoadingButton>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WithdrawModal;
