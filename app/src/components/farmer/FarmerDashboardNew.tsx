"use client";

import { useState } from "react";
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
  MessageCircle
} from "lucide-react";
import CropPools from "./CropPools";
import RegisterCrop from "./RegisterCrop";
import FindWarehouse from "./FindWarehouse";
import ActivityFeed from "./ActivityFeed";
import UserProfile from "./UserProfile";
// import DepositCollateral from "./DepositCollateral";
// import BorrowFunds from "./BorrowFunds";
// import LoanStatus from "./LoanStatus";
// import RepayLoan from "./RepayLoan";
// import CropTokensList from "./CropTokensList";

interface FarmerDashboardProps {
  farmerName: string;
  farmerId: number;
  onLogout: () => void;
}

type DashboardSection = "overview" | "my-crops" | "borrow-loans" | "activity";
type DefiStep = "crop-pools" | "deposit-collateral" | "borrow-funds" | "loan-status" | "repay-loan" | "withdraw-to-bank";

export default function FarmerDashboardNew({ farmerName, farmerId, onLogout }: FarmerDashboardProps) {
  const [currentSection, setCurrentSection] = useState<DashboardSection>("overview");
  const [defiStep, setDefiStep] = useState<DefiStep | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [deliveryWorkflow, setDeliveryWorkflow] = useState<"findWarehouse" | "registerCrop" | null>(null);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | null>(null);

  // Mock data
  const farmerStats = {
    totalTokenizedCrops: 12,
    totalValue: 25000,
    availableCredit: 5000,
    activeLoans: 2,
    nextRepayment: "2024-02-15",
    totalEarnings: 15000,
    kycStatus: "verified",
    accountNumber: `MBR-${Date.now().toString().slice(-8)}` // Member account number instead of wallet address
  };

  const cropPools = [
    {
      id: "rice-pool",
      name: "RICE Pool",
      cropType: "Rice",
      totalLiquidity: 150000,
      apy: 8.5,
      utilization: 65,
      available: 52500,
      icon: "🌾",
      color: "green"
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
      color: "yellow"
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
      color: "amber"
    }
  ];

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
        <Card className="hover:shadow-lg transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tokenized Crops</p>
                <p className="text-2xl font-bold text-foreground">{farmerStats.totalTokenizedCrops}</p>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +2 this week
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <Package className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Value</p>
                <p className="text-2xl font-bold text-foreground">${farmerStats.totalValue.toLocaleString()}</p>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +12.5% this month
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Available Credit</p>
                <p className="text-2xl font-bold text-foreground">${farmerStats.availableCredit.toLocaleString()}</p>
                <p className="text-xs text-blue-600 flex items-center mt-1">
                  <CreditCard className="h-3 w-3 mr-1" />
                  Ready to borrow
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <CreditCard className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Loans</p>
                <p className="text-2xl font-bold text-foreground">{farmerStats.activeLoans}</p>
                <p className="text-xs text-orange-600 flex items-center mt-1">
                  <Clock className="h-3 w-3 mr-1" />
                  Next due: {farmerStats.nextRepayment}
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <FileText className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Start Banner */}
      <Card className="mb-8 bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <Wheat className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Get Started</h3>
                <p className="text-sm text-muted-foreground">View your crop tokens and start borrowing against them</p>
              </div>
            </div>
            <Button
              onClick={() => handleSectionChange("my-crops")}
              className="bg-green-600 hover:bg-green-700"
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
        <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer" onClick={() => handleSectionChange("my-crops")}>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Wheat className="h-5 w-5 text-green-600" />
              <span>My Crops</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              View your stored crops and their current values
            </p>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="p-3 bg-green-50 rounded-lg">
                <p className="text-sm text-muted-foreground">Wheat Credits</p>
                <p className="text-2xl font-bold text-green-600">1,250</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-muted-foreground">Rice Credits</p>
                <p className="text-2xl font-bold text-blue-600">800</p>
              </div>
            </div>
            <Button className="w-full" onClick={(e) => { e.stopPropagation(); handleSectionChange("my-crops"); }}>
              <Wheat className="h-4 w-4 mr-2" />
              View My Crops
            </Button>
          </CardContent>
        </Card>

        {/* Borrow & Loans */}
        <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer" onClick={() => handleSectionChange("borrow-loans")}>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-blue-600" />
              <span>Borrow & Loans</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Use your crop tokens as collateral to borrow funds
            </p>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-muted-foreground">Available Credit</p>
                <p className="text-2xl font-bold text-blue-600">${farmerStats.availableCredit.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-orange-50 rounded-lg">
                <p className="text-sm text-muted-foreground">Active Loans</p>
                <p className="text-2xl font-bold text-orange-600">{farmerStats.activeLoans}</p>
              </div>
            </div>
            <Button className="w-full" onClick={(e) => { e.stopPropagation(); handleSectionChange("borrow-loans"); }}>
              <DollarSign className="h-4 w-4 mr-2" />
              Borrow Funds
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5 text-purple-600" />
            <span>Recent Activity</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentTransactions.map((tx) => {
              const Icon = tx.icon;
              return (
                <div key={tx.id} className="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-50">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <Icon className="h-4 w-4 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-foreground">{tx.description}</h4>
                    <p className="text-sm text-muted-foreground">{tx.date}</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-medium ${
                      tx.type === 'borrow' ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {tx.amount}
                    </p>
                    <Badge variant="outline" className="text-xs">
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
                  <option value="corn">Corn</option>
                  <option value="soybeans">Soybeans</option>
                  <option value="cotton">Cotton</option>
                  <option value="storage">Storage</option>
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

  const renderCropPools = () => (
    <div className="space-y-6">
      <div className="text-center py-6">
        <h2 className="text-3xl font-bold text-foreground mb-2">Crop Pools</h2>
        <p className="text-lg text-muted-foreground">
          Discover available liquidity pools for your crop tokens
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cropPools.map((pool) => (
          <Card key={pool.id} className="hover:shadow-lg transition-all duration-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">{pool.icon}</div>
                  <div>
                    <CardTitle className="text-lg">{pool.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{pool.cropType} Pool</p>
                  </div>
                </div>
                <Badge variant="outline" className="text-green-600 border-green-200">
                  {pool.apy}% APY
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
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
                  <span className="font-medium">{pool.utilization}%</span>
                </div>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${pool.utilization}%` }}
                />
              </div>
              
              <Button className="w-full" onClick={() => handleDefiStep("deposit-collateral")}>
                <Lock className="h-4 w-4 mr-2" />
                Deposit Collateral
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderMobileMenu = () => (
    <div className="lg:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
      <div className="fixed left-0 top-0 h-full w-80 bg-white shadow-xl">
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
                      : 'hover:bg-gray-100'
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
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-sm border-b">
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
                <Card className="hover:shadow-lg transition-all duration-200">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="text-4xl">🌾</div>
                        <div>
                          <CardTitle className="text-xl">Wheat Credits</CardTitle>
                          <p className="text-sm text-muted-foreground">Stored Wheat Value</p>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Balance</p>
                      <p className="text-3xl font-bold text-foreground">1,250 WHEAT</p>
                      <p className="text-sm text-green-600 mt-1">≈ $3,125 USD</p>
                    </div>
                    <div className="pt-4 border-t">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-muted-foreground">Available</span>
                        <span className="font-medium">750 WHEAT</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Pledged as Security</span>
                        <span className="font-medium">500 WHEAT</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* RICE Token */}
                <Card className="hover:shadow-lg transition-all duration-200">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="text-4xl">🌾</div>
                        <div>
                          <CardTitle className="text-xl">Rice Credits</CardTitle>
                          <p className="text-sm text-muted-foreground">Stored Rice Value</p>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Balance</p>
                      <p className="text-3xl font-bold text-foreground">800 RICE</p>
                      <p className="text-sm text-green-600 mt-1">≈ $2,400 USD</p>
                    </div>
                    <div className="pt-4 border-t">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-muted-foreground">Available</span>
                        <span className="font-medium">300 RICE</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Pledged as Security</span>
                        <span className="font-medium">500 RICE</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions */}
              <div className="max-w-4xl mx-auto">
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Button
                        className="h-16 text-base bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                        onClick={() => setDeliveryWorkflow("findWarehouse")}
                      >
                        <Truck className="h-5 w-5 mr-2" />
                        Request Delivery
                      </Button>
                      <Button
                        className="h-16 text-base"
                        onClick={() => handleSectionChange("borrow-loans")}
                      >
                        <Lock className="h-5 w-5 mr-2" />
                        Use as Collateral
                      </Button>
                      <Button
                        variant="outline"
                        className="h-16 text-base"
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
                  <CropPools
                    onDeposit={(poolId) => {
                      console.log("Deposit to pool:", poolId);
                      setDefiStep("deposit-collateral");
                    }}
                    onViewDetails={(poolId) => console.log("View details for pool:", poolId)}
                    onBorrow={(poolId) => {
                      console.log("Borrow from pool:", poolId);
                      setDefiStep("borrow-funds");
                    }}
                  />
                </div>
              ) : defiStep === "deposit-collateral" ? (
                <div className="p-8 text-center">
                  <h3 className="text-lg font-semibold mb-2">Deposit Collateral</h3>
                  <p className="text-gray-600">Deposit collateral form coming soon...</p>
                </div>
              ) : defiStep === "borrow-funds" ? (
                <div className="p-8 text-center">
                  <h3 className="text-lg font-semibold mb-2">Borrow Funds</h3>
                  <p className="text-gray-600">Borrow funds form coming soon...</p>
                </div>
              ) : defiStep === "loan-status" ? (
                <div className="p-8 text-center">
                  <h3 className="text-lg font-semibold mb-2">Loan Status</h3>
                  <p className="text-gray-600">Loan status view coming soon...</p>
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

                  <Card className="max-w-md mx-auto">
                    <CardContent className="p-6 space-y-4">
                      <div className="text-left space-y-4">
                        <div>
                          <Label>Available USDC Balance</Label>
                          <div className="text-2xl font-bold text-green-600">$5,000.00 USDC</div>
                        </div>

                        <div>
                          <Label htmlFor="withdraw-amount">Withdrawal Amount</Label>
                          <Input
                            id="withdraw-amount"
                            type="number"
                            placeholder="Enter amount"
                            className="text-lg h-12"
                          />
                        </div>

                        <div>
                          <Label htmlFor="bank-account">Bank Account</Label>
                          <select
                            id="bank-account"
                            className="w-full px-3 py-3 border border-gray-300 rounded-md text-base"
                          >
                            <option>Select bank account</option>
                            <option>Bank BCA - ****1234</option>
                            <option>Bank Mandiri - ****5678</option>
                          </select>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-left">
                          <div className="flex items-start space-x-2">
                            <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                            <div className="text-blue-800">
                              <p className="font-medium mb-1">Conversion Rate</p>
                              <p>1 USDC = 15,500 IDR (Indonesian Rupiah)</p>
                              <p className="text-xs text-blue-600 mt-1">Processing time: 1-2 business days</p>
                            </div>
                          </div>
                        </div>

                        <Button className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 h-12 text-base">
                          <Banknote className="h-5 w-5 mr-2" />
                          Withdraw to Bank
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="mt-6 text-xs text-gray-500 text-center">
                    {`Funds will be converted to your local currency and transferred to your bank account within 1-2 business days`}
                  </div>
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
