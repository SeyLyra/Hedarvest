"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Wallet, LogOut, Loader2, Coins, PieChart, Droplets } from "lucide-react";
import Image from "next/image";
import { useWalletConnect } from "@/hooks/useWalletConnect";
import PoolsPage from "@/components/PoolsPage";
import PortfolioPage from "@/components/PortfolioPage";
import FaucetPage from "@/components/FaucetPage";

// API base URL
const API_BASE_URL = typeof window !== 'undefined' 
  ? (window as any).location?.origin || 'http://localhost:3000'
  : 'http://localhost:3000';

export default function InvestorDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('pools');
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Wallet integration
  const { address, isConnected, hbarBalance, fetchBalance, disconnect, connect, isConnecting } = useWalletConnect();
  const [userAddress, setUserAddress] = useState<string>("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Ensure we're on the client side
  useEffect(() => {
    setIsClient(true);
  }, []);

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

  const handleDeposit = async (grainType: string, amount: string) => {
    if (!isAuthenticated) {
      toast.error('Please authenticate your wallet first');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/investor/deposit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          grainType, 
          amount: parseFloat(amount),
          depositorAddress: userAddress
        })
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(`Successfully deposited ${amount} tokens to ${grainType} pool`);
        console.log('Deposit result:', result);
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Deposit failed');
      }
    } catch (error) {
      console.error('Deposit error:', error);
      toast.error('Error processing deposit');
    } finally {
      setIsLoading(false);
    }
  };

  const handleWithdraw = async (grainType: string, amount: string) => {
    if (!isAuthenticated) {
      toast.error('Please authenticate your wallet first');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/investor/withdraw`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          grainType, 
          shares: parseFloat(amount),
          depositorAddress: userAddress
        })
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(`Successfully withdrew ${amount} shares from ${grainType} pool`);
        console.log('Withdraw result:', result);
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Withdrawal failed');
      }
    } catch (error) {
      console.error('Withdraw error:', error);
      toast.error('Error processing withdrawal');
    } finally {
      setIsLoading(false);
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-emerald-700">Loading...</p>
        </div>
      </div>
    );
  }

  // Show wallet connection required if not connected
  if (!isConnected) {
    return (
      <div className="min-h-screen animated-bg flex items-center justify-center">
        <Card className="w-full max-w-md bg-white/80 backdrop-blur-sm border-emerald-200">
          <CardContent className="p-8 text-center">
            <Wallet className="w-16 h-16 text-emerald-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-emerald-800 mb-2">Wallet Required</h2>
            <p className="text-emerald-600 mb-6">
              Please connect your HashPack wallet to access the investor dashboard.
            </p>
            <Button 
              onClick={connect}
              disabled={isConnecting}
              className="bg-emerald-500 hover:bg-emerald-600 text-white"
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
    <div className="min-h-screen relative overflow-hidden">
      {/* Ultra Fancy White-Dominant Background with Modern Green */}
      <div className="absolute inset-0 bg-gradient-to-br from-white via-emerald-50 to-teal-50">
        <div className="absolute inset-0 opacity-30" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23F0FDF4' fill-opacity='0.3'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-teal-500/5 to-cyan-500/5 animate-pulse-slow"></div>
      </div>

      {/* Floating Modern Green Shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-20 h-20 bg-gradient-to-r from-emerald-200/30 to-teal-300/30 rounded-full blur-xl animate-float"></div>
        <div className="absolute top-40 right-20 w-32 h-32 bg-gradient-to-r from-teal-200/30 to-cyan-300/30 rounded-full blur-xl animate-float" style={{animationDelay: '2s'}}></div>
        <div className="absolute bottom-40 left-1/4 w-24 h-24 bg-gradient-to-r from-green-200/30 to-emerald-300/30 rounded-full blur-xl animate-float" style={{animationDelay: '4s'}}></div>
        <div className="absolute top-60 right-1/3 w-16 h-16 bg-gradient-to-r from-mint-200/30 to-teal-300/30 rounded-full blur-xl animate-float" style={{animationDelay: '1s'}}></div>
      </div>

      {/* Top Navigation */}
      <div className="relative z-50 bg-gradient-to-r from-white/95 via-white/90 to-white/85 backdrop-blur-3xl border-b border-white/30 shadow-2xl">
        <div className="px-8 py-4">
          {/* Header with Logo and Wallet */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4 group cursor-pointer">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-orange-500 rounded-2xl blur-lg opacity-75 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative bg-gradient-to-r from-amber-400 to-orange-500 p-1 rounded-2xl">
                  <Image
                    src="/logo.png"
                    alt="Hedarvest Logo"
                    width={40}
                    height={40}
                    className="w-10 h-10 group-hover:scale-110 transition-transform duration-300"
                  />
                </div>
              </div>
              <div>
                <span className="text-3xl font-black bg-gradient-to-r from-emerald-700 via-teal-600 to-cyan-600 bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-300">
                  Hedarvest
                </span>
                <div className="text-xs text-emerald-600 font-medium">Agricultural DeFi Platform</div>
              </div>
            </div>
            
            {/* Wallet Status */}
            <div className="flex items-center gap-4">
              <Card className="bg-gradient-to-r from-emerald-50/90 to-teal-50/90 border-emerald-200/50 shadow-xl backdrop-blur-sm">
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/25">
                      <Wallet className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-sm">
                      <div className="font-bold text-emerald-800">
                        {userAddress ? `${userAddress.slice(0, 6)}...${userAddress.slice(-4)}` : 'Connected'}
                      </div>
                      {hbarBalance && (
                        <div className="text-xs text-emerald-600 font-mono">
                          {hbarBalance} HBAR
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Button
                onClick={handleDisconnect}
                variant="outline"
                size="sm"
                className="text-red-600 border-red-200 hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50 hover:border-red-300 transition-all duration-300 hover:scale-105 shadow-lg"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Disconnect
              </Button>
            </div>
          </div>

          {/* Compact Tab Navigation */}
          <div className="flex space-x-2 bg-white/60 backdrop-blur-xl rounded-2xl p-2 shadow-inner border border-white/20">
            {[
              { id: 'pools', label: 'Pools', icon: Coins, description: 'Investment' },
              { id: 'portfolio', label: 'Portfolio', icon: PieChart, description: 'Investments' },
              { id: 'faucet', label: 'Faucet', icon: Droplets, description: 'Test Tokens' }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <Button
                  key={tab.id}
                  variant={isActive ? "default" : "ghost"}
                  className={`flex-1 h-10 rounded-xl transition-all duration-300 group relative overflow-hidden ${
                    isActive 
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25 scale-105' 
                      : 'text-emerald-700 hover:bg-gradient-to-r hover:from-emerald-50 hover:to-teal-50 hover:scale-105 hover:shadow-md'
                  }`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent"></div>
                  )}
                  <div className="flex items-center gap-2 relative z-10">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-emerald-600'}`} />
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
            onDeposit={handleDeposit}
            onWithdraw={handleWithdraw}
            isLoading={isLoading}
          />
        )}
        
        {activeTab === 'portfolio' && (
          <PortfolioPage userAddress={userAddress} />
        )}
        
        {activeTab === 'faucet' && (
          <FaucetPage userAddress={userAddress} />
        )}
      </div>
    </div>
  );
}