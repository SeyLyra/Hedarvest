"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import {
  CheckCircle,
  Shield,
  TrendingUp,
  Eye,
  BarChart3,
  AlertCircle,
  RefreshCw,
  ArrowRight,
  Sparkles,
  Zap,
  Star,
  Globe,
  Lock,
  Target,
  Rocket,
  Wheat,
  Sun,
  Leaf,
  TreePine,
  Gem,
  Coins,
  Banknote,
  PiggyBank,
  Award,
  Crown,
  Diamond,
  Heart,
  Flame
} from "lucide-react";
import { useHashPackDirect } from "@/hooks/useHashPackDirect";

// TypeScript declaration for HashPack
declare global {
  interface Window {
    hedera?: {
      request: (params: { method: string }) => Promise<string[]>;
    };
  }
}

export default function InvestorLoginPage() {
  const router = useRouter();
  const [showRedirectFallback, setShowRedirectFallback] = useState(false);
  const [confirmedAccountId, setConfirmedAccountId] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  
  // Use the direct HashPack connection hook
  const {
    hashconnect,
    connectionStatus,
    isConnected,
    accountId,
    error,
    isLoading,
    connect,
    disconnect,
    checkConnection,
    hbarBalance,
    fetchBalance
  } = useHashPackDirect();

  // Ensure we're on the client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Handle successful connection
  useEffect(() => {
    if (isConnected && accountId) {
      console.log('✅ HashPack connected successfully:', accountId);
      // Store account in localStorage for persistence
      localStorage.setItem('hashpack_account', accountId);
      
      // Redirect to dashboard after successful connection
      setTimeout(() => {
        router.push('/investor-dashboard');
      }, 1000);
    }
  }, [isConnected, accountId, router]);

  // Handle retry connection
  const handleRetryConnection = () => {
    connect();
  };

  // Test function to verify click handlers work
  const testClick = () => {
    alert('Test button is working!');
  };

  const checkHashPackManually = () => {
    if (typeof window === 'undefined') {
      alert('Window not available');
      return;
    }

    // Check specifically for HashPack (not MetaMask)
    const checks = {
      'window.hedera (HashPack)': !!window.hedera,
      'window.hashpack (HashPack)': !!(window as any).hashpack,
      'window.ethereum (MetaMask)': !!(window as any).ethereum,
      'window.web3': !!(window as any).web3,
    };
    
    // Look for any property that might be HashPack
    const allProps = Object.keys(window);
    const hashpackProps = allProps.filter(prop => 
      prop.toLowerCase().includes('hedera') || 
      prop.toLowerCase().includes('hash') || 
      prop.toLowerCase().includes('pack')
    );
    
    // Check for HashPack in different ways
    const hashpackChecks = {
      'window.hedera': window.hedera,
      'window.hashpack': (window as any).hashpack,
      'window.hashconnect': (window as any).hashconnect,
      'window.HederaWallet': (window as any).HederaWallet,
      'window.HederaWalletConnect': (window as any).HederaWalletConnect,
    };
    
    // Check if HashPack is in extensions
    const extensions = (window as any).chrome?.runtime?.getManifest ? 'Chrome extensions available' : 'No Chrome extensions API';
    
    alert(`HashPack Detection Results:\n${Object.entries(checks).map(([key, value]) => `${key}: ${value ? '✅' : '❌'}`).join('\n')}\n\nFound properties: ${hashpackProps.join(', ') || 'None'}\n\nHashPack specific: ${Object.entries(hashpackChecks).filter(([k,v]) => v).map(([k,v]) => k).join(', ') || 'None'}`);
  };

  const testDirectConnection = async () => {
    if (typeof window === 'undefined') {
      alert('Window not available');
      return;
    }

    // Try to detect HashPack specifically (not MetaMask)
    const hashpackDetected = window.hedera || (window as any).hashpack;
    
    if (!hashpackDetected) {
      alert('HashPack not found! Please:\n1. Install HashPack extension\n2. Refresh the page\n3. Make sure extension is enabled\n\nNote: MetaMask is detected but we need HashPack specifically');
      return;
    }

    try {
      const provider = window.hedera || (window as any).hashpack;
      const accounts = await provider.request({ method: 'eth_requestAccounts' });
      alert(`Direct connection successful! Accounts: ${JSON.stringify(accounts)}`);
    } catch (err: any) {
      alert(`Direct connection failed: ${err.message}`);
    }
  };

  const debugLog = () => {
    const debugInfo = {
      hashconnect: !!hashconnect,
      connectionStatus,
      isConnected,
      accountId,
      error,
      isLoading,
      isClient,
      windowHedera: typeof window !== 'undefined' ? !!window.hedera : false,
      windowHashpack: typeof window !== 'undefined' ? !!(window as any).hashpack : false
    };
    
    alert(`Debug Info:\n${Object.entries(debugInfo).map(([key, value]) => `${key}: ${value}`).join('\n')}`);
  };

  // Check for existing connection on page load
  useEffect(() => {
    const existingAccount = localStorage.getItem('hashpack_account');
    if (existingAccount) {
      setConfirmedAccountId(existingAccount);
      // Auto-redirect if already connected
        setTimeout(() => {
        router.push('/investor-dashboard');
        }, 1000);
    }
  }, [router]);

  // Show loading state during hydration
  if (!isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4"></div>
          <p className="text-emerald-700">Loading...</p>
        </div>
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

      {/* Ultra Fancy Agricultural Header */}
      <header className="relative z-50 w-full px-8 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4 group cursor-pointer">
              {/* Ultra Fancy Elegant Logo with Multiple Layers */}
              <div className="relative">
                {/* Outer Glow Ring - Animated Pulse */}
                <div className="absolute inset-0 bg-gradient-to-r from-amber-300 via-emerald-400 to-teal-400 rounded-3xl blur-2xl opacity-60 group-hover:opacity-90 transition-all duration-700 animate-pulse"></div>
                
                {/* Middle Glow Ring - Rotating */}
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 via-cyan-400 to-amber-400 rounded-3xl blur-xl opacity-40 group-hover:opacity-70 transition-all duration-500 group-hover:animate-spin" style={{animationDuration: '8s'}}></div>
                
                {/* Inner Shadow Ring */}
                <div className="absolute inset-1 bg-gradient-to-br from-white/20 to-transparent rounded-3xl blur-sm opacity-50 group-hover:opacity-80 transition-opacity duration-500"></div>
                
                {/* Gradient Border Container with Shine Effect */}
                <div className="relative bg-gradient-to-br from-amber-400 via-emerald-500 to-teal-600 p-1.5 rounded-3xl shadow-2xl group-hover:shadow-emerald-500/50 transition-all duration-500 group-hover:scale-110 overflow-hidden">
                  {/* Animated Shine Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  
                  {/* Inner White Background with Gradient */}
                  <div className="relative bg-gradient-to-br from-white via-emerald-50/30 to-teal-50/30 rounded-[20px] p-3 backdrop-blur-xl">
                    {/* Logo Image with Enhanced Effects */}
                    <div className="relative">
                      <Image
                        src="/logo.png"
                        alt="Hedarvest Logo"
                        width={48}
                        height={48}
                        className="w-12 h-12 group-hover:scale-125 group-hover:rotate-6 transition-all duration-500 drop-shadow-xl relative z-10"
                      />
                      {/* Logo Inner Glow */}
                      <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/30 to-teal-400/30 rounded-xl blur-md group-hover:blur-lg transition-all duration-500"></div>
                    </div>
                  </div>
                </div>
                
                {/* Floating Particles Effect */}
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-amber-400 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-ping"></div>
                <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-emerald-400 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-ping" style={{animationDelay: '0.3s'}}></div>
                <div className="absolute top-0 left-1/2 w-1.5 h-1.5 bg-teal-400 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-ping" style={{animationDelay: '0.6s'}}></div>
              </div>
              
              <div>
                <span className="text-3xl font-black bg-gradient-to-r from-emerald-700 via-teal-600 to-cyan-600 bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-300 inline-block">
                  Hedarvest
                </span>
                <div className="text-xs text-emerald-600 font-medium flex items-center gap-2">
                  <span>Agricultural DeFi Platform</span>
                  <Sparkles className="w-3 h-3 text-amber-500 animate-pulse" />
                </div>
              </div>
          </div>

            <div className="flex items-center gap-6">
              {!isConnected ? (
                <div className="flex flex-col items-end gap-4">
                  <Button
                    onClick={connect}
                    disabled={isLoading}
                    className="relative group overflow-hidden bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:via-teal-400 hover:to-cyan-400 text-white font-bold py-4 px-8 rounded-2xl shadow-2xl hover:shadow-emerald-500/25 transition-all duration-300 hover:scale-105"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                        <span className="relative z-10">Connecting...</span>
                      </>
                    ) : (
                      <>
                        <span className="relative z-10 mr-3 group-hover:animate-bounce">🌾</span>
                        <span className="relative z-10">Connect HashPack</span>
                        <ArrowRight className="relative z-10 w-5 h-5 ml-3 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </Button>
                  
                  <div className="flex items-center gap-3">
                    <div className="text-xs text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-200">
                      HashConnect: {hashconnect ? '✅' : '❌'} | Status: {connectionStatus}
                    </div>
                    <button 
                      onClick={testClick}
                      className="text-xs text-blue-600 underline hover:text-blue-700 transition-colors"
                    >
                      Test Click
                    </button>
                    <button 
                      onClick={checkHashPackManually}
                      className="text-xs text-orange-600 underline hover:text-orange-700 transition-colors"
                    >
                      Check HashPack
                    </button>
                    <button 
                      onClick={testDirectConnection}
                      className="text-xs text-purple-600 underline hover:text-purple-700 transition-colors"
                    >
                      Direct Test
                    </button>
                    <button 
                      onClick={debugLog}
                      className="text-xs text-emerald-600 underline hover:text-teal-600 transition-colors"
                    >
                      Debug Log
                    </button>
                    <button 
                      onClick={connect}
                      className="text-xs text-emerald-600 underline hover:text-teal-700 transition-colors"
                    >
                      Retry Connect
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 backdrop-blur-sm rounded-2xl px-6 py-3 border border-emerald-500/30">
                  <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse shadow-lg shadow-emerald-400/50"></div>
                  <div className="flex flex-col">
                    <span className="text-emerald-700 text-sm font-medium">
                      {accountId ? `${accountId.slice(0, 6)}...${accountId.slice(-4)}` : 'Connected'}
                    </span>
                    <div className="flex items-center gap-2">
                      {hbarBalance && (
                        <span className="text-emerald-600 text-xs">
                          {hbarBalance} HBAR
                        </span>
                      )}
                      <button
                        onClick={fetchBalance}
                        className="text-xs text-emerald-600 hover:text-emerald-700 underline"
                        title="Refresh Balance"
                      >
                        Refresh
                      </button>
                    </div>
                  </div>
                  <button 
                    onClick={disconnect}
                    className="text-xs text-red-600 underline hover:text-red-700 transition-colors ml-2"
                  >
                    Disconnect
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Ultra Fancy Agricultural Hero Section */}
      <section className="relative py-32 overflow-hidden">
        <div className="w-full px-8 relative z-10">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-20">
              {/* Animated Agricultural Badge */}
              <div className="mb-8 animate-fade-in">
                <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-cyan-500/20 backdrop-blur-sm border border-emerald-500/30">
                  <Wheat className="w-4 h-4 text-emerald-600 animate-pulse" />
                  <span className="text-emerald-700 font-medium">Powered by Hedera Network</span>
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-ping"></div>
                </div>
              </div>
              
              {/* Main Heading with Agricultural Effects */}
              <h1 className="text-6xl md:text-8xl font-black mb-8 leading-tight">
                <span className="block text-emerald-800 mb-4 animate-fade-in" style={{animationDelay: '0.1s'}}>
                  Institutional-Grade
                </span>
                <span className="block bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent animate-fade-in" style={{animationDelay: '0.3s'}}>
                  Agricultural Investing
                </span>
              </h1>
              
              {/* Subtitle with Agricultural Glow Effect */}
              <p className="text-2xl md:text-3xl text-emerald-700 mb-12 max-w-5xl mx-auto leading-relaxed animate-fade-in" style={{animationDelay: '0.5s'}}>
                Access a new asset class with predictable returns backed by real-world agricultural operations. 
                Earn sustainable yields while supporting global food security.
              </p>

              {/* Ultra Fancy Agricultural CTA Button */}
              <div className="animate-fade-in" style={{animationDelay: '0.7s'}}>
                <Button
                  onClick={connect}
                  disabled={isLoading}
                  className="relative group overflow-hidden bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:via-teal-400 hover:to-cyan-400 text-white font-black py-6 px-12 rounded-3xl shadow-2xl hover:shadow-emerald-500/50 transition-all duration-500 hover:scale-110 text-xl"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-4"></div>
                      <span className="relative z-10">Connecting to HashPack...</span>
                    </>
                  ) : (
                    <>
                      <Wheat className="relative z-10 w-6 h-6 mr-4 group-hover:animate-bounce" />
                      <span className="relative z-10">Start Investing Now</span>
                      <ArrowRight className="relative z-10 w-6 h-6 ml-4 group-hover:translate-x-2 transition-transform" />
                    </>
                  )}
                </Button>
              </div>
                          </div>
              
            {/* Ultra Fancy Agricultural Investment Advantages Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
              {[
                { icon: Gem, title: "Real Asset Backing", desc: "100% collateralized by physical crops", color: "from-emerald-400 to-teal-500", emoji: "💎" },
                { icon: Coins, title: "Predictable Yields", desc: "8-12% APY from agricultural operations", color: "from-teal-400 to-cyan-500", emoji: "💰" },
                { icon: Crown, title: "Full Transparency", desc: "Blockchain-verified supply chain tracking", color: "from-green-400 to-emerald-500", emoji: "👑" },
                { icon: Diamond, title: "Diversified Portfolio", desc: "Multiple crops and geographic regions", color: "from-cyan-400 to-teal-500", emoji: "💠" }
              ].map((item, index) => (
                <div key={index} className="group relative">
                  <div className="absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl rounded-3xl" style={{background: `linear-gradient(135deg, ${item.color.split(' ')[1]}, ${item.color.split(' ')[3]})`}}></div>
                  <div className="relative bg-gradient-to-br from-emerald-50/90 to-teal-50/90 backdrop-blur-xl rounded-3xl p-8 border border-emerald-200/50 hover:border-emerald-400/70 transition-all duration-500 hover:scale-105 hover:-translate-y-2 shadow-lg hover:shadow-emerald-200/50">
                    <div className={`w-16 h-16 bg-gradient-to-r ${item.color} rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300`}>
                      <item.icon className="w-8 h-8 text-white" />
                          </div>
                    <div className="text-4xl mb-4 group-hover:animate-bounce">{item.emoji}</div>
                    <h3 className="text-xl font-bold text-emerald-800 mb-4 group-hover:text-emerald-600 transition-colors">{item.title}</h3>
                    <p className="text-emerald-700 group-hover:text-emerald-800 transition-colors">{item.desc}</p>
                    <div className="mt-6 w-full h-1 bg-gradient-to-r from-transparent via-emerald-300/50 to-transparent rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                          </div>
                </div>
              ))}
                        </div>

            {/* Ultra Fancy Agricultural Why Invest Section */}
            <div className="relative mb-20">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10 rounded-4xl blur-3xl"></div>
              <div className="relative bg-gradient-to-br from-emerald-50/95 to-teal-50/95 backdrop-blur-xl rounded-4xl p-16 border border-emerald-200/50 shadow-xl">
                <div className="text-center mb-16">
                  <h2 className="text-5xl md:text-6xl font-black text-emerald-800 mb-8">
                  Why Invest in{" "}
                    <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
                    Agricultural Assets?
                  </span>
                </h2>
                  <p className="text-2xl text-emerald-700 max-w-4xl mx-auto">
                  Traditional markets are volatile, but agriculture provides stable, inflation-resistant returns 
                  backed by the world's most essential industry.
                  </p>
                </div>
                
                <div className="grid md:grid-cols-3 gap-12">
                  {[
                    { emoji: "💎", title: "Stable Returns", desc: "Agricultural assets provide consistent returns regardless of market volatility, as food demand remains constant.", color: "from-emerald-400 to-teal-500", icon: PiggyBank },
                    { emoji: "🌍", title: "Global Impact", desc: "Support sustainable farming practices while earning returns that contribute to global food security.", color: "from-teal-400 to-cyan-500", icon: Heart },
                    { emoji: "⚡", title: "Innovation", desc: "Be part of the blockchain revolution in agriculture, combining traditional farming with cutting-edge technology.", color: "from-green-400 to-emerald-500", icon: Zap }
                  ].map((item, index) => (
                    <div key={index} className="text-center group cursor-pointer">
                      <div className="text-8xl mb-6 group-hover:animate-bounce">{item.emoji}</div>
                      <div className="w-16 h-16 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                        <item.icon className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-3xl font-bold text-emerald-800 mb-6 group-hover:scale-105 transition-transform">{item.title}</h3>
                      <p className="text-emerald-700 group-hover:text-emerald-800 transition-colors text-lg leading-relaxed">
                        {item.desc}
                  </p>
                </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Ultra Fancy Agricultural Investment Stats Section */}
      <section className="relative py-20">
        <div className="w-full px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-5xl font-black text-emerald-800 mb-6">
                Ready to Start{" "}
                <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
                  Investing?
                </span>
              </h2>
              <p className="text-2xl text-emerald-700">
                Use the Connect HashPack button to connect your wallet and access the investor dashboard
              </p>
              
              {/* Ultra Fancy Agricultural Status Messages */}
              {error && (
                <div className="mt-8 max-w-2xl mx-auto">
                  <div className="relative bg-red-50 backdrop-blur-xl rounded-3xl p-8 border border-red-200">
                    <div className="flex items-center gap-3 text-red-600 mb-4">
                      <AlertCircle className="h-6 w-6 animate-pulse" />
                      <span className="font-bold text-xl">Connection Error</span>
                  </div>
                    <p className="text-red-700 mb-6">{error}</p>
                    <div className="flex justify-center gap-4">
                      <Button
                        onClick={handleRetryConnection}
                        variant="outline"
                        size="lg"
                        className="bg-red-500/20 border-red-500/50 text-red-300 hover:bg-red-500/30 group"
                      >
                        <RefreshCw className="h-5 w-5 mr-2 group-hover:rotate-180 transition-transform" />
                        Try Again
                      </Button>
                        <Button
                      onClick={() => window.location.reload()}
                      variant="ghost"
                        size="lg"
                        className="text-red-600 hover:bg-red-100 group"
                    >
                        <span className="group-hover:animate-bounce">🔄</span>
                      Refresh Page
                        </Button>
                    </div>
                      </div>
                    </div>
              )}

              {isConnected && accountId && (
                <div className="mt-8 max-w-2xl mx-auto">
                  <div className="relative bg-green-50 backdrop-blur-xl rounded-3xl p-8 border border-green-200">
                    <div className="flex items-center gap-3 text-green-600 mb-4">
                      <CheckCircle className="h-6 w-6 animate-bounce" />
                      <span className="font-bold text-xl">Wallet Connected Successfully!</span>
                    </div>
                    <p className="text-green-700 mb-2 bg-white/80 p-3 rounded-xl font-mono">
                      Account: {accountId ? `${accountId.slice(0, 6)}...${accountId.slice(-4)}` : 'Unknown'}
                    </p>
                    {hbarBalance && (
                      <p className="text-green-600 mb-2 bg-white/80 p-3 rounded-xl font-mono">
                        Balance: {hbarBalance} HBAR
                      </p>
                    )}
                    <p className="text-green-600 animate-pulse">
                      Redirecting to dashboard...
                    </p>
                  </div>
                </div>
              )}
              
              {isLoading && (
                <div className="mt-8 max-w-2xl mx-auto">
                  <div className="relative bg-amber-50 backdrop-blur-xl rounded-3xl p-8 border border-amber-200">
                    <div className="flex items-center gap-3 text-amber-600 mb-4">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      <span className="font-bold text-xl">Connecting to HashPack...</span>
                    </div>
                    <p className="text-amber-700 mb-4">
                      Please approve the connection in your HashPack wallet. You should be automatically redirected back to this page.
                    </p>
                    <div className="flex justify-center">
                    <Button
                        onClick={() => window.location.reload()}
                      variant="ghost"
                        size="lg"
                        className="text-amber-600 hover:bg-amber-100 group"
                    >
                        <RefreshCw className="h-5 w-5 mr-2 group-hover:rotate-180 transition-transform" />
                        Refresh Page
                    </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Ultra Fancy Agricultural Investment Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { value: "8-12%", label: "Expected APY", desc: "Sustainable returns from agricultural operations", color: "from-emerald-400 to-teal-500", emoji: "💰" },
                { value: "100%", label: "Asset Backed", desc: "Fully collateralized by physical crops", color: "from-teal-400 to-cyan-500", emoji: "💎" },
                { value: "24/7", label: "Transparency", desc: "Blockchain-verified supply chain tracking", color: "from-green-400 to-emerald-500", emoji: "👑" }
              ].map((stat, index) => (
                <div key={index} className="group relative">
                  <div className="absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl rounded-3xl" style={{background: `linear-gradient(135deg, ${stat.color.split(' ')[1]}, ${stat.color.split(' ')[3]})`}}></div>
                  <div className="relative bg-gradient-to-br from-emerald-50/90 to-teal-50/90 backdrop-blur-xl rounded-3xl p-8 border border-emerald-200/50 hover:border-emerald-400/70 transition-all duration-500 hover:scale-105 text-center shadow-lg hover:shadow-emerald-200/50">
                    <div className="text-6xl mb-4 group-hover:animate-bounce">{stat.emoji}</div>
                    <div className={`text-6xl font-black bg-gradient-to-r ${stat.color} bg-clip-text text-transparent mb-4 group-hover:scale-110 transition-transform`}>
                      {stat.value}
              </div>
                    <div className="text-2xl font-bold text-emerald-800 mb-2 group-hover:text-emerald-600 transition-colors">{stat.label}</div>
                    <div className="text-emerald-700 group-hover:text-emerald-800 transition-colors">{stat.desc}</div>
                    <div className="mt-6 w-full h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              </div>
              </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Ultra Fancy Agricultural HashPack Redirect Fallback */}
      {showRedirectFallback && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="relative max-w-md mx-4">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-3xl blur-xl"></div>
            <Card className="relative bg-white/95 backdrop-blur-xl border border-emerald-200/50 rounded-3xl shadow-2xl">
              <CardHeader className="text-center">
                <CardTitle className="text-3xl font-black bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
                  Wallet Connected
                </CardTitle>
            </CardHeader>
              <CardContent className="space-y-8 text-center">
                <div className="flex items-center justify-center gap-3 text-emerald-600">
                  <CheckCircle className="h-8 w-8 animate-bounce" />
                  <span className="font-bold text-xl">HashPack wallet connected successfully!</span>
              </div>
                <div className="text-emerald-700 bg-emerald-100 p-4 rounded-xl font-mono">
                Account: {confirmedAccountId}
              </div>
              <Button
                onClick={() => router.push('/dashboard/investor')}
                  className="w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:via-teal-400 hover:to-cyan-400 text-white font-bold py-4 px-8 rounded-2xl shadow-2xl hover:shadow-emerald-500/25 transition-all duration-300 hover:scale-105 group"
              >
                  <Wheat className="w-5 h-5 mr-2 group-hover:animate-bounce" />
                Continue to Dashboard
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </CardContent>
          </Card>
          </div>
        </div>
      )}
    </div>
  );
}