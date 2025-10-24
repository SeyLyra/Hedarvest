"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CROP_TOKEN_IDS } from "@/lib/contracts";
import { 
  Lock, 
  Coins, 
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

interface DepositCollateralProps {
  onBack: () => void;
  onComplete: (data: CollateralData) => void;
  userAddress: string;
  hashconnect: any;
  selectedPoolData?: any; // Pool data passed from parent
}

interface CollateralData {
  id: string;
  poolId: string;
  poolName: string;
  tokenIds: string[];
  totalValue: number;
  collateralRatio: number;
  maxBorrowAmount: number;
  depositDate: string;
  status: "pending" | "active" | "liquidated";
}

interface CropToken {
  id: string;
  tokenId: string;
  cropType: string;
  grade: string;
  quantity: number;
  unit: string;
  value: number;
  status: "available" | "deposited" | "borrowed";
  warehouse: string;
  issueDate: string;
  expiryDate: string;
}

const mockCropTokens: CropToken[] = [
  {
    id: "token001",
    tokenId: "WH-RICE-001",
    cropType: "Rice",
    grade: "Premium",
    quantity: 500,
    unit: "kg",
    value: 2500,
    status: "available",
    warehouse: "Green Valley Storage",
    issueDate: "2024-01-15",
    expiryDate: "2024-07-15"
  },
  {
    id: "token002",
    tokenId: "WH-CORN-002",
    cropType: "Corn",
    grade: "Grade A",
    quantity: 1200,
    unit: "kg",
    value: 1800,
    status: "available",
    warehouse: "Central Grain Hub",
    issueDate: "2024-01-14",
    expiryDate: "2024-07-14"
  },
  {
    id: "token003",
    tokenId: "WH-WHEAT-003",
    cropType: "Wheat",
    grade: "Grade B",
    quantity: 800,
    unit: "kg",
    value: 1200,
    status: "available",
    warehouse: "Premium Storage",
    issueDate: "2024-01-13",
    expiryDate: "2024-07-13"
  },
  {
    id: "token004",
    tokenId: "WH-SOYBEAN-004",
    cropType: "Soybean",
    grade: "Grade A",
    quantity: 600,
    unit: "kg",
    value: 1500,
    status: "deposited",
    warehouse: "Rural Storage Co-op",
    issueDate: "2024-01-12",
    expiryDate: "2024-07-12"
  }
];

const mockPools = [
  {
    id: "rice-pool",
    name: "RICE Pool",
    cropType: "Rice",
    apy: 8.5,
    collateralRatio: 0.75,
    minDeposit: 100,
    maxDeposit: 10000
  },
  {
    id: "corn-pool",
    name: "CORN Pool",
    cropType: "Corn",
    apy: 7.2,
    collateralRatio: 0.70,
    minDeposit: 200,
    maxDeposit: 15000
  },
  {
    id: "wheat-pool",
    name: "WHEAT Pool",
    cropType: "Wheat",
    apy: 9.1,
    collateralRatio: 0.80,
    minDeposit: 150,
    maxDeposit: 12000
  }
];

export default function DepositCollateral({ onBack, onComplete, userAddress, hashconnect, selectedPoolData: initialPoolData }: DepositCollateralProps) {
  const [selectedPool, setSelectedPool] = useState<string>("");
  const [selectedTokens, setSelectedTokens] = useState<string[]>([]);
  const [depositAmount, setDepositAmount] = useState<string>("");
  const [isDepositing, setIsDepositing] = useState(false);

  const availableTokens = mockCropTokens.filter(token => token.status === "available");
  const selectedPoolData = mockPools.find(pool => pool.id === selectedPool) || initialPoolData;

  const handleTokenSelect = (tokenId: string) => {
    setSelectedTokens(prev => 
      prev.includes(tokenId) 
        ? prev.filter(id => id !== tokenId)
        : [...prev, tokenId]
    );
  };

  const handleSelectAll = () => {
    if (selectedTokens.length === availableTokens.length) {
      setSelectedTokens([]);
    } else {
      setSelectedTokens(availableTokens.map(token => token.id));
    }
  };

  const calculateTotalValue = () => {
    return selectedTokens.reduce((total, tokenId) => {
      const token = availableTokens.find(t => t.id === tokenId);
      return total + (token?.value || 0);
    }, 0);
  };

  const calculateMaxBorrow = () => {
    if (!selectedPoolData) return 0;
    return calculateTotalValue() * selectedPoolData.collateralRatio;
  };

  const handleDeposit = async () => {
    if (!selectedPool || !depositAmount) {
      alert('Please select a pool and enter an amount');
      return;
    }

    // Get the collateral token ID based on the selected pool's crop type
    const poolInfo = mockPools.find(p => p.id === selectedPool);
    if (!poolInfo) {
      alert('Pool not found');
      return;
    }

    setIsDepositing(true);

    try {
      // Get farmer data from localStorage
      const farmerData = localStorage.getItem('farmer');
      const token = localStorage.getItem('token');

      if (!farmerData || !token) {
        alert('Please login first');
        return;
      }

      const farmer = JSON.parse(farmerData);

      // Call backend API to deposit collateral using custodial wallet
      const response = await fetch('http://localhost:4000/farmers/collateral/deposit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          farmerId: farmer.id,
          cropType: poolInfo.cropType.toLowerCase(), // 'rice', 'wheat', or 'corn'
          amount: parseFloat(depositAmount)
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to deposit collateral');
      }

      const result = await response.json();

      // Show success message
      alert(`Collateral deposited successfully!\n\nTransaction ID: ${result.contractTxId}\n\nYou can now borrow against your ${poolInfo.cropType} collateral.`);

      // Create collateral data for completion callback
      const collateralData: CollateralData = {
        id: `collateral_${Date.now()}`,
        poolId: selectedPool,
        poolName: poolInfo.name,
        tokenIds: [result.cropType],
        totalValue: parseFloat(depositAmount),
        collateralRatio: poolInfo.collateralRatio,
        maxBorrowAmount: parseFloat(depositAmount) * poolInfo.collateralRatio,
        depositDate: new Date().toISOString().split('T')[0],
        status: "active"
      };

      onComplete(collateralData);
    } catch (error) {
      console.error('Error depositing collateral:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Failed to deposit collateral'}`);
    } finally {
      setIsDepositing(false);
    }
  };

  const getGradeColor = (grade: string) => {
    switch (grade.toLowerCase()) {
      case "premium": return "text-green-600 bg-green-100";
      case "grade a": return "text-blue-600 bg-blue-100";
      case "grade b": return "text-yellow-600 bg-yellow-100";
      case "grade c": return "text-orange-600 bg-orange-100";
      default: return "text-gray-600 bg-gray-100";
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center py-6">
        <div className="flex items-center justify-center mb-4">
          <div className="p-4 bg-gradient-to-r from-orange-500 to-red-500 rounded-full">
            <Lock className="h-8 w-8 text-white" />
          </div>
        </div>
        <h2 className="text-3xl font-bold text-foreground mb-2">Deposit Collateral</h2>
        <p className="text-lg text-muted-foreground">
          Lock your crop tokens as collateral to access DeFi lending
        </p>
      </div>

      {/* Pool Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            <span>Select Lending Pool</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {mockPools.map((pool) => (
              <Card 
                key={pool.id}
                className={`cursor-pointer transition-all duration-200 ${
                  selectedPool === pool.id 
                    ? 'ring-2 ring-orange-500 shadow-lg' 
                    : 'hover:shadow-md'
                }`}
                onClick={() => setSelectedPool(pool.id)}
              >
                <CardContent className="p-4">
                  <div className="text-center">
                    <h3 className="font-semibold text-foreground mb-2">{pool.name}</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">APY:</span>
                        <span className="font-medium text-green-600">{pool.apy}%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Collateral Ratio:</span>
                        <span className="font-medium">{Math.round(pool.collateralRatio * 100)}%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Min Deposit:</span>
                        <span className="font-medium">${pool.minDeposit}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Amount Input */}
      {selectedPool && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Coins className="h-5 w-5 text-green-600" />
              <span>Deposit Amount</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="depositAmount">Amount of {selectedPoolData?.cropType} tokens to deposit</Label>
              <Input
                id="depositAmount"
                type="number"
                placeholder="Enter amount"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                min="1"
              />
              <p className="text-sm text-muted-foreground">
                Min: {selectedPoolData?.minDeposit || 1} tokens | Max: {selectedPoolData?.maxDeposit || 10000} tokens
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Token Selection */}
      {selectedPool && depositAmount && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <Coins className="h-5 w-5 text-green-600" />
                <span>Select Crop Tokens (Optional)</span>
              </CardTitle>
              <Button variant="outline" onClick={handleSelectAll}>
                {selectedTokens.length === availableTokens.length ? 'Deselect All' : 'Select All'}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedTokens.length === availableTokens.length}
                        onChange={handleSelectAll}
                        className="h-4 w-4 text-orange-600"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Token ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Crop</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grade</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Warehouse</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {availableTokens.map((token) => (
                    <tr key={token.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedTokens.includes(token.id)}
                          onChange={() => handleTokenSelect(token.id)}
                          className="h-4 w-4 text-orange-600"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-foreground">{token.tokenId}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-foreground">{token.cropType}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className={getGradeColor(token.grade)}>
                          {token.grade}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-foreground">{token.quantity} {token.unit}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-foreground">${token.value.toLocaleString()}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-muted-foreground">{token.warehouse}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary */}
      {selectedPool && depositAmount && (
        <Card className="bg-orange-50 border-orange-200">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-orange-600" />
              <span>Deposit Summary</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Collateral Amount</p>
                <p className="text-2xl font-bold text-foreground">{depositAmount} {selectedPoolData?.cropType} tokens</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Max Borrow Amount</p>
                <p className="text-2xl font-bold text-green-600">
                  ${((parseFloat(depositAmount) || 0) * (selectedPoolData?.collateralRatio || 0)).toLocaleString()}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Collateral Ratio</p>
                <p className="text-2xl font-bold text-blue-600">{Math.round((selectedPoolData?.collateralRatio || 0) * 100)}%</p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg">
              <h4 className="font-semibold text-foreground mb-2">Deposit Summary</h4>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Pool:</span>
                  <span className="font-medium">{selectedPoolData?.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Token Type:</span>
                  <span className="font-medium">{selectedPoolData?.cropType}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Amount:</span>
                  <span className="font-medium">{depositAmount} tokens</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>APY:</span>
                  <span className="font-medium text-green-600">{selectedPoolData?.apy}%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Deposit Progress */}
      {isDepositing && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <RefreshCw className="h-8 w-8 text-blue-600 animate-spin" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-foreground">Depositing Collateral...</h3>
                <p className="text-sm text-muted-foreground">
                  Locking your crop tokens in the {selectedPoolData?.name} pool
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Pools
        </Button>
        <Button
          onClick={handleDeposit}
          disabled={!selectedPool || !depositAmount || isDepositing}
          className="bg-orange-600 hover:bg-orange-700"
        >
          {isDepositing ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Depositing...
            </>
          ) : (
            <>
              <Lock className="h-4 w-4 mr-2" />
              Deposit Collateral
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
