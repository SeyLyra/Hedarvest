"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  DollarSign, 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle, 
  AlertCircle, 
  Info, 
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
  Activity, 
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

interface BorrowFundsProps {
  onBack: () => void;
  onComplete: (data: LoanData) => void;
}

interface LoanData {
  id: string;
  amount: number;
  interestRate: number;
  collateralValue: number;
  collateralRatio: number;
  loanTerm: number; // in days
  borrowDate: string;
  dueDate: string;
  status: "active" | "repaid" | "liquidated";
  poolId: string;
  poolName: string;
}

const mockCollateralData = {
  totalValue: 5500,
  maxBorrowAmount: 4125,
  collateralRatio: 0.75,
  poolName: "RICE Pool",
  poolId: "rice-pool",
  interestRate: 8.5
};

const loanTerms = [
  { value: 30, label: "30 days", interestRate: 8.5 },
  { value: 60, label: "60 days", interestRate: 9.0 },
  { value: 90, label: "90 days", interestRate: 9.5 },
  { value: 180, label: "6 months", interestRate: 10.0 },
  { value: 365, label: "1 year", interestRate: 11.0 }
];

export default function BorrowFunds({ onBack, onComplete }: BorrowFundsProps) {
  const [borrowAmount, setBorrowAmount] = useState("");
  const [selectedTerm, setSelectedTerm] = useState(30);
  const [isBorrowing, setIsBorrowing] = useState(false);

  const selectedTermData = loanTerms.find(term => term.value === selectedTerm);
  const borrowAmountNum = parseFloat(borrowAmount) || 0;
  const interestAmount = borrowAmountNum * (selectedTermData?.interestRate || 0) / 100 * (selectedTerm / 365);
  const totalRepayment = borrowAmountNum + interestAmount;
  const newCollateralRatio = borrowAmountNum / mockCollateralData.totalValue;

  const handleBorrow = async () => {
    if (borrowAmountNum <= 0 || borrowAmountNum > mockCollateralData.maxBorrowAmount) return;

    setIsBorrowing(true);
    
    // Simulate borrowing process
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const loanData: LoanData = {
      id: `loan_${Date.now()}`,
      amount: borrowAmountNum,
      interestRate: selectedTermData?.interestRate || 0,
      collateralValue: mockCollateralData.totalValue,
      collateralRatio: newCollateralRatio,
      loanTerm: selectedTerm,
      borrowDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + selectedTerm * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: "active",
      poolId: mockCollateralData.poolId,
      poolName: mockCollateralData.poolName
    };

    setIsBorrowing(false);
    onComplete(loanData);
  };

  const getRiskColor = (ratio: number) => {
    if (ratio < 0.5) return "text-green-600";
    if (ratio < 0.7) return "text-yellow-600";
    return "text-red-600";
  };

  const getRiskLevel = (ratio: number) => {
    if (ratio < 0.5) return "Low Risk";
    if (ratio < 0.7) return "Medium Risk";
    return "High Risk";
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center py-6">
        <div className="flex items-center justify-center mb-4">
          <div className="p-4 bg-gradient-to-r from-green-500 to-blue-500 rounded-full">
            <DollarSign className="h-8 w-8 text-white" />
          </div>
        </div>
        <h2 className="text-3xl font-bold text-foreground mb-2">Borrow Funds</h2>
        <p className="text-lg text-muted-foreground">
          Access instant liquidity using your crop tokens as collateral
        </p>
      </div>

      {/* Collateral Summary */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-blue-600" />
            <span>Your Collateral</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Total Collateral Value</p>
              <p className="text-2xl font-bold text-foreground">${mockCollateralData.totalValue.toLocaleString()}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Max Borrow Amount</p>
              <p className="text-2xl font-bold text-green-600">${mockCollateralData.maxBorrowAmount.toLocaleString()}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Pool</p>
              <p className="text-lg font-semibold text-foreground">{mockCollateralData.poolName}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Borrow Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            <span>Borrow Details</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="borrowAmount">Borrow Amount (USD)</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="borrowAmount"
                type="number"
                placeholder="Enter amount to borrow"
                value={borrowAmount}
                onChange={(e) => setBorrowAmount(e.target.value)}
                className="pl-10"
                max={mockCollateralData.maxBorrowAmount}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Maximum: ${mockCollateralData.maxBorrowAmount.toLocaleString()}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="loanTerm">Loan Term</Label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {loanTerms.map((term) => (
                <Button
                  key={term.value}
                  variant={selectedTerm === term.value ? "default" : "outline"}
                  onClick={() => setSelectedTerm(term.value)}
                  className="flex flex-col h-auto py-3"
                >
                  <span className="font-medium">{term.label}</span>
                  <span className="text-xs text-muted-foreground">{term.interestRate}% APR</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Risk Assessment */}
          {borrowAmountNum > 0 && (
            <Card className="bg-gray-50">
              <CardContent className="p-4">
                <h4 className="font-semibold text-foreground mb-3">Risk Assessment</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">New Collateral Ratio</p>
                    <p className={`text-xl font-bold ${getRiskColor(newCollateralRatio)}`}>
                      {Math.round(newCollateralRatio * 100)}%
                    </p>
                    <Badge className={getRiskColor(newCollateralRatio)}>
                      {getRiskLevel(newCollateralRatio)}
                    </Badge>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Interest Rate</p>
                    <p className="text-xl font-bold text-foreground">{selectedTermData?.interestRate}% APR</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Interest Amount</p>
                    <p className="text-xl font-bold text-orange-600">${interestAmount.toFixed(2)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Loan Summary */}
          {borrowAmountNum > 0 && (
            <Card className="bg-green-50 border-green-200">
              <CardHeader>
                <CardTitle className="text-lg">Loan Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Borrow Amount:</span>
                  <span className="font-medium">${borrowAmountNum.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Interest ({selectedTermData?.interestRate}% APR):</span>
                  <span className="font-medium">${interestAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Repayment:</span>
                  <span className="font-bold text-lg">${totalRepayment.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Due Date:</span>
                  <span className="font-medium">
                    {new Date(Date.now() + selectedTerm * 24 * 60 * 60 * 1000).toLocaleDateString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Borrow Progress */}
      {isBorrowing && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <RefreshCw className="h-8 w-8 text-blue-600 animate-spin" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-foreground">Processing Loan...</h3>
                <p className="text-sm text-muted-foreground">
                  Transferring funds to your wallet
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Terms and Conditions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-gray-600" />
            <span>Important Terms</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start space-x-2">
            <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5" />
            <p className="text-sm text-muted-foreground">
              Your crop tokens are locked as collateral until the loan is repaid
            </p>
          </div>
          <div className="flex items-start space-x-2">
            <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5" />
            <p className="text-sm text-muted-foreground">
              If collateral value drops below 80%, you may be subject to liquidation
            </p>
          </div>
          <div className="flex items-start space-x-2">
            <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5" />
            <p className="text-sm text-muted-foreground">
              Interest accrues daily and compounds over the loan term
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Collateral
        </Button>
        <Button 
          onClick={handleBorrow}
          disabled={borrowAmountNum <= 0 || borrowAmountNum > mockCollateralData.maxBorrowAmount || isBorrowing}
          className="bg-green-600 hover:bg-green-700"
        >
          {isBorrowing ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <DollarSign className="h-4 w-4 mr-2" />
              Borrow Funds
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
