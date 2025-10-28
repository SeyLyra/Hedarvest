"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  PieChart,
  TrendingUp,
  DollarSign,
  Activity,
  RefreshCw,
  Eye,
  EyeOff
} from "lucide-react";
import TransactionHistory from "./TransactionHistory";

interface PortfolioPosition {
  assetType: string;
  poolAddress: string;
  shares: string;
  sharesFormatted?: number;
  positionValue: number;
  yieldEarned: number;
  apr: number;
  utilizationRate: string;
  totalDeposited: number;
  createdAt: string;
}

interface PortfolioData {
  investorAddress: string;
  totalDeposits: number;
  totalValue: number;
  totalYield: number;
  averageAPR: number;
  riskScore: number;
  positions: PortfolioPosition[];
  totalTransactions: number;
  recentTransactions: any[];
  transactionHistory: any[];
}

interface PortfolioPageProps {
  userAddress: string;
}

export default function PortfolioPage({ userAddress }: PortfolioPageProps) {
  const [portfolioData, setPortfolioData] = useState<PortfolioData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showValues, setShowValues] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPortfolio = async () => {
      if (!userAddress) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/api/investor/portfolio/${userAddress}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch portfolio: ${response.statusText}`);
        }
        
        const data = await response.json();
        setPortfolioData(data);
      } catch (err) {
        console.error('Error fetching portfolio:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch portfolio data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPortfolio();
  }, [userAddress]);

  // Use real data from portfolioData or fallback to 0
  const totalDeposited = portfolioData?.totalDeposits || 0;
  const totalEarned = portfolioData?.totalYield || 0;
  const totalValue = portfolioData?.totalValue || 0;
  const avgHealthScore = portfolioData?.riskScore || 0;
  const positions = portfolioData?.positions || [];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getHealthBarColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getUtilizationColor = (utilization: string) => {
    const util = Number(utilization);
    if (util >= 80) return 'text-red-600 bg-red-100';
    if (util >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-emerald-500 dark:text-emerald-400" />
          <p className="text-emerald-700/80 dark:text-emerald-300/70">Loading portfolio...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100/80 dark:bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Activity className="w-8 h-8 text-red-500 dark:text-red-400" />
          </div>
          <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">Error Loading Portfolio</h3>
          <p className="text-red-600/80 dark:text-red-300/70 mb-4">{error}</p>
          <Button
            onClick={() => window.location.reload()}
            variant="outline"
            className="text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/20 hover:bg-red-50/80 dark:hover:bg-red-500/10"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
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
            Portfolio
          </h1>
          <p className="text-emerald-600/80 dark:text-emerald-300/70 text-lg font-medium">Track your investments and earnings</p>
          <div className="flex items-center gap-2 mt-2">
            <div className="w-2 h-2 bg-emerald-400 dark:bg-emerald-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-emerald-600/80 dark:text-emerald-300/80 font-medium">Real-time Updates</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowValues(!showValues)}
            className="text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20 hover:bg-gradient-to-r hover:from-emerald-50/80 hover:to-teal-50/80 dark:hover:from-emerald-500/10 dark:hover:to-teal-500/10 hover:border-emerald-300 transition-all duration-300 hover:scale-105 shadow-md"
          >
            {showValues ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
            {showValues ? 'Hide' : 'Show'} Values
          </Button>
          <Button
            variant="outline"
            className="text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20 hover:bg-gradient-to-r hover:from-emerald-50/80 hover:to-teal-50/80 dark:hover:from-emerald-500/10 dark:hover:to-teal-500/10 hover:border-emerald-300 transition-all duration-300 hover:scale-105 shadow-md"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Portfolio Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-emerald-50/70 to-teal-50/70 dark:from-emerald-500/10 dark:to-teal-500/10 border-emerald-200/50 dark:border-emerald-500/15 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
              <div>
                <p className="text-sm text-emerald-600/80 dark:text-emerald-300/80">Total Deposited</p>
                <p className="text-2xl font-bold text-emerald-800 dark:text-emerald-200">
                  {showValues ? formatCurrency(totalDeposited) : '••••••'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-teal-50/70 to-cyan-50/70 dark:from-teal-500/10 dark:to-cyan-500/10 border-teal-200/50 dark:border-teal-500/15 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-teal-500 dark:text-teal-400" />
              <div>
                <p className="text-sm text-teal-600/80 dark:text-teal-300/80">Earned Interest</p>
                <p className="text-2xl font-bold text-teal-800 dark:text-teal-200">
                  {showValues ? formatCurrency(totalEarned) : '••••••'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50/70 to-emerald-50/70 dark:from-green-500/10 dark:to-emerald-500/10 border-green-200/50 dark:border-green-500/15 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <PieChart className="w-5 h-5 text-green-500 dark:text-green-400" />
              <div>
                <p className="text-sm text-green-600/80 dark:text-green-300/80">Current Value</p>
                <p className="text-2xl font-bold text-green-800 dark:text-green-200">
                  {showValues ? formatCurrency(totalValue) : '••••••'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-lime-50/70 to-green-50/70 dark:from-lime-500/10 dark:to-green-500/10 border-lime-200/50 dark:border-lime-500/15 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-lime-500 dark:text-lime-400" />
              <div>
                <p className="text-sm text-lime-600/80 dark:text-lime-300/80">Risk Score</p>
                <p className="text-2xl font-bold text-lime-800 dark:text-lime-200">
                  {avgHealthScore.toFixed(0)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Positions */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-emerald-800 dark:text-emerald-200">Your Positions</h2>
        
        {positions.length === 0 ? (
          <Card className="bg-white/95 dark:bg-[#121a16]/90 backdrop-blur-sm border-emerald-100/60 dark:border-emerald-500/15 shadow-md">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-emerald-100/80 dark:bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <PieChart className="w-8 h-8 text-emerald-500 dark:text-emerald-400" />
              </div>
              <h3 className="text-lg font-semibold text-emerald-800 dark:text-emerald-200 mb-2">No Positions Yet</h3>
              <p className="text-emerald-600/80 dark:text-emerald-300/70">Start investing in pools to see your portfolio here.</p>
            </CardContent>
          </Card>
        ) : (
          positions.map((position, index) => (
            <Card key={`${position.assetType}-${index}`} className="bg-white/95 dark:bg-[#121a16]/90 backdrop-blur-sm border-emerald-100/60 dark:border-emerald-500/15 hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl text-emerald-800 dark:text-emerald-200">{position.assetType}</CardTitle>
                  <Badge 
                    variant="secondary" 
                    className={`${getUtilizationColor(position.utilizationRate)} border-0`}
                  >
                    Utilization: {Number(position.utilizationRate).toFixed(1)}%
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Position Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-emerald-50/80 dark:bg-emerald-500/10 rounded-lg p-3">
                    <p className="text-xs text-emerald-600/80 dark:text-emerald-300/80 mb-1">Deposited</p>
                    <p className="font-bold text-emerald-800 dark:text-emerald-200">
                      {showValues ? formatCurrency(position.totalDeposited) : '••••••'}
                    </p>
                  </div>
                  
                  <div className="bg-teal-50/80 dark:bg-teal-500/10 rounded-lg p-3">
                    <p className="text-xs text-teal-600/80 dark:text-teal-300/80 mb-1">LP Shares</p>
                    <p className="font-bold text-teal-800 dark:text-teal-200">
                      {showValues ? (position.sharesFormatted ?? 0).toFixed(6) : '••••••'}
                    </p>
                  </div>
                  
                  <div className="bg-green-50/80 dark:bg-green-500/10 rounded-lg p-3">
                    <p className="text-xs text-green-600/80 dark:text-green-300/80 mb-1">Yield Earned</p>
                    <p className="font-bold text-green-800 dark:text-green-200">
                      {showValues ? formatCurrency(position.yieldEarned) : '••••••'}
                    </p>
                  </div>
                  
                  <div className="bg-lime-50/80 dark:bg-lime-500/10 rounded-lg p-3">
                    <p className="text-xs text-lime-600/80 dark:text-lime-300/80 mb-1">Current Value</p>
                    <p className="font-bold text-lime-800 dark:text-lime-200">
                      {showValues ? formatCurrency(position.positionValue) : '••••••'}
                    </p>
                  </div>
                </div>

                {/* Utilization Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>Pool Utilization</span>
                    <span>{Number(position.utilizationRate).toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className={`h-3 rounded-full transition-all duration-500 ${getHealthBarColor(Number(position.utilizationRate))}`}
                      style={{ width: `${Math.min(Number(position.utilizationRate), 100)}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Low Risk</span>
                    <span>Medium Risk</span>
                    <span>High Risk</span>
                  </div>
                </div>

                {/* Pool Info */}
                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-emerald-100 dark:border-emerald-500/15">
                  <div className="text-center">
                    <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70">Pool APR</p>
                    <p className="font-semibold text-emerald-800 dark:text-emerald-200">{(position.apr * 100).toFixed(2)}%</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70">Pool Address</p>
                    <p className="font-mono text-xs text-emerald-600/70 dark:text-emerald-400/70 break-all">
                      {position.poolAddress.slice(0, 8)}...{position.poolAddress.slice(-6)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Transaction History from HCS */}
      <TransactionHistory 
        userAddress={userAddress} 
        transactions={portfolioData?.transactionHistory || []}
      />
    </div>
  );
}
