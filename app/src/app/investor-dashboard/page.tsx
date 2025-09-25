"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { TrendingUp, DollarSign, Activity, BarChart3 } from "lucide-react";

interface PoolData {
  grainType: string;
  poolAddress: string;
  price: number;
  availableLiquidity: string;
  totalBorrows: string;
  utilizationRate: number;
}

const mockPoolData: PoolData[] = [
  {
    grainType: "Rice",
    poolAddress: process.env.NEXT_PUBLIC_RICE_POOL_ADDRESS || "0x1234...5678",
    price: 200,
    availableLiquidity: "100000",
    totalBorrows: "40000",
    utilizationRate: 40,
  },
  {
    grainType: "Corn",
    poolAddress: process.env.NEXT_PUBLIC_CORN_POOL_ADDRESS || "0x2345...6789",
    price: 180,
    availableLiquidity: "85000",
    totalBorrows: "35000",
    utilizationRate: 41,
  },
  {
    grainType: "Wheat",
    poolAddress: process.env.NEXT_PUBLIC_WHEAT_POOL_ADDRESS || "0x3456...7890",
    price: 220,
    availableLiquidity: "120000",
    totalBorrows: "50000",
    utilizationRate: 42,
  },
  {
    grainType: "Soybean",
    poolAddress: process.env.NEXT_PUBLIC_SOYBEAN_POOL_ADDRESS || "0x4567...8901",
    price: 190,
    availableLiquidity: "95000",
    totalBorrows: "38000",
    utilizationRate: 40,
  },
];

export default function InvestorDashboard() {
  const [pools, setPools] = useState<PoolData[]>(mockPoolData);
  const [amounts, setAmounts] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleAmountChange = (grainType: string, value: string) => {
    setAmounts(prev => ({
      ...prev,
      [grainType]: value
    }));
  };

  const handleDeposit = async (grainType: string) => {
    const amount = amounts[grainType];
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    setIsLoading(true);
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simulate API call
      const response = await fetch('/api/investor/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grainType, amount })
      });

      if (response.ok) {
        toast.success(`Successfully deposited ${amount} tokens to ${grainType} pool`);
        setAmounts(prev => ({ ...prev, [grainType]: "" }));
      } else {
        throw new Error('Deposit failed');
      }
    } catch (error) {
      toast.error(`Failed to deposit to ${grainType} pool`);
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
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simulate API call
      const response = await fetch('/api/investor/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grainType, shares: amount })
      });

      if (response.ok) {
        toast.success(`Successfully withdrew ${amount} shares from ${grainType} pool`);
        setAmounts(prev => ({ ...prev, [grainType]: "" }));
      } else {
        throw new Error('Withdrawal failed');
      }
    } catch (error) {
      toast.error(`Failed to withdraw from ${grainType} pool`);
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Investor Dashboard</h1>
              <p className="text-muted-foreground mt-1">Manage your grain pool investments</p>
            </div>
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">
              Demo Mode (Mock API)
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total TVL</p>
                  <p className="text-2xl font-bold">$400K</p>
                </div>
                <DollarSign className="h-8 w-8 text-agricultural-green" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Average APY</p>
                  <p className="text-2xl font-bold">8.2%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-trust-blue" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Pools</p>
                  <p className="text-2xl font-bold">4</p>
                </div>
                <Activity className="h-8 w-8 text-golden-accent" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Avg Utilization</p>
                  <p className="text-2xl font-bold">41%</p>
                </div>
                <BarChart3 className="h-8 w-8 text-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Available Grain Pools */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-foreground mb-2">Available Grain Pools</h2>
          <p className="text-muted-foreground">Invest in diversified agricultural assets with real-world backing</p>
        </div>

        {/* Pool Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {pools.map((pool) => (
            <Card key={pool.grainType} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-bold text-foreground">
                    {pool.grainType} Pool
                  </CardTitle>
                  <Badge 
                    variant="outline" 
                    className={
                      pool.utilizationRate > 50 
                        ? "border-red-200 text-red-700 bg-red-50" 
                        : "border-green-200 text-green-700 bg-green-50"
                    }
                  >
                    {pool.utilizationRate}% utilized
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground font-mono">
                  {pool.poolAddress}
                </p>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {/* Pool Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Current Price</p>
                    <p className="text-lg font-bold text-foreground">
                      {formatCurrency(pool.price.toString())}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Available Liquidity</p>
                    <p className="text-lg font-bold text-agricultural-green">
                      {formatCurrency(pool.availableLiquidity)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Borrows</p>
                    <p className="text-lg font-bold text-foreground">
                      {formatCurrency(pool.totalBorrows)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Utilization Rate</p>
                    <p className="text-lg font-bold text-foreground">
                      {pool.utilizationRate}%
                    </p>
                  </div>
                </div>

                {/* Action Section */}
                <div className="space-y-4 pt-4 border-t">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Amount
                    </label>
                    <Input
                      type="number"
                      placeholder="Enter amount"
                      value={amounts[pool.grainType] || ""}
                      onChange={(e) => handleAmountChange(pool.grainType, e.target.value)}
                      className="mb-3"
                    />
                  </div>
                  
                  <div className="flex gap-3">
                    <Button
                      onClick={() => handleDeposit(pool.grainType)}
                      disabled={isLoading || !amounts[pool.grainType]}
                      className="flex-1 bg-agricultural-green hover:bg-agricultural-green/90"
                    >
                      {isLoading ? "Processing..." : "Deposit"}
                    </Button>
                    <Button
                      onClick={() => handleWithdraw(pool.grainType)}
                      disabled={isLoading || !amounts[pool.grainType]}
                      variant="outline"
                      className="flex-1"
                    >
                      {isLoading ? "Processing..." : "Withdraw"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
