"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  DollarSign, 
  Activity, 
  ArrowRight,
  Loader2,
  RefreshCw,
  Coins
} from "lucide-react";
import { toast } from "sonner";

interface PoolData {
  id: number;
  grainType: string;
  address: string;
  price: number;
  availableLiquidity: string;
  totalBorrows: string;
  utilizationRate: number;
  apr: number;
}

interface PoolsPageProps {
  onDeposit: (poolAddress: string, amount: string) => Promise<void>;
  onWithdraw: (poolAddress: string, shares: string) => Promise<void>;
  isLoading: boolean;
  onRefreshNeeded?: () => void;
}

export default function PoolsPage({ onDeposit, onWithdraw, isLoading, onRefreshNeeded }: PoolsPageProps) {
  const [pools, setPools] = useState<PoolData[]>([]);
  const [amounts, setAmounts] = useState<{ [key: string]: string }>({});
  const [poolsLoading, setPoolsLoading] = useState(true);

  const fetchPools = async () => {
    setPoolsLoading(true);
    try {
      console.log('🏊 Fetching pools from /api/pools/list...');
      const response = await fetch('/api/pools/list');
      console.log('   Response status:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('   Result:', result);
        
        if (result.success && result.data) {
          console.log('✅ Setting pools:', result.data.length, 'pools');
          setPools(result.data);
        } else {
          console.error('Failed to fetch pools:', result.error);
          toast.error('Failed to load pools');
        }
      } else {
        console.error('Failed to fetch pools, status:', response.status);
        toast.error('Failed to load pools');
      }
    } catch (error) {
      console.error('Error fetching pools:', error);
      toast.error('Error loading pools');
    } finally {
      setPoolsLoading(false);
    }
  };

  useEffect(() => {
    fetchPools();
  }, []);

  const handleDeposit = async (poolAddress: string) => {
    const amount = amounts[poolAddress];
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    await onDeposit(poolAddress, amount);

    // Auto-refresh pool data after successful deposit
    setTimeout(() => {
      fetchPools();
      onRefreshNeeded?.();
    }, 3000);
  };

  const handleWithdraw = async (poolAddress: string) => {
    const amount = amounts[poolAddress];
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    await onWithdraw(poolAddress, amount);

    // Auto-refresh pool data after successful withdrawal
    setTimeout(() => {
      fetchPools();
      onRefreshNeeded?.();
    }, 3000);
  };

  const formatNumber = (value: string) => {
    return new Intl.NumberFormat('en-US').format(parseFloat(value));
  };

  const getUtilizationColor = (rate: number) => {
    if (rate < 50) return 'text-green-600 bg-green-100';
    if (rate < 80) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  if (poolsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-emerald-500 dark:text-emerald-400" />
          <p className="text-emerald-700/80 dark:text-emerald-300/70">Loading pools...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-700 via-teal-600 to-green-700 dark:from-emerald-400 dark:via-teal-400 dark:to-green-500 bg-clip-text text-transparent">
            Investment Pools
          </h1>
          <p className="text-emerald-600/80 dark:text-emerald-300/70 text-lg">Discover and invest in agricultural lending pools</p>
          <div className="flex items-center gap-2 mt-2">
            <div className="w-2 h-2 bg-emerald-400 dark:bg-emerald-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-emerald-600/80 dark:text-emerald-300/80 font-medium">Live Data</span>
          </div>
        </div>
        <Button
          onClick={fetchPools}
          variant="outline"
          className="text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20 hover:bg-gradient-to-r hover:from-emerald-50/80 hover:to-teal-50/80 dark:hover:from-emerald-500/10 dark:hover:to-teal-500/10 hover:border-emerald-300 transition-all duration-300 hover:scale-105 shadow-md"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-emerald-50/70 to-teal-50/70 dark:from-emerald-500/10 dark:to-teal-500/10 border-emerald-200/50 dark:border-emerald-500/15 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-teal-500 dark:from-emerald-500 dark:to-teal-500 rounded-xl flex items-center justify-center shadow-md shadow-emerald-400/20 dark:shadow-emerald-500/10">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-emerald-600/80 dark:text-emerald-300/80 mb-1">Total Value Locked</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-emerald-700 to-teal-700 dark:from-emerald-400 dark:to-teal-400 bg-clip-text text-transparent">
                  ${formatNumber(pools.reduce((sum, pool) => sum + parseFloat(pool.availableLiquidity), 0).toString())}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-teal-50/70 to-cyan-50/70 dark:from-teal-500/10 dark:to-cyan-500/10 border-teal-200/50 dark:border-teal-500/15 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-teal-400 to-cyan-500 dark:from-teal-500 dark:to-cyan-500 rounded-xl flex items-center justify-center shadow-md shadow-teal-400/20 dark:shadow-teal-500/10">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-teal-600/80 dark:text-teal-300/80 mb-1">Average APR</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-teal-700 to-cyan-700 dark:from-teal-400 dark:to-cyan-400 bg-clip-text text-transparent">
                  {(pools.reduce((sum, pool) => sum + pool.apr, 0) / pools.length).toFixed(1)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50/70 to-emerald-50/70 dark:from-green-500/10 dark:to-emerald-500/10 border-green-200/50 dark:border-green-500/15 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 dark:from-green-500 dark:to-emerald-500 rounded-xl flex items-center justify-center shadow-md shadow-green-400/20 dark:shadow-green-500/10">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-green-600/80 dark:text-green-300/80 mb-1">Active Pools</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-green-700 to-emerald-700 dark:from-green-400 dark:to-emerald-400 bg-clip-text text-transparent">
                  {pools.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-lime-50/70 to-green-50/70 dark:from-lime-500/10 dark:to-green-500/10 border-lime-200/50 dark:border-lime-500/15 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-lime-400 to-green-500 dark:from-lime-500 dark:to-green-500 rounded-xl flex items-center justify-center shadow-md shadow-lime-400/20 dark:shadow-lime-500/10">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-lime-600/80 dark:text-lime-300/80 mb-1">Avg Utilization</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-lime-700 to-green-700 dark:from-lime-400 dark:to-green-400 bg-clip-text text-transparent">
                  {(pools.reduce((sum, pool) => sum + pool.utilizationRate, 0) / pools.length).toFixed(1)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pools Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
        {pools.map((pool) => (
          <Card key={pool.id} className="bg-white/95 dark:bg-[#121a16]/90 backdrop-blur-xl border-emerald-100/60 dark:border-emerald-500/15 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105 group">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-teal-500 dark:from-emerald-500 dark:to-teal-500 rounded-xl flex items-center justify-center shadow-md shadow-emerald-400/20 dark:shadow-emerald-500/10 group-hover:scale-110 transition-transform duration-300">
                    <Coins className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-bold bg-gradient-to-r from-emerald-700 to-teal-700 dark:from-emerald-400 dark:to-teal-400 bg-clip-text text-transparent">
                      {pool.grainType}
                    </CardTitle>
                    <p className="text-sm text-emerald-600/70 dark:text-emerald-400/60 font-mono">
                      {pool.address.slice(0, 6)}...{pool.address.slice(-4)}
                    </p>
                  </div>
                </div>
                <Badge 
                  variant="secondary" 
                  className={`${getUtilizationColor(pool.utilizationRate)} border-0 shadow-md px-3 py-1`}
                >
                  {pool.utilizationRate}% utilized
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Pool Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-emerald-50/80 dark:bg-emerald-500/10 rounded-lg p-3">
                  <p className="text-xs text-emerald-600/80 dark:text-emerald-300/80 mb-1">TVL</p>
                  <p className="font-bold text-emerald-800 dark:text-emerald-200">${formatNumber(pool.availableLiquidity)}</p>
                </div>
                <div className="bg-teal-50/80 dark:bg-teal-500/10 rounded-lg p-3">
                  <p className="text-xs text-teal-600/80 dark:text-teal-300/80 mb-1">APR</p>
                  <p className="font-bold text-teal-800 dark:text-teal-200">{pool.apr}%</p>
                </div>
              </div>

              {/* Price */}
              <div className="bg-slate-50/80 dark:bg-slate-500/10 rounded-lg p-3">
                <p className="text-xs text-slate-600 dark:text-slate-300/80 mb-1">Current Price</p>
                <p className="font-bold text-slate-800 dark:text-slate-200">${pool.price.toFixed(2)}</p>
              </div>

              {/* Utilization Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Utilization</span>
                  <span>{pool.utilizationRate}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-500 ${
                      pool.utilizationRate < 50 ? 'bg-green-500' :
                      pool.utilizationRate < 80 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.min(pool.utilizationRate, 100)}%` }}
                  ></div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Amount"
                    value={amounts[pool.address] || ''}
                    onChange={(e) => setAmounts(prev => ({ ...prev, [pool.address]: e.target.value }))}
                    className="flex-1 border-emerald-200 focus:border-emerald-400"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => handleDeposit(pool.address)}
                    disabled={isLoading}
                    className="flex-1 bg-gradient-to-r from-emerald-400 to-teal-500 dark:from-emerald-500 dark:to-teal-500 hover:from-emerald-500 hover:to-teal-600 dark:hover:from-emerald-600 dark:hover:to-teal-600 text-white shadow-md"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <DollarSign className="w-4 h-4 mr-2" />
                    )}
                    Deposit
                  </Button>

                  <Button
                    onClick={() => handleWithdraw(pool.address)}
                    disabled={isLoading}
                    variant="outline"
                    className="flex-1 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20 hover:bg-emerald-50/80 dark:hover:bg-emerald-500/10"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <ArrowRight className="w-4 h-4 mr-2" />
                    )}
                    Withdraw
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {pools.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-emerald-100/80 dark:bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Coins className="w-8 h-8 text-emerald-500 dark:text-emerald-400" />
          </div>
          <h3 className="text-lg font-semibold text-emerald-800 dark:text-emerald-200 mb-2">No Pools Available</h3>
          <p className="text-emerald-600/80 dark:text-emerald-300/70">Check back later for new investment opportunities.</p>
        </div>
      )}
    </div>
  );
}
