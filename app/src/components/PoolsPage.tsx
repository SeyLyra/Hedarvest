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
  onDeposit: (grainType: string, amount: string) => Promise<void>;
  onWithdraw: (grainType: string, amount: string) => Promise<void>;
  isLoading: boolean;
}

export default function PoolsPage({ onDeposit, onWithdraw, isLoading }: PoolsPageProps) {
  const [pools, setPools] = useState<PoolData[]>([]);
  const [amounts, setAmounts] = useState<{ [key: string]: string }>({});
  const [poolsLoading, setPoolsLoading] = useState(true);

  const fetchPools = async () => {
    setPoolsLoading(true);
    try {
      const response = await fetch('/api/pools/list');
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setPools(result.data);
        } else {
          console.error('Failed to fetch pools:', result.error);
          toast.error('Failed to load pools');
        }
      } else {
        console.error('Failed to fetch pools');
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

  const handleDeposit = async (grainType: string) => {
    const amount = amounts[grainType];
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    await onDeposit(grainType, amount);
  };

  const handleWithdraw = async (grainType: string) => {
    const amount = amounts[grainType];
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    await onWithdraw(grainType, amount);
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
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-emerald-600" />
          <p className="text-emerald-700">Loading pools...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 bg-clip-text text-transparent">
            Investment Pools
          </h1>
          <p className="text-emerald-600 text-lg">Discover and invest in agricultural lending pools</p>
          <div className="flex items-center gap-2 mt-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-emerald-600 font-medium">Live Data</span>
          </div>
        </div>
        <Button
          onClick={fetchPools}
          variant="outline"
          className="text-emerald-600 border-emerald-200 hover:bg-gradient-to-r hover:from-emerald-50 hover:to-teal-50 hover:border-emerald-300 transition-all duration-300 hover:scale-105 shadow-lg"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-emerald-50 via-emerald-100 to-teal-50 border-emerald-200/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/25">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-emerald-600 mb-1">Total Value Locked</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-emerald-800 to-teal-800 bg-clip-text text-transparent">
                  ${formatNumber(pools.reduce((sum, pool) => sum + parseFloat(pool.availableLiquidity), 0).toString())}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 via-blue-100 to-cyan-50 border-blue-200/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-blue-600 mb-1">Average APR</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-blue-800 to-cyan-800 bg-clip-text text-transparent">
                  {(pools.reduce((sum, pool) => sum + pool.apr, 0) / pools.length).toFixed(1)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 via-purple-100 to-pink-50 border-purple-200/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/25">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-purple-600 mb-1">Active Pools</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-purple-800 to-pink-800 bg-clip-text text-transparent">
                  {pools.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 via-orange-100 to-red-50 border-orange-200/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/25">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-orange-600 mb-1">Avg Utilization</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-orange-800 to-red-800 bg-clip-text text-transparent">
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
          <Card key={pool.id} className="bg-gradient-to-br from-white/90 via-white/80 to-white/70 backdrop-blur-xl border-white/20 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105 group">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/25 group-hover:scale-110 transition-transform duration-300">
                    <Coins className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-bold bg-gradient-to-r from-emerald-800 to-teal-800 bg-clip-text text-transparent">
                      {pool.grainType}
                    </CardTitle>
                    <p className="text-sm text-emerald-600 font-mono">
                      {pool.address.slice(0, 6)}...{pool.address.slice(-4)}
                    </p>
                  </div>
                </div>
                <Badge 
                  variant="secondary" 
                  className={`${getUtilizationColor(pool.utilizationRate)} border-0 shadow-lg px-3 py-1`}
                >
                  {pool.utilizationRate}% utilized
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Pool Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-emerald-50 rounded-lg p-3">
                  <p className="text-xs text-emerald-600 mb-1">TVL</p>
                  <p className="font-bold text-emerald-800">${formatNumber(pool.availableLiquidity)}</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-3">
                  <p className="text-xs text-blue-600 mb-1">APR</p>
                  <p className="font-bold text-blue-800">{pool.apr}%</p>
                </div>
              </div>

              {/* Price */}
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-600 mb-1">Current Price</p>
                <p className="font-bold text-gray-800">${pool.price.toFixed(2)}</p>
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
                    value={amounts[pool.grainType] || ''}
                    onChange={(e) => setAmounts(prev => ({ ...prev, [pool.grainType]: e.target.value }))}
                    className="flex-1"
                  />
                </div>
                
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleDeposit(pool.grainType)}
                    disabled={isLoading}
                    className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <DollarSign className="w-4 h-4 mr-2" />
                    )}
                    Deposit
                  </Button>
                  
                  <Button
                    onClick={() => handleWithdraw(pool.grainType)}
                    disabled={isLoading}
                    variant="outline"
                    className="flex-1 text-emerald-600 border-emerald-200 hover:bg-emerald-50"
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
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Coins className="w-8 h-8 text-emerald-600" />
          </div>
          <h3 className="text-lg font-semibold text-emerald-800 mb-2">No Pools Available</h3>
          <p className="text-emerald-600">Check back later for new investment opportunities.</p>
        </div>
      )}
    </div>
  );
}
