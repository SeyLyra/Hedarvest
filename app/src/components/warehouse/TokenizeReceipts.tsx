"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  Coins, 
  FileText, 
  Upload, 
  Download, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Clock, 
  Eye, 
  ExternalLink, 
  QrCode, 
  ArrowLeft, 
  ArrowRight, 
  Save, 
  Send, 
  RefreshCw, 
  Info, 
  AlertTriangle, 
  User, 
  Calendar, 
  Package, 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  History, 
  Activity, 
  Shield, 
  Lock, 
  Key, 
  Bell, 
  Settings, 
  Home, 
  Warehouse, 
  FlaskConical, 
  DollarSign, 
  Percent, 
  Users2, 
  Building2, 
  Truck, 
  Scale, 
  Thermometer, 
  Droplets, 
  Camera, 
  FileText as FileTextIcon, 
  Activity as ActivityIcon, 
  BarChart3 as BarChart3Icon, 
  TrendingUp as TrendingUpIcon, 
  TrendingDown as TrendingDownIcon, 
  Minus as MinusIcon, 
  Plus as PlusIcon, 
  Search as SearchIcon, 
  Filter as FilterIcon, 
  Edit as EditIcon, 
  Trash2 as Trash2Icon, 
  History as HistoryIcon, 
  Activity as ActivityIconIcon, 
  Shield as ShieldIcon, 
  Lock as LockIcon, 
  Key as KeyIcon, 
  Bell as BellIcon, 
  Settings as SettingsIcon, 
  Home as HomeIcon, 
  Warehouse as WarehouseIcon, 
  FlaskConical as FlaskConicalIcon, 
  DollarSign as DollarSignIcon, 
  Percent as PercentIcon, 
  Users2 as Users2Icon, 
  Building2 as Building2Icon, 
  Truck as TruckIcon, 
  Scale as ScaleIcon, 
  Thermometer as ThermometerIcon, 
  Droplets as DropletsIcon, 
  Camera as CameraIcon
} from "lucide-react";

interface TokenizeReceiptsProps {
  onBack: () => void;
  onComplete: (receiptData: ReceiptData) => void;
}

interface ReceiptData {
  id: string;
  tokenId: string;
  farmerId: string;
  farmerName: string;
  cropType: string;
  grade: string;
  quantity: number;
  unit: string;
  issueDate: string;
  expiryDate: string;
  warehouseId: string;
  warehouseName: string;
  txHash: string;
  ipfsHash: string;
  value: number;
  metadata: {
    moisture: number;
    temperature: number;
    impurities: number;
    qualityGrade: string;
    inspectorName: string;
    inspectionDate: string;
    testResults: string[];
    photos: string[];
    notes: string;
  };
  status: "pending" | "minting" | "minted" | "failed";
}

const mockVerifiedDeliveries = [
  {
    id: "del001",
    farmerName: "John Smith",
    farmerId: "farmer_001",
    cropType: "Rice",
    grade: "Premium",
    quantity: 500,
    unit: "kg",
    moisture: 12.5,
    temperature: 25.0,
    impurities: 1.2,
    qualityGrade: "Premium",
    inspectorName: "Jane Inspector",
    inspectionDate: "2024-01-15",
    testResults: ["Moisture Content", "Purity Analysis"],
    photos: ["photo1.jpg", "photo2.jpg"],
    notes: "High quality Basmati rice, excellent condition",
    estimatedValue: 2500
  },
  {
    id: "del002",
    farmerName: "Sarah Johnson",
    farmerId: "farmer_002",
    cropType: "Corn",
    grade: "Grade A",
    quantity: 1200,
    unit: "kg",
    moisture: 14.2,
    temperature: 22.5,
    impurities: 2.1,
    qualityGrade: "Grade A",
    inspectorName: "Mike Inspector",
    inspectionDate: "2024-01-15",
    testResults: ["Protein Content", "Pesticide Residue"],
    photos: ["photo3.jpg"],
    notes: "Good quality corn, meets Grade A standards",
    estimatedValue: 1800
  }
];

export default function TokenizeReceipts({ onBack, onComplete }: TokenizeReceiptsProps) {
  const [selectedDeliveries, setSelectedDeliveries] = useState<string[]>([]);
  const [isMinting, setIsMinting] = useState(false);
  const [mintingProgress, setMintingProgress] = useState(0);
  const [mintedReceipts, setMintedReceipts] = useState<ReceiptData[]>([]);

  const handleSelectDelivery = (deliveryId: string) => {
    setSelectedDeliveries(prev => 
      prev.includes(deliveryId) 
        ? prev.filter(id => id !== deliveryId)
        : [...prev, deliveryId]
    );
  };

  const handleSelectAll = () => {
    if (selectedDeliveries.length === mockVerifiedDeliveries.length) {
      setSelectedDeliveries([]);
    } else {
      setSelectedDeliveries(mockVerifiedDeliveries.map(d => d.id));
    }
  };

  const handleTokenize = async () => {
    if (selectedDeliveries.length === 0) return;

    setIsMinting(true);
    setMintingProgress(0);

    // Simulate minting process
    for (let i = 0; i < selectedDeliveries.length; i++) {
      const deliveryId = selectedDeliveries[i];
      const delivery = mockVerifiedDeliveries.find(d => d.id === deliveryId);
      
      if (delivery) {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const receiptData: ReceiptData = {
          id: `rec_${Date.now()}_${i}`,
          tokenId: `WH-${delivery.cropType.toUpperCase()}-${String(Date.now()).slice(-6)}`,
          farmerId: delivery.farmerId,
          farmerName: delivery.farmerName,
          cropType: delivery.cropType,
          grade: delivery.grade,
          quantity: delivery.quantity,
          unit: delivery.unit,
          issueDate: new Date().toISOString().split('T')[0],
          expiryDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 6 months
          warehouseId: "warehouse_001",
          warehouseName: "Green Valley Storage",
          txHash: `0x${Math.random().toString(16).substr(2, 8)}...${Math.random().toString(16).substr(2, 8)}`,
          ipfsHash: `Qm${Math.random().toString(16).substr(2, 8)}...${Math.random().toString(16).substr(2, 8)}`,
          value: delivery.estimatedValue,
          metadata: {
            moisture: delivery.moisture,
            temperature: delivery.temperature,
            impurities: delivery.impurities,
            qualityGrade: delivery.qualityGrade,
            inspectorName: delivery.inspectorName,
            inspectionDate: delivery.inspectionDate,
            testResults: delivery.testResults,
            photos: delivery.photos,
            notes: delivery.notes
          },
          status: "minted"
        };

        setMintedReceipts(prev => [...prev, receiptData]);
        setMintingProgress(((i + 1) / selectedDeliveries.length) * 100);
      }
    }

    setIsMinting(false);
    setSelectedDeliveries([]);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "text-yellow-600 bg-yellow-100";
      case "minting": return "text-blue-600 bg-blue-100";
      case "minted": return "text-green-600 bg-green-100";
      case "failed": return "text-red-600 bg-red-100";
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

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center py-6">
        <div className="flex items-center justify-center mb-4">
          <div className="p-4 bg-gradient-to-r from-green-600 to-blue-600 rounded-full">
            <Coins className="h-8 w-8 text-white" />
          </div>
        </div>
        <h2 className="text-3xl font-bold text-foreground mb-2">Tokenize & Issue Receipts</h2>
        <p className="text-lg text-muted-foreground">
          Create digital warehouse receipts and mint tokens for verified crops
        </p>
      </div>

      {/* Minting Progress */}
      {isMinting && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <RefreshCw className="h-8 w-8 text-blue-600 animate-spin" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-foreground">Minting Tokens...</h3>
                <p className="text-sm text-muted-foreground">
                  Creating digital receipts and minting tokens on blockchain
                </p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${mintingProgress}%` }}
                  />
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {Math.round(mintingProgress)}% complete
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Verified Deliveries */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span>Verified Deliveries Ready for Tokenization</span>
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleSelectAll}>
                {selectedDeliveries.length === mockVerifiedDeliveries.length ? 'Deselect All' : 'Select All'}
              </Button>
              <Button 
                onClick={handleTokenize}
                disabled={selectedDeliveries.length === 0 || isMinting}
                className="bg-green-600 hover:bg-green-700"
              >
                <Coins className="h-4 w-4 mr-2" />
                Tokenize Selected ({selectedDeliveries.length})
              </Button>
            </div>
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
                      checked={selectedDeliveries.length === mockVerifiedDeliveries.length}
                      onChange={handleSelectAll}
                      className="h-4 w-4 text-green-600"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Farmer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Crop</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grade</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Inspector</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {mockVerifiedDeliveries.map((delivery) => (
                  <tr key={delivery.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedDeliveries.includes(delivery.id)}
                        onChange={() => handleSelectDelivery(delivery.id)}
                        className="h-4 w-4 text-green-600"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-foreground">{delivery.farmerName}</div>
                        <div className="text-sm text-muted-foreground">{delivery.farmerId}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-foreground">{delivery.cropType}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge className={getGradeColor(delivery.grade)}>
                        {delivery.grade}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-foreground">{delivery.quantity} {delivery.unit}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-foreground">${delivery.estimatedValue.toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-muted-foreground">{delivery.inspectorName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <FileText className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Recently Minted Receipts */}
      {mintedReceipts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Coins className="h-5 w-5 text-green-600" />
              <span>Recently Minted Receipts</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Token ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Farmer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Crop</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {mintedReceipts.map((receipt) => (
                    <tr key={receipt.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-foreground">{receipt.tokenId}</div>
                        <div className="text-xs text-muted-foreground">ID: {receipt.id}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-foreground">{receipt.farmerName}</div>
                        <div className="text-xs text-muted-foreground">{receipt.farmerId}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-foreground">{receipt.cropType}</div>
                        <Badge className={getGradeColor(receipt.grade)}>
                          {receipt.grade}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-foreground">{receipt.quantity} {receipt.unit}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-foreground">${receipt.value.toLocaleString()}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className={getStatusColor(receipt.status)}>
                          {receipt.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <QrCode className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Ready to Tokenize</p>
                <p className="text-2xl font-bold text-foreground">{mockVerifiedDeliveries.length}</p>
              </div>
              <Package className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Selected</p>
                <p className="text-2xl font-bold text-foreground">{selectedDeliveries.length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Minted Today</p>
                <p className="text-2xl font-bold text-foreground">{mintedReceipts.length}</p>
              </div>
              <Coins className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Value</p>
                <p className="text-2xl font-bold text-foreground">
                  ${mintedReceipts.reduce((sum, r) => sum + r.value, 0).toLocaleString()}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Receipts
          </Button>
          <Button>
            <FileText className="h-4 w-4 mr-2" />
            View All Receipts
          </Button>
        </div>
      </div>
    </div>
  );
}
