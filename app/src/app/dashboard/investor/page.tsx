'use client';

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { TrendingUp, DollarSign, Activity, BarChart3, LogOut, Loader2 } from "lucide-react";
// Logo import removed - using public path instead
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useWallet } from "@/hooks/useWallet";
import { useRouter } from "next/navigation";
import { Loader } from "@/components/shared/Loader";
import { LoadingButton } from "@/components/shared/LoadingButton";
import { PoolCardSkeleton, StatsSkeleton, WalletSkeleton } from "@/components/shared/Skeleton";
import { DashboardNavigation, DashboardSection } from "@/components/dashboard/DashboardNavigation";
import { OverviewSection } from "@/components/dashboard/OverviewSection";
import { PoolsSection } from "@/components/dashboard/PoolsSection";
import { PortfolioSection } from "@/components/dashboard/PortfolioSection";
import { ActivitySection } from "@/components/dashboard/ActivitySection";
import { useWalletBalance } from "@/hooks/useWalletBalance";

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

// API base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

export default function InvestorDashboard() {
  const [pools, setPools] = useState<PoolData[]>([]);
  const [amounts, setAmounts] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [poolsLoading, setPoolsLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<DashboardSection>('overview');
  const [overviewData, setOverviewData] = useState<any>(null);
  const [portfolioData, setPortfolioData] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [overviewLoading, setOverviewLoading] = useState(false);
  const [portfolioLoading, setPortfolioLoading] = useState(false);
  const [activityLoading, setActivityLoading] = useState(false);
  
  // Wallet integration
  const { address, isConnected, disconnect } = useWallet();
  const { hbarBalanceFormatted, usdtBalanceFormatted, loading: balanceLoading } = useWalletBalance(address);
  const [userAddress, setUserAddress] = useState<string>("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  // Update user address when wallet connects
  useEffect(() => {
    if (address) {
      setUserAddress(address);
    }
  }, [address]);

  // Set authenticated when wallet connects
  useEffect(() => {
    if (isConnected && address) {
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
    }
  }, [isConnected, address]);

  // Fetch data on component mount
  useEffect(() => {
    fetchPools();
    fetchOverviewData();
    fetchPortfolioData();
    fetchActivities();
  }, []);

  // Fetch data when section changes
  useEffect(() => {
    switch (activeSection) {
      case 'overview':
        if (!overviewData) fetchOverviewData();
        break;
      case 'portfolio':
        if (!portfolioData) fetchPortfolioData();
        break;
      case 'activity':
        if (activities.length === 0) fetchActivities();
        break;
    }
  }, [activeSection]);


  const handleLogout = () => {
    // Clear all state
    setPools([]);
    setOverviewData(null);
    setPortfolioData(null);
    setActivities([]);
    setIsAuthenticated(false);
    setUserAddress('');
    
    // Disconnect wallet
    disconnect();
    
    // Show success message
    toast.success('Logged out successfully');
    
    // Redirect to home
    router.push('/');
  };

  const fetchPools = async () => {
    setPoolsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/investor/pools`);
      if (response.ok) {
        const poolsData = await response.json();
        // Transform the data to include required properties
        const transformedPools = poolsData.map((pool: any, index: number) => ({
          id: index + 1,
          grainType: pool.grainType,
          address: pool.address,
          price: pool.price || 200,
          availableLiquidity: pool.availableLiquidity || "0",
          totalBorrows: pool.totalBorrows || "0",
          utilizationRate: pool.utilizationRate || 0,
          apr: pool.apr || 0,
          tvl: pool.availableLiquidity || "0",
          currentPrice: pool.currentPrice || 200,
        }));
        setPools(transformedPools);
      } else {
        toast.error('Failed to load pools');
      }
    } catch (error) {
      toast.error('Error loading pools');
    } finally {
      setPoolsLoading(false);
    }
  };

  const fetchOverviewData = async () => {
    setOverviewLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/investor/pools`);
      if (response.ok) {
        const data = await response.json();
        // Transform data for overview section
        const overviewData = {
          totalTVL: data.reduce((sum: number, pool: any) => sum + parseFloat(pool.availableLiquidity || "0") + parseFloat(pool.totalBorrows || "0"), 0),
          totalDeposits: 0, // This would come from user's portfolio
          totalBorrows: data.reduce((sum: number, pool: any) => sum + parseFloat(pool.totalBorrows || "0"), 0),
          currentYield: data.reduce((sum: number, pool: any) => sum + pool.apr, 0) / data.length,
          yieldChange: 0, // No mock data - real yield change from portfolio
          poolAllocation: data.map((pool: any, index: number) => ({
            name: pool.grainType,
            value: parseFloat(pool.availableLiquidity || "0") + parseFloat(pool.totalBorrows || "0"),
            color: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'][index % 4]
          })),
          yieldHistory: [] // No mock data - real yield history from portfolio
        };
        setOverviewData(overviewData);
      } else {
      }
    } catch (error) {
    } finally {
      setOverviewLoading(false);
    }
  };

  const fetchPortfolioData = async () => {
    setPortfolioLoading(true);
    try {
      // Use the connected wallet address for portfolio data
      const walletAddress = address; // Only use connected wallet address
      const response = await fetch(`${API_BASE_URL}/investor/portfolio/${walletAddress}`);
      if (response.ok) {
        const data = await response.json();
        // Add missing fields with default values
        const portfolioDataWithDefaults = {
          ...data,
          allocation: data.allocation || [],
          yieldHistory: data.yieldHistory || []
        };
        setPortfolioData(portfolioDataWithDefaults);
      } else {
        // No mock data - show empty portfolio if API fails
        setPortfolioData({
          totalDeposits: 0,
          totalValue: 0,
          totalYield: 0,
          averageAPR: 0,
          riskScore: 0,
          positions: [],
          allocation: [],
          yieldHistory: []
        });
      }
    } catch (error) {
    } finally {
      setPortfolioLoading(false);
    }
  };

  const fetchActivities = async () => {
    setActivityLoading(true);
    try {
      // Use the wallet address to fetch relevant activities
      const walletAddress = address || '0xA235741Ca138Ee7C34fEEf59E52c4Ca4d3aB4E16';
      const response = await fetch(`${API_BASE_URL}/hcs/events?address=${walletAddress}&limit=10`);
      if (response.ok) {
        const data = await response.json();
        // Transform HCS events to activity format
        const activities = data.events?.map((event: any) => ({
          id: event.id,
          type: event.eventType,
          grainType: event.payload?.grainType || 'Unknown',
          amount: event.payload?.amount || 0,
          shares: event.payload?.shares || 0,
          timestamp: event.timestamp,
          status: 'completed',
          transactionHash: event.transactionId,
          blockNumber: event.payload?.blockNumber || 0
        })) || [];
        setActivities(activities);
      } else {
        // Mock activity data for now
        const mockActivities = [
          {
            id: '1',
            type: 'deposit',
            grainType: 'Rice',
            amount: 1000,
            shares: 5.2,
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            status: 'completed',
            transactionHash: '0x1234567890abcdef',
            blockNumber: 12345678
          },
          {
            id: '2',
            type: 'deposit',
            grainType: 'Corn',
            amount: 2000,
            shares: 10.4,
            timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
            status: 'completed',
            transactionHash: '0xabcdef1234567890',
            blockNumber: 12345675
          },
          {
            id: '3',
            type: 'withdraw',
            grainType: 'Wheat',
            amount: 500,
            shares: 2.6,
            timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            status: 'completed',
            transactionHash: '0x9876543210fedcba',
            blockNumber: 12345650
          }
        ];
        setActivities(mockActivities);
      }
    } catch (error) {
    } finally {
      setActivityLoading(false);
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

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'overview':
        return (
          <OverviewSection 
            data={overviewData} 
            isLoading={overviewLoading} 
          />
        );
      case 'pools':
        return (
          <PoolsSection 
            pools={pools} 
            isLoading={poolsLoading} 
            onDeposit={handleDeposit}
            onWithdraw={handleWithdraw}
            isTransactionLoading={isLoading}
          />
        );
      case 'portfolio':
        return (
          <PortfolioSection 
            data={portfolioData} 
            isLoading={portfolioLoading} 
          />
        );
      case 'activity':
        return (
          <ActivitySection 
            activities={activities} 
            isLoading={activityLoading} 
            onRefresh={fetchActivities}
            onLoadMore={() => {}} // Implement pagination
            hasMore={false} // Implement pagination
          />
        );
      default:
        return null;
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="border-b bg-card">
          <div className="w-full px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <img 
                  src="/logo.png" 
                  alt="Hedarvest Logo" 
                  className="w-12 h-12"
                />
                <div>
                  <h1 className="text-3xl font-bold text-foreground">Investor Dashboard</h1>
                  <p className="text-muted-foreground mt-1">Manage your grain pool investments</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {isConnected && address && (
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">Wallet Balance</div>
                    <div className="font-medium">
                      {address.slice(0, 6)}...{address.slice(-4)}
                    </div>
                  </div>
                )}
                {isAuthenticated && (
                  <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                    Connected
                  </Badge>
                )}
                
                {/* Wallet Balance */}
       {isConnected && address && (
         <div className="flex items-center gap-4 text-sm">
           <div className="text-right">
             <div className="text-xs text-muted-foreground mb-1">
               Wallet: {address.slice(0, 6)}...{address.slice(-4)}
             </div>
             {balanceLoading ? (
               <div className="flex items-center gap-2">
                 <Loader2 className="w-4 h-4 animate-spin" />
                 <span className="text-muted-foreground">Loading...</span>
               </div>
             ) : (
               <>
                 <div className="font-medium text-sm">
                   {parseFloat(hbarBalanceFormatted).toFixed(4)} HBAR
                 </div>
                 <div className="font-medium text-sm">
                   {parseFloat(usdtBalanceFormatted).toFixed(2)} USDT
                 </div>
               </>
             )}
           </div>
         </div>
       )}
                
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

        {/* Navigation */}
        <DashboardNavigation 
          activeSection={activeSection} 
          onSectionChange={setActiveSection} 
        />

        {/* Main Content */}
        <div className="w-full px-8 py-8">
  
          {/* Active Section Content */}
          {renderActiveSection()}
        </div>
      </div>
    </ProtectedRoute>
  );
}
