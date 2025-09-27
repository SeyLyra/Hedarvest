'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  DollarSign, 
  Activity, 
  ArrowUpRight,
  ArrowDownRight,
  Coins,
  BarChart3
} from 'lucide-react';
import { PoolCardSkeleton } from '@/components/shared/Skeleton';
import { LoadingButton } from '@/components/shared/LoadingButton';
import { DepositModal } from './DepositModal';
import { WithdrawModal } from './WithdrawModal';

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

interface PoolsSectionProps {
  pools: PoolData[];
  isLoading: boolean;
  onDeposit: (grainType: string, amount: number) => Promise<void>;
  onWithdraw: (grainType: string, shares: number) => Promise<void>;
  isTransactionLoading: boolean;
}

export const PoolsSection = ({ 
  pools, 
  isLoading, 
  onDeposit, 
  onWithdraw, 
  isTransactionLoading 
}: PoolsSectionProps) => {
  const [selectedPool, setSelectedPool] = useState<PoolData | null>(null);
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);

  const formatCurrency = (value: string | number) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numValue);
  };

  const formatNumber = (value: string) => {
    return new Intl.NumberFormat('en-US').format(parseFloat(value));
  };

  const getUtilizationColor = (rate: number) => {
    if (rate > 80) return 'text-red-600 bg-red-100 border-red-200';
    if (rate > 60) return 'text-yellow-600 bg-yellow-100 border-yellow-200';
    return 'text-green-600 bg-green-100 border-green-200';
  };

  const handleDeposit = (grainType: string, amount: number) => {
    onDeposit(grainType, amount);
    setDepositModalOpen(false);
    setSelectedPool(null);
  };

  const handleWithdraw = (grainType: string, shares: number) => {
    onWithdraw(grainType, shares);
    setWithdrawModalOpen(false);
    setSelectedPool(null);
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 4 }).map((_, index) => (
          <PoolCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Pools Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {pools.map((pool) => (
            <Card key={pool.grainType} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-agricultural-green/20 to-trust-blue/20 flex items-center justify-center">
                      <Coins className="h-6 w-6 text-agricultural-green" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold text-foreground">
                        {pool.grainType} Pool
                      </CardTitle>
                      <p className="text-sm text-muted-foreground font-mono">
                        {pool.address}
                      </p>
                    </div>
                  </div>
                  <Badge 
                    variant="secondary"
                    className={getUtilizationColor(pool.utilizationRate)}
                  >
                    {pool.utilizationRate}% Utilized
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {/* Pool Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">TVL</p>
                    <p className="text-lg font-semibold text-foreground">
                      {formatCurrency(pool.tvl)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Current Price</p>
                    <p className="text-lg font-semibold text-foreground">
                      ${pool.currentPrice}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Available Liquidity</p>
                    <p className="text-lg font-semibold text-foreground">
                      {formatCurrency(pool.availableLiquidity)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Borrows</p>
                    <p className="text-lg font-semibold text-foreground">
                      {formatCurrency(pool.totalBorrows)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">APR</p>
                    <p className="text-lg font-semibold text-foreground text-green-600">
                      {pool.apr}%
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Utilization</p>
                    <p className="text-lg font-semibold text-foreground">
                      {pool.utilizationRate}%
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <LoadingButton
                    onClick={() => {
                      setSelectedPool(pool);
                      setDepositModalOpen(true);
                    }}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    disabled={isTransactionLoading}
                    isLoading={isTransactionLoading}
                    loadingText="Processing..."
                  >
                    <ArrowUpRight className="w-4 h-4 mr-2" />
                    Deposit
                  </LoadingButton>
                  <LoadingButton
                    onClick={() => {
                      setSelectedPool(pool);
                      setWithdrawModalOpen(true);
                    }}
                    variant="outline"
                    className="flex-1"
                    disabled={isTransactionLoading}
                    isLoading={isTransactionLoading}
                    loadingText="Processing..."
                  >
                    <ArrowDownRight className="w-4 h-4 mr-2" />
                    Withdraw
                  </LoadingButton>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Pool Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Pool Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">
                  {formatCurrency(pools.reduce((sum, pool) => sum + pool.tvl, 0))}
                </p>
                <p className="text-sm text-muted-foreground">Total TVL</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">
                  {formatCurrency(pools.reduce((sum, pool) => sum + parseFloat(pool.availableLiquidity), 0))}
                </p>
                <p className="text-sm text-muted-foreground">Total Liquidity</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">
                  {formatCurrency(pools.reduce((sum, pool) => sum + parseFloat(pool.totalBorrows), 0))}
                </p>
                <p className="text-sm text-muted-foreground">Total Borrows</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground text-green-600">
                  {(pools.reduce((sum, pool) => sum + pool.apr, 0) / pools.length).toFixed(1)}%
                </p>
                <p className="text-sm text-muted-foreground">Average APR</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      {selectedPool && (
        <>
          <DepositModal
            isOpen={depositModalOpen}
            onClose={() => {
              setDepositModalOpen(false);
              setSelectedPool(null);
            }}
            pool={selectedPool}
            onDeposit={handleDeposit}
          />
          <WithdrawModal
            isOpen={withdrawModalOpen}
            onClose={() => {
              setWithdrawModalOpen(false);
              setSelectedPool(null);
            }}
            pool={selectedPool}
            onWithdraw={handleWithdraw}
          />
        </>
      )}
    </>
  );
};

export default PoolsSection;
