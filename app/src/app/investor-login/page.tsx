"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import {
  CheckCircle,
  AlertCircle,
  RefreshCw,
  ArrowRight,
  Wheat,
  Wallet,
  Loader2,
  Moon,
  Sun
} from "lucide-react";
import { useHashPackDirect } from "@/hooks/useHashPackDirect";
import { useTheme } from "next-themes";

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
  const { theme, setTheme } = useTheme();
  
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

  // Check for existing connection on mount FIRST (before anything else)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const existingAccount = localStorage.getItem('hashpack_account');
      if (existingAccount) {
        console.log('✅ Existing account found, redirecting:', existingAccount);
        setConfirmedAccountId(existingAccount);
        // Use replace instead of push to prevent back button issues
        router.replace('/investor-dashboard');
      }
    }
  }, [router]);

  // Handle successful connection
  useEffect(() => {
    if (isConnected && accountId) {
      console.log('✅ HashPack connected successfully:', accountId);
      // Store account in localStorage for persistence
      localStorage.setItem('hashpack_account', accountId);

      // Redirect to dashboard IMMEDIATELY after successful connection
      // Use replace instead of push to prevent back button issues
      router.replace('/investor-dashboard');
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
    
    alert(`HashPack Detection Results:\n${Object.entries(checks).map(([key, value]: [string, boolean]) => `${key}: ${value ? '✅' : '❌'}`).join('\n')}\n\nFound properties: ${hashpackProps.join(', ') || 'None'}\n\nHashPack specific: ${Object.entries(hashpackChecks).filter(([k, v]: [string, boolean]) => v).map(([k, v]: [string, boolean]) => k).join(', ') || 'None'}`);
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
    
    alert(`Debug Info:\n${Object.entries(debugInfo).map(([key, value]: [string, any]) => `${key}: ${value}`).join('\n')}`);
  };

  // Show loading state during hydration or when redirecting
  if (!isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50/30 via-teal-50/30 to-green-50/30 dark:from-[#0d1410] dark:via-[#0f1912] dark:to-[#0e1711]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-400 mx-auto mb-4"></div>
          <p className="text-emerald-700/80 dark:text-emerald-300/80">Loading...</p>
        </div>
      </div>
    );
  }

  // If already connected, show redirecting message instead of login page
  if (isConnected && accountId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50/30 via-teal-50/30 to-green-50/30 dark:from-[#0d1410] dark:via-[#0f1912] dark:to-[#0e1711]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-400 mx-auto mb-4"></div>
          <p className="text-emerald-700/80 dark:text-emerald-300/80 mb-2">Already connected!</p>
          <p className="text-emerald-600/70 dark:text-emerald-400/70 text-sm">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  // If we have confirmed account in localStorage, show redirecting
  if (confirmedAccountId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50/30 via-teal-50/30 to-green-50/30 dark:from-[#0d1410] dark:via-[#0f1912] dark:to-[#0e1711]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-400 mx-auto mb-4"></div>
          <p className="text-emerald-700/80 dark:text-emerald-300/80 mb-2">Already logged in!</p>
          <p className="text-emerald-600/70 dark:text-emerald-400/70 text-sm">Redirecting to dashboard...</p>
        </div>
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

      {/* Clean Header */}
      <div className="relative z-50 bg-white/90 dark:bg-[#121a16]/95 backdrop-blur-xl border-b border-emerald-100/50 dark:border-emerald-500/10 shadow-lg">
        <div className="px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 group cursor-pointer">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-orange-500 rounded-2xl blur-lg opacity-60 group-hover:opacity-80 transition-opacity duration-500"></div>
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
                <span className="text-3xl font-black bg-gradient-to-r from-emerald-600 via-teal-500 to-green-600 dark:from-emerald-400 dark:via-teal-400 dark:to-green-500 bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-300">
                  Hedarvest
                </span>
                <div className="text-xs text-emerald-600/70 dark:text-emerald-400/60 font-medium">Agricultural DeFi Platform</div>
              </div>
          </div>

            <div className="flex items-center gap-3">
              {!isConnected ? (
                <div className="flex items-center gap-3">
                  <Button
                    onClick={connect}
                    disabled={isLoading}
                    className="bg-gradient-to-r from-emerald-400 to-teal-500 dark:from-emerald-500 dark:to-teal-500 hover:from-emerald-500 hover:to-teal-600 dark:hover:from-emerald-600 dark:hover:to-teal-600 text-white shadow-lg"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <Wallet className="w-4 h-4 mr-2" />
                        Connect HashPack
                      </>
                    )}
                  </Button>
                  
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
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Card className="bg-gradient-to-r from-emerald-50/80 to-teal-50/80 dark:from-emerald-500/10 dark:to-teal-500/10 border-emerald-100/60 dark:border-emerald-500/15 shadow-lg backdrop-blur-sm">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 dark:from-emerald-500 dark:to-teal-500 rounded-xl flex items-center justify-center shadow-md shadow-emerald-400/20 dark:shadow-emerald-500/10">
                          <Wallet className="w-5 h-5 text-white" />
                        </div>
                        <div className="text-sm">
                          <div className="font-bold text-emerald-800 dark:text-emerald-200">
                      {accountId ? `${accountId.slice(0, 6)}...${accountId.slice(-4)}` : 'Connected'}
                          </div>
                      {hbarBalance && (
                            <div className="text-xs text-emerald-600/80 dark:text-emerald-300/80 font-mono">
                              ℏ {hbarBalance} HBAR
                            </div>
                          )}
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
                    onClick={disconnect}
                    variant="outline"
                    size="sm"
                    className="text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-500/20 hover:bg-gradient-to-r hover:from-rose-50 hover:to-red-50 dark:hover:from-rose-500/10 dark:hover:to-red-500/10 hover:border-rose-300 transition-all duration-300 hover:scale-105 shadow-md"
                  >
                    Disconnect
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            {/* Clean Badge */}
            <div className="mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50/80 dark:bg-emerald-500/10 border border-emerald-200/60 dark:border-emerald-500/20">
                <Wheat className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-emerald-700 dark:text-emerald-300 font-medium">Powered by Hedera Network</span>
              </div>
              </div>
              
            {/* Main Heading */}
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              <span className="block text-emerald-800 dark:text-emerald-200 mb-4">
                  Institutional-Grade
                </span>
              <span className="block bg-gradient-to-r from-emerald-600 via-teal-600 to-green-600 dark:from-emerald-400 dark:via-teal-400 dark:to-green-500 bg-clip-text text-transparent">
                  Agricultural Investing
                </span>
              </h1>
              
            {/* Subtitle */}
            <p className="text-xl text-emerald-700 dark:text-emerald-300 mb-12 max-w-3xl mx-auto leading-relaxed">
                Access a new asset class with predictable returns backed by real-world agricultural operations. 
                Earn sustainable yields while supporting global food security.
              </p>

            {/* CTA Button */}
            <div className="mb-16">
                <Button
                  onClick={connect}
                  disabled={isLoading}
                className="bg-gradient-to-r from-emerald-400 to-teal-500 dark:from-emerald-500 dark:to-teal-500 hover:from-emerald-500 hover:to-teal-600 dark:hover:from-emerald-600 dark:hover:to-teal-600 text-white font-bold py-4 px-8 rounded-2xl shadow-lg hover:shadow-emerald-400/25 transition-all duration-300 hover:scale-105 text-lg"
                >
                  {isLoading ? (
                    <>
                    <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                    Connecting to HashPack...
                    </>
                  ) : (
                    <>
                    <Wheat className="w-5 h-5 mr-3" />
                    Start Investing Now
                    <ArrowRight className="w-5 h-5 ml-3" />
                    </>
                  )}
                </Button>
              </div>
                          </div>
              
          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {[
              { title: "Real Asset Backing", desc: "100% collateralized by physical crops", emoji: "💎" },
              { title: "Predictable Yields", desc: "8-12% APY from agricultural operations", emoji: "💰" },
              { title: "Full Transparency", desc: "Blockchain-verified supply chain tracking", emoji: "👑" },
              { title: "Diversified Portfolio", desc: "Multiple crops and geographic regions", emoji: "💠" }
              ].map((item, index) => (
              <Card key={index} className="group bg-white/80 dark:bg-[#121a16]/80 backdrop-blur-sm border-emerald-100/60 dark:border-emerald-500/15 hover:border-emerald-300/60 dark:hover:border-emerald-400/30 transition-all duration-300 hover:scale-105 hover:shadow-lg shadow-emerald-100/20 dark:shadow-emerald-500/5">
                <CardContent className="p-6 text-center">
                  <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">{item.emoji}</div>
                  <h3 className="text-lg font-bold text-emerald-800 dark:text-emerald-200 mb-3 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{item.title}</h3>
                  <p className="text-emerald-700 dark:text-emerald-300 group-hover:text-emerald-800 dark:group-hover:text-emerald-200 transition-colors text-sm">{item.desc}</p>
                </CardContent>
              </Card>
              ))}
                        </div>

          {/* Why Invest Section */}
          <Card className="mb-16 bg-white/80 dark:bg-[#121a16]/80 backdrop-blur-sm border-emerald-100/60 dark:border-emerald-500/15 shadow-lg shadow-emerald-100/20 dark:shadow-emerald-500/5">
            <CardContent className="p-8">
              <div className="text-center mb-12">
                <h2 className="text-4xl font-bold text-emerald-800 dark:text-emerald-200 mb-6">
                  Why Invest in Agricultural Assets?
                </h2>
                <p className="text-xl text-emerald-700 dark:text-emerald-300 max-w-3xl mx-auto">
                  Traditional markets are volatile, but agriculture provides stable, inflation-resistant returns 
                  backed by the world's most essential industry.
                  </p>
                </div>
                
              <div className="grid md:grid-cols-3 gap-8">
                {[
                  { emoji: "💎", title: "Stable Returns", desc: "Agricultural assets provide consistent returns regardless of market volatility, as food demand remains constant." },
                  { emoji: "🌍", title: "Global Impact", desc: "Support sustainable farming practices while earning returns that contribute to global food security." },
                  { emoji: "⚡", title: "Innovation", desc: "Be part of the blockchain revolution in agriculture, combining traditional farming with cutting-edge technology." }
                  ].map((item, index) => (
                  <div key={index} className="text-center group">
                    <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">{item.emoji}</div>
                    <h3 className="text-2xl font-bold text-emerald-800 dark:text-emerald-200 mb-4 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{item.title}</h3>
                    <p className="text-emerald-700 dark:text-emerald-300 group-hover:text-emerald-800 dark:group-hover:text-emerald-200 transition-colors leading-relaxed">
                        {item.desc}
                  </p>
                </div>
                  ))}
                </div>
            </CardContent>
          </Card>

          {/* Status Messages */}
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-emerald-800 dark:text-emerald-200 mb-6">
              Ready to Start Investing?
              </h2>
            <p className="text-xl text-emerald-700 dark:text-emerald-300 mb-8">
                Use the Connect HashPack button to connect your wallet and access the investor dashboard
              </p>
              
            {/* Status Messages */}
              {error && (
              <Card className="max-w-2xl mx-auto mb-8 bg-red-50/80 dark:bg-red-500/10 border-red-200/60 dark:border-red-500/20">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 text-red-600 dark:text-red-400 mb-4">
                    <AlertCircle className="h-6 w-6" />
                      <span className="font-bold text-xl">Connection Error</span>
                  </div>
                  <p className="text-red-700 dark:text-red-300 mb-6">{error}</p>
                    <div className="flex justify-center gap-4">
                      <Button
                        onClick={handleRetryConnection}
                        variant="outline"
                      className="bg-red-500/20 border-red-500/50 text-red-600 dark:text-red-400 hover:bg-red-500/30"
                      >
                      <RefreshCw className="h-4 w-4 mr-2" />
                        Try Again
                      </Button>
                        <Button
                      onClick={() => window.location.reload()}
                      variant="ghost"
                      className="text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/10"
                    >
                      Refresh Page
                        </Button>
                    </div>
                </CardContent>
              </Card>
              )}

              {isConnected && accountId && (
              <Card className="max-w-2xl mx-auto mb-8 bg-green-50/80 dark:bg-green-500/10 border-green-200/60 dark:border-green-500/20">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 text-green-600 dark:text-green-400 mb-4">
                    <CheckCircle className="h-6 w-6" />
                      <span className="font-bold text-xl">Wallet Connected Successfully!</span>
                    </div>
                  <p className="text-green-700 dark:text-green-300 mb-2 bg-white/80 dark:bg-[#121a16]/80 p-3 rounded-xl font-mono">
                      Account: {accountId ? `${accountId.slice(0, 6)}...${accountId.slice(-4)}` : 'Unknown'}
                    </p>
                    {hbarBalance && (
                    <p className="text-green-600 dark:text-green-400 mb-2 bg-white/80 dark:bg-[#121a16]/80 p-3 rounded-xl font-mono">
                        Balance: {hbarBalance} HBAR
                      </p>
                    )}
                  <p className="text-green-600 dark:text-green-400">
                      Redirecting to dashboard...
                    </p>
                </CardContent>
              </Card>
              )}
              
              {isLoading && (
              <Card className="max-w-2xl mx-auto mb-8 bg-amber-50/80 dark:bg-amber-500/10 border-amber-200/60 dark:border-amber-500/20">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400 mb-4">
                    <Loader2 className="h-6 w-6 animate-spin" />
                      <span className="font-bold text-xl">Connecting to HashPack...</span>
                    </div>
                  <p className="text-amber-700 dark:text-amber-300 mb-4">
                      Please approve the connection in your HashPack wallet. You should be automatically redirected back to this page.
                    </p>
                    <div className="flex justify-center">
                    <Button
                        onClick={() => window.location.reload()}
                      variant="ghost"
                      className="text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-500/10"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh Page
                    </Button>
                  </div>
                </CardContent>
              </Card>
              )}
            </div>

          {/* Investment Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { value: "8-12%", label: "Expected APY", desc: "Sustainable returns from agricultural operations", emoji: "💰" },
              { value: "100%", label: "Asset Backed", desc: "Fully collateralized by physical crops", emoji: "💎" },
              { value: "24/7", label: "Transparency", desc: "Blockchain-verified supply chain tracking", emoji: "👑" }
            ].map((stat, index) => (
              <Card key={index} className="group bg-white/80 dark:bg-[#121a16]/80 backdrop-blur-sm border-emerald-100/60 dark:border-emerald-500/15 hover:border-emerald-300/60 dark:hover:border-emerald-400/30 transition-all duration-300 hover:scale-105 hover:shadow-lg shadow-emerald-100/20 dark:shadow-emerald-500/5">
                <CardContent className="p-6 text-center">
                  <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">{stat.emoji}</div>
                  <div className="text-4xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-green-600 dark:from-emerald-400 dark:via-teal-400 dark:to-green-500 bg-clip-text text-transparent mb-2 group-hover:scale-110 transition-transform">
                      {stat.value}
              </div>
                  <div className="text-lg font-bold text-emerald-800 dark:text-emerald-200 mb-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{stat.label}</div>
                  <div className="text-emerald-700 dark:text-emerald-300 group-hover:text-emerald-800 dark:group-hover:text-emerald-200 transition-colors text-sm">{stat.desc}</div>
                </CardContent>
              </Card>
              ))}
            </div>
        </div>
      </div>

      {/* HashPack Redirect Fallback */}
      {showRedirectFallback && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <Card className="max-w-md mx-4 bg-white/95 dark:bg-[#121a16]/95 backdrop-blur-xl border border-emerald-200/50 dark:border-emerald-500/20 shadow-2xl">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-emerald-800 dark:text-emerald-200">
                Wallet Connected
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 text-center">
              <div className="flex items-center justify-center gap-3 text-emerald-600 dark:text-emerald-400">
                <CheckCircle className="h-6 w-6" />
                <span className="font-bold text-lg">HashPack wallet connected successfully!</span>
              </div>
              <div className="text-emerald-700 dark:text-emerald-300 bg-emerald-100/80 dark:bg-emerald-500/10 p-4 rounded-xl font-mono">
                Account: {confirmedAccountId}
              </div>
              <Button
                onClick={() => router.push('/investor-dashboard')}
                className="w-full bg-gradient-to-r from-emerald-400 to-teal-500 dark:from-emerald-500 dark:to-teal-500 hover:from-emerald-500 hover:to-teal-600 dark:hover:from-emerald-600 dark:hover:to-teal-600 text-white font-bold py-3 px-6 rounded-xl shadow-lg hover:shadow-emerald-400/25 transition-all duration-300 hover:scale-105"
              >
                <Wheat className="w-4 h-4 mr-2" />
                Continue to Dashboard
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}