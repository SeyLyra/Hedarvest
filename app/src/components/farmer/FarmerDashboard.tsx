"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  Wallet
} from "lucide-react";

interface FarmerDashboardProps {
  farmerName: string;
  onLogout: () => void;
}

type DashboardAction = 
  | "register-crop"
  | "find-warehouse" 
  | "view-tokens"
  | "deposit-collateral"
  | "borrow-funds"
  | "repay-loan"
  | "check-loan-status"
  | "withdraw-funds"
  | null;

export default function FarmerDashboard({ farmerName, onLogout }: FarmerDashboardProps) {
  const [currentAction, setCurrentAction] = useState<DashboardAction>(null);
  const [cropData, setCropData] = useState({
    type: "",
    quantity: "",
    harvestDate: "",
    photo: null as File | null
  });
  const [location, setLocation] = useState("");
  const [borrowAmount, setBorrowAmount] = useState("");
  const [repayAmount, setRepayAmount] = useState("");
  const [withdrawalMethod, setWithdrawalMethod] = useState("");

  const handleAction = (action: DashboardAction) => {
    setCurrentAction(action);
  };

  const handleBack = () => {
    setCurrentAction(null);
  };

  const handleCropRegistration = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Crop registration submitted! Please deposit crops at a warehouse for inspection.");
    setCurrentAction(null);
  };

  const handleLocationSearch = () => {
    alert("Location search functionality would be implemented here");
  };

  const handleDepositCollateral = () => {
    alert("Tokens now locked as collateral. Borrowing limit updated.");
    setCurrentAction(null);
  };

  const handleBorrowFunds = () => {
    alert("Funds transferred! Your loan status is updated.");
    setCurrentAction(null);
  };

  const handleRepayLoan = () => {
    alert("On repayment, crop tokens are released back to you. Warehouse notified.");
    setCurrentAction(null);
  };

  const handleWithdrawFunds = () => {
    alert("Withdrawal request submitted! You'll receive notification when funds are ready.");
    setCurrentAction(null);
  };

  const mockCropTokens = [
    { id: "001", type: "Corn", quantity: "500kg", warehouse: "Warehouse A", status: "Available" },
    { id: "002", type: "Rice", quantity: "300kg", warehouse: "Warehouse C", status: "Collateralized" }
  ];

  const mockWarehouses = [
    { name: "Warehouse A", distance: "2.5km", slots: "Available" },
    { name: "Warehouse B", distance: "5km", slots: "Full" },
    { name: "Warehouse C", distance: "8km", slots: "Available" }
  ];

  const mockLoans = [
    { amount: "$2,500", dueDate: "2024-02-15", status: "Active", collateral: "Batch #001" },
    { amount: "$1,800", dueDate: "2024-01-20", status: "Closed", collateral: "Batch #003" }
  ];

  if (currentAction) {
    return (
      <div className="min-h-screen bg-black text-white">
        {/* Top Navigation */}
        <div className="bg-gray-900/50 backdrop-blur-sm border-b border-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <Button variant="ghost" onClick={handleBack} className="mr-4 text-cyan-400 hover:text-cyan-300">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
                <h1 className="text-xl font-semibold text-white">
                  {currentAction === "register-crop" && "Register New Crop Asset"}
                  {currentAction === "find-warehouse" && "Find Nearest Warehouse"}
                  {currentAction === "view-tokens" && "View My Crop Tokens"}
                  {currentAction === "deposit-collateral" && "Deposit Crop Tokens as Collateral"}
                  {currentAction === "borrow-funds" && "Borrow Funds from Lending Pool"}
                  {currentAction === "repay-loan" && "Repay Loan and Release Collateral"}
                  {currentAction === "check-loan-status" && "Check Loan Status"}
                  {currentAction === "withdraw-funds" && "Withdraw Borrowed Funds"}
                </h1>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="bg-gray-900/50 border-gray-800 shadow-2xl">
            <CardContent className="p-8">
              {/* Register Crop Asset */}
              {currentAction === "register-crop" && (
                <form onSubmit={handleCropRegistration} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="cropType" className="text-cyan-400">Type of crop</Label>
                    <Select onValueChange={(value) => setCropData({...cropData, type: value})}>
                      <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                        <SelectValue placeholder="Select crop type" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700">
                        <SelectItem value="corn">Corn</SelectItem>
                        <SelectItem value="rice">Rice</SelectItem>
                        <SelectItem value="wheat">Wheat</SelectItem>
                        <SelectItem value="soybean">Soybean</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="quantity" className="text-cyan-400">Quantity (kg)</Label>
                    <Input
                      id="quantity"
                      type="number"
                      placeholder="Enter quantity in kg"
                      value={cropData.quantity}
                      onChange={(e) => setCropData({...cropData, quantity: e.target.value})}
                      className="bg-gray-800 border-gray-700 text-white placeholder-gray-400"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="harvestDate" className="text-cyan-400">Harvest Date</Label>
                    <Input
                      id="harvestDate"
                      type="date"
                      value={cropData.harvestDate}
                      onChange={(e) => setCropData({...cropData, harvestDate: e.target.value})}
                      className="bg-gray-800 border-gray-700 text-white"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="photo" className="text-cyan-400">Upload Photo or Harvest Receipt</Label>
                    <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center hover:border-cyan-500 transition-colors">
                      <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-300 mb-2">Click to upload or drag and drop</p>
                      <p className="text-sm text-gray-500">PNG, JPG up to 10MB</p>
                      <Input
                        id="photo"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => setCropData({...cropData, photo: e.target.files?.[0] || null})}
                      />
                    </div>
                  </div>
                  
                  <Button type="submit" className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold py-3">
                    Submit Registration
                  </Button>
                </form>
              )}

              {/* Find Warehouse */}
              {currentAction === "find-warehouse" && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="location" className="text-cyan-400">Enter your location or allow location access</Label>
                    <div className="flex gap-2">
                      <Input
                        id="location"
                        placeholder="Enter your address or city"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="bg-gray-800 border-gray-700 text-white placeholder-gray-400"
                      />
                      <Button onClick={handleLocationSearch} variant="outline" className="border-cyan-500 text-cyan-400 hover:bg-cyan-500/10">
                        <MapPin className="h-4 w-4 mr-2" />
                        Use Current Location
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-white">Warehouses near you:</h3>
                    {mockWarehouses.map((warehouse, index) => (
                      <Card key={index} className="bg-gray-800/50 border-gray-700">
                        <div className="flex justify-between items-center p-4">
                          <div>
                            <h4 className="font-semibold text-white">{warehouse.name}</h4>
                            <p className="text-sm text-gray-400">{warehouse.distance}</p>
                          </div>
                          <div className="text-right">
                            <p className={`text-sm font-medium ${
                              warehouse.slots === "Available" ? "text-green-400" : "text-red-400"
                            }`}>
                              {warehouse.slots}
                            </p>
                            <Button size="sm" className="mt-2 bg-cyan-500 hover:bg-cyan-600 text-white">
                              Select
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* View Tokens */}
              {currentAction === "view-tokens" && (
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-white">Your crop tokens (backed by warehouse receipts):</h3>
                  {mockCropTokens.map((token) => (
                    <Card key={token.id} className="bg-gray-800/50 border-gray-700">
                      <div className="flex justify-between items-center p-4">
                        <div>
                          <h4 className="font-semibold text-white">Batch #{token.id}, {token.type}, {token.quantity}</h4>
                          <p className="text-sm text-gray-400">({token.warehouse})</p>
                        </div>
                        <div className="text-right">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            token.status === "Available" 
                              ? "bg-green-500/20 text-green-400 border border-green-500/30" 
                              : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                          }`}>
                            {token.status}
                          </span>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}

              {/* Deposit Collateral */}
              {currentAction === "deposit-collateral" && (
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold text-white">Choose crop batch to deposit:</h3>
                  <div className="space-y-4">
                    {mockCropTokens.filter(token => token.status === "Available").map((token) => (
                      <Card key={token.id} className="bg-gray-800/50 border-gray-700 cursor-pointer hover:border-cyan-500/50 transition-colors">
                        <div className="flex justify-between items-center p-4">
                          <div>
                            <h4 className="font-semibold text-white">Batch #{token.id}, {token.type}, {token.quantity}</h4>
                            <p className="text-sm text-gray-400">({token.warehouse})</p>
                          </div>
                          <Button onClick={handleDepositCollateral} size="sm" className="bg-cyan-500 hover:bg-cyan-600 text-white">
                            Deposit
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Borrow Funds */}
              {currentAction === "borrow-funds" && (
                <div className="space-y-6">
                  <div className="bg-blue-500/10 border border-blue-500/30 p-4 rounded-lg">
                    <p className="text-blue-400 font-medium">
                      You can borrow up to $5,000 based on your collateral.
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="borrowAmount" className="text-cyan-400">Enter desired amount</Label>
                    <Input
                      id="borrowAmount"
                      type="number"
                      placeholder="Enter amount to borrow"
                      value={borrowAmount}
                      onChange={(e) => setBorrowAmount(e.target.value)}
                      className="bg-gray-800 border-gray-700 text-white placeholder-gray-400"
                    />
                  </div>
                  
                  <Button onClick={handleBorrowFunds} className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold py-3">
                    Confirm Borrowing
                  </Button>
                </div>
              )}

              {/* Repay Loan */}
              {currentAction === "repay-loan" && (
                <div className="space-y-6">
                  <div className="bg-yellow-500/10 border border-yellow-500/30 p-4 rounded-lg">
                    <p className="text-yellow-400 font-medium">
                      Your active loan: $2,500, due date 2024-02-15
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="repayAmount" className="text-cyan-400">Enter repayment amount</Label>
                    <Input
                      id="repayAmount"
                      type="number"
                      placeholder="Enter amount to repay"
                      value={repayAmount}
                      onChange={(e) => setRepayAmount(e.target.value)}
                      className="bg-gray-800 border-gray-700 text-white placeholder-gray-400"
                    />
                  </div>
                  
                  <Button onClick={handleRepayLoan} className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold py-3">
                    Confirm Repayment
                  </Button>
                </div>
              )}

              {/* Check Loan Status */}
              {currentAction === "check-loan-status" && (
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-white">Current and past loans:</h3>
                  {mockLoans.map((loan, index) => (
                    <Card key={index} className="bg-gray-800/50 border-gray-700">
                      <div className="flex justify-between items-center p-4">
                        <div>
                          <h4 className="font-semibold text-white">Amount: {loan.amount}</h4>
                          <p className="text-sm text-gray-400">Due: {loan.dueDate}</p>
                          <p className="text-sm text-gray-400">Collateral: {loan.collateral}</p>
                        </div>
                        <div className="text-right">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            loan.status === "Active" 
                              ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30" 
                              : "bg-green-500/20 text-green-400 border border-green-500/30"
                          }`}>
                            {loan.status}
                          </span>
                          {loan.status === "Active" && (
                            <Button size="sm" className="mt-2 bg-cyan-500 hover:bg-cyan-600 text-white">
                              Repay
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}

              {/* Withdraw Funds */}
              {currentAction === "withdraw-funds" && (
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold text-white">Choose withdrawal method:</h3>
                  
                  <div className="space-y-4">
                    <Card className="bg-gray-800/50 border-gray-700 cursor-pointer hover:border-cyan-500/50 transition-colors">
                      <div className="flex items-center gap-4 p-4">
                        <CreditCard className="h-8 w-8 text-cyan-400" />
                        <div>
                          <h4 className="font-semibold text-white">Bank Transfer</h4>
                          <p className="text-sm text-gray-400">Enter account details</p>
                        </div>
                        <Button size="sm" onClick={handleWithdrawFunds} className="bg-cyan-500 hover:bg-cyan-600 text-white">
                          Select
                        </Button>
                      </div>
                    </Card>
                    
                    <Card className="bg-gray-800/50 border-gray-700 cursor-pointer hover:border-cyan-500/50 transition-colors">
                      <div className="flex items-center gap-4 p-4">
                        <Phone className="h-8 w-8 text-green-400" />
                        <div>
                          <h4 className="font-semibold text-white">E-wallet</h4>
                          <p className="text-sm text-gray-400">Enter phone/ID</p>
                        </div>
                        <Button size="sm" onClick={handleWithdrawFunds} className="bg-cyan-500 hover:bg-cyan-600 text-white">
                          Select
                        </Button>
                      </div>
                    </Card>
                    
                    <Card className="bg-gray-800/50 border-gray-700 cursor-pointer hover:border-cyan-500/50 transition-colors">
                      <div className="flex items-center gap-4 p-4">
                        <MapPin className="h-8 w-8 text-orange-400" />
                        <div>
                          <h4 className="font-semibold text-white">Cash Pickup</h4>
                          <p className="text-sm text-gray-400">At Agent/Co-op location</p>
                        </div>
                        <Button size="sm" onClick={handleWithdrawFunds} className="bg-cyan-500 hover:bg-cyan-600 text-white">
                          Select
                        </Button>
                      </div>
                    </Card>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Top Navigation */}
      <div className="bg-gray-900/50 backdrop-blur-sm border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center">
                  <Wheat className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="ml-4">
                <h1 className="text-xl font-semibold text-white">Hedarvest</h1>
                <p className="text-sm text-cyan-400">DeFi Agriculture Protocol</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-cyan-400">
                <Bell className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-cyan-400">
                <Settings className="h-5 w-5" />
              </Button>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
                <span className="text-sm font-medium text-white">{farmerName}</span>
              </div>
              <Button 
                onClick={onLogout}
                variant="outline"
                size="sm"
                className="flex items-center gap-2 border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-4xl font-bold text-white mb-2">
            Welcome back, {farmerName}! 👋
          </h2>
          <p className="text-lg text-gray-400">
            Manage your crops, loans, and financial activities in the DeFi ecosystem.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700 hover:border-cyan-500/50 transition-colors">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-cyan-500/20 rounded-lg">
                  <Package className="h-6 w-6 text-cyan-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-400">Active Tokens</p>
                  <p className="text-2xl font-bold text-white">12</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700 hover:border-blue-500/50 transition-colors">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-blue-500/20 rounded-lg">
                  <DollarSign className="h-6 w-6 text-blue-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-400">Available Credit</p>
                  <p className="text-2xl font-bold text-white">$2,500</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700 hover:border-orange-500/50 transition-colors">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-orange-500/20 rounded-lg">
                  <CreditCard className="h-6 w-6 text-orange-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-400">Active Loans</p>
                  <p className="text-2xl font-bold text-white">2</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700 hover:border-purple-500/50 transition-colors">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-purple-500/20 rounded-lg">
                  <MapPin className="h-6 w-6 text-purple-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-400">Nearby Warehouses</p>
                  <p className="text-2xl font-bold text-white">3</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Register Crop Asset */}
          <Card 
            className="cursor-pointer transition-all duration-300 hover:shadow-2xl hover:scale-105 bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700 hover:border-green-500/50 group"
            onClick={() => handleAction("register-crop")}
          >
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center">
                <div className="p-4 bg-green-500/20 rounded-full mb-4 group-hover:bg-green-500/30 transition-colors">
                  <Upload className="h-8 w-8 text-green-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Register New Crop
                </h3>
                <p className="text-sm text-gray-400 mb-4">
                  Tokenize your harvested crops
                </p>
                <Button variant="outline" size="sm" className="w-full border-green-500/50 text-green-400 hover:bg-green-500/10">
                  <Zap className="h-4 w-4 mr-2" />
                  Get Started
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Find Warehouse */}
          <Card 
            className="cursor-pointer transition-all duration-300 hover:shadow-2xl hover:scale-105 bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700 hover:border-blue-500/50 group"
            onClick={() => handleAction("find-warehouse")}
          >
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center">
                <div className="p-4 bg-blue-500/20 rounded-full mb-4 group-hover:bg-blue-500/30 transition-colors">
                  <MapPin className="h-8 w-8 text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Find Warehouse
                </h3>
                <p className="text-sm text-gray-400 mb-4">
                  Locate storage facilities
                </p>
                <Button variant="outline" size="sm" className="w-full border-blue-500/50 text-blue-400 hover:bg-blue-500/10">
                  <Activity className="h-4 w-4 mr-2" />
                  Get Started
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* View Tokens */}
          <Card 
            className="cursor-pointer transition-all duration-300 hover:shadow-2xl hover:scale-105 bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700 hover:border-purple-500/50 group"
            onClick={() => handleAction("view-tokens")}
          >
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center">
                <div className="p-4 bg-purple-500/20 rounded-full mb-4 group-hover:bg-purple-500/30 transition-colors">
                  <Eye className="h-8 w-8 text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  My Crop Tokens
                </h3>
                <p className="text-sm text-gray-400 mb-4">
                  View digital certificates
                </p>
                <Button variant="outline" size="sm" className="w-full border-purple-500/50 text-purple-400 hover:bg-purple-500/10">
                  <Coins className="h-4 w-4 mr-2" />
                  Get Started
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Deposit Collateral */}
          <Card 
            className="cursor-pointer transition-all duration-300 hover:shadow-2xl hover:scale-105 bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700 hover:border-orange-500/50 group"
            onClick={() => handleAction("deposit-collateral")}
          >
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center">
                <div className="p-4 bg-orange-500/20 rounded-full mb-4 group-hover:bg-orange-500/30 transition-colors">
                  <Lock className="h-8 w-8 text-orange-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Deposit Collateral
                </h3>
                <p className="text-sm text-gray-400 mb-4">
                  Lock tokens for loans
                </p>
                <Button variant="outline" size="sm" className="w-full border-orange-500/50 text-orange-400 hover:bg-orange-500/10">
                  <Shield className="h-4 w-4 mr-2" />
                  Get Started
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Borrow Funds */}
          <Card 
            className="cursor-pointer transition-all duration-300 hover:shadow-2xl hover:scale-105 bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700 hover:border-cyan-500/50 group"
            onClick={() => handleAction("borrow-funds")}
          >
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center">
                <div className="p-4 bg-cyan-500/20 rounded-full mb-4 group-hover:bg-cyan-500/30 transition-colors">
                  <DollarSign className="h-8 w-8 text-cyan-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Borrow Funds
                </h3>
                <p className="text-sm text-gray-400 mb-4">
                  Get instant DeFi loans
                </p>
                <Button variant="outline" size="sm" className="w-full border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Get Started
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Repay Loan */}
          <Card 
            className="cursor-pointer transition-all duration-300 hover:shadow-2xl hover:scale-105 bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700 hover:border-red-500/50 group"
            onClick={() => handleAction("repay-loan")}
          >
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center">
                <div className="p-4 bg-red-500/20 rounded-full mb-4 group-hover:bg-red-500/30 transition-colors">
                  <RotateCcw className="h-8 w-8 text-red-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Repay Loan
                </h3>
                <p className="text-sm text-gray-400 mb-4">
                  Free your collateral
                </p>
                <Button variant="outline" size="sm" className="w-full border-red-500/50 text-red-400 hover:bg-red-500/10">
                  <Banknote className="h-4 w-4 mr-2" />
                  Get Started
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Check Loan Status */}
          <Card 
            className="cursor-pointer transition-all duration-300 hover:shadow-2xl hover:scale-105 bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700 hover:border-indigo-500/50 group"
            onClick={() => handleAction("check-loan-status")}
          >
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center">
                <div className="p-4 bg-indigo-500/20 rounded-full mb-4 group-hover:bg-indigo-500/30 transition-colors">
                  <FileText className="h-8 w-8 text-indigo-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Loan Status
                </h3>
                <p className="text-sm text-gray-400 mb-4">
                  Track loan activities
                </p>
                <Button variant="outline" size="sm" className="w-full border-indigo-500/50 text-indigo-400 hover:bg-indigo-500/10">
                  <Activity className="h-4 w-4 mr-2" />
                  Get Started
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Withdraw Funds */}
          <Card 
            className="cursor-pointer transition-all duration-300 hover:shadow-2xl hover:scale-105 bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700 hover:border-teal-500/50 group"
            onClick={() => handleAction("withdraw-funds")}
          >
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center">
                <div className="p-4 bg-teal-500/20 rounded-full mb-4 group-hover:bg-teal-500/30 transition-colors">
                  <Download className="h-8 w-8 text-teal-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Withdraw Funds
                </h3>
                <p className="text-sm text-gray-400 mb-4">
                  Transfer to your wallet
                </p>
                <Button variant="outline" size="sm" className="w-full border-teal-500/50 text-teal-400 hover:bg-teal-500/10">
                  <Wallet className="h-4 w-4 mr-2" />
                  Get Started
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}