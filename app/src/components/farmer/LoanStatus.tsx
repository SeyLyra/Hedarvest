"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Activity, 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle, 
  AlertCircle, 
  Info, 
  DollarSign, 
  Percent, 
  Clock, 
  Shield, 
  TrendingUp, 
  BarChart3, 
  Eye, 
  ExternalLink, 
  RefreshCw, 
  Package, 
  Scale, 
  FileText, 
  Zap, 
  Target, 
  PieChart, 
  TrendingDown, 
  Minus, 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  History, 
  Bell, 
  Settings, 
  Home, 
  User, 
  Warehouse, 
  Leaf, 
  Sprout, 
  Droplets, 
  Sun, 
  Wind, 
  Thermometer, 
  Award, 
  Star, 
  ArrowUpRight, 
  ArrowDownRight, 
  Calendar, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  Smartphone, 
  Monitor, 
  Tablet, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Clock3, 
  DollarSign as DollarIcon, 
  Percent as PercentIcon, 
  Users2, 
  Building2, 
  Truck, 
  Scale as ScaleIcon, 
  Thermometer as ThermometerIcon, 
  Droplets as DropletsIcon, 
  Sun as SunIcon, 
  Wind as WindIcon, 
  Thermometer as ThermometerIcon2, 
  Award as AwardIcon, 
  Star as StarIcon, 
  ArrowUpRight as ArrowUpRightIcon, 
  ArrowDownRight as ArrowDownRightIcon, 
  Minus as MinusIcon, 
  Plus as PlusIcon, 
  Search as SearchIcon, 
  Filter as FilterIcon, 
  Edit as EditIcon, 
  Trash2 as Trash2Icon, 
  History as HistoryIcon, 
  Activity as ActivityIcon, 
  BarChart3 as BarChart3Icon, 
  TrendingUp as TrendingUpIcon, 
  TrendingDown as TrendingDownIcon, 
  PieChart as PieChartIcon, 
  RefreshCw as RefreshCwIcon, 
  ExternalLink as ExternalLinkIcon, 
  Eye as EyeIcon, 
  Target as TargetIcon, 
  Zap as ZapIcon, 
  FileText as FileTextIcon, 
  Scale as ScaleIcon2, 
  Package as PackageIcon, 
  Activity as ActivityIcon2, 
  Bell as BellIcon, 
  Settings as SettingsIcon, 
  Home as HomeIcon, 
  User as UserIcon, 
  Warehouse as WarehouseIcon, 
  Leaf as LeafIcon, 
  Sprout as SproutIcon, 
  Droplets as DropletsIcon2, 
  Sun as SunIcon2, 
  Wind as WindIcon2, 
  Thermometer as ThermometerIcon3, 
  Award as AwardIcon2, 
  Star as StarIcon2, 
  ArrowUpRight as ArrowUpRightIcon2, 
  ArrowDownRight as ArrowDownRightIcon2, 
  Calendar as CalendarIcon, 
  MapPin as MapPinIcon, 
  Phone as PhoneIcon, 
  Mail as MailIcon, 
  Globe as GlobeIcon, 
  Smartphone as SmartphoneIcon, 
  Monitor as MonitorIcon, 
  Tablet as TabletIcon, 
  AlertTriangle as AlertTriangleIcon, 
  CheckCircle2 as CheckCircle2Icon, 
  XCircle as XCircleIcon, 
  Clock3 as Clock3Icon, 
  DollarSign as DollarIcon2, 
  Percent as PercentIcon2, 
  Users2 as Users2Icon, 
  Building2 as Building2Icon, 
  Truck as TruckIcon
} from "lucide-react";

interface LoanStatusProps {
  onBack: () => void;
  onRepay: () => void;
}

interface Loan {
  id: string;
  amount: number;
  interestRate: number;
  collateralValue: number;
  collateralRatio: number;
  loanTerm: number;
  borrowDate: string;
  dueDate: string;
  status: "active" | "repaid" | "liquidated";
  poolName: string;
  remainingAmount: number;
  interestAccrued: number;
  daysRemaining: number;
  healthScore: number; // 0-100
}

export default function LoanStatus({ onBack, onRepay }: LoanStatusProps) {
  const [selectedLoan, setSelectedLoan] = useState<string | null>(null);
  const [loans, setLoans] = useState<Loan[]>([]);

  const activeLoans = loans.filter(loan => loan.status === "active");
  const totalBorrowed = activeLoans.reduce((sum, loan) => sum + loan.remainingAmount, 0);
  const totalInterest = activeLoans.reduce((sum, loan) => sum + loan.interestAccrued, 0);
  const avgHealthScore = activeLoans.length > 0 
    ? Math.round(activeLoans.reduce((sum, loan) => sum + loan.healthScore, 0) / activeLoans.length)
    : 0;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "text-green-600 bg-green-100";
      case "repaid": return "text-blue-600 bg-blue-100";
      case "liquidated": return "text-red-600 bg-red-100";
      default: return "text-gray-600 bg-gray-100";
    }
  };

  const getHealthColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getHealthLevel = (score: number) => {
    if (score >= 80) return "Healthy";
    if (score >= 60) return "At Risk";
    return "Critical";
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center py-6">
        <div className="flex items-center justify-center mb-4">
          <div className="p-4 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full">
            <Activity className="h-8 w-8 text-white" />
          </div>
        </div>
        <h2 className="text-3xl font-bold text-foreground mb-2">Loan Status</h2>
        <p className="text-lg text-muted-foreground">
          Monitor your active loans and track repayment progress
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Loans</p>
                <p className="text-2xl font-bold text-foreground">{activeLoans.length}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Borrowed</p>
                <p className="text-2xl font-bold text-foreground">${totalBorrowed.toLocaleString()}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Interest Accrued</p>
                <p className="text-2xl font-bold text-foreground">${totalInterest.toFixed(2)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Health Score</p>
                <p className={`text-2xl font-bold ${getHealthColor(avgHealthScore)}`}>
                  {avgHealthScore}%
                </p>
                <p className="text-xs text-muted-foreground">{getHealthLevel(avgHealthScore)}</p>
              </div>
              <Shield className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Loans */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5 text-green-600" />
            <span>Active Loans</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loan ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pool</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Health</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {activeLoans.map((loan) => (
                  <tr key={loan.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-foreground">{loan.id}</div>
                      <div className="text-xs text-muted-foreground">
                        Borrowed: {new Date(loan.borrowDate).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-foreground">${loan.remainingAmount.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">
                        Interest: ${loan.interestAccrued.toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-foreground">{loan.poolName}</div>
                      <div className="text-xs text-muted-foreground">
                        {loan.interestRate}% APR
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-foreground">{new Date(loan.dueDate).toLocaleDateString()}</div>
                      <div className="text-xs text-muted-foreground">
                        {loan.daysRemaining} days left
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <div className={`text-sm font-medium ${getHealthColor(loan.healthScore)}`}>
                          {loan.healthScore}%
                        </div>
                        <Badge className={getHealthColor(loan.healthScore)}>
                          {getHealthLevel(loan.healthScore)}
                        </Badge>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge className={getStatusColor(loan.status)}>
                        {loan.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          onClick={() => {
                            setSelectedLoan(loan.id);
                            onRepay();
                          }}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Repay
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {activeLoans.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">
                No active loans found
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Loan History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <History className="h-5 w-5 text-gray-600" />
            <span>Loan History</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loan ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pool</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Borrow Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loans.filter(loan => loan.status !== "active").map((loan) => (
                  <tr key={loan.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-foreground">{loan.id}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-foreground">${loan.amount.toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-foreground">{loan.poolName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-foreground">{new Date(loan.borrowDate).toLocaleDateString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge className={getStatusColor(loan.status)}>
                        {loan.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {loans.filter(loan => loan.status !== "active").length === 0 && (
              <div className="p-8 text-center text-muted-foreground">
                No loan history available
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Risk Warnings */}
      {activeLoans.some(loan => loan.healthScore < 70) && (
        <Card className="bg-yellow-50 border-yellow-200">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-yellow-800">
              <AlertTriangle className="h-5 w-5" />
              <span>Risk Warning</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-yellow-700">
                Some of your loans have low health scores. Consider repaying or adding more collateral to avoid liquidation.
              </p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="border-yellow-600 text-yellow-700">
                  Add Collateral
                </Button>
                <Button size="sm" className="bg-yellow-600 hover:bg-yellow-700">
                  Repay Now
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Borrow
        </Button>
        <div className="flex gap-2">
          <Button variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button>
            <FileText className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>
    </div>
  );
}
