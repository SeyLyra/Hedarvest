"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { TrendingUp, DollarSign, Activity, BarChart3, ArrowRight, Loader2 } from "lucide-react";
import { useWalletConnect } from "@/hooks/useWalletConnect";

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

// API base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

export default function InvestorDashboard() {
  const [pools, setPools] = useState<PoolData[]>([]);
  const [amounts, setAmounts] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [poolsLoading, setPoolsLoading] = useState(true);
  
  // Wallet integration
  const { address, isConnected } = useWalletConnect();
  const [userAddress, setUserAddress] = useState<string>("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Update user address when wallet connects
  useEffect(() => {
    if (address) {
      setUserAddress(address);
    }
  }, [address]);

  // Authenticate with backend when wallet connects
  useEffect(() => {
    if (isConnected && address && !isAuthenticated) {
      handleWalletAuthentication();
    }
  }, [isConnected, address, isAuthenticated]);

  // Fetch pools on component mount only if authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchPools();
    }
  }, [isAuthenticated]);

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

  const fetchPools = async () => {
    setPoolsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/investor/pools`);
      if (response.ok) {
        const poolsData = await response.json();
        setPools(poolsData);
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

  const handleAmountChange = (grainType: string, value: string) => {
    setAmounts(prev => ({
      ...prev,
      [grainType]: value
    }));
  };

  const handleDeposit = async (grainType: string) => {
    const amount = amounts[grainType];
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/investor/deposit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          grainType, 
          amount: parseFloat(amount),
          depositorAddress: userAddress
        })
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(`Successfully deposited ${amount} USDT to ${grainType} pool`);
        toast.info(`Transaction Hash: ${result.transactions?.contractTxHash || 'Processing...'}`);
        setAmounts(prev => ({ ...prev, [grainType]: "" }));
        // Refresh pools to get updated liquidity
        fetchPools();
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Deposit failed');
      }
    } catch (error) {
      toast.error(`Failed to deposit to ${grainType} pool: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWithdraw = async (grainType: string) => {
    const amount = amounts[grainType];
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/investor/withdraw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          grainType, 
          shares: parseFloat(amount),
          depositorAddress: userAddress
        })
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(`Successfully withdrew ${amount} shares from ${grainType} pool`);
        toast.info(`Transaction Hash: ${result.transactions?.contractTxHash || 'Processing...'}`);
        setAmounts(prev => ({ ...prev, [grainType]: "" }));
        // Refresh pools to get updated liquidity
        fetchPools();
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Withdrawal failed');
      }
    } catch (error) {
      toast.error(`Failed to withdraw from ${grainType} pool: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(parseFloat(value));
  };

  const formatNumber = (value: string) => {
    return new Intl.NumberFormat('en-US').format(parseFloat(value));
  };

  return (
    <div className="min-h-screen animated-bg">
      {/* Header */}
      <div className="glass border-b border-border/50">
        <div className="w-full px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold gradient-text">Investor Dashboard</h1>
              <p className="text-muted-foreground mt-2 text-lg">Manage your grain pool investments</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex gap-2">
                <Badge variant="secondary" className="bg-agricultural-green/10 text-agricultural-green border-agricultural-green/20 animate-pulse">
                  Live API Integration
                </Badge>
                <Badge variant="outline" className="bg-trust-blue/10 text-trust-blue border-trust-blue/20">
                  USDT Staking
                </Badge>
                {isAuthenticated && (
                  <Badge variant="default" className="bg-agricultural-green/10 text-agricultural-green border-agricultural-green/20 animate-pulse">
                    <div className="w-2 h-2 bg-agricultural-green rounded-full mr-2 animate-pulse"></div>
                    Wallet Connected
                  </Badge>
                )}
              </div>
              <Button onClick={() => window.location.href = '/investor-login'} variant="gradient" size="lg" className="group">
                <span className="group-hover:animate-bounce">🔗</span>
                Connect HashPack
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full px-8 py-8">
        {/* Wallet Connection Status */}
        {isConnected ? (
          <div className="mb-8 glass rounded-2xl p-6 card-hover">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-foreground mb-2">Connected Wallet</h3>
                <p className="text-muted-foreground">
                  {isAuthenticated ? 'Wallet authenticated and ready for transactions' : 'Authenticating wallet...'}
                </p>
                <p className="text-sm font-mono text-muted-foreground mt-2 bg-muted/50 p-2 rounded-lg">
                  {userAddress}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {isAuthenticated ? (
                  <Badge variant="default" className="bg-agricultural-green/10 text-agricultural-green border-agricultural-green/20 animate-pulse">
                    <div className="w-2 h-2 bg-agricultural-green rounded-full mr-2 animate-pulse"></div>
                    ✓ Authenticated
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-golden-accent/10 text-golden-accent border-golden-accent/20 animate-pulse">
                    <div className="w-2 h-2 bg-golden-accent rounded-full mr-2 animate-pulse"></div>
                    Authenticating...
                  </Badge>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-8 glass rounded-2xl p-6 card-hover">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-foreground mb-2">Connect Your Wallet</h3>
                <p className="text-muted-foreground">Connect your HashPack wallet to start investing</p>
              </div>
              <Button onClick={() => window.location.href = '/investor-login'} variant="gradient" size="lg" className="group">
                <span className="group-hover:animate-bounce">🔗</span>
                Connect HashPack
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>
        )}

        {/* Main Content - Only show if wallet is authenticated */}
        {!isAuthenticated ? (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <h2 className="text-2xl font-bold text-foreground mb-4">Wallet Required</h2>
              <p className="text-muted-foreground mb-6">
                Please connect and authenticate your HashPack wallet to access the investor dashboard.
              </p>
              <Button onClick={() => window.location.href = '/investor-login'}>
                Connect HashPack
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="card-hover group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground group-hover:text-agricultural-green transition-colors">Total TVL</p>
                  <p className="text-3xl font-bold group-hover:scale-105 transition-transform">
                    {formatCurrency(pools.reduce((sum, pool) => sum + parseFloat(pool.availableLiquidity || "0") + parseFloat(pool.totalBorrows || "0"), 0).toString())}
                  </p>
                </div>
                <DollarSign className="h-10 w-10 text-agricultural-green group-hover:scale-110 transition-transform" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="card-hover group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground group-hover:text-trust-blue transition-colors">Average APY</p>
                  <p className="text-3xl font-bold group-hover:scale-105 transition-transform">
                    {pools.length > 0 ? (pools.reduce((sum, pool) => sum + pool.apr, 0) / pools.length).toFixed(1) : '0'}%
                  </p>
                </div>
                <TrendingUp className="h-10 w-10 text-trust-blue group-hover:scale-110 transition-transform" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="card-hover group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground group-hover:text-golden-accent transition-colors">Active Pools</p>
                  <p className="text-3xl font-bold group-hover:scale-105 transition-transform">{pools.length}</p>
                </div>
                <Activity className="h-10 w-10 text-golden-accent group-hover:scale-110 transition-transform" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="card-hover group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">Avg Utilization</p>
                  <p className="text-3xl font-bold group-hover:scale-105 transition-transform">
                    {pools.length > 0 ? (pools.reduce((sum, pool) => sum + pool.utilizationRate, 0) / pools.length).toFixed(0) : '0'}%
                  </p>
                </div>
                <BarChart3 className="h-10 w-10 text-foreground group-hover:scale-110 transition-transform" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Available Grain Pools */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold gradient-text mb-2">Available Grain Pools</h2>
          <p className="text-muted-foreground text-lg">Invest in diversified agricultural assets with real-world backing</p>
        </div>

        {/* Pool Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {poolsLoading ? (
            // Loading skeletons
            Array.from({ length: 4 }).map((_, index) => (
              <Card key={index} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i}>
                        <div className="h-4 bg-muted rounded w-full mb-2"></div>
                        <div className="h-6 bg-muted rounded w-2/3"></div>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-3 pt-4 border-t">
                    <div className="h-10 bg-muted rounded"></div>
                    <div className="flex gap-3">
                      <div className="h-10 bg-muted rounded flex-1"></div>
                      <div className="h-10 bg-muted rounded flex-1"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : pools.length === 0 ? (
            // No pools message
            <div className="col-span-full text-center py-12">
              <p className="text-muted-foreground text-lg mb-4">No pools available</p>
              <Button onClick={fetchPools} variant="outline">
                Retry Loading
              </Button>
            </div>
          ) : (
            // Actual pools
            pools.map((pool) => (
            <Card key={pool.grainType} className="glass card-hover group">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl font-bold gradient-text group-hover:scale-105 transition-transform">
                    {pool.grainType} Pool
                  </CardTitle>
                  <Badge 
                    variant="outline" 
                    className={
                      pool.utilizationRate > 50 
                        ? "border-red-200 text-red-700 bg-red-50 animate-pulse" 
                        : "border-agricultural-green/20 text-agricultural-green bg-agricultural-green/10"
                    }
                  >
                    <div className="w-2 h-2 rounded-full bg-current mr-2 animate-pulse"></div>
                    {pool.utilizationRate}% utilized
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground font-mono bg-muted/50 p-2 rounded-lg">
                  {pool.address}
                </p>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {/* Pool Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Current Price</p>
                    <p className="text-lg font-bold text-foreground">
                      {formatCurrency(pool.price.toString())}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Available Liquidity</p>
                    <p className="text-lg font-bold text-agricultural-green">
                      {formatCurrency(pool.availableLiquidity)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Borrows</p>
                    <p className="text-lg font-bold text-foreground">
                      {formatCurrency(pool.totalBorrows)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Utilization Rate</p>
                    <p className="text-lg font-bold text-foreground">
                      {pool.utilizationRate}%
                    </p>
                  </div>
                </div>

                {/* Action Section */}
                <div className="space-y-4 pt-4 border-t">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Amount (USDT)
                    </label>
                    <Input
                      type="number"
                      placeholder="Enter USDT amount"
                      value={amounts[pool.grainType] || ""}
                      onChange={(e) => handleAmountChange(pool.grainType, e.target.value)}
                      className="mb-3"
                      min="0"
                      step="0.01"
                    />
                    <p className="text-xs text-muted-foreground mb-3">
                      Stake USDT to earn {pool.apr}% APR in {pool.grainType} pool
                    </p>
                  </div>
                  
                  <div className="flex gap-3">
                    <Button
                      onClick={() => handleDeposit(pool.grainType)}
                      disabled={isLoading || !amounts[pool.grainType]}
                      variant="farmer"
                      size="lg"
                      className="flex-1 group"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <span className="group-hover:animate-bounce">💰</span>
                          Stake USDT
                          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={() => handleWithdraw(pool.grainType)}
                      disabled={isLoading || !amounts[pool.grainType]}
                      variant="outline"
                      size="lg"
                      className="flex-1 group"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <span className="group-hover:animate-bounce">💸</span>
                          Withdraw
                          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            ))
          )}
        </div>
          </>
        )}
      </div>
    </div>
  );
}
