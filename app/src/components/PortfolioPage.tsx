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

interface PortfolioPosition {
  id: string;
  grainType: string;
  amountDeposited: number;
  lpTokens: number;
  earnedInterest: number;
  currentValue: number;
  utilizationRate: number;
  apr: number;
  healthScore: number;
}

interface PortfolioPageProps {
  userAddress: string;
}

export default function PortfolioPage({ userAddress }: PortfolioPageProps) {
  const [positions, setPositions] = useState<PortfolioPosition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showValues, setShowValues] = useState(true);

  // Mock data - in a real app, this would come from API
  const mockPositions: PortfolioPosition[] = [
    {
      id: "1",
      grainType: "Wheat",
      amountDeposited: 5000,
      lpTokens: 20.5,
      earnedInterest: 125.50,
      currentValue: 5125.50,
      utilizationRate: 75,
      apr: 8.5,
      healthScore: 85
    },
    {
      id: "2", 
      grainType: "Corn",
      amountDeposited: 3000,
      lpTokens: 16.7,
      earnedInterest: 67.20,
      currentValue: 3067.20,
      utilizationRate: 60,
      apr: 9.2,
      healthScore: 92
    },
    {
      id: "3",
      grainType: "Soybeans",
      amountDeposited: 8000,
      lpTokens: 25.0,
      earnedInterest: 156.80,
      currentValue: 8156.80,
      utilizationRate: 90,
      apr: 7.8,
      healthScore: 70
    }
  ];

  useEffect(() => {
    // Simulate API call
    const fetchPortfolio = async () => {
      setIsLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      setPositions(mockPositions);
      setIsLoading(false);
    };

    fetchPortfolio();
  }, []);

  const totalDeposited = positions.reduce((sum, pos) => sum + pos.amountDeposited, 0);
  const totalEarned = positions.reduce((sum, pos) => sum + pos.earnedInterest, 0);
  const totalValue = positions.reduce((sum, pos) => sum + pos.currentValue, 0);
  const avgHealthScore = positions.length > 0 ? positions.reduce((sum, pos) => sum + pos.healthScore, 0) / positions.length : 0;

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-emerald-600" />
          <p className="text-emerald-700">Loading portfolio...</p>
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
            Portfolio
          </h1>
          <p className="text-emerald-600 text-lg font-medium">Track your investments and earnings</p>
          <div className="flex items-center gap-2 mt-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-emerald-600 font-medium">Real-time Updates</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowValues(!showValues)}
            className="text-emerald-600 border-emerald-200 hover:bg-gradient-to-r hover:from-emerald-50 hover:to-teal-50 hover:border-emerald-300 transition-all duration-300 hover:scale-105 shadow-lg"
          >
            {showValues ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
            {showValues ? 'Hide' : 'Show'} Values
          </Button>
          <Button
            variant="outline"
            className="text-emerald-600 border-emerald-200 hover:bg-gradient-to-r hover:from-emerald-50 hover:to-teal-50 hover:border-emerald-300 transition-all duration-300 hover:scale-105 shadow-lg"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Portfolio Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-600" />
              <div>
                <p className="text-sm text-emerald-600">Total Deposited</p>
                <p className="text-2xl font-bold text-emerald-800">
                  {showValues ? formatCurrency(totalDeposited) : '••••••'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm text-blue-600">Earned Interest</p>
                <p className="text-2xl font-bold text-blue-800">
                  {showValues ? formatCurrency(totalEarned) : '••••••'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <PieChart className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-sm text-purple-600">Current Value</p>
                <p className="text-2xl font-bold text-purple-800">
                  {showValues ? formatCurrency(totalValue) : '••••••'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-red-50 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-orange-600" />
              <div>
                <p className="text-sm text-orange-600">Health Score</p>
                <p className="text-2xl font-bold text-orange-800">
                  {avgHealthScore.toFixed(0)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Positions */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-emerald-800">Your Positions</h2>
        
        {positions.length === 0 ? (
          <Card className="bg-white/80 backdrop-blur-sm border-emerald-200">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <PieChart className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-lg font-semibold text-emerald-800 mb-2">No Positions Yet</h3>
              <p className="text-emerald-600">Start investing in pools to see your portfolio here.</p>
            </CardContent>
          </Card>
        ) : (
          positions.map((position) => (
            <Card key={position.id} className="bg-white/80 backdrop-blur-sm border-emerald-200 hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl text-emerald-800">{position.grainType}</CardTitle>
                  <Badge 
                    variant="secondary" 
                    className={`${getHealthColor(position.healthScore)} border-0`}
                  >
                    Health: {position.healthScore}%
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Position Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-emerald-50 rounded-lg p-3">
                    <p className="text-xs text-emerald-600 mb-1">Deposited</p>
                    <p className="font-bold text-emerald-800">
                      {showValues ? formatCurrency(position.amountDeposited) : '••••••'}
                    </p>
                  </div>
                  
                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-xs text-blue-600 mb-1">LP Tokens</p>
                    <p className="font-bold text-blue-800">
                      {showValues ? position.lpTokens.toFixed(2) : '••••••'}
                    </p>
                  </div>
                  
                  <div className="bg-green-50 rounded-lg p-3">
                    <p className="text-xs text-green-600 mb-1">Earned Interest</p>
                    <p className="font-bold text-green-800">
                      {showValues ? formatCurrency(position.earnedInterest) : '••••••'}
                    </p>
                  </div>
                  
                  <div className="bg-purple-50 rounded-lg p-3">
                    <p className="text-xs text-purple-600 mb-1">Current Value</p>
                    <p className="font-bold text-purple-800">
                      {showValues ? formatCurrency(position.currentValue) : '••••••'}
                    </p>
                  </div>
                </div>

                {/* Health Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>Portfolio Health</span>
                    <span>{position.healthScore}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className={`h-3 rounded-full transition-all duration-500 ${getHealthBarColor(position.healthScore)}`}
                      style={{ width: `${Math.min(position.healthScore, 100)}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Poor</span>
                    <span>Good</span>
                    <span>Excellent</span>
                  </div>
                </div>

                {/* Pool Info */}
                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-200">
                  <div className="text-center">
                    <p className="text-xs text-gray-600">Pool APR</p>
                    <p className="font-semibold text-emerald-800">{position.apr}%</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-600">Utilization</p>
                    <p className="font-semibold text-emerald-800">{position.utilizationRate}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Performance Chart Placeholder */}
      <Card className="bg-white/80 backdrop-blur-sm border-emerald-200">
        <CardHeader>
          <CardTitle className="text-emerald-800">Performance Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <PieChart className="w-12 h-12 text-emerald-400 mx-auto mb-2" />
              <p className="text-emerald-600">Performance chart coming soon</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
