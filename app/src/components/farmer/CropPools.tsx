"use client";

import { useState, useEffect } from "react";
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
  PieChart,
  RefreshCw
} from "lucide-react";

interface CropPool {
  id: number;
  grainType: string;
  address: string;
  lendingTokenAddress: string;
  collateralTokenAddress: string;
  price: number;
  availableLiquidity: string;
  totalBorrows: string;
  utilizationRate: number;
  apr: number;
}

interface CropPoolsProps {
  onDeposit: (poolId: string) => void;
  onViewDetails: (poolId: string) => void;
  onBorrow?: (poolId: string) => void;
}

export default function CropPools({ onDeposit, onViewDetails, onBorrow }: CropPoolsProps) {
  const [pools, setPools] = useState<CropPool[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"apy" | "liquidity" | "utilization">("apy");
  const [filterRisk, setFilterRisk] = useState<"all" | "low" | "medium" | "high">("all");
  const [collateralByGrain, setCollateralByGrain] = useState<Record<string, { hasCollateral: boolean; maxBorrow?: string }>>({});
  const [checkingCollateral, setCheckingCollateral] = useState(false);

  // Fetch pools data on component mount (live only)
  useEffect(() => {
    const fetchPools = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/pools/list');
        const data = await response.json();
        
        if (data.success) {
          const filtered = (data.data || []).filter((p: any) => String(p.grainType || '').toUpperCase() !== 'CORN');
          setPools(filtered);
        } else {
          setPools([]);
        }
      } catch (error) {
        console.error('Failed to fetch pools:', error);
        setPools([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPools();
  }, []);

  // Fetch per-pool collateral status (has collateral -> show Borrow)
  useEffect(() => {
    const fetchCollateralStatus = async () => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('farmerToken') : null;
        if (!token || pools.length === 0) {
          setCheckingCollateral(false);
          return;
        }
        
        setCheckingCollateral(true);
        console.log('🔍 Checking collateral status for pools:', pools.map(p => p.grainType));
        
        const results = await Promise.all(
          pools.map(async (p) => {
            try {
              const grainType = p.grainType.toLowerCase();
              console.log(`🔍 Fetching allowance for ${grainType}...`);
              const res = await fetch(`/api/farmers/borrow/allowance/${encodeURIComponent(grainType)}`, {
                headers: { 'Authorization': `Bearer ${token}` },
                cache: 'no-store',
              });
              const json = await res.json();
              
              console.log(`📊 Allowance response for ${grainType}:`, json);
              
              if (!res.ok) {
                console.log(`❌ Allowance API failed for ${grainType}:`, json);
                return [p.grainType.toUpperCase(), { hasCollateral: false }] as const;
              }
              
              // Determine present collateral from onchain or fallback response
              const collateralOnChain = json.collateral ? Number(json.collateral) : 0;
              const collateralTokens = json.collateralTokens ? parseFloat(json.collateralTokens) : 0;
              const collateralPresent = collateralOnChain > 0 || collateralTokens > 0;
              
              console.log(`✅ ${grainType} - OnChain: ${collateralOnChain}, Tokens: ${collateralTokens}, HasCollateral: ${collateralPresent}`);
              
              const maxBorrow = json.maxBorrowUSD || json.maxBorrowTokens || undefined;
              return [p.grainType.toUpperCase(), { hasCollateral: collateralPresent, maxBorrow: maxBorrow }] as const;
            } catch (err) {
              console.error(`❌ Error checking collateral for ${p.grainType}:`, err);
              return [p.grainType.toUpperCase(), { hasCollateral: false }] as const;
            }
          })
        );
        const map: Record<string, { hasCollateral: boolean; maxBorrow?: string }> = {};
        for (const [gt, val] of results) map[gt] = val;
        console.log('📊 Final collateral map:', map);
        setCollateralByGrain(map);
      } catch (e) {
        console.error('❌ Error fetching collateral status:', e);
      } finally {
        setCheckingCollateral(false);
      }
    };
    fetchCollateralStatus();
  }, [pools]);

  // Helper function to get risk level based on utilization
  const getRiskLevel = (utilization: number): "low" | "medium" | "high" => {
    if (utilization < 60) return "low";
    if (utilization < 80) return "medium";
    return "high";
  };

  const filteredPools = pools
    .filter(pool => 
      pool.grainType.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter(pool => {
      const riskLevel = getRiskLevel(pool.utilizationRate);
      return filterRisk === "all" || riskLevel === filterRisk;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "apy":
          return b.apr - a.apr;
        case "liquidity":
          return parseFloat(b.availableLiquidity) - parseFloat(a.availableLiquidity);
        case "utilization":
          return b.utilizationRate - a.utilizationRate;
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
                <p className="text-2xl font-bold text-foreground">{pools.length}</p>
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
                  ${pools.reduce((sum, pool) => sum + parseFloat(pool.availableLiquidity), 0).toLocaleString()}
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
                <p className="text-sm text-muted-foreground">Avg APR</p>
                <p className="text-2xl font-bold text-foreground">
                  {pools.length > 0 ? (pools.reduce((sum, pool) => sum + pool.apr, 0) / pools.length).toFixed(1) : '0'}%
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
                <p className="text-sm text-muted-foreground">Avg Utilization</p>
                <p className="text-2xl font-bold text-foreground">
                  {pools.length > 0 ? (pools.reduce((sum, pool) => sum + pool.utilizationRate, 0) / pools.length).toFixed(1) : '0'}%
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

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading pools from Hedera testnet...</p>
        </div>
      )}

      {/* Pools Grid */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPools.map((pool) => {
          const riskLevel = getRiskLevel(pool.utilizationRate);
          const hasCollateral = collateralByGrain[pool.grainType.toUpperCase()]?.hasCollateral;
          
          return (
            <Card key={pool.id} className="hover:shadow-lg transition-all duration-200 group">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="text-3xl">🌾</div>
                    <div>
                      <CardTitle className="text-lg">{pool.grainType} Pool</CardTitle>
                      <p className="text-sm text-muted-foreground">{pool.grainType} Lending Pool</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end space-y-1">
                    <div className="flex items-center space-x-2">
                      {hasCollateral && (
                        <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">
                          <Lock className="h-3 w-3 mr-1" />
                          Collateral Added
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-green-600 border-green-200">
                        {pool.apr}% APY
                      </Badge>
                    </div>
                    <Badge className={`text-xs ${getRiskColor(riskLevel)}`}>
                      {riskLevel.toUpperCase()} RISK
                    </Badge>
                  </div>
                </div>
              </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Pool Stats */}
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Available Liquidity</span>
                  <span className="font-medium">${parseFloat(pool.availableLiquidity).toLocaleString()}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Borrowed</span>
                  <span className="font-medium">${parseFloat(pool.totalBorrows).toLocaleString()}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Utilization</span>
                  <span className={`font-medium ${getUtilizationColor(pool.utilizationRate)}`}>
                    {pool.utilizationRate}%
                  </span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Pool Address</span>
                  <span className="font-mono text-xs text-muted-foreground">
                    {pool.address.slice(0, 6)}...{pool.address.slice(-4)}
                  </span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">APR</span>
                  <span className="font-medium">{pool.apr}%</span>
                </div>
              </div>

              {/* Collateral status from live allowance (no mock) */}
              {hasCollateral && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <Lock className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">Collateral detected</span>
                  </div>
                  {collateralByGrain[pool.grainType.toUpperCase()]?.maxBorrow && (
                    <p className="text-xs text-green-700 mt-1">
                      Max borrow: ${(parseFloat(collateralByGrain[pool.grainType.toUpperCase()]?.maxBorrow || '0') / 1e18).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDC
                  </p>
                  )}
                </div>
              )}
              
              {/* Utilization Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Utilization</span>
                  <span>{pool.utilizationRate}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      pool.utilizationRate < 50 
                        ? 'bg-gradient-to-r from-green-500 to-green-400' 
                        : pool.utilizationRate < 80 
                          ? 'bg-gradient-to-r from-yellow-500 to-yellow-400'
                          : 'bg-gradient-to-r from-red-500 to-red-400'
                    }`}
                    style={{ width: `${pool.utilizationRate}%` }}
                  />
                </div>
              </div>
              
              {/* Pool Info */}
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Pool Type</span>
                  <span>Hedera Lending Pool</span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Network</span>
                  <span>Hedera Testnet</span>
                </div>
              </div>
              
              {/* Action Buttons - Only show after collateral check is done */}
              <div className="flex gap-2">
                {checkingCollateral ? (
                  <Button 
                    className="flex-1" 
                    disabled
                  >
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Checking Collateral...
                  </Button>
                ) : hasCollateral ? (
                  <>
                    <Button 
                      className="flex-1 bg-green-600 hover:bg-green-700" 
                      onClick={() => onBorrow?.(pool.id.toString())}
                    >
                      <DollarSign className="h-4 w-4 mr-2" />
                      Borrow Funds
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => onViewDetails(pool.id.toString())}
                    >
                      <Activity className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    <Button 
                      className="flex-1" 
                      onClick={() => onDeposit(pool.id.toString())}
                      disabled={parseFloat(pool.availableLiquidity) === 0}
                    >
                      <Lock className="h-4 w-4 mr-2" />
                      Add Collateral
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => onViewDetails(pool.id.toString())}
                    >
                      <Info className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
              
              {/* Last Updated */}
              <div className="text-xs text-muted-foreground text-center">
                Live on Hedera Testnet
              </div>
            </CardContent>
          </Card>
          );
        })}
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredPools.length === 0 && (
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
