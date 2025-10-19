"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Coins, 
  Search, 
  Filter, 
  Eye, 
  Download, 
  RefreshCw, 
  Package, 
  Scale, 
  Calendar, 
  MapPin, 
  Award, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  TrendingUp, 
  BarChart3, 
  Activity, 
  FileText, 
  ExternalLink, 
  Plus, 
  Minus, 
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
  Star, 
  ArrowUpRight, 
  ArrowDownRight, 
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
  DollarSign, 
  Percent, 
  Users2, 
  Building2, 
  Truck
} from "lucide-react";

interface CropToken {
  id: string;
  tokenId: string;
  cropType: string;
  grade: string;
  quantity: number;
  unit: string;
  value: number;
  status: "available" | "deposited" | "borrowed" | "redeemed";
  warehouse: string;
  warehouseId: string;
  issueDate: string;
  expiryDate: string;
  qualityScore: number;
  moisture: number;
  impurities: number;
  location: string;
  farmerId: string;
  farmerName: string;
  blockchainTx: string;
  ipfsHash: string;
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
    warehouseId: "WH001",
    issueDate: "2024-01-15",
    expiryDate: "2024-07-15",
    qualityScore: 95,
    moisture: 12.5,
    impurities: 0.8,
    location: "Central Valley, CA",
    farmerId: "F001",
    farmerName: "John Smith",
    blockchainTx: "0x1234...5678",
    ipfsHash: "QmHash123..."
  },
  {
    id: "token002",
    tokenId: "WH-CORN-002",
    cropType: "Corn",
    grade: "Grade A",
    quantity: 1200,
    unit: "kg",
    value: 1800,
    status: "deposited",
    warehouse: "Central Grain Hub",
    warehouseId: "WH002",
    issueDate: "2024-01-14",
    expiryDate: "2024-07-14",
    qualityScore: 88,
    moisture: 14.2,
    impurities: 1.2,
    location: "Iowa, USA",
    farmerId: "F001",
    farmerName: "John Smith",
    blockchainTx: "0x2345...6789",
    ipfsHash: "QmHash456..."
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
    warehouseId: "WH003",
    issueDate: "2024-01-13",
    expiryDate: "2024-07-13",
    qualityScore: 82,
    moisture: 11.8,
    impurities: 1.5,
    location: "Kansas, USA",
    farmerId: "F001",
    farmerName: "John Smith",
    blockchainTx: "0x3456...7890",
    ipfsHash: "QmHash789..."
  },
  {
    id: "token004",
    tokenId: "WH-SOYBEAN-004",
    cropType: "Soybean",
    grade: "Grade A",
    quantity: 600,
    unit: "kg",
    value: 1500,
    status: "borrowed",
    warehouse: "Rural Storage Co-op",
    warehouseId: "WH004",
    issueDate: "2024-01-12",
    expiryDate: "2024-07-12",
    qualityScore: 90,
    moisture: 13.1,
    impurities: 0.9,
    location: "Illinois, USA",
    farmerId: "F001",
    farmerName: "John Smith",
    blockchainTx: "0x4567...8901",
    ipfsHash: "QmHash012..."
  }
];

export default function CropTokensList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("issueDate");

  const filteredTokens = mockCropTokens.filter(token => {
    const matchesSearch = token.tokenId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         token.cropType.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         token.warehouse.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || token.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available": return "text-green-600 bg-green-100";
      case "deposited": return "text-blue-600 bg-blue-100";
      case "borrowed": return "text-orange-600 bg-orange-100";
      case "redeemed": return "text-gray-600 bg-gray-100";
      default: return "text-gray-600 bg-gray-100";
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

  const totalValue = mockCropTokens.reduce((sum, token) => sum + token.value, 0);
  const availableValue = mockCropTokens
    .filter(token => token.status === "available")
    .reduce((sum, token) => sum + token.value, 0);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center py-6">
        <div className="flex items-center justify-center mb-4">
          <div className="p-4 bg-gradient-to-r from-green-500 to-blue-500 rounded-full">
            <Coins className="h-8 w-8 text-white" />
          </div>
        </div>
        <h2 className="text-3xl font-bold text-foreground mb-2">My Crop Tokens</h2>
        <p className="text-lg text-muted-foreground">
          Manage your digital crop certificates and track their value
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Tokens</p>
                <p className="text-2xl font-bold text-foreground">{mockCropTokens.length}</p>
              </div>
              <Package className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Value</p>
                <p className="text-2xl font-bold text-foreground">${totalValue.toLocaleString()}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Available Value</p>
                <p className="text-2xl font-bold text-foreground">${availableValue.toLocaleString()}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Quality Score</p>
                <p className="text-2xl font-bold text-foreground">
                  {Math.round(mockCropTokens.reduce((sum, token) => sum + token.qualityScore, 0) / mockCropTokens.length)}%
                </p>
              </div>
              <Award className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tokens, crops, or warehouses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">All Status</option>
                <option value="available">Available</option>
                <option value="deposited">Deposited</option>
                <option value="borrowed">Borrowed</option>
                <option value="redeemed">Redeemed</option>
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="issueDate">Issue Date</option>
                <option value="value">Value</option>
                <option value="cropType">Crop Type</option>
                <option value="grade">Grade</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tokens Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Coins className="h-5 w-5 text-green-600" />
            <span>Crop Tokens ({filteredTokens.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Token ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Crop</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grade</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Warehouse</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTokens.map((token) => (
                  <tr key={token.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-foreground">{token.tokenId}</div>
                      <div className="text-xs text-muted-foreground">
                        Issued: {new Date(token.issueDate).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-foreground">{token.cropType}</div>
                      <div className="text-xs text-muted-foreground">
                        Quality: {token.qualityScore}%
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge className={getGradeColor(token.grade)}>
                        {token.grade}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-foreground">{token.quantity} {token.unit}</div>
                      <div className="text-xs text-muted-foreground">
                        Moisture: {token.moisture}%
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-foreground">${token.value.toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge className={getStatusColor(token.status)}>
                        {token.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-foreground">{token.warehouse}</div>
                      <div className="text-xs text-muted-foreground">{token.location}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Download className="h-4 w-4" />
                        </Button>
                        {token.status === "available" && (
                          <Button size="sm" className="bg-green-600 hover:bg-green-700">
                            Deposit
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="flex justify-between">
        <Button variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Register New Crop
          </Button>
        </div>
      </div>
    </div>
  );
}
