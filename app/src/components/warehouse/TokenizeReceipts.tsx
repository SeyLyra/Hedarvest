"use client";

import { useState, useEffect } from "react";
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
import { BACKEND_URL } from "@/lib/config";

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
  mirrorNodeUrl?: string;
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
  const [verifiedDeliveries, setVerifiedDeliveries] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [currentlyMintingId, setCurrentlyMintingId] = useState<string | null>(null);

  // Fetch verified deliveries from the API
  useEffect(() => {
    fetchVerifiedDeliveries();
  }, []);

  const fetchVerifiedDeliveries = async () => {
    try {
      setIsLoading(true);

      // Get warehouse token from localStorage
      const token = localStorage.getItem('warehouseToken');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Fetch received deliveries that are ready to be tokenized
      const response = await fetch(`${BACKEND_URL}/warehouse/deliveries?status=received`, {
        method: 'GET',
        headers
      });

      if (response.ok) {
        const data = await response.json();

        // Transform the data to match the component's expected format
        const transformedData = data.map((item: any) => {
          // Prefer human-readable farmer name from email (e.g., john.kamau@ → John Kamau)
          let farmerDisplayName = 'Unknown Farmer';
          if (item.farmer?.email) {
            const emailName = String(item.farmer.email).split('@')[0];
            farmerDisplayName = emailName
              .split('.')
              .map((part: string) => part.charAt(0).toUpperCase() + part.slice(1))
              .join(' ');
          } else if (item.farmer?.memberNumber) {
            farmerDisplayName = String(item.farmer.memberNumber);
          }

          return {
            id: `del${item.id}`,
            farmerName: farmerDisplayName,
            farmerId: item.farmer?.memberNumber || item.farmerId,
            cropType: item.cropType,
            grade: item.actualGrade || item.estimatedGrade,
            quantity: parseFloat(item.actualWeight || item.estimatedWeight),
            unit: item.unit || 'kg',
            moisture: parseFloat(item.moistureContent) || 0,
            temperature: parseFloat(item.temperature) || 0,
            impurities: 0, // Default value
            qualityGrade: item.actualGrade || item.estimatedGrade,
            inspectorName: item.inspectorName || 'Warehouse Inspector',
            inspectionDate: new Date(item.updatedAt).toISOString().split('T')[0],
            testResults: [],
            photos: [],
            notes: item.notes || '',
            estimatedValue: parseFloat(item.estimatedValue) || 0,
          };
        });
        
        setVerifiedDeliveries(transformedData);
      } else {
        console.error('Failed to fetch verified deliveries');
        setVerifiedDeliveries([]);
      }
    } catch (error) {
      console.error('Error fetching verified deliveries:', error);
      setVerifiedDeliveries([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectDelivery = (deliveryId: string) => {
    setSelectedDeliveries(prev => 
      prev.includes(deliveryId) 
        ? prev.filter(id => id !== deliveryId)
        : [...prev, deliveryId]
    );
  };

  const handleSelectAll = () => {
    if (selectedDeliveries.length === verifiedDeliveries.length) {
      setSelectedDeliveries([]);
    } else {
      setSelectedDeliveries(verifiedDeliveries.map(d => d.id));
    }
  };

  const handleTokenize = async () => {
    if (selectedDeliveries.length === 0) return;

    setIsMinting(true);
    setMintingProgress(0);
    setError(null);
    setSuccessMessage(null);

    let successCount = 0;

    // Process each selected delivery
    for (let i = 0; i < selectedDeliveries.length; i++) {
      const deliveryId = selectedDeliveries[i];
      const delivery = verifiedDeliveries.find(d => d.id === deliveryId);
      
      if (delivery) {
        try {
          const numericId = parseInt(deliveryId.replace('del', ''));
          setCurrentlyMintingId(deliveryId);

          // Get warehouse token from localStorage
          const token = localStorage.getItem('warehouseToken');
          const headers: HeadersInit = {
            'Content-Type': 'application/json',
          };

          if (token) {
            headers['Authorization'] = `Bearer ${token}`;
          }

          const requestBody = {
            finalWeight: delivery.quantity,
            finalGrade: delivery.grade,
            moisturePercent: delivery.moisture,
            qualityScore: 85, // Default quality score
            notes: delivery.notes || `Verified and tokenized ${delivery.cropType}`,
          };

          // Call the API to verify delivery and mint tokens
          const response = await fetch(`${BACKEND_URL}/warehouse/deliveries/${numericId}/verify`, {
            method: 'POST',
            headers,
            body: JSON.stringify(requestBody)
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const errorMessage = errorData.message || errorData.error || `Failed to mint token (Status: ${response.status})`;
            
            throw new Error(errorMessage);
          }

          const tokenData = await response.json();

          // Extract Hedera transaction details
          const hederaTxId = tokenData.hederaTxId || tokenData.grainDeposit?.hederaTxId;
          const mirrorNodeUrl = tokenData.mirrorNodeUrl;
          const tokensMinted = tokenData.grainDeposit?.tokensMinted;

          const receiptData: ReceiptData = {
            id: tokenData.grainDeposit?.id?.toString() || `rec_${Date.now()}_${i}`,
            tokenId: `WH-${delivery.cropType.toUpperCase()}-${tokenData.grainDeposit?.id || Date.now()}`,
            farmerId: delivery.farmerId,
            farmerName: delivery.farmerName,
            cropType: delivery.cropType,
            grade: tokenData.grainDeposit?.qualityGrade || delivery.grade,
            quantity: tokenData.grainDeposit?.weightKg || delivery.quantity,
            unit: delivery.unit,
            issueDate: new Date().toISOString().split('T')[0],
            expiryDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 6 months
            warehouseId: "WH001",
            warehouseName: "Green Valley Storage",
            txHash: hederaTxId || 'Minting failed - check logs',
            ipfsHash: 'N/A',
            mirrorNodeUrl: mirrorNodeUrl,
            value: delivery.estimatedValue,
            metadata: {
              moisture: tokenData.grainDeposit?.moisturePercent || delivery.moisture,
              temperature: delivery.temperature,
              impurities: delivery.impurities,
              qualityGrade: tokenData.grainDeposit?.qualityGrade || delivery.qualityGrade,
              inspectorName: delivery.inspectorName,
              inspectionDate: delivery.inspectionDate,
              testResults: delivery.testResults,
              photos: delivery.photos,
              notes: delivery.notes
            },
            status: "minted"
          };
          setMintedReceipts(prev => [...prev, receiptData]);
          successCount++;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
          setError(`Failed to mint token for ${delivery.farmerName}: ${errorMessage}`);
        } finally {
          setCurrentlyMintingId(null);
        }
        setMintingProgress(((i + 1) / selectedDeliveries.length) * 100);
      }
    }

    setIsMinting(false);
    setSelectedDeliveries([]);
    setCurrentlyMintingId(null);

    // Show success message if any receipts were minted
    if (successCount > 0) {
      setSuccessMessage(`Successfully verified and minted ${successCount} token(s) to Hedera blockchain! Redirecting to Issued Receipts...`);

      // Call onComplete with the last receipt to trigger redirect
      setTimeout(() => {
        if (mintedReceipts.length > 0) {
          onComplete(mintedReceipts[mintedReceipts.length - 1]);
        }
      }, 2000); // Give user time to see the success message
    }

    // Refresh the list of verified deliveries
    fetchVerifiedDeliveries();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "text-yellow-700 bg-yellow-100 dark:text-yellow-200 dark:bg-yellow-900/30";
      case "minting": return "text-blue-700 bg-blue-100 dark:text-blue-200 dark:bg-blue-900/30";
      case "minted": return "text-green-700 bg-green-100 dark:text-green-200 dark:bg-green-900/30";
      case "failed": return "text-red-700 bg-red-100 dark:text-red-200 dark:bg-red-900/30";
      default: return "text-gray-700 bg-gray-100 dark:text-gray-200 dark:bg-gray-800/40";
    }
  };

  const getGradeColor = (grade: string) => {
    switch (grade.toLowerCase()) {
      case "premium": return "text-green-700 bg-green-100 dark:text-green-200 dark:bg-green-900/30";
      case "grade a": return "text-blue-700 bg-blue-100 dark:text-blue-200 dark:bg-blue-900/30";
      case "grade b": return "text-yellow-700 bg-yellow-100 dark:text-yellow-200 dark:bg-yellow-900/30";
      case "grade c": return "text-orange-700 bg-orange-100 dark:text-orange-200 dark:bg-orange-900/30";
      default: return "text-gray-700 bg-gray-100 dark:text-gray-200 dark:bg-gray-800/40";
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
          Verify deliveries and mint tokens to Hedera blockchain
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          Note: If you see errors, try hard refreshing (Ctrl+Shift+R or Cmd+Shift+R) to clear cache
        </p>
      </div>

      {/* Success Alert */}
      {successMessage && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-green-900">Success!</h3>
                <p className="text-sm text-green-700 mt-1">{successMessage}</p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSuccessMessage(null)}
                className="text-green-600 hover:text-green-900"
              >
                <XCircle className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Alert */}
      {error && (
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              <AlertTriangle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-red-900">Minting Error</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setError(null)}
                className="text-red-600 hover:text-red-900"
              >
                <XCircle className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Minting Progress */}
      {isMinting && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <RefreshCw className="h-8 w-8 text-blue-600 animate-spin" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-foreground">Verifying & Minting Tokens...</h3>
                <p className="text-sm text-muted-foreground">
                  Verifying deliveries, creating grain deposits and minting tokens on Hedera blockchain
                </p>
                {currentlyMintingId && (
                  <p className="text-sm text-blue-600 font-medium mt-1">
                    Processing: {verifiedDeliveries.find(d => d.id === currentlyMintingId)?.cropType || 'Delivery'}
                    {' '}from {verifiedDeliveries.find(d => d.id === currentlyMintingId)?.farmerName || 'farmer'}
                  </p>
                )}
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${mintingProgress}%` }}
                  />
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {Math.round(mintingProgress)}% complete ({selectedDeliveries.filter((_, idx) => idx < Math.ceil(mintingProgress / 100 * selectedDeliveries.length)).length} of {selectedDeliveries.length})
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Inspecting Deliveries */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-blue-600" />
              <span>Received Deliveries Ready for Tokenization</span>
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={fetchVerifiedDeliveries}
                disabled={isLoading || isMinting}
                title="Refresh deliveries"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
              <Button
                variant="outline"
                onClick={handleSelectAll}
                disabled={isMinting || verifiedDeliveries.length === 0}
              >
                {selectedDeliveries.length === verifiedDeliveries.length ? 'Deselect All' : 'Select All'}
              </Button>
              <Button
                onClick={handleTokenize}
                disabled={selectedDeliveries.length === 0 || isMinting}
                className={`${isMinting ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'} text-white`}
              >
                {isMinting ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Minting...
                  </>
                ) : (
                  <>
                    <Coins className="h-4 w-4 mr-2" />
                    Verify & Tokenize Selected ({selectedDeliveries.length})
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center items-center p-8">
              <RefreshCw className="h-8 w-8 text-blue-600 animate-spin" />
              <span className="ml-2">Loading received deliveries...</span>
            </div>
          ) : verifiedDeliveries.length === 0 ? (
            <div className="text-center p-8">
              <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Deliveries Ready</h3>
              <p className="text-muted-foreground mb-4">
                There are no received deliveries ready for tokenization. Complete quality inspections first from the "Quality Inspection" tab.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedDeliveries.length === verifiedDeliveries.length}
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
                  {verifiedDeliveries.map((delivery) => (
                    <tr key={delivery.id} className={`hover:bg-gray-50 ${currentlyMintingId === delivery.id ? 'bg-blue-50' : ''}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {currentlyMintingId === delivery.id ? (
                          <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />
                        ) : (
                          <input
                            type="checkbox"
                            checked={selectedDeliveries.includes(delivery.id)}
                            onChange={() => handleSelectDelivery(delivery.id)}
                            className="h-4 w-4 text-green-600"
                            disabled={isMinting}
                          />
                        )}
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
          )}
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
                        {receipt.txHash && !receipt.txHash.includes('failed') && !receipt.txHash.includes('Pending') && (
                          <div className="text-xs text-green-600 font-mono mt-1" title={receipt.txHash}>
                            ⛓️ {receipt.txHash.substring(0, 20)}...
                          </div>
                        )}
                        {receipt.mirrorNodeUrl && (
                          <Button
                            size="sm"
                            variant="link"
                            className="text-xs text-blue-600 hover:text-blue-800 p-0 h-auto mt-1"
                            onClick={() => window.open(receipt.mirrorNodeUrl, '_blank')}
                            title="View on Mirror Node"
                          >
                            🔗 View on Hashscan
                          </Button>
                        )}
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
                          <Button size="sm" variant="outline" title="View Details">
                            <Eye className="h-4 w-4" />
                          </Button>
                          {receipt.mirrorNodeUrl ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(receipt.mirrorNodeUrl, '_blank')}
                              title="View on Hashscan (Mirror Node)"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          ) : receipt.txHash && !receipt.txHash.includes('failed') && !receipt.txHash.includes('Pending') ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(`https://hashscan.io/testnet/transaction/${receipt.txHash}`, '_blank')}
                              title="View on Hashscan"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          ) : null}
                          <Button size="sm" variant="outline" title="Generate QR Code">
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
