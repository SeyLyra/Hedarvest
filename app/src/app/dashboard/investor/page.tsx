'use client';

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { TrendingUp, DollarSign, Activity, BarChart3, LogOut } from "lucide-react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useWallet } from "@/hooks/useWallet";
import { useRouter } from "next/navigation";
import { Loader } from "@/components/shared/Loader";
import { LoadingButton } from "@/components/shared/LoadingButton";
import { PoolCardSkeleton, StatsSkeleton, WalletSkeleton } from "@/components/shared/Skeleton";

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
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  
  // Wallet integration
  const { address, isConnected, disconnect, authenticateWithBackend } = useWallet();
  const [userAddress, setUserAddress] = useState<string>("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

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

  // Fetch pools on component mount
  useEffect(() => {
    fetchPools();
  }, []);

  const handleWalletAuthentication = async () => {
    setIsAuthenticating(true);
    try {
      const result = await authenticateWithBackend(API_BASE_URL);
      if (result.success) {
        setIsAuthenticated(true);
        toast.success('Wallet authenticated successfully');
      } else {
        toast.error(`Authentication failed: ${result.error}`);
      }
    } catch (error) {
      toast.error('Failed to authenticate wallet');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleLogout = () => {
    disconnect();
    router.push('/');
    toast.success('Logged out successfully');
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
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="border-b bg-card">
          <div className="w-full px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Investor Dashboard</h1>
                <p className="text-muted-foreground mt-1">Manage your grain pool investments</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex gap-2">
                  <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                    Live API Integration
                  </Badge>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    USDT Staking
                  </Badge>
                  {isAuthenticated && (
                    <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                      Wallet Connected
                    </Badge>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="w-full px-8 py-8">
          {/* Wallet Connection Status */}
          {isConnected ? (
            <div className="mb-8 bg-card rounded-xl p-6 border">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">Connected Wallet</h3>
                  <p className="text-sm text-muted-foreground">
                    {isAuthenticated ? 'Wallet authenticated and ready for transactions' : 'Authenticating wallet...'}
                  </p>
                  <p className="text-sm font-mono text-muted-foreground mt-1">
                    {userAddress}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {isAuthenticated ? (
                    <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                      ✓ Authenticated
                    </Badge>
                  ) : isAuthenticating ? (
                    <div className="flex items-center gap-2">
                      <Loader size="sm" />
                      <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                        Authenticating...
                      </Badge>
                    </div>
                  ) : (
                    <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                      Authenticating...
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          ) : null}

          {/* Overview Stats */}
          {poolsLoading ? (
            <StatsSkeleton />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Pools</p>
                      <p className="text-2xl font-bold text-foreground">{pools.length}</p>
                    </div>
                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <BarChart3 className="h-4 w-4 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Liquidity</p>
                      <p className="text-2xl font-bold text-foreground">
                        {pools.length > 0 ? formatCurrency(
                          pools.reduce((sum, pool) => sum + parseFloat(pool.availableLiquidity), 0).toString()
                        ) : '$0'}
                      </p>
                    </div>
                    <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                      <DollarSign className="h-4 w-4 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Avg APR</p>
                      <p className="text-2xl font-bold text-foreground">
                        {pools.length > 0 ? (pools.reduce((sum, pool) => sum + pool.apr, 0) / pools.length).toFixed(1) : '0.0'}%
                      </p>
                    </div>
                    <div className="h-8 w-8 rounded-full bg-yellow-100 flex items-center justify-center">
                      <TrendingUp className="h-4 w-4 text-yellow-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Active Pools</p>
                      <p className="text-2xl font-bold text-foreground">
                        {pools.filter(pool => parseFloat(pool.availableLiquidity) > 0).length}
                      </p>
                    </div>
                    <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                      <Activity className="h-4 w-4 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Pools Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {poolsLoading ? (
              // Loading skeletons
              Array.from({ length: 4 }).map((_, index) => (
                <PoolCardSkeleton key={index} />
              ))
            ) : (
              // Actual pools
              pools.map((pool) => (
                <Card key={pool.grainType} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xl font-bold text-foreground">
                        {pool.grainType} Pool
                      </CardTitle>
                      <Badge 
                        variant={pool.utilizationRate > 80 ? "destructive" : pool.utilizationRate > 60 ? "default" : "secondary"}
                        className={
                          pool.utilizationRate > 80 
                            ? "bg-red-100 text-red-800 border-red-200" 
                            : pool.utilizationRate > 60 
                            ? "bg-yellow-100 text-yellow-800 border-yellow-200"
                            : "bg-green-100 text-green-800 border-green-200"
                        }
                      >
                        {pool.utilizationRate}% Utilized
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground font-mono">
                      {pool.address}
                    </p>
                  </CardHeader>
                  
                  <CardContent className="space-y-6">
                    {/* Pool Stats */}
                    <div className="grid grid-cols-2 gap-4">
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
                        <p className="text-sm text-muted-foreground">Price</p>
                        <p className="text-lg font-semibold text-foreground">
                          ${pool.price}
                        </p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-4">
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          placeholder="Amount"
                          value={amounts[pool.grainType] || ""}
                          onChange={(e) => setAmounts(prev => ({ ...prev, [pool.grainType]: e.target.value }))}
                          className="flex-1"
                        />
                        <LoadingButton 
                          onClick={() => handleDeposit(pool.grainType)}
                          disabled={!amounts[pool.grainType]}
                          isLoading={isLoading}
                          loadingText="Depositing..."
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Deposit
                        </LoadingButton>
                      </div>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          placeholder="Shares to withdraw"
                          value={amounts[pool.grainType] || ""}
                          onChange={(e) => setAmounts(prev => ({ ...prev, [pool.grainType]: e.target.value }))}
                          className="flex-1"
                        />
                        <LoadingButton 
                          onClick={() => handleWithdraw(pool.grainType)}
                          disabled={!amounts[pool.grainType]}
                          isLoading={isLoading}
                          loadingText="Withdrawing..."
                          variant="outline"
                        >
                          Withdraw
                        </LoadingButton>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
