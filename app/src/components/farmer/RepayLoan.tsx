"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  RotateCcw, 
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

interface RepayLoanProps {
  onBack: () => void;
  onComplete: (data: RepaymentData) => void;
}

interface RepaymentData {
  id: string;
  loanId: string;
  amount: number;
  repaymentDate: string;
  remainingAmount: number;
  collateralReleased: boolean;
  status: "completed" | "pending" | "failed";
}

const mockLoan = {
  id: "loan001",
  amount: 2500,
  interestRate: 8.5,
  collateralValue: 5500,
  collateralRatio: 0.45,
  loanTerm: 90,
  borrowDate: "2024-01-15",
  dueDate: "2024-04-15",
  status: "active",
  poolName: "RICE Pool",
  remainingAmount: 2500,
  interestAccrued: 45.20,
  daysRemaining: 45,
  healthScore: 85
};

const repaymentOptions = [
  { value: "partial", label: "Partial Repayment", description: "Pay a portion of the loan" },
  { value: "full", label: "Full Repayment", description: "Pay the entire remaining amount" },
  { value: "interest", label: "Interest Only", description: "Pay only the accrued interest" }
];

export default function RepayLoan({ onBack, onComplete }: RepayLoanProps) {
  const [repayType, setRepayType] = useState<string>("partial");
  const [repayAmount, setRepayAmount] = useState("");
  const [isRepaying, setIsRepaying] = useState(false);

  const repayAmountNum = parseFloat(repayAmount) || 0;
  const totalOwed = mockLoan.remainingAmount + mockLoan.interestAccrued;
  const isFullRepayment = repayType === "full" || repayAmountNum >= totalOwed;
  const remainingAfterRepay = Math.max(0, totalOwed - repayAmountNum);

  const handleRepay = async () => {
    if (repayAmountNum <= 0) return;

    setIsRepaying(true);
    
    // Simulate repayment process
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const repaymentData: RepaymentData = {
      id: `repay_${Date.now()}`,
      loanId: mockLoan.id,
      amount: repayAmountNum,
      repaymentDate: new Date().toISOString().split('T')[0],
      remainingAmount: remainingAfterRepay,
      collateralReleased: isFullRepayment,
      status: "completed"
    };

    setIsRepaying(false);
    onComplete(repaymentData);
  };

  const handleQuickAmount = (percentage: number) => {
    const amount = (totalOwed * percentage / 100).toFixed(2);
    setRepayAmount(amount);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center py-6">
        <div className="flex items-center justify-center mb-4">
          <div className="p-4 bg-gradient-to-r from-red-500 to-orange-500 rounded-full">
            <RotateCcw className="h-8 w-8 text-white" />
          </div>
        </div>
        <h2 className="text-3xl font-bold text-foreground mb-2">Repay Loan</h2>
        <p className="text-lg text-muted-foreground">
          Repay your loan to release collateral and reduce interest
        </p>
      </div>

      {/* Loan Summary */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-blue-600" />
            <span>Loan Details</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Loan ID:</span>
                <span className="font-medium">{mockLoan.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pool:</span>
                <span className="font-medium">{mockLoan.poolName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Interest Rate:</span>
                <span className="font-medium">{mockLoan.interestRate}% APR</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Due Date:</span>
                <span className="font-medium">{new Date(mockLoan.dueDate).toLocaleDateString()}</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Remaining Principal:</span>
                <span className="font-medium">${mockLoan.remainingAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Interest Accrued:</span>
                <span className="font-medium">${mockLoan.interestAccrued.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Owed:</span>
                <span className="font-bold text-lg">${totalOwed.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Days Remaining:</span>
                <span className="font-medium">{mockLoan.daysRemaining} days</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Repayment Options */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="h-5 w-5 text-green-600" />
            <span>Repayment Type</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {repaymentOptions.map((option) => (
              <Card 
                key={option.value}
                className={`cursor-pointer transition-all duration-200 ${
                  repayType === option.value 
                    ? 'ring-2 ring-green-500 shadow-lg' 
                    : 'hover:shadow-md'
                }`}
                onClick={() => setRepayType(option.value)}
              >
                <CardContent className="p-4">
                  <div className="text-center">
                    <h3 className="font-semibold text-foreground mb-2">{option.label}</h3>
                    <p className="text-sm text-muted-foreground">{option.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Amount Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            <span>Repayment Amount</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="repayAmount">Amount (USD)</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="repayAmount"
                type="number"
                placeholder="Enter repayment amount"
                value={repayAmount}
                onChange={(e) => setRepayAmount(e.target.value)}
                className="pl-10"
                max={totalOwed}
                disabled={repayType === "full"}
              />
            </div>
            {repayType === "full" && (
              <p className="text-sm text-muted-foreground">
                Full repayment: ${totalOwed.toFixed(2)}
              </p>
            )}
          </div>

          {/* Quick Amount Buttons */}
          <div className="space-y-2">
            <Label>Quick Amounts</Label>
            <div className="flex gap-2 flex-wrap">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleQuickAmount(25)}
              >
                25%
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleQuickAmount(50)}
              >
                50%
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleQuickAmount(75)}
              >
                75%
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleQuickAmount(100)}
              >
                100%
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Repayment Summary */}
      {repayAmountNum > 0 && (
        <Card className="bg-green-50 border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span>Repayment Summary</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Repayment Amount:</span>
                  <span className="font-medium">${repayAmountNum.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Remaining After Repay:</span>
                  <span className="font-medium">${remainingAfterRepay.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Collateral Released:</span>
                  <span className="font-medium">
                    {isFullRepayment ? "Yes" : "No"}
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Interest Saved:</span>
                  <span className="font-medium text-green-600">
                    ${(repayAmountNum * 0.085 / 365 * mockLoan.daysRemaining).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">New Health Score:</span>
                  <span className="font-medium text-green-600">
                    {isFullRepayment ? "100%" : `${Math.min(100, Math.round(100 - (remainingAfterRepay / mockLoan.collateralValue) * 100))}%`}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Repayment Progress */}
      {isRepaying && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <RefreshCw className="h-8 w-8 text-blue-600 animate-spin" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-foreground">Processing Repayment...</h3>
                <p className="text-sm text-muted-foreground">
                  {isFullRepayment ? "Releasing collateral..." : "Updating loan balance..."}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Important Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Info className="h-5 w-5 text-blue-600" />
            <span>Important Notes</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start space-x-2">
            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
            <p className="text-sm text-muted-foreground">
              Full repayment will release all your collateral tokens
            </p>
          </div>
          <div className="flex items-start space-x-2">
            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
            <p className="text-sm text-muted-foreground">
              Partial repayment reduces your loan balance and interest accrual
            </p>
          </div>
          <div className="flex items-start space-x-2">
            <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5" />
            <p className="text-sm text-muted-foreground">
              Repayment is processed immediately and cannot be reversed
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Loan Status
        </Button>
        <Button 
          onClick={handleRepay}
          disabled={repayAmountNum <= 0 || repayAmountNum > totalOwed || isRepaying}
          className="bg-red-600 hover:bg-red-700"
        >
          {isRepaying ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <RotateCcw className="h-4 w-4 mr-2" />
              Repay Loan
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
