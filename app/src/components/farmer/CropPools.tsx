"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Lock, 
  DollarSign, 
  Percent, 
  Users, 
  Search, 
  Filter, 
  ArrowUpRight, 
  ArrowDownRight,
  Info,
  Shield,
  Activity,
  Clock,
  Zap,
  Target,
  PieChart
} from "lucide-react";

interface CropPool {
  id: string;
  name: string;
  cropType: string;
  totalLiquidity: number;
  apy: number;
  utilization: number;
  available: number;
  icon: string;
  color: string;
  riskLevel: "low" | "medium" | "high";
  minDeposit: number;
  maxDeposit: number;
  lockPeriod: number; // in days
  totalDepositors: number;
  lastUpdated: string;
}

interface CropPoolsProps {
  onDeposit: (poolId: string) => void;
  onViewDetails: (poolId: string) => void;
  onBorrow?: (poolId: string) => void;
}

export default function CropPools({ onDeposit, onViewDetails, onBorrow }: CropPoolsProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"apy" | "liquidity" | "utilization">("apy");
  const [filterRisk, setFilterRisk] = useState<"all" | "low" | "medium" | "high">("all");

  // Mock data for farmer's collateral deposits (for borrowing)
  const farmerCollateral = {
    "rice-pool": { hasCollateral: true, amount: 2500, depositedAt: "2024-01-15" },
    "corn-pool": { hasCollateral: false, amount: 0, depositedAt: null },
    "wheat-pool": { hasCollateral: true, amount: 1200, depositedAt: "2024-01-10" },
    "soybean-pool": { hasCollateral: false, amount: 0, depositedAt: null },
    "cotton-pool": { hasCollateral: false, amount: 0, depositedAt: null },
    "sugar-pool": { hasCollateral: false, amount: 0, depositedAt: null }
  };

  const cropPools: CropPool[] = [
    {
      id: "rice-pool",
      name: "RICE Pool",
      cropType: "Rice",
      totalLiquidity: 150000,
      apy: 8.5,
      utilization: 65,
      available: 52500,
      icon: "🌾",
      color: "green",
      riskLevel: "low",
      minDeposit: 100,
      maxDeposit: 10000,
      lockPeriod: 30,
      totalDepositors: 45,
      lastUpdated: "2 hours ago"
    },
    {
      id: "corn-pool",
      name: "CORN Pool", 
      cropType: "Corn",
      totalLiquidity: 200000,
      apy: 7.2,
      utilization: 78,
      available: 44000,
      icon: "🌽",
      color: "yellow",
      riskLevel: "medium",
      minDeposit: 200,
      maxDeposit: 15000,
      lockPeriod: 45,
      totalDepositors: 67,
      lastUpdated: "1 hour ago"
    },
    {
      id: "wheat-pool",
      name: "WHEAT Pool",
      cropType: "Wheat", 
      totalLiquidity: 120000,
      apy: 9.1,
      utilization: 45,
      available: 66000,
      icon: "🌾",
      color: "amber",
      riskLevel: "low",
      minDeposit: 150,
      maxDeposit: 12000,
      lockPeriod: 30,
      totalDepositors: 32,
      lastUpdated: "3 hours ago"
    },
    {
      id: "soybean-pool",
      name: "SOYBEAN Pool",
      cropType: "Soybean",
      totalLiquidity: 180000,
      apy: 6.8,
      utilization: 82,
      available: 32400,
      icon: "🫘",
      color: "brown",
      riskLevel: "high",
      minDeposit: 300,
      maxDeposit: 20000,
      lockPeriod: 60,
      totalDepositors: 28,
      lastUpdated: "30 minutes ago"
    },
    {
      id: "cotton-pool",
      name: "COTTON Pool",
      cropType: "Cotton",
      totalLiquidity: 95000,
      apy: 10.2,
      utilization: 38,
      available: 58900,
      icon: "🌿",
      color: "emerald",
      riskLevel: "medium",
      minDeposit: 100,
      maxDeposit: 8000,
      lockPeriod: 40,
      totalDepositors: 19,
      lastUpdated: "1 hour ago"
    },
    {
      id: "sugar-pool",
      name: "SUGAR Pool",
      cropType: "Sugar Cane",
      totalLiquidity: 220000,
      apy: 5.9,
      utilization: 91,
      available: 19800,
      icon: "🍯",
      color: "orange",
      riskLevel: "high",
      minDeposit: 500,
      maxDeposit: 25000,
      lockPeriod: 90,
      totalDepositors: 41,
      lastUpdated: "15 minutes ago"
    }
  ];

  const filteredPools = cropPools
    .filter(pool => 
      pool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pool.cropType.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter(pool => filterRisk === "all" || pool.riskLevel === filterRisk)
    .sort((a, b) => {
      switch (sortBy) {
        case "apy":
          return b.apy - a.apy;
        case "liquidity":
          return b.totalLiquidity - a.totalLiquidity;
        case "utilization":
          return b.utilization - a.utilization;
        default:
          return 0;
      }
    });

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "low": return "text-green-600 bg-green-100";
      case "medium": return "text-yellow-600 bg-yellow-100";
      case "high": return "text-red-600 bg-red-100";
      default: return "text-gray-600 bg-gray-100";
    }
  };

  const getUtilizationColor = (utilization: number) => {
    if (utilization < 50) return "text-green-600";
    if (utilization < 80) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center py-6">
        <div className="flex items-center justify-center mb-4">
          <div className="p-4 bg-gradient-to-r from-agricultural-green to-trust-blue rounded-full">
            <BarChart3 className="h-8 w-8 text-white" />
          </div>
        </div>
        <h2 className="text-3xl font-bold text-foreground mb-2">Crop Lending Pools</h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Borrow funds using your crop tokens as collateral. These pools are funded by lenders who earn interest on their deposits.
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Pools</p>
                <p className="text-2xl font-bold text-foreground">{cropPools.length}</p>
              </div>
              <PieChart className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Liquidity</p>
                <p className="text-2xl font-bold text-foreground">
                  ${cropPools.reduce((sum, pool) => sum + pool.totalLiquidity, 0).toLocaleString()}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg APY</p>
                <p className="text-2xl font-bold text-foreground">
                  {(cropPools.reduce((sum, pool) => sum + pool.apy, 0) / cropPools.length).toFixed(1)}%
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Depositors</p>
                <p className="text-2xl font-bold text-foreground">
                  {cropPools.reduce((sum, pool) => sum + pool.totalDepositors, 0)}
                </p>
              </div>
              <Users className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search pools by name or crop type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "apy" | "liquidity" | "utilization")}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="apy">Sort by APY</option>
            <option value="liquidity">Sort by Liquidity</option>
            <option value="utilization">Sort by Utilization</option>
          </select>
          
          <select
            value={filterRisk}
            onChange={(e) => setFilterRisk(e.target.value as "all" | "low" | "medium" | "high")}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="all">All Risk Levels</option>
            <option value="low">Low Risk</option>
            <option value="medium">Medium Risk</option>
            <option value="high">High Risk</option>
          </select>
        </div>
      </div>

      {/* Pools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPools.map((pool) => (
          <Card key={pool.id} className="hover:shadow-lg transition-all duration-200 group">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="text-3xl">{pool.icon}</div>
                  <div>
                    <CardTitle className="text-lg">{pool.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{pool.cropType} Pool</p>
                  </div>
                </div>
                <div className="flex flex-col items-end space-y-1">
                  <div className="flex items-center space-x-2">
                    {farmerCollateral[pool.id as keyof typeof farmerCollateral]?.hasCollateral && (
                      <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">
                        <Lock className="h-3 w-3 mr-1" />
                        Collateral Added
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-green-600 border-green-200">
                      {pool.apy}% APY
                    </Badge>
                  </div>
                  <Badge className={`text-xs ${getRiskColor(pool.riskLevel)}`}>
                    {pool.riskLevel.toUpperCase()} RISK
                  </Badge>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Pool Stats */}
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Liquidity</span>
                  <span className="font-medium">${pool.totalLiquidity.toLocaleString()}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Available</span>
                  <span className="font-medium text-green-600">${pool.available.toLocaleString()}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Utilization</span>
                  <span className={`font-medium ${getUtilizationColor(pool.utilization)}`}>
                    {pool.utilization}%
                  </span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Lenders</span>
                  <span className="font-medium">{pool.totalDepositors}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Lock Period</span>
                  <span className="font-medium">{pool.lockPeriod} days</span>
                </div>
              </div>

              {/* Your Collateral Info */}
              {farmerCollateral[pool.id as keyof typeof farmerCollateral]?.hasCollateral && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Lock className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-800">Your Collateral</span>
                    </div>
                    <span className="text-sm font-bold text-green-800">
                      ${farmerCollateral[pool.id as keyof typeof farmerCollateral]?.amount.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-green-600 mt-1">
                    Added on {farmerCollateral[pool.id as keyof typeof farmerCollateral]?.depositedAt}
                  </p>
                </div>
              )}
              
              {/* Utilization Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Utilization</span>
                  <span>{pool.utilization}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      pool.utilization < 50 
                        ? 'bg-gradient-to-r from-green-500 to-green-400' 
                        : pool.utilization < 80 
                          ? 'bg-gradient-to-r from-yellow-500 to-yellow-400'
                          : 'bg-gradient-to-r from-red-500 to-red-400'
                    }`}
                    style={{ width: `${pool.utilization}%` }}
                  />
                </div>
              </div>
              
              {/* Lending Range */}
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Lending Range</span>
                  <span>Min: ${pool.minDeposit} - Max: ${pool.maxDeposit.toLocaleString()}</span>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-2">
                {farmerCollateral[pool.id as keyof typeof farmerCollateral]?.hasCollateral ? (
                  <>
                    <Button 
                      className="flex-1 bg-green-600 hover:bg-green-700" 
                      onClick={() => onBorrow?.(pool.id)}
                    >
                      <DollarSign className="h-4 w-4 mr-2" />
                      Borrow Funds
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => onViewDetails(pool.id)}
                    >
                      <Activity className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    <Button 
                      className="flex-1" 
                      onClick={() => onDeposit(pool.id)}
                      disabled={pool.available === 0}
                    >
                      <Lock className="h-4 w-4 mr-2" />
                      Add Collateral
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => onViewDetails(pool.id)}
                    >
                      <Info className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
              
              {/* Last Updated */}
              <div className="text-xs text-muted-foreground text-center">
                Updated {pool.lastUpdated}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredPools.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No pools found</h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your search terms or filters
            </p>
            <Button 
              variant="outline" 
              onClick={() => {
                setSearchTerm("");
                setFilterRisk("all");
              }}
            >
              Clear Filters
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
