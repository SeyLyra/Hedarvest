"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Wallet, LogOut, Loader2, Coins, PieChart, Droplets, Moon, Sun, Wheat } from "lucide-react";
import Image from "next/image";
import { useWalletConnect } from "@/hooks/useWalletConnect";
import { useLendingPool } from "@/hooks/useLendingPool";
import PoolsPage from "@/components/PoolsPage";
import PortfolioPage from "@/components/PortfolioPage";
import { useTheme } from "next-themes";

// API base URL
const API_BASE_URL = typeof window !== 'undefined' 
  ? (window as any).location?.origin || 'http://localhost:3000'
  : 'http://localhost:3000';

// USDT Token ID (from backend environment)
const USDT_TOKEN_ID = '0.0.7115536';

// Helper to get topic from HashConnect session
const getTopicFromSession = (hc: any): string | null => {
  try {
    if (hc.topic) return hc.topic;
    if (hc._signClient?.session?.values?.length > 0) {
      return hc._signClient.session.values[0].topic;
    }
    return null;
  } catch {
    return null;
  }
};

export default function InvestorDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('pools');
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { theme, setTheme } = useTheme();
  
  // Wallet integration
  const { address, isConnected, hbarBalance, fetchBalance, disconnect, connect, isConnecting, hashconnect } = useWalletConnect();
  const { deposit, withdraw, isLoading: isLendingPoolLoading } = useLendingPool();
  const [userAddress, setUserAddress] = useState<string>("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [usdtBalance, setUsdtBalance] = useState<string>("0");
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);

  // Ensure we're on the client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Update user address when wallet connects
  useEffect(() => {
    if (address) {
      setUserAddress(address);
      fetchUsdtBalance(address);
    }
  }, [address]);

  // Fetch USDT balance
  const fetchUsdtBalance = async (walletAddress: string) => {
    if (!walletAddress) return;
    
    setIsLoadingBalance(true);
    try {
      const response = await fetch(`/api/faucet/balance/${walletAddress}`);
      if (response.ok) {
        const result = await response.json();
        setUsdtBalance(result.balance || "0");
      }
    } catch (error) {
    } finally {
      setIsLoadingBalance(false);
    }
  };

  // Authenticate with backend when wallet connects
  useEffect(() => {
    if (isConnected && address && !isAuthenticated) {
      handleWalletAuthentication();
    }
  }, [isConnected, address, isAuthenticated]);

  const handleWalletAuthentication = async () => {
    try {
      // For now, just mark as authenticated when wallet is connected
      // In a real implementation, you would verify the wallet signature with the backend
      if (isConnected && address) {
        setIsAuthenticated(true);
        toast.success('Wallet authenticated successfully');
      } else {
        toast.error('Please connect your wallet first');
      }
    } catch (error) {
      toast.error('Failed to authenticate wallet');
    }
  };

  const handleDepositWrapper = async (poolAddress: string, amount: string) => {
    const result = await deposit({
      poolAddress,
      amount,
      userAddress,
      hashconnect,
      usdtTokenId: USDT_TOKEN_ID
    });

    if (result?.success) {
      // Refresh balance after successful deposit
      setTimeout(() => {
        fetchUsdtBalance(userAddress);
      }, 3000);
    }
  };

  const handleWithdrawWrapper = async (poolAddress: string, shares: string) => {
    if (!isAuthenticated) {
      toast.error('Please authenticate your wallet first');
      return;
    }

    const result = await withdraw({
      poolAddress,
      shares,
      userAddress,
      hashconnect
    });

    if (result?.success) {
      // Refresh balance after successful withdrawal
      setTimeout(() => {
        fetchUsdtBalance(userAddress);
      }, 3000);
    }
  };

  const handleDisconnect = () => {
    disconnect();
    setIsAuthenticated(false);
    setUserAddress("");
    toast.success('Wallet disconnected');
    
    // Redirect to investor login page after disconnection
    setTimeout(() => {
      router.push('/investor-login');
    }, 500); // Small delay to allow toast to show
  };

  // Show loading state during hydration
  if (!isClient) {
  return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50/30 via-teal-50/30 to-green-50/30">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-400 mx-auto mb-4"></div>
          <p className="text-emerald-700/80">Loading...</p>
        </div>
      </div>
    );
  }

  // Show wallet connection required if not connected
  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50/30 via-teal-50/30 to-green-50/30 dark:from-[#0d1410] dark:via-[#0f1912] dark:to-[#0e1711] flex items-center justify-center">
        <Card className="w-full max-w-md bg-white/95 dark:bg-[#121a16]/95 backdrop-blur-sm border-emerald-100 dark:border-emerald-500/15 shadow-xl">
          <CardContent className="p-8 text-center">
            <Wallet className="w-16 h-16 text-emerald-500 dark:text-emerald-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-emerald-800 dark:text-emerald-200 mb-2">Wallet Required</h2>
            <p className="text-emerald-600/80 dark:text-emerald-300/70 mb-6">
              Please connect your HashPack wallet to access the investor dashboard.
            </p>
            <Button 
              onClick={connect}
              disabled={isConnecting}
              className="bg-gradient-to-r from-emerald-400 to-teal-500 dark:from-emerald-500 dark:to-teal-500 hover:from-emerald-500 hover:to-teal-600 dark:hover:from-emerald-600 dark:hover:to-teal-600 text-white shadow-lg"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                'Connect Wallet'
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-white dark:bg-[#0d1410]">
      {/* Elegant Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-white via-emerald-50/30 to-teal-50/30 dark:from-[#0d1410] dark:via-[#0f1912] dark:to-[#0e1711]">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/5 via-teal-400/5 to-green-400/5 dark:from-emerald-500/5 dark:via-teal-500/5 dark:to-green-500/5 animate-pulse-slow"></div>
      </div>

      {/* Subtle Floating Shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-r from-emerald-200/20 to-teal-200/20 dark:from-emerald-400/5 dark:to-teal-400/5 rounded-full blur-3xl animate-float"></div>
        <div className="absolute top-40 right-20 w-40 h-40 bg-gradient-to-r from-teal-200/20 to-green-200/20 dark:from-teal-400/5 dark:to-green-400/5 rounded-full blur-3xl animate-float" style={{animationDelay: '2s'}}></div>
        <div className="absolute bottom-40 left-1/4 w-36 h-36 bg-gradient-to-r from-green-200/20 to-emerald-200/20 dark:from-green-400/5 dark:to-emerald-400/5 rounded-full blur-3xl animate-float" style={{animationDelay: '4s'}}></div>
        <div className="absolute top-60 right-1/3 w-28 h-28 bg-gradient-to-r from-mint-200/20 to-teal-200/20 dark:from-emerald-400/5 dark:to-teal-400/5 rounded-full blur-3xl animate-float" style={{animationDelay: '1s'}}></div>
      </div>

      {/* Top Navigation */}
      <div className="relative z-50 bg-white/90 dark:bg-[#121a16]/95 backdrop-blur-xl border-b border-emerald-100/50 dark:border-emerald-500/10 shadow-lg">
        <div className="px-8 py-4">
          {/* Header with Logo and Wallet */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4 group cursor-pointer">
              <div className="w-8 h-8 bg-gradient-to-r from-agricultural-green to-trust-blue rounded-lg flex items-center justify-center">
                <Wheat className="h-5 w-5 text-white" />
              </div>
              <div>
                <span className="text-xl font-bold text-foreground">Hedarvest</span>
                <div className="text-xs text-muted-foreground">Investor Dashboard</div>
              </div>
            </div>
            
            {/* Wallet Status */}
            <div className="flex items-center gap-3">
              <Card className="bg-gradient-to-r from-emerald-50/80 to-teal-50/80 dark:from-emerald-500/10 dark:to-teal-500/10 border-emerald-100/60 dark:border-emerald-500/15 shadow-lg backdrop-blur-sm">
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 dark:from-emerald-500 dark:to-teal-500 rounded-xl flex items-center justify-center shadow-md shadow-emerald-400/20 dark:shadow-emerald-500/10">
                      <Wallet className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-sm">
                      <div className="font-bold text-emerald-800 dark:text-emerald-200">
                        {userAddress ? `${userAddress.slice(0, 6)}...${userAddress.slice(-4)}` : 'Connected'}
                      </div>
                      <div className="space-y-0.5">
                      {hbarBalance && (
                          <div className="text-xs text-emerald-600/80 dark:text-emerald-300/80 font-mono">
                            ℏ {hbarBalance} HBAR
                          </div>
                        )}
                        <div className="text-xs text-teal-600/80 dark:text-teal-400/80 font-mono flex items-center gap-1">
                          {isLoadingBalance ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <span>💵 {usdtBalance} USDT</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                variant="outline"
                size="sm"
                className="text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20 hover:bg-emerald-50/80 dark:hover:bg-emerald-500/10 transition-all duration-300 hover:scale-105 shadow-md"
              >
                {theme === "dark" ? (
                  <Sun className="w-4 h-4" />
                ) : (
                  <Moon className="w-4 h-4" />
                )}
              </Button>
              
              <Button
                onClick={handleDisconnect}
                variant="outline"
                size="sm"
                className="text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-500/20 hover:bg-gradient-to-r hover:from-rose-50 hover:to-red-50 dark:hover:from-rose-500/10 dark:hover:to-red-500/10 hover:border-rose-300 transition-all duration-300 hover:scale-105 shadow-md"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Disconnect
              </Button>
            </div>
          </div>

          {/* Compact Tab Navigation */}
          <div className="flex space-x-2 bg-emerald-50/40 dark:bg-emerald-500/5 backdrop-blur-xl rounded-2xl p-2 shadow-inner border border-emerald-100/40 dark:border-emerald-500/10">
            {[
              { id: 'pools', label: 'Pools', icon: Coins, description: 'Investment' },
              { id: 'portfolio', label: 'Portfolio', icon: PieChart, description: 'Investments' }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <Button
                  key={tab.id}
                  variant={isActive ? "default" : "ghost"}
                  className={`flex-1 h-10 rounded-xl transition-all duration-300 group relative overflow-hidden ${
                    isActive 
                      ? 'bg-gradient-to-r from-emerald-400 to-teal-500 dark:from-emerald-500 dark:to-teal-500 text-white shadow-lg shadow-emerald-400/20 dark:shadow-emerald-500/10 scale-105' 
                      : 'text-emerald-700 dark:text-emerald-300 hover:bg-gradient-to-r hover:from-emerald-50/80 hover:to-teal-50/80 dark:hover:from-emerald-500/10 dark:hover:to-teal-500/10 hover:scale-105 hover:shadow-md'
                  }`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent"></div>
                  )}
                  <div className="flex items-center gap-2 relative z-10">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-emerald-500 dark:text-emerald-400'}`} />
                    <div className="flex flex-col items-start">
                      <span className="font-semibold text-xs">{tab.label}</span>
                      <span className="text-xs opacity-75">{tab.description}</span>
                    </div>
                  </div>
                </Button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Page Content */}
      <div className="relative z-10 p-8">
        {activeTab === 'pools' && (
          <PoolsPage
            onDeposit={handleDepositWrapper}
            onWithdraw={handleWithdrawWrapper}
            isLoading={isLendingPoolLoading}
          />
        )}
        
        {activeTab === 'portfolio' && (
          <PortfolioPage userAddress={userAddress} />
        )}
        
      </div>
    </div>
  );
}