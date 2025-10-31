"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { 
  Wheat, 
  MapPin, 
  Eye, 
  Lock, 
  DollarSign, 
  RotateCcw, 
  FileText, 
  Download,
  Upload,
  CheckCircle,
  Clock,
  AlertCircle,
  ArrowLeft,
  Camera,
  Phone,
  CreditCard,
  LogOut,
  Home,
  User,
  Settings,
  Bell,
  TrendingUp,
  Package,
  Banknote,
  Zap,
  Shield,
  Activity,
  Coins,
  Wallet,
  ChevronRight,
  ChevronDown,
  BarChart3,
  History,
  Building2,
  Truck,
  Leaf,
  Sprout,
  Droplets,
  Sun,
  Wind,
  Thermometer,
  Scale,
  Award,
  Star,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Plus,
  Search,
  Filter,
  Calendar,
  Target,
  PieChart,
  TrendingDown,
  RefreshCw,
  ExternalLink,
  Info,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock3,
  DollarSign as DollarIcon,
  Percent,
  Users2,
  Users,
  Globe,
  Smartphone,
  Monitor,
  Tablet,
  Menu,
  MessageCircle,
  Copy
} from "lucide-react";
import CropPools from "./CropPools";
import RegisterCrop from "./RegisterCrop";
import FindWarehouse from "./FindWarehouse";
import ActivityFeed from "./ActivityFeed";
import UserProfile from "./UserProfile";
import { toast } from "sonner";

interface FarmerDashboardProps {
  farmerName: string;
  farmerId: number;
  onLogout: () => void;
  hederaAccountId?: string;
}

type DashboardSection = "overview" | "my-crops" | "borrow-loans" | "activity";
type DefiStep = "crop-pools" | "deposit-collateral" | "borrow-funds" | "loan-status" | "repay-loan" | "withdraw-to-bank";

export default function FarmerDashboardNew({ farmerName, farmerId, onLogout, hederaAccountId }: FarmerDashboardProps) {
  const [currentSection, setCurrentSection] = useState<DashboardSection>("overview");
  const [defiStep, setDefiStep] = useState<DefiStep | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [deliveryWorkflow, setDeliveryWorkflow] = useState<"findWarehouse" | "registerCrop" | null>(null);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | null>(null);
  const [selectedPoolForDeposit, setSelectedPoolForDeposit] = useState<{ id: number; grainType: string } | null>(null);
  const [depositAmount, setDepositAmount] = useState<string>("");
  const [isDepositing, setIsDepositing] = useState(false);
  const [isRefreshingForDeposit, setIsRefreshingForDeposit] = useState(false);
  
  // Borrow form state
  const [selectedPoolForBorrow, setSelectedPoolForBorrow] = useState<{ id: number; grainType: string; maxBorrow?: string } | null>(null);
  const [borrowAmount, setBorrowAmount] = useState<string>("");
  const [isBorrowing, setIsBorrowing] = useState(false);
  const [overviewLoading, setOverviewLoading] = useState(false);
  const [overviewMetrics, setOverviewMetrics] = useState<{
    totalCollateralUSD?: number;
    totalMaxBorrowUSD?: number;
    activeLoans?: number;
  }>({});
  const [loanPositions, setLoanPositions] = useState<Record<string, { collateralUSD?: string; borrowedUSD?: string; maxBorrowUSD?: string; ltv?: string }>>({});
  const [loadingLoanPositions, setLoadingLoanPositions] = useState(false);

  // Live token balances
  const [isLoadingBalances, setIsLoadingBalances] = useState(false);
  const [wheatBalance, setWheatBalance] = useState<string>("0");
  const [riceBalance, setRiceBalance] = useState<string>("0");
  const [usdcBalance, setUsdcBalance] = useState<number>(0); // mock USDC balance
  const [wheatAssociated, setWheatAssociated] = useState<boolean | undefined>(undefined);
  const [riceAssociated, setRiceAssociated] = useState<boolean | undefined>(undefined);

  // Load mock USDC balance from localStorage
  useEffect(() => {
    const acct = hederaAccountId || (typeof window !== 'undefined' ? localStorage.getItem('farmerAccountId') || '' : '');
    if (!acct) return;
    const key = `mockUsdcBalance:${acct}`;
    const raw = typeof window !== 'undefined' ? localStorage.getItem(key) : null;
    const val = raw ? parseFloat(raw) : 0;
    if (!Number.isNaN(val)) setUsdcBalance(val);
  }, [hederaAccountId]);

  useEffect(() => {
    const acct = hederaAccountId || (typeof window !== 'undefined' ? localStorage.getItem('farmerAccountId') || '' : '');
    console.log('🔍 Farmer Dashboard - Hedera Account ID:', acct);
    
    if (!acct) {
      console.log('⚠️ No Hedera Account ID found for farmer');
      return;
    }

    const fetchBalances = async () => {
      try {
        setIsLoadingBalances(true);
        // Fetch crop token balances and mock USDC balance
        const [wheatRes, riceRes, usdcRes] = await Promise.all([
          fetch(`/api/faucet/balance/${acct}?tokenType=wheat`, { cache: 'no-store' }),
          fetch(`/api/faucet/balance/${acct}?tokenType=rice`, { cache: 'no-store' }),
          fetch(`/api/faucet/balance/${acct}?tokenType=usdc`, { cache: 'no-store' }),
        ]);
        const [wheatJson, riceJson, usdcJson] = await Promise.all([
          wheatRes.json(),
          riceRes.json(),
          usdcRes.json(),
        ]);
        if (wheatRes.ok) {
          setWheatBalance(wheatJson.balance || '0');
          setWheatAssociated(wheatJson.isAssociated);
        }
        if (riceRes.ok) {
          setRiceBalance(riceJson.balance || '0');
          setRiceAssociated(riceJson.isAssociated);
        }
        if (usdcRes.ok) {
          const bal = typeof usdcJson.balance === 'string' ? parseFloat(usdcJson.balance) : Number(usdcJson.balance || 0);
          setUsdcBalance(isFinite(bal) ? bal : 0);
        }
      } catch (_) {
        // keep defaults
      } finally {
        setIsLoadingBalances(false);
      }
    };

    fetchBalances();
  }, [hederaAccountId]);

  // Load overview metrics from live pools/allowances
  useEffect(() => {
    const loadOverview = async () => {
      try {
        setOverviewLoading(true);
        const token = typeof window !== 'undefined' ? localStorage.getItem('farmerToken') : null;
        if (!token) {
          setOverviewMetrics({});
          return;
        }
        const poolsRes = await fetch('/api/pools/list', { cache: 'no-store' });
        const poolsJson = await poolsRes.json();
        const pools = poolsJson?.success ? poolsJson.data : [];
        if (!pools || pools.length === 0) {
          setOverviewMetrics({});
          return;
        }
        const results = await Promise.all(pools.map(async (p: any) => {
          const grain = String(p.grainType || '').toLowerCase();
          const res = await fetch(`/api/farmers/borrow/allowance/${grain}`, {
            headers: { Authorization: `Bearer ${token}` },
            cache: 'no-store',
          });
          const json = await res.json();
          return res.ok ? json : null;
        }));
        let totalCollateral = 0;
        let totalMaxBorrow = 0;
        let activeLoans = 0;
        for (const r of results) {
          if (!r) continue;
          // collateralValueUSD is now in human-readable format from backend
          const coll = r.collateralValueUSD ? parseFloat(r.collateralValueUSD) : 0;
          // maxBorrowUSD is now in human-readable format from backend
          const maxB = r.maxBorrowUSD ? parseFloat(r.maxBorrowUSD) : 0;
          const bor = r.borrows ? Number(r.borrows) / 1e6 : 0; // USDC 6 decimals
          totalCollateral += coll;
          totalMaxBorrow += maxB;
          if (bor > 0) activeLoans += 1;
        }
        setOverviewMetrics({
          totalCollateralUSD: totalCollateral,
          totalMaxBorrowUSD: totalMaxBorrow,
          activeLoans,
        });
      } catch (_) {
        setOverviewMetrics({});
      } finally {
        setOverviewLoading(false);
      }
    };
    loadOverview();
  }, []);

  // Load loan positions when entering the loan-status view
  useEffect(() => {
    const loadPositions = async () => {
      if (defiStep !== 'loan-status') return;
      setLoadingLoanPositions(true);
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('farmerToken') : null;
        if (!token) {
          setLoanPositions({});
          setLoadingLoanPositions(false);
          return;
        }
        // Fetch live pools to determine available grain types
        const poolsRes = await fetch('/api/pools/list', { cache: 'no-store' });
        const poolsJson = await poolsRes.json();
        const pools = poolsJson?.success ? poolsJson.data : [];
        const grains: string[] = pools.map((p: any) => String(p.grainType || '').toLowerCase()).filter(Boolean);
        if (grains.length === 0) {
          setLoanPositions({});
          setLoadingLoanPositions(false);
          return;
        }
        const results = await Promise.all(grains.map(async (g) => {
          const res = await fetch(`/api/farmers/borrow/allowance/${g}`, {
            headers: { Authorization: `Bearer ${token}` },
            cache: 'no-store',
          });
          const json = await res.json();
          if (!res.ok) return [g.toUpperCase(), {}] as const;
          return [g.toUpperCase(), {
            collateralUSD: json.collateralValueUSD,
            borrowedUSD: json.borrows,
            maxBorrowUSD: json.maxBorrowUSD,
            ltv: json.loanToValue,
          }] as const;
        }));
        const map: Record<string, { collateralUSD?: string; borrowedUSD?: string; maxBorrowUSD?: string; ltv?: string }> = {};
        for (const [k, v] of results) map[k] = v;
        setLoanPositions(map);
      } catch (e) {
        setLoanPositions({});
      } finally {
        setLoadingLoanPositions(false);
      }
    };
    loadPositions();
  }, [defiStep]);

  const refreshBalances = async (account: string) => {
    try {
      setIsRefreshingForDeposit(true);
      const [wheatRes, riceRes, usdcRes] = await Promise.all([
        fetch(`/api/faucet/balance/${account}?tokenType=wheat`, { cache: 'no-store' }),
        fetch(`/api/faucet/balance/${account}?tokenType=rice`, { cache: 'no-store' }),
        fetch(`/api/faucet/balance/${account}?tokenType=usdc`, { cache: 'no-store' }),
      ]);
      const [wheatJson, riceJson, usdcJson] = await Promise.all([wheatRes.json(), riceRes.json(), usdcRes.json()]);
      if (wheatRes.ok) {
        setWheatBalance(wheatJson.balance || '0');
        setWheatAssociated(wheatJson.isAssociated);
      }
      if (riceRes.ok) {
        setRiceBalance(riceJson.balance || '0');
        setRiceAssociated(riceJson.isAssociated);
      }
      if (usdcRes.ok) {
        const bal = typeof usdcJson.balance === 'string' ? parseFloat(usdcJson.balance) : Number(usdcJson.balance || 0);
        setUsdcBalance(isFinite(bal) ? bal : 0);
      }
    } catch (_) {
      // ignore
    } finally {
      setIsRefreshingForDeposit(false);
    }
  };

  // Mock data (non-balance items)
  const farmerStats = {
    totalTokenizedCrops: 12,
    totalValue: 25000,
    availableCredit: 5000,
    activeLoans: 2,
    nextRepayment: "2024-02-15",
    totalEarnings: 15000,
    kycStatus: "verified",
    accountNumber: `MBR-${Date.now().toString().slice(-8)}`,
    walletAddress: hederaAccountId || "",
    hederaAccountId: hederaAccountId || "",
    isCustodial: true,
    memberNumber: `MBR-${Date.now().toString().slice(-8)}`
  };

  const recentTransactions = [
    {
      id: "tx001",
      type: "mint",
      description: "Tokenized 500kg Rice",
      amount: "+2,500",
      date: "2024-01-15",
      status: "completed",
      icon: Upload
    },
    {
      id: "tx002", 
      type: "borrow",
      description: "Borrowed against Rice tokens",
      amount: "-1,800",
      date: "2024-01-14",
      status: "completed",
      icon: DollarSign
    },
    {
      id: "tx003",
      type: "repay",
      description: "Partial loan repayment",
      amount: "+500",
      date: "2024-01-13", 
      status: "completed",
      icon: RotateCcw
    }
  ];

  const handleSectionChange = (section: DashboardSection) => {
    setCurrentSection(section);
    if (section === "borrow-loans") {
      setDefiStep("crop-pools");
    } else {
      setDefiStep(null);
    }
    setIsMobileMenuOpen(false);
  };

  const handleDefiStep = (step: DefiStep) => {
    setDefiStep(step);
    setCurrentSection("borrow-loans");
  };

  const renderOverview = () => (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="text-center py-8 bg-gradient-to-r from-agricultural-green/5 to-trust-blue/5 rounded-2xl">
        <div className="flex items-center justify-center mb-4">
          <div className="p-4 bg-gradient-to-r from-agricultural-green to-trust-blue rounded-full">
            <Wheat className="h-8 w-8 text-white" />
          </div>
        </div>
        <h2 className="text-3xl font-bold text-foreground mb-2">
          Welcome back, {farmerName}! 🌾
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Manage your crops, access DeFi lending, and grow your agricultural business with blockchain technology.
        </p>
      </div>

      {/* Key Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-lg transition-all duration-200 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700 dark:text-green-300">Tokenized Crops</p>
                <p className="text-2xl font-bold text-green-900 dark:text-green-100">{farmerStats.totalTokenizedCrops}</p>
                <p className="text-xs text-green-600 dark:text-green-400 flex items-center mt-1">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  2 this week
                </p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-800/30 rounded-lg">
                <Package className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-200 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-blue-200 dark:border-blue-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Total Value</p>
                {overviewLoading ? (
                  <p className="text-sm text-blue-700 dark:text-blue-300">Loading…</p>
                ) : overviewMetrics.totalCollateralUSD !== undefined ? (
                  <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">${overviewMetrics.totalCollateralUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                ) : (
                  <p className="text-xs text-blue-600 dark:text-blue-400">Coming soon</p>
                )}
                <p className="text-xs text-green-600 dark:text-green-400 flex items-center mt-1">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +12.5% this month
                </p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-800/30 rounded-lg">
                <DollarSign className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-200 bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 border-purple-200 dark:border-purple-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700 dark:text-purple-300">Available Credit</p>
                {overviewLoading ? (
                  <p className="text-sm text-purple-700 dark:text-purple-300">Loading…</p>
                ) : overviewMetrics.totalMaxBorrowUSD !== undefined ? (
                  <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">${overviewMetrics.totalMaxBorrowUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                ) : (
                  <p className="text-xs text-purple-700 dark:text-purple-300">Coming soon</p>
                )}
                <p className="text-xs text-blue-600 dark:text-blue-400 flex items-center mt-1">
                  <CreditCard className="h-3 w-3 mr-1" />
                  Ready to borrow
                </p>
              </div>
              <div className="p-3 bg-purple-100 dark:bg-purple-800/30 rounded-lg">
                <CreditCard className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-200 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border-orange-200 dark:border-orange-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-700 dark:text-orange-300">Active Loans</p>
                {overviewLoading ? (
                  <p className="text-sm text-orange-700 dark:text-orange-300">Loading…</p>
                ) : overviewMetrics.activeLoans !== undefined ? (
                  <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">{overviewMetrics.activeLoans}</p>
                ) : (
                  <p className="text-xs text-orange-700 dark:text-orange-300">Coming soon</p>
                )}
                <p className="text-xs text-orange-600 dark:text-orange-400 flex items-center mt-1">
                  <Clock className="h-3 w-3 mr-1" />
                  Next due: —
                </p>
              </div>
              <div className="p-3 bg-orange-100 dark:bg-orange-800/30 rounded-lg">
                <FileText className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Start Banner */}
      <Card className="mb-8 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border-green-200 dark:border-green-700">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-green-100 dark:bg-green-800/30 rounded-lg">
                <Wheat className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-green-900 dark:text-green-100">Get Started</h3>
                <p className="text-sm text-green-700 dark:text-green-300">View your crop tokens and start borrowing against them</p>
              </div>
            </div>
            <Button
              onClick={() => handleSectionChange("my-crops")}
              className="bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800"
            >
              <Wheat className="h-4 w-4 mr-2" />
              View My Crops
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* My Crops */}
        <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-700" onClick={() => handleSectionChange("my-crops")}>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-green-900 dark:text-green-100">
              <Wheat className="h-5 w-5 text-green-600 dark:text-green-400" />
              <span>My Crops</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-green-700 dark:text-green-300 mb-4">
              View your stored crops and their current values
            </p>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="p-3 bg-green-100 dark:bg-green-800/30 rounded-lg">
                <p className="text-sm text-green-700 dark:text-green-300">Wheat Credits</p>
                <p className="text-2xl font-bold text-green-800 dark:text-green-200">{isLoadingBalances ? 'Loading…' : `${wheatBalance} WHEAT`}</p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-800/30 rounded-lg">
                <p className="text-sm text-blue-700 dark:text-blue-300">Rice Credits</p>
                <p className="text-2xl font-bold text-blue-800 dark:text-blue-200">{isLoadingBalances ? 'Loading…' : `${riceBalance} RICE`}</p>
              </div>
            </div>
            <Button className="w-full bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800" onClick={(e) => { e.stopPropagation(); handleSectionChange("my-crops"); }}>
              <Wheat className="h-4 w-4 mr-2" />
              View My Crops
            </Button>
          </CardContent>
        </Card>

        {/* Borrow & Loans */}
        <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-blue-200 dark:border-blue-700" onClick={() => handleSectionChange("borrow-loans")}>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-blue-900 dark:text-blue-100">
              <DollarSign className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <span>Borrow & Loans</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-blue-700 dark:text-blue-300 mb-4">
              Use your crop tokens as collateral to borrow funds
            </p>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-800/30 rounded-lg">
                <p className="text-sm text-blue-700 dark:text-blue-300">Available Credit</p>
                <p className="text-2xl font-bold text-blue-800 dark:text-blue-200">${farmerStats.availableCredit.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-orange-100 dark:bg-orange-800/30 rounded-lg">
                <p className="text-sm text-orange-700 dark:text-orange-300">Active Loans</p>
                <p className="text-2xl font-bold text-orange-800 dark:text-orange-200">{farmerStats.activeLoans}</p>
              </div>
            </div>
            <Button className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800" onClick={(e) => { e.stopPropagation(); handleSectionChange("borrow-loans"); }}>
              <DollarSign className="h-4 w-4 mr-2" />
              Borrow Funds
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Wallet Information */}
      <Card className="bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-900/20 dark:to-gray-900/20 border-slate-200 dark:border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-slate-900 dark:text-slate-100">
            <Wallet className="h-5 w-5 text-slate-600 dark:text-slate-400" />
            <span>Wallet Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Hedera Account ID</Label>
                <div className="flex items-center space-x-2 mt-1">
                  <code className="text-sm font-mono bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded border text-slate-800 dark:text-slate-200">
                    {farmerStats.hederaAccountId || 'Not set'}
                  </code>
                  {farmerStats.hederaAccountId && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(farmerStats.hederaAccountId);
                      }}
                      className="text-slate-600 dark:text-slate-400"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                {!farmerStats.hederaAccountId && (
                  <Button
                    size="sm"
                    variant="default"
                    onClick={async () => {
                      console.log('🔧 Requesting Hedera wallet creation...');
                      try {
                        const token = localStorage.getItem('farmerToken');
                        if (!token) {
                          console.error('❌ No farmer token found');
                          return;
                        }
                        const response = await fetch('/api/farmers/create-wallet', {
                          method: 'POST',
                          headers: {
                            'Authorization': `Bearer ${token}`,
                          },
                        });
                        const data = await response.json();
                        if (response.ok) {
                          console.log('✅ Wallet created:', data);
                          window.location.reload();
                        } else {
                          console.error('❌ Failed to create wallet:', data);
                          alert(`Failed to create wallet: ${data.error || 'Unknown error'}`);
                        }
                      } catch (error) {
                        console.error('❌ Error creating wallet:', error);
                        alert('Error creating wallet. Please try again.');
                      }
                    }}
                    className="mt-2 bg-blue-600 hover:bg-blue-700"
                  >
                    <Wallet className="h-4 w-4 mr-2" />
                    Create Hedera Wallet
                  </Button>
                )}
              </div>
              <div>
                <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Member Number</Label>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{farmerStats.memberNumber}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Wallet Type</Label>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge variant={farmerStats.isCustodial ? "default" : "secondary"} className="text-xs">
                    {farmerStats.isCustodial ? "Custodial" : "Self-Managed"}
                  </Badge>
                  <Shield className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">KYC Status</Label>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge variant="outline" className="text-xs text-green-600 border-green-200 dark:text-green-400 dark:border-green-700">
                    {farmerStats.kycStatus}
                  </Badge>
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 border-purple-200 dark:border-purple-700">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-purple-900 dark:text-purple-100">
            <Activity className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            <span>Recent Activity</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentTransactions.map((tx) => {
              const Icon = tx.icon;
              return (
                <div key={tx.id} className="flex items-center space-x-4 p-3 rounded-lg hover:bg-purple-100/50 dark:hover:bg-purple-800/20 transition-colors">
                  <div className="p-2 bg-purple-100 dark:bg-purple-800/30 rounded-lg">
                    <Icon className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-purple-900 dark:text-purple-100">{tx.description}</h4>
                    <p className="text-sm text-purple-700 dark:text-purple-300">{tx.date}</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-medium ${
                      tx.type === 'borrow' ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
                    }`}>
                      {tx.amount}
                    </p>
                    <Badge variant="outline" className="text-xs border-purple-200 dark:border-purple-700 text-purple-700 dark:text-purple-300">
                      {tx.status}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderContactAgent = () => {
    // Mock data for local agents
    const localAgents = [
      {
        id: 1,
        name: "Maria Rodriguez",
        title: "Senior Agricultural Agent",
        location: "Central Valley, CA",
        distance: "2.3 miles",
        phone: "+1 (555) 123-4567",
        email: "maria.rodriguez@hedarvest.com",
        specialties: ["Rice", "Wheat", "Corn"],
        rating: 4.9,
        experience: "8 years",
        languages: ["English", "Spanish"],
        availability: "Available now",
        avatar: "👩‍🌾"
      },
      {
        id: 2,
        name: "John Chen",
        title: "Crop Finance Specialist",
        location: "Fresno County, CA",
        distance: "5.7 miles",
        phone: "+1 (555) 234-5678",
        email: "john.chen@hedarvest.com",
        specialties: ["Soybeans", "Cotton", "Sugar"],
        rating: 4.8,
        experience: "12 years",
        languages: ["English", "Mandarin"],
        availability: "Available in 2 hours",
        avatar: "👨‍💼"
      },
      {
        id: 3,
        name: "Sarah Johnson",
        title: "Warehouse & Storage Expert",
        location: "Bakersfield, CA",
        distance: "8.1 miles",
        phone: "+1 (555) 345-6789",
        email: "sarah.johnson@hedarvest.com",
        specialties: ["Storage Solutions", "Quality Control", "Logistics"],
        rating: 4.7,
        experience: "6 years",
        languages: ["English"],
        availability: "Available tomorrow",
        avatar: "👩‍💻"
      }
    ];

    return (
      <div className="space-y-6">
        <div className="text-center py-6">
          <h2 className="text-3xl font-bold text-foreground mb-2">Find Local Agents</h2>
          <p className="text-lg text-muted-foreground">
            Connect with experienced agricultural agents in your area
          </p>
        </div>

        {/* Search and Filter */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Label htmlFor="search">Search agents</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="search"
                    placeholder="Search by name, specialty, or location..."
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="md:w-48">
                <Label htmlFor="specialty">Specialty</Label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500">
                  <option value="">All Specialties</option>
                  <option value="rice">Rice</option>
                  <option value="wheat">Wheat</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Agents List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {localAgents.map((agent) => (
            <Card key={agent.id} className="hover:shadow-lg transition-all duration-200">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4 mb-4">
                  <div className="text-4xl">{agent.avatar}</div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-foreground">{agent.name}</h3>
                    <p className="text-sm text-muted-foreground">{agent.title}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <MapPin className="h-3 w-3 text-gray-400" />
                      <span className="text-xs text-gray-500">{agent.location}</span>
                      <span className="text-xs text-green-600 font-medium">• {agent.distance}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {/* Rating and Experience */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      <span className="text-sm font-medium">{agent.rating}</span>
                    </div>
                    <span className="text-xs text-gray-500">{agent.experience}</span>
                  </div>

                  {/* Specialties */}
                  <div>
                    <p className="text-xs font-medium text-gray-600 mb-1">Specialties:</p>
                    <div className="flex flex-wrap gap-1">
                      {agent.specialties.map((specialty) => (
                        <Badge key={specialty} variant="secondary" className="text-xs">
                          {specialty}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Availability */}
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${
                      agent.availability === "Available now" ? "bg-green-500" : 
                      agent.availability.includes("hours") ? "bg-yellow-500" : "bg-gray-400"
                    }`}></div>
                    <span className="text-xs text-gray-600">{agent.availability}</span>
                  </div>

                  {/* Contact Buttons */}
                  <div className="flex space-x-2 pt-2">
                    <Button 
                      size="sm" 
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      onClick={() => window.open(`tel:${agent.phone}`)}
                    >
                      <Phone className="h-3 w-3 mr-1" />
                      Call
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => window.open(`mailto:${agent.email}`)}
                    >
                      <MessageCircle className="h-3 w-3 mr-1" />
                      Email
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Help Section */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <MessageCircle className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">Need Immediate Help?</h3>
                <p className="text-blue-700 mb-4">
                  Can't find a local agent or need urgent assistance? Our support team is available 24/7.
                </p>
                <div className="flex space-x-3">
                  <Button variant="outline" size="sm" className="border-blue-300 text-blue-700 hover:bg-blue-100">
                    <Phone className="h-4 w-4 mr-2" />
                    Call Support: +1 (555) 000-HELP
                  </Button>
                  <Button variant="outline" size="sm" className="border-blue-300 text-blue-700 hover:bg-blue-100">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Live Chat
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderMobileMenu = () => (
    <div className="lg:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
      <div className="fixed left-0 top-0 h-full w-80 bg-background shadow-xl">
        <div className="p-6">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-agricultural-green to-trust-blue rounded-lg flex items-center justify-center">
                <Wheat className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold">Hedarvest</span>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <XCircle className="h-5 w-5" />
            </Button>
          </div>
          
          <nav className="space-y-2">
            {[
              { id: "overview", label: "Overview", icon: Home },
              { id: "my-crops", label: "My Crops", icon: Wheat },
              { id: "borrow-loans", label: "Borrow & Loans", icon: DollarSign },
              { id: "activity", label: "Activity", icon: Activity }
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSectionChange(item.id as DashboardSection)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    currentSection === item.id
                      ? 'bg-primary/10 text-primary'
                      : 'hover:bg-muted'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Button 
                variant="ghost" 
                size="sm" 
                className="lg:hidden mr-4"
                onClick={() => setIsMobileMenuOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-agricultural-green to-trust-blue rounded-lg flex items-center justify-center">
                  <Wheat className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-foreground">Hedarvest</h1>
                  <p className="text-xs text-muted-foreground">Farmer Dashboard</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" className="hidden sm:flex">
                <Bell className="h-5 w-5" />
              </Button>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-agricultural-green to-trust-blue rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
                <span className="hidden sm:block text-sm font-medium text-foreground">{farmerName}</span>
              </div>
              <Button 
                onClick={onLogout}
                variant="outline"
                size="sm"
                className="hidden sm:flex"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Desktop Navigation */}
        <div className="hidden lg:block">
          <div className="flex space-x-1 mb-8">
            {[
              { id: "overview", label: "Overview", icon: Home },
              { id: "my-crops", label: "My Crops", icon: Wheat },
              { id: "borrow-loans", label: "Borrow & Loans", icon: DollarSign },
              { id: "activity", label: "Activity", icon: Activity }
            ].map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.id}
                  variant={currentSection === item.id ? "default" : "ghost"}
                  onClick={() => handleSectionChange(item.id as DashboardSection)}
                  className="flex items-center space-x-2"
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Button>
              );
            })}
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-8">
          {/* Delivery Workflow */}
          {deliveryWorkflow === "findWarehouse" && (
            <FindWarehouse
              onBack={() => setDeliveryWorkflow(null)}
              onNext={(warehouseId) => {
                setSelectedWarehouseId(warehouseId);
                setDeliveryWorkflow("registerCrop");
              }}
            />
          )}

          {deliveryWorkflow === "registerCrop" && (
            <RegisterCrop
              onBack={() => setDeliveryWorkflow("findWarehouse")}
              onNext={() => {
                setDeliveryWorkflow(null);
                setSelectedWarehouseId(null);
                setCurrentSection("my-crops");
              }}
              warehouseId={selectedWarehouseId || undefined}
            />
          )}

          {/* Regular Dashboard Sections */}
          {!deliveryWorkflow && currentSection === "overview" && renderOverview()}
          {!deliveryWorkflow && currentSection === "my-crops" && (
            <div className="space-y-6">
              {/* Header */}
              <div className="text-center py-6">
                <div className="flex items-center justify-center mb-4">
                  <div className="p-4 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full">
                    <Wheat className="h-8 w-8 text-white" />
                  </div>
                </div>
                <h2 className="text-3xl font-bold text-foreground mb-2">My Crop Tokens</h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  View your tokenized crops and their current values
                </p>
              </div>

              {/* Crop Token Balances */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                {/* WHEAT Token */}
                <Card className="hover:shadow-lg transition-all duration-200 bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 border-amber-200 dark:border-amber-700">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="text-4xl">🌾</div>
                        <div>
                          <CardTitle className="text-xl text-amber-900 dark:text-amber-100">Wheat Credits</CardTitle>
                          <p className="text-sm text-amber-700 dark:text-amber-300">Stored Wheat Value</p>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm text-amber-700 dark:text-amber-300 mb-1">Balance</p>
                      <p className="text-3xl font-bold text-amber-900 dark:text-amber-100">{isLoadingBalances ? 'Loading…' : `${wheatBalance} WHEAT`}</p>
                      {wheatAssociated === false && (
                        <p className="text-xs text-red-600 mt-1">Token not associated. Please associate WHEAT in your wallet.</p>
                      )}
                    </div>
                    <div className="pt-4 border-t border-amber-200 dark:border-amber-700">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-amber-700 dark:text-amber-300">Available</span>
                        <span className="font-medium text-amber-800 dark:text-amber-200">—</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-amber-700 dark:text-amber-300">Pledged as Security</span>
                        <span className="font-medium text-amber-800 dark:text-amber-200">—</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* RICE Token */}
                <Card className="hover:shadow-lg transition-all duration-200 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-700">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="text-4xl">🌾</div>
                        <div>
                          <CardTitle className="text-xl text-green-900 dark:text-green-100">Rice Credits</CardTitle>
                          <p className="text-sm text-green-700 dark:text-green-300">Stored Rice Value</p>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm text-green-700 dark:text-green-300 mb-1">Balance</p>
                      <p className="text-3xl font-bold text-green-900 dark:text-green-100">{isLoadingBalances ? 'Loading…' : `${riceBalance} RICE`}</p>
                      {riceAssociated === false && (
                        <p className="text-xs text-red-600 mt-1">Token not associated. Please associate RICE in your wallet.</p>
                      )}
                    </div>
                    <div className="pt-4 border-t border-green-200 dark:border-green-700">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-green-700 dark:text-green-300">Available</span>
                        <span className="font-medium text-green-800 dark:text-green-200">—</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-green-700 dark:text-green-300">Pledged as Security</span>
                        <span className="font-medium text-green-800 dark:text-green-200">—</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions */}
              <div className="max-w-4xl mx-auto">
                <Card className="bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-900/20 dark:to-gray-900/20 border-slate-200 dark:border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-slate-900 dark:text-slate-100">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Button
                        className="h-16 text-base bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 dark:from-green-700 dark:to-emerald-700 dark:hover:from-green-800 dark:hover:to-emerald-800"
                        onClick={() => setDeliveryWorkflow("findWarehouse")}
                      >
                        <Truck className="h-5 w-5 mr-2" />
                        Request Delivery
                      </Button>
                      <Button
                        className="h-16 text-base bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 dark:from-blue-700 dark:to-cyan-700 dark:hover:from-blue-800 dark:hover:to-cyan-800"
                        onClick={() => handleSectionChange("borrow-loans")}
                      >
                        <Lock className="h-5 w-5 mr-2" />
                        Use as Collateral
                      </Button>
                      <Button
                        variant="outline"
                        className="h-16 text-base border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                        onClick={() => handleSectionChange("activity")}
                      >
                        <History className="h-5 w-5 mr-2" />
                        View Activity
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
          {!deliveryWorkflow && currentSection === "borrow-loans" && (
            <div>
              {!defiStep || defiStep === "crop-pools" ? (
                <div className="space-y-6">
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setDefiStep('loan-status')}>
                      <BarChart3 className="h-4 w-4 mr-2" />
                      View Loan Position
                    </Button>
                    <Button variant="outline" onClick={() => setDefiStep('withdraw-to-bank')}>
                      <Banknote className="h-4 w-4 mr-2" />
                      Withdraw to Bank
                    </Button>
                  </div>
                  <CropPools
                    onDeposit={async (poolId) => {
                      try {
                        // Fetch pool details to get grainType
                        const response = await fetch('/api/pools/list');
                        const data = await response.json();
                        const pools = data.success ? data.data : [];
                        const pool = pools.find((p: any) => p.id.toString() === poolId.toString()) || 
                                    { id: parseInt(poolId), grainType: 'WHEAT' }; // fallback
                        setSelectedPoolForDeposit({ id: pool.id, grainType: String(pool.grainType).toUpperCase() });
                        
                        // Ensure balances are fresh when entering deposit step - use same logic as useEffect
                        const acct = hederaAccountId || (typeof window !== 'undefined' ? localStorage.getItem('farmerAccountId') || '' : '');
                        console.log('🔍 Deposit form - Using account:', acct);
                        if (acct) {
                          await refreshBalances(acct);
                        }
                        
                      setDefiStep("deposit-collateral");
                      } catch (error) {
                        console.error("Failed to fetch pool:", error);
                        // Use fallback
                        setSelectedPoolForDeposit({ id: parseInt(poolId), grainType: 'WHEAT' });
                        setDefiStep("deposit-collateral");
                      }
                    }}
                    onViewDetails={(poolId) => console.log("View details for pool:", poolId)}
                    onBorrow={async (poolId) => {
                      try {
                        const response = await fetch('/api/pools/list');
                        const data = await response.json();
                        const pools = data.success ? data.data : [];
                        const pool = pools.find((p: any) => p.id.toString() === poolId.toString()) ||
                                    { id: parseInt(poolId), grainType: 'WHEAT' };
                        
                        // Fetch max borrow allowance
                        const token = localStorage.getItem('farmerToken');
                        if (token) {
                          const allowanceRes = await fetch(`/api/farmers/borrow/allowance/${pool.grainType.toLowerCase()}`, {
                            headers: { 'Authorization': `Bearer ${token}` },
                            cache: 'no-store',
                          });
                          const allowanceJson = await allowanceRes.json();
                          const maxBorrow = allowanceJson.maxBorrowUSD || '0';
                          setSelectedPoolForBorrow({ 
                            id: pool.id, 
                            grainType: pool.grainType.toUpperCase(),
                            maxBorrow: maxBorrow
                          });
                        } else {
                          setSelectedPoolForBorrow({ 
                            id: pool.id, 
                            grainType: pool.grainType.toUpperCase()
                          });
                        }
                      setDefiStep("borrow-funds");
                      } catch (error) {
                        console.error("Failed to fetch pool:", error);
                        setSelectedPoolForBorrow({ id: parseInt(poolId), grainType: 'WHEAT' });
                        setDefiStep("borrow-funds");
                      }
                    }}
                  />
                </div>
              ) : defiStep === "deposit-collateral" ? (
                <div className="p-8 max-w-2xl mx-auto">
                  {/* Back Button */}
                  <div className="mb-6">
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setDefiStep("crop-pools");
                        setSelectedPoolForDeposit(null);
                        setDepositAmount("");
                      }}
                      className="mb-4"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back to Pools
                    </Button>
                  </div>

                  {/* Deposit Form */}
                  <Card className="bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-900/20 dark:to-gray-900/20 border-slate-200 dark:border-slate-700">
                    <CardHeader>
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full">
                          <Lock className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-2xl text-slate-900 dark:text-slate-100">Deposit Collateral</CardTitle>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                            Deposit {selectedPoolForDeposit?.grainType || 'crop'} tokens as collateral to borrow funds
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Current Balance */}
                      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4">
                        <div className="flex justify-between items-center">
                          <div className="flex-1">
                            <p className="text-sm text-green-700 dark:text-green-300">Your {selectedPoolForDeposit?.grainType || 'crop'} Balance</p>
                            {isLoadingBalances || isRefreshingForDeposit ? (
                              <div className="flex items-center space-x-2 text-green-700 dark:text-green-300 mt-1">
                                <RefreshCw className="h-4 w-4 animate-spin" />
                                <span>Loading balance...</span>
                              </div>
                            ) : (
                              <>
                                <p className="text-2xl font-bold text-green-900 dark:text-green-100 mt-1">
                                  {(selectedPoolForDeposit?.grainType || '').toUpperCase() === 'WHEAT' ? wheatBalance : 
                                   (selectedPoolForDeposit?.grainType || '').toUpperCase() === 'RICE' ? riceBalance : '0'}
                                </p>
                                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                                  (Same as shown in "My Crops" section)
                                </p>
                              </>
                            )}
                            <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                              {selectedPoolForDeposit?.grainType || 'CROP'} Tokens
                            </p>
                            {/* Manual refresh button */}
                            <Button
                              variant="outline"
                              size="sm"
                              className="mt-2 h-7 text-xs"
                              onClick={async () => {
                                const acct = hederaAccountId || (typeof window !== 'undefined' ? localStorage.getItem('farmerAccountId') || '' : '');
                                console.log('🔄 Manual refresh - Using account:', acct);
                                if (acct) {
                                  await refreshBalances(acct);
                                  toast.success('Balance refreshed');
                                } else {
                                  toast.error('No account ID found');
                                }
                              }}
                            >
                              <RefreshCw className="h-3 w-3 mr-1" />
                              Refresh Balance
                            </Button>
                            {/* Debug info */}
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 break-all">
                              Account: {hederaAccountId || localStorage.getItem('farmerAccountId') || 'Not set'}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              State - Wheat: {wheatBalance} | Rice: {riceBalance}
                            </p>
                          </div>
                          <Wallet className="h-10 w-10 text-green-600 dark:text-green-400 ml-4" />
                        </div>
                      </div>

                      {/* Amount Input */}
                      <div className="space-y-2">
                        <Label htmlFor="deposit-amount" className="text-slate-900 dark:text-slate-100">
                          Amount to Deposit
                        </Label>
                        <Input
                          id="deposit-amount"
                          type="number"
                          placeholder="Enter amount"
                          value={depositAmount}
                          onChange={(e) => setDepositAmount(e.target.value)}
                          className="text-lg h-12"
                          min="0"
                          step="0.01"
                        />
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Maximum: {(selectedPoolForDeposit?.grainType || '').toUpperCase() === 'WHEAT' ? wheatBalance : 
                                     (selectedPoolForDeposit?.grainType || '').toUpperCase() === 'RICE' ? riceBalance : '0'} tokens
                        </p>
                      </div>

                      {/* Info Box */}
                      <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/15 rounded-lg p-4">
                        <div className="flex items-start space-x-2">
                          <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5" />
                          <div className="text-blue-800 dark:text-blue-200 text-sm">
                            <p className="font-medium mb-1">How It Works</p>
                            <ul className="list-disc list-inside space-y-1 text-xs">
                              <li>Your {selectedPoolForDeposit?.grainType || 'crop'} tokens will be transferred to the lending pool</li>
                              <li>You can then borrow USDC against this collateral</li>
                              <li>You can withdraw your collateral after repaying any loans</li>
                            </ul>
                          </div>
                        </div>
                      </div>

                      {/* Submit Button */}
                      <Button
                        className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 dark:from-green-700 dark:to-emerald-700 dark:hover:from-green-800 dark:hover:to-emerald-800 h-12 text-base"
                        onClick={async () => {
                          if (!selectedPoolForDeposit) {
                            toast.error("No pool selected");
                            return;
                          }
                          const amount = parseFloat(depositAmount);
                          if (!amount || amount <= 0) {
                            toast.error("Please enter a valid amount");
                            return;
                          }
                          
                          const selectedType = (selectedPoolForDeposit.grainType || '').toUpperCase();
                          const maxBalance = selectedType === 'WHEAT' 
                            ? parseFloat(wheatBalance) 
                            : selectedType === 'RICE'
                            ? parseFloat(riceBalance)
                            : 0;

                          if (amount > maxBalance) {
                            toast.error(`Insufficient balance. Maximum: ${maxBalance} tokens`);
                            return;
                          }

                          setIsDepositing(true);
                          try {
                            const token = localStorage.getItem('farmerToken');
                            if (!token) {
                              toast.error("Please log in again");
                              return;
                            }

                            const response = await fetch('/api/farmers/collateral/deposit', {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`,
                              },
                              body: JSON.stringify({
                                grainType: (selectedPoolForDeposit.grainType || '').toLowerCase(),
                                amount: amount,
                              }),
                            });

                            const result = await response.json();

                            if (!response.ok) {
                              toast.error(result.error || result.message || "Failed to deposit collateral");
                              return;
                            }

                            // Get transaction ID from result
                            const txId = result.contractTxId || result.hederaTxId || result.transactionId || result.mirrorNodeUrl?.split('/').pop();
                            const hashScanUrl = txId ? `https://hashscan.io/testnet/transaction/${txId}` : null;
                            const mirrorUrl = txId ? `https://testnet.mirrornode.hedera.com/api/v1/transactions/${txId}` : null;

                            // Show success toast with transaction links
                            const toastDescription = txId 
                              ? `Transaction: ${txId.substring(0, 20)}...`
                              : 'Transaction submitted successfully';
                            
                            toast.success(`Successfully deposited ${amount} ${selectedPoolForDeposit.grainType} tokens as collateral!`, {
                              duration: 8000,
                              description: toastDescription,
                              action: hashScanUrl ? {
                                label: 'View on HashScan',
                                onClick: () => window.open(hashScanUrl, '_blank')
                              } : undefined,
                            });

                            // Also show a second toast for Mirror Node link if available
                            if (mirrorUrl && txId) {
                              setTimeout(() => {
                                toast.info('View transaction details', {
                                  duration: 6000,
                                  action: {
                                    label: 'View in Mirror',
                                    onClick: () => window.open(mirrorUrl, '_blank')
                                  },
                                });
                              }, 500);
                            }
                            
                            // Reset form and go back to pools
                            setDepositAmount("");
                            setDefiStep("crop-pools");
                            setSelectedPoolForDeposit(null);
                            
                            // Refresh balances
                            if (hederaAccountId) {
                              const [wheatRes, riceRes] = await Promise.all([
                                fetch(`/api/faucet/balance/${hederaAccountId}?tokenType=wheat`, { cache: 'no-store' }),
                                fetch(`/api/faucet/balance/${hederaAccountId}?tokenType=rice`, { cache: 'no-store' }),
                              ]);
                              const [wheatJson, riceJson] = await Promise.all([wheatRes.json(), riceRes.json()]);
                              if (wheatRes.ok) setWheatBalance(wheatJson.balance || '0');
                              if (riceRes.ok) setRiceBalance(riceJson.balance || '0');
                            }
                          } catch (error) {
                            console.error("Deposit error:", error);
                            toast.error("Failed to deposit collateral. Please try again.");
                          } finally {
                            setIsDepositing(false);
                          }
                        }}
                        disabled={isDepositing || !depositAmount || parseFloat(depositAmount) <= 0}
                      >
                        {isDepositing ? (
                          <>
                            <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                            Depositing...
                          </>
                        ) : (
                          <>
                            <Lock className="h-5 w-5 mr-2" />
                            Deposit Collateral
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              ) : defiStep === "borrow-funds" ? (
                <div className="p-8 max-w-2xl mx-auto">
                  {/* Back Button */}
                  <div className="mb-6">
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setDefiStep("crop-pools");
                        setSelectedPoolForBorrow(null);
                        setBorrowAmount("");
                      }}
                      className="mb-4"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back to Pools
                    </Button>
                  </div>

                  {/* Borrow Form */}
                  <Card className="bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-900/20 dark:to-gray-900/20 border-slate-200 dark:border-slate-700">
                    <CardHeader>
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full">
                          <DollarSign className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-2xl text-slate-900 dark:text-slate-100">Borrow Funds</CardTitle>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                            Borrow USDC against your {selectedPoolForBorrow?.grainType || 'crop'} collateral
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Max Borrow Info */}
                      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                        <div className="flex justify-between items-center">
                          <div className="flex-1">
                            <p className="text-sm text-blue-700 dark:text-blue-300">Maximum Borrowable Amount</p>
                            <p className="text-2xl font-bold text-blue-900 dark:text-blue-100 mt-1">
                              ${selectedPoolForBorrow?.maxBorrow ? parseFloat(selectedPoolForBorrow.maxBorrow).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'} USDC
                            </p>
                            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                              Based on your collateral (60% LTV)
                            </p>
                          </div>
                          <Coins className="h-10 w-10 text-blue-600 dark:text-blue-400 ml-4" />
                        </div>
                      </div>

                      {/* Amount Input */}
                      <div className="space-y-2">
                        <Label htmlFor="borrow-amount" className="text-slate-900 dark:text-slate-100">
                          Amount to Borrow (USDC)
                        </Label>
                        <Input
                          id="borrow-amount"
                          type="number"
                          placeholder="Enter amount"
                          value={borrowAmount}
                          onChange={(e) => setBorrowAmount(e.target.value)}
                          className="text-lg h-12"
                          min="0"
                          step="0.01"
                        />
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Maximum: ${selectedPoolForBorrow?.maxBorrow ? parseFloat(selectedPoolForBorrow.maxBorrow).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'} USDC
                        </p>
                      </div>

                      {/* Info Box */}
                      <div className="bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-500/15 rounded-lg p-4">
                        <div className="flex items-start space-x-2">
                          <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                          <div className="text-yellow-800 dark:text-yellow-200 text-sm">
                            <p className="font-medium mb-1">Important Reminders</p>
                            <ul className="list-disc list-inside space-y-1 text-xs">
                              <li>You must repay this loan before withdrawing your collateral</li>
                              <li>Interest will accrue over time based on the pool's APR</li>
                              <li>Liquidation risk exists if collateral value drops significantly</li>
                            </ul>
                          </div>
                        </div>
                      </div>

                      {/* Submit Button */}
                      <Button
                        className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 dark:from-green-700 dark:to-emerald-700 dark:hover:from-green-800 dark:hover:to-emerald-800 h-12 text-base"
                        onClick={async () => {
                          if (!selectedPoolForBorrow) {
                            toast.error("No pool selected");
                            return;
                          }
                          const amount = parseFloat(borrowAmount);
                          if (!amount || amount <= 0) {
                            toast.error("Please enter a valid amount");
                            return;
                          }

                          const maxBorrowNum = selectedPoolForBorrow.maxBorrow 
                            ? parseFloat(selectedPoolForBorrow.maxBorrow)
                            : 0;

                          if (amount > maxBorrowNum) {
                            toast.error(`Amount exceeds maximum. Maximum: $${maxBorrowNum.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDC`);
                            return;
                          }

                          setIsBorrowing(true);
                          try {
                            const token = localStorage.getItem('farmerToken');
                            if (!token) {
                              toast.error("Please log in again");
                              return;
                            }

                            const response = await fetch('/api/farmers/borrow/funds', {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`,
                              },
                              body: JSON.stringify({
                                grainType: selectedPoolForBorrow.grainType.toLowerCase(),
                                amount: amount,
                              }),
                            });

                            const result = await response.json();

                            if (!response.ok) {
                              toast.error(result.error || result.message || "Failed to borrow funds");
                              return;
                            }

                            // Get transaction ID from result
                            const txId = result.contractTxId || result.hederaTxId || result.transactionId || result.mirrorNodeUrl?.split('/').pop();
                            const hashScanUrl = txId ? `https://hashscan.io/testnet/transaction/${txId}` : null;
                            const mirrorUrl = txId ? `https://testnet.mirrornode.hedera.com/api/v1/transactions/${txId}` : null;

                            // Show success toast with transaction links
                            const toastDescription = txId 
                              ? `Transaction: ${txId.substring(0, 20)}...`
                              : 'Transaction submitted successfully';
                            
                            toast.success(`Successfully borrowed ${amount} USDC!`, {
                              duration: 8000,
                              description: toastDescription,
                              action: hashScanUrl ? {
                                label: 'View on HashScan',
                                onClick: () => window.open(hashScanUrl, '_blank')
                              } : undefined,
                            });

                            // Also show a second toast for Mirror Node link if available
                            if (mirrorUrl && txId) {
                              setTimeout(() => {
                                toast.info('View transaction details', {
                                  duration: 6000,
                                  action: {
                                    label: 'View in Mirror',
                                    onClick: () => window.open(mirrorUrl, '_blank')
                                  },
                                });
                              }, 500);
                            }

                            // Update mock USDC balance locally (or re-fetch)
                            setUsdcBalance((prev) => prev + amount);

                            setBorrowAmount("");
                            setDefiStep("crop-pools");
                            setSelectedPoolForBorrow(null);

                            // Refresh balances and allowance
                            if (hederaAccountId) {
                              await refreshBalances(hederaAccountId);
                            }
                          } catch (error) {
                            console.error("Borrow error:", error);
                            toast.error("Failed to borrow funds. Please try again.");
                          } finally {
                            setIsBorrowing(false);
                          }
                        }}
                        disabled={isBorrowing || !borrowAmount || parseFloat(borrowAmount) <= 0}
                      >
                        {isBorrowing ? (
                          <>
                            <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                            Borrowing...
                          </>
                        ) : (
                          <>
                            <DollarSign className="h-5 w-5 mr-2" />
                            Borrow USDC
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              ) : defiStep === "loan-status" ? (
                <div className="p-8 max-w-3xl mx-auto">
                  <div className="mb-6 flex justify-between items-center">
                    <Button variant="ghost" onClick={() => setDefiStep('crop-pools')} className="mb-4">
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back to Pools
                    </Button>
                    <Button variant="outline" onClick={() => setDefiStep('withdraw-to-bank')}>
                      <Banknote className="h-4 w-4 mr-2" />
                      Withdraw to Bank
                    </Button>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle>Loan Position</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {loadingLoanPositions ? (
                        <div className="flex items-center text-sm text-slate-600">
                          <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                          Loading positions...
                        </div>
                      ) : (
                        Object.keys(loanPositions).map((g) => {
                          const p = loanPositions[g] || {};
                          const coll = p.collateralUSD ? parseFloat(p.collateralUSD).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00';
                          // Borrow value is in underlying token units (USDC), which is 6 decimals
                          const bor = p.borrowedUSD ? (parseFloat(p.borrowedUSD) / 1e6).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00';
                          const max = p.maxBorrowUSD ? parseFloat(p.maxBorrowUSD).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00';
                          const ltvPct = p.ltv ? (Number(p.ltv) / 1e16).toFixed(2) : '—';
                          return (
                            <div key={g} className="border rounded-lg p-4">
                              <div className="flex items-center justify-between">
                                <div className="font-semibold">{g} Pool</div>
                                <Badge variant="secondary">{ltvPct !== '—' ? `${ltvPct}% LTV` : '—'}</Badge>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3 text-sm">
                                <div>
                                  <div className="text-slate-500">Collateral Value</div>
                                  <div className="font-medium">${coll} USDC</div>
                                </div>
                                <div>
                                  <div className="text-slate-500">Borrowed</div>
                                  <div className={`font-medium ${parseFloat(p.borrowedUSD || '0') > 0 ? 'text-red-600' : ''}`}>${bor} USDC</div>
                                </div>
                                <div>
                                  <div className="text-slate-500">Max Borrow</div>
                                  <div className="font-medium">${max} USDC</div>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </CardContent>
                  </Card>
                </div>
              ) : defiStep === "repay-loan" ? (
                <div className="p-8 text-center">
                  <h3 className="text-lg font-semibold mb-2">Repay Loan</h3>
                  <p className="text-gray-600">Repay loan form coming soon...</p>
                </div>
              ) : defiStep === "withdraw-to-bank" ? (
                <div className="p-8">
                  {/* Back Button */}
                  <div className="mb-6">
                    <Button
                      variant="ghost"
                      onClick={() => setDefiStep("crop-pools")}
                      className="mb-4"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back to Pools
                    </Button>
                  </div>

                  <div className="text-center">
                    <div className="mb-6">
                      <div className="mx-auto w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mb-4">
                        <Banknote className="h-8 w-8 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold mb-3">Withdraw to Bank Account</h3>
                      <p className="text-gray-600 max-w-md mx-auto">
                        Convert your USDC to local currency and withdraw directly to your bank account
                      </p>
                    </div>
                  </div>

                  <WithdrawMockForm usdcBalance={usdcBalance} onWithdraw={(amt) => {
                    setUsdcBalance((prev) => prev - amt);
                    toast.success(`Offramp initiated for $${amt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDC`);
                    setDefiStep('crop-pools');
                  }} />
                </div>
              ) : null}
            </div>
          )}
          {currentSection === "activity" && <ActivityFeed farmerId={farmerId} />}
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && renderMobileMenu()}
    </div>
  );
}

function WithdrawMockForm({ usdcBalance, onWithdraw }: { usdcBalance: number; onWithdraw: (amount: number) => void }) {
  const [amount, setAmount] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  return (
    <Card className="max-w-md mx-auto">
      <CardContent className="p-6 space-y-4">
        <div className="text-left space-y-4">
          <div>
            <Label>Available USDC Balance</Label>
            <div className="text-2xl font-bold text-green-600">${usdcBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDC</div>
          </div>
          <div>
            <Label htmlFor="withdraw-amount">Withdrawal Amount</Label>
            <Input
              id="withdraw-amount"
              type="number"
              placeholder="Enter amount"
              className="text-lg h-12"
              value={amount}
              min="0"
              step="0.01"
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="bank-account">Bank Account</Label>
            <select
              id="bank-account"
              className="w-full px-3 py-3 border border-gray-300 rounded-md text-base"
            >
              <option>Select bank account</option>
              <option>Bank A - ****1234</option>
              <option>Bank B - ****5678</option>
            </select>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-left">
            <div className="flex items-start space-x-2">
              <Info className="h-4 w-4 text-blue-600 mt-0.5" />
              <div className="text-blue-800">
                <p className="font-medium mb-1">Conversion Rate</p>
                <p>1 USDC = 15,500 IDR (mock)</p>
                <p className="text-xs text-blue-600 mt-1">Processing time: 1-2 business days</p>
              </div>
            </div>
          </div>
          <Button
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 h-12 text-base"
            disabled={isSubmitting || !amount || parseFloat(amount) <= 0 || parseFloat(amount) > usdcBalance}
            onClick={async () => {
              const amt = parseFloat(amount);
              if (!amt || amt <= 0) return;
              if (amt > usdcBalance) {
                toast.error('Insufficient USDC balance');
                return;
              }
              setIsSubmitting(true);
              try {
                // Mock offramp action
                await new Promise((res) => setTimeout(res, 800));
                onWithdraw(amt);
              } finally {
                setIsSubmitting(false);
              }
            }}
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Banknote className="h-5 w-5 mr-2" />
                Withdraw to Bank
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
