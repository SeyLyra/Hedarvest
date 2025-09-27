'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { WalletConnectButton } from '@/components/auth/WalletConnectButton';
import { useWallet } from '@/hooks/useWallet';
import { TrendingUp, Shield, DollarSign, ArrowRight, CheckCircle } from 'lucide-react';
import { Loader } from '@/components/shared/Loader';
import { LoadingButton } from '@/components/shared/LoadingButton';

export default function InvestorLoginPage() {
  const router = useRouter();
  const { isConnected, isConnecting, address, error, connectMetaMask } = useWallet();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'connecting' | 'switching-network' | 'connected'>('idle');
  const [isDirectConnecting, setIsDirectConnecting] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(0);

  // Memoize the wallet state to prevent dependency array changes
  const walletState = useMemo(() => ({
    isConnected,
    isConnecting,
    address,
    forceUpdate
  }), [isConnected, isConnecting, address, forceUpdate]);

  // Check if wallet is already connected on page load
  useEffect(() => {
    console.log('=== PAGE LOAD WALLET CHECK ===');
    console.log('Initial wallet state:', { isConnected, isConnecting, address });
    
    if (isConnected && address) {
      console.log('Wallet already connected, redirecting...');
      setTimeout(() => {
        window.location.href = '/dashboard/investor';
      }, 100);
    }
  }, []);

  // Auto-redirect if wallet is already connected
  useEffect(() => {
    console.log('=== WALLET STATE EFFECT ===');
    console.log('Wallet state changed:', walletState);
    console.log('isConnected:', walletState.isConnected);
    console.log('isConnecting:', walletState.isConnecting);
    console.log('address:', walletState.address);
    
    if (walletState.isConnected && !walletState.isConnecting && walletState.address) {
      console.log('✅ Conditions met for redirect');
      console.log('Redirecting to dashboard...');
      setConnectionStatus('connected');
      setIsRedirecting(true);
      // Redirect immediately after wallet is connected
      console.log('Executing redirect...');
      setTimeout(() => {
        window.location.href = '/dashboard/investor';
      }, 100);
    } else {
      console.log('❌ Conditions not met for redirect');
      console.log('isConnected:', walletState.isConnected);
      console.log('isConnecting:', walletState.isConnecting);
      console.log('address:', walletState.address);
    }
  }, [walletState]);

  const handleWalletConnected = () => {
    console.log('Wallet connected callback triggered');
    setConnectionStatus('connected');
    setIsRedirecting(true);
    // Redirect immediately after successful connection
    console.log('Executing redirect from callback...');
    window.location.href = '/dashboard/investor';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(0,0,0,0.1)_1px,transparent_0)] bg-[length:20px_20px]"></div>
      </div>
      
      {/* Header */}
      <div className="relative z-10 border-b bg-card/80 backdrop-blur-sm">
        <div className="w-full px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-r from-agricultural-green to-golden-accent shadow-lg"></div>
              <span className="text-3xl font-bold text-foreground">Hedarvest</span>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => router.push('/')}
              className="hover:bg-muted/50 transition-colors"
            >
              ← Back to Home
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex items-center justify-center min-h-[calc(100vh-120px)] px-8 py-16">
        <div className="w-full max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left Column - Content */}
            <div className="space-y-12">
              {/* Hero Section */}
              <div className="space-y-8">
                <div className="space-y-6">
                  <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-agricultural-green/10 to-trust-blue/10 border border-agricultural-green/20 text-agricultural-green text-sm font-medium">
                    🌾 Agricultural Finance Revolution
                  </div>
                  
                  <h1 className="text-5xl md:text-6xl font-bold text-foreground leading-tight">
                    Invest in Real-World{" "}
                    <span className="bg-gradient-to-r from-agricultural-green via-trust-blue to-golden-accent bg-clip-text text-transparent">
                      Yields
                    </span>
                  </h1>
                  
                  <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl">
                    By becoming an investor, you provide liquidity into agricultural lending pools and earn sustainable yield backed by real assets.
                  </p>
                </div>

                {/* Supported Wallets */}
                <div className="space-y-4">
                  <p className="text-lg font-medium text-foreground">
                    We currently support MetaMask (EVM) and HashPack (Hedera).
                  </p>
                  <div className="flex gap-3">
                    <Badge variant="outline" className="bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border-blue-200 px-4 py-2 text-sm font-medium">
                      🦊 MetaMask
                    </Badge>
                    <Badge variant="outline" className="bg-gradient-to-r from-purple-50 to-purple-100 text-purple-700 border-purple-200 px-4 py-2 text-sm font-medium">
                      🔗 HashPack
                    </Badge>
                  </div>
                </div>

                {/* Security Note */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6 shadow-sm">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Shield className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-green-800 mb-2">
                        Your wallet is your login
                      </p>
                      <p className="text-green-700 leading-relaxed">
                        No password is required, and you always stay in control of your funds. 
                        Your private keys never leave your device.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Info Card */}
              <Card className="bg-gradient-to-br from-agricultural-green/5 via-trust-blue/5 to-golden-accent/5 border-agricultural-green/20 shadow-xl">
                <CardHeader className="pb-4">
                  <CardTitle className="text-2xl font-bold text-foreground flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-agricultural-green to-trust-blue rounded-full flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 text-white" />
                    </div>
                    Why Invest with Hedarvest?
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-foreground mb-2">Earn yield on real-world collateral</p>
                      <p className="text-muted-foreground leading-relaxed">
                        Your investments are backed by actual agricultural assets, not synthetic tokens. 
                        Real farmers, real crops, real returns.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <CheckCircle className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-foreground mb-2">Withdraw anytime</p>
                      <p className="text-muted-foreground leading-relaxed">
                        No lock-up periods. Access your funds when you need them with instant liquidity.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <CheckCircle className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-foreground mb-2">Transparent on-chain pools</p>
                      <p className="text-muted-foreground leading-relaxed">
                        All transactions are verifiable on the blockchain for complete transparency and trust.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Wallet Connection */}
            <div className="space-y-10">
              {/* Connection Card */}
              <Card className="bg-gradient-to-br from-card via-card to-muted/20 border-border shadow-2xl backdrop-blur-sm">
                <CardHeader className="text-center pb-6">
                  <div className="w-20 h-20 bg-gradient-to-r from-agricultural-green via-trust-blue to-golden-accent rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                    <DollarSign className="w-10 h-10 text-white" />
                  </div>
                  <CardTitle className="text-3xl font-bold text-foreground mb-3">
                    Connect Your Wallet
                  </CardTitle>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    Connect your MetaMask or HashPack wallet to start investing in real-world agricultural yields
                  </p>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  {/* Success State */}
                  {isConnected && isRedirecting ? (
                    <div className="text-center space-y-6">
                      <div className="w-20 h-20 bg-gradient-to-r from-green-100 to-emerald-100 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
                        <CheckCircle className="w-10 h-10 text-green-600" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-foreground mb-3">
                          🎉 Wallet Connected Successfully!
                        </h3>
                        <p className="text-lg text-muted-foreground mb-2">
                          Welcome, <span className="font-mono font-semibold text-foreground">{address?.slice(0, 6)}...{address?.slice(-4)}</span>
                        </p>
                        <p className="text-muted-foreground">
                          Redirecting to your dashboard...
                        </p>
                      </div>
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-agricultural-green"></div>
                      </div>
                    </div>
                  ) : isConnecting ? (
                    <div className="text-center space-y-6">
                      <div className="w-20 h-20 bg-gradient-to-r from-blue-100 to-trust-blue/20 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-trust-blue"></div>
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-foreground mb-3">
                          {error && error.includes('switch to Hedera') ? 'Switching Network...' : 'Connecting Wallet...'}
                        </h3>
                        <p className="text-lg text-muted-foreground">
                          {error && error.includes('switch to Hedera') 
                            ? 'Please switch to Hedera Testnet in MetaMask to continue'
                            : 'Please approve the connection in your wallet'
                          }
                        </p>
                      </div>
                    </div>
                  ) : error ? (
                    <div className="text-center space-y-6">
                      <div className="w-20 h-20 bg-gradient-to-r from-red-100 to-red-200 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
                        <div className="w-10 h-10 text-red-600">⚠️</div>
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-foreground mb-3">
                          Connection Failed
                        </h3>
                        <p className="text-lg text-muted-foreground mb-4">
                          {error}
                        </p>
                        <Button 
                          onClick={() => window.location.reload()} 
                          variant="outline"
                          className="mt-4"
                        >
                          Try Again
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Wallet Connection Button */}
                      <div className="space-y-6">
                        <WalletConnectButton
                          variant="default"
                          size="lg"
                          className="w-full text-xl py-8 bg-gradient-to-r from-agricultural-green to-trust-blue hover:from-agricultural-green/90 hover:to-trust-blue/90 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                          onConnected={handleWalletConnected}
                        />
                        
                        {/* Direct MetaMask Connection Button */}
                        <LoadingButton
                          onClick={async () => {
                            console.log('=== DIRECT METAMASK CONNECTION ===');
                            console.log('Current state before connection:', { isConnected, isConnecting, address, error });
                            
                            setIsDirectConnecting(true);
                            try {
                              console.log('Calling connectMetaMask from hook...');
                              await connectMetaMask();
                              console.log('connectMetaMask completed');
                              
                              // Check state after connection
                              console.log('State after connection:', { isConnected, isConnecting, address, error });
                              
                              // Force redirect if connected
                              if (isConnected && address) {
                                console.log('Force redirecting after direct connection...');
                                setTimeout(() => {
                                  window.location.href = '/dashboard/investor';
                                }, 500);
                              }
                            } catch (err) {
                              console.error('Direct connection failed:', err);
                            } finally {
                              setIsDirectConnecting(false);
                            }
                          }}
                          variant="outline"
                          className="w-full"
                          isLoading={isDirectConnecting}
                          loadingText="Connecting to MetaMask..."
                        >
                          🦊 Connect MetaMask Direct
                        </LoadingButton>
                        
                        {/* Debug Info */}
                        <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                          <h4 className="font-semibold mb-2">Debug Info:</h4>
                          <div className="text-sm space-y-1">
                            <p>isConnected: {isConnected ? '✅' : '❌'}</p>
                            <p>isConnecting: {isConnecting ? '🔄' : '⏸️'}</p>
                            <p>address: {address || 'None'}</p>
                            <p>error: {error || 'None'}</p>
                            <p>isRedirecting: {isRedirecting ? '🔄' : '⏸️'}</p>
                          </div>
                          <div className="flex gap-2 mt-2">
                            <Button
                              onClick={() => {
                                console.log('Manual redirect triggered');
                                window.location.href = '/dashboard/investor';
                              }}
                              variant="outline"
                              size="sm"
                            >
                              🔄 Manual Redirect
                            </Button>
                            <Button
                              onClick={() => {
                                console.log('Force refresh triggered');
                                setForceUpdate(prev => prev + 1);
                              }}
                              variant="outline"
                              size="sm"
                            >
                              🔄 Force Refresh
                            </Button>
                          </div>
                        </div>

                        <div className="text-center space-y-2">
                          <p className="text-sm text-muted-foreground">
                            By connecting, you agree to our Terms of Service
                          </p>
                          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                            <Shield className="w-3 h-3" />
                            <span>Secure • Private • Non-custodial</span>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Features Preview - Only show when not connected */}
                  {!isConnected && (
                    <div className="space-y-4">
                      <h4 className="text-lg font-semibold text-foreground text-center">
                        What you'll get access to:
                      </h4>
                      <div className="grid grid-cols-1 gap-4">
                        <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-agricultural-green/5 to-trust-blue/5 rounded-xl border border-agricultural-green/10">
                          <div className="w-10 h-10 bg-gradient-to-r from-agricultural-green/20 to-agricultural-green/10 rounded-xl flex items-center justify-center">
                            <TrendingUp className="w-5 h-5 text-agricultural-green" />
                          </div>
                          <span className="font-medium text-foreground">Real-time pool analytics</span>
                        </div>
                        
                        <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-trust-blue/5 to-purple-50 rounded-xl border border-trust-blue/10">
                          <div className="w-10 h-10 bg-gradient-to-r from-trust-blue/20 to-trust-blue/10 rounded-xl flex items-center justify-center">
                            <Shield className="w-5 h-5 text-trust-blue" />
                          </div>
                          <span className="font-medium text-foreground">Secure wallet integration</span>
                        </div>
                        
                        <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-golden-accent/5 to-yellow-50 rounded-xl border border-golden-accent/10">
                          <div className="w-10 h-10 bg-gradient-to-r from-golden-accent/20 to-golden-accent/10 rounded-xl flex items-center justify-center">
                            <DollarSign className="w-5 h-5 text-golden-accent" />
                          </div>
                          <span className="font-medium text-foreground">Instant deposit & withdrawal</span>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Trust Indicators */}
              <div className="bg-gradient-to-r from-muted/40 via-muted/20 to-muted/40 rounded-2xl p-8 border border-border/50 shadow-lg">
                <h4 className="text-xl font-bold text-foreground mb-6 text-center">
                  Trusted by Investors
                </h4>
                <div className="grid grid-cols-3 gap-6 text-center">
                  <div className="space-y-2">
                    <div className="text-3xl font-bold text-agricultural-green">8.2%</div>
                    <div className="text-sm text-muted-foreground font-medium">Avg APY</div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-3xl font-bold text-trust-blue">$2.4M</div>
                    <div className="text-sm text-muted-foreground font-medium">Total Value</div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-3xl font-bold text-golden-accent">165%</div>
                    <div className="text-sm text-muted-foreground font-medium">Collateral Ratio</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 border-t bg-card/80 backdrop-blur-sm">
        <div className="w-full px-8 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-xl bg-gradient-to-r from-agricultural-green to-golden-accent shadow-lg"></div>
              <span className="text-xl font-bold text-foreground">Hedarvest</span>
            </div>
            <div className="flex items-center gap-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-agricultural-green"></div>
                <span>Powered by Hedera Network</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-trust-blue"></div>
                <span>Blockchain Verified</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-golden-accent"></div>
                <span>Real-World Assets</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
