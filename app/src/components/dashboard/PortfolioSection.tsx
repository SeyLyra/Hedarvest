'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  DollarSign,
  Activity,
  BarChart3,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Coins,
  Shield,
  AlertTriangle,
  Briefcase,
  History,
  CheckCircle2,
  XCircle,
  Clock
} from 'lucide-react';
import { 
  PieChart as RechartsPieChart, 
  Pie,
  Cell, 
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { Loader } from '@/components/shared/Loader';
import { StatsSkeleton } from '@/components/shared/Skeleton';

interface PortfolioPosition {
  grainType: string;
  depositedAmount: number;
  currentValue: number;
  accruedYield: number;
  shares: number;
  apr: number;
  riskScore: number;
}

interface TransactionHistory {
  id: string;
  type: string;
  grainType: string;
  amount: number;
  shares: number;
  timestamp: string;
  status: string;
  transactionHash: string;
  poolAddress: string;
  depositorAddress: string;
}

interface PortfolioData {
  totalDeposits: number;
  totalValue: number;
  totalYield: number;
  averageAPR: number;
  riskScore: number;
  positions: PortfolioPosition[];
  allocation: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  yieldHistory: Array<{
    date: string;
    yield: number;
  }>;
  transactionHistory?: TransactionHistory[];
}

interface PortfolioSectionProps {
  data?: PortfolioData;
  isLoading: boolean;
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];

export const PortfolioSection = ({ data, isLoading }: PortfolioSectionProps) => {
  if (isLoading) {
    return (
      <div className="space-y-8">
        <StatsSkeleton />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-muted rounded w-1/3"></div>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-muted rounded"></div>
            </CardContent>
          </Card>
          <Card className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-muted rounded w-1/3"></div>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-muted rounded"></div>
            </CardContent>
          </Card>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <Card key={index} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="h-4 bg-muted rounded w-full"></div>
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Briefcase className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No portfolio data available</p>
        </div>
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  const getRiskColor = (score: number) => {
    if (score <= 3) return 'text-green-600 bg-green-100 border-green-200';
    if (score <= 6) return 'text-yellow-600 bg-yellow-100 border-yellow-200';
    return 'text-red-600 bg-red-100 border-red-200';
  };

  const getRiskLabel = (score: number) => {
    if (score <= 3) return 'Low Risk';
    if (score <= 6) return 'Medium Risk';
    return 'High Risk';
  };

  return (
    <div className="space-y-8">
      {/* Portfolio Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Value</p>
                <p className="text-2xl font-bold text-foreground">
                  {formatCurrency(data.totalValue)}
                </p>
                <div className="flex items-center mt-1">
                  <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                  <span className="text-sm text-green-600">+{formatPercentage(data.totalYield / data.totalDeposits * 100)}</span>
                </div>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Deposits</p>
                <p className="text-2xl font-bold text-foreground">
                  {formatCurrency(data.totalDeposits)}
                </p>
                <div className="flex items-center mt-1">
                  <ArrowUpRight className="w-4 h-4 text-blue-600 mr-1" />
                  <span className="text-sm text-blue-600">Principal</span>
                </div>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Accrued Yield</p>
                <p className="text-2xl font-bold text-foreground">
                  {formatCurrency(data.totalYield)}
                </p>
                <div className="flex items-center mt-1">
                  <TrendingUp className="w-4 h-4 text-yellow-600 mr-1" />
                  <span className="text-sm text-yellow-600">{formatPercentage(data.averageAPR)} APR</span>
                </div>
              </div>
              <div className="h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Risk Score</p>
                <p className="text-2xl font-bold text-foreground">
                  {data.riskScore}/10
                </p>
                <Badge className={`mt-2 ${getRiskColor(data.riskScore)}`}>
                  {getRiskLabel(data.riskScore)}
                </Badge>
              </div>
              <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                <Shield className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Portfolio Allocation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5" />
              Portfolio Allocation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={data.allocation}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {data.allocation.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [formatCurrency(value), 'Value']} />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Yield Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Yield Performance (30 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.yieldHistory || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number) => [formatCurrency(value), 'Yield']}
                    labelFormatter={(label) => `Date: ${label}`}
                  />
                  <Bar dataKey="yield" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Position Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="w-5 h-5" />
            Position Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.positions.map((position, index) => (
              <div key={index} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-agricultural-green/20 to-trust-blue/20 flex items-center justify-center">
                      <Coins className="h-5 w-5 text-agricultural-green" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{position.grainType}</h3>
                      <p className="text-sm text-muted-foreground">
                        {position.shares.toFixed(4)} shares
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(position.currentValue)}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatPercentage(position.apr)} APR
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Deposited</p>
                    <p className="font-semibold">{formatCurrency(position.depositedAmount)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Current Value</p>
                    <p className="font-semibold">{formatCurrency(position.currentValue)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Accrued Yield</p>
                    <p className="font-semibold text-green-600">{formatCurrency(position.accruedYield)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Risk Score</p>
                    <Badge className={getRiskColor(position.riskScore)}>
                      {position.riskScore}/10
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Risk Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Risk Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                <Shield className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="font-semibold mb-2">Diversification</h3>
              <p className="text-sm text-muted-foreground">
                Well-diversified across {data.positions.length} grain types
              </p>
            </div>
            <div className="text-center">
              <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="font-semibold mb-2">Performance</h3>
              <p className="text-sm text-muted-foreground">
                Average APR of {formatPercentage(data.averageAPR)}
              </p>
            </div>
            <div className="text-center">
              <div className="h-16 w-16 rounded-full bg-yellow-100 flex items-center justify-center mx-auto mb-3">
                <AlertTriangle className="h-8 w-8 text-yellow-600" />
              </div>
              <h3 className="font-semibold mb-2">Risk Level</h3>
              <p className="text-sm text-muted-foreground">
                {getRiskLabel(data.riskScore)} portfolio
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transaction History from HCS */}
      {data.transactionHistory && data.transactionHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="w-5 h-5" />
              Transaction History (HCS)
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Blockchain-verified transaction history from Hedera Consensus Service
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.transactionHistory.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                      tx.status === 'completed'
                        ? 'bg-green-100'
                        : tx.status === 'failed'
                        ? 'bg-red-100'
                        : 'bg-yellow-100'
                    }`}>
                      {tx.status === 'completed' ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : tx.status === 'failed' ? (
                        <XCircle className="h-5 w-5 text-red-600" />
                      ) : (
                        <Clock className="h-5 w-5 text-yellow-600" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold capitalize">
                          {tx.type.replace('_', ' ')}
                        </p>
                        <Badge variant="outline" className="text-xs">
                          {tx.grainType}
                        </Badge>
                        <Badge
                          className={
                            tx.status === 'completed'
                              ? 'bg-green-100 text-green-800 border-green-200'
                              : tx.status === 'failed'
                              ? 'bg-red-100 text-red-800 border-red-200'
                              : 'bg-yellow-100 text-yellow-800 border-yellow-200'
                          }
                        >
                          {tx.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                        <span>
                          {tx.type.includes('deposit') ? '+' : '-'}{formatCurrency(tx.amount)}
                        </span>
                        {tx.shares > 0 && (
                          <span>
                            • {tx.shares.toFixed(4)} shares
                          </span>
                        )}
                        <span>
                          • {new Date(tx.timestamp).toLocaleString()}
                        </span>
                      </div>
                      {tx.transactionHash && (
                        <p className="text-xs text-muted-foreground mt-1 font-mono">
                          Tx: {tx.transactionHash.slice(0, 20)}...
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    {tx.type === 'deposit' ? (
                      <ArrowUpRight className="w-5 h-5 text-green-600" />
                    ) : (
                      <ArrowDownRight className="w-5 h-5 text-red-600" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PortfolioSection;
