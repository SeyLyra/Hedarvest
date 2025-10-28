"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Package,
  Truck,
  FlaskConical,
  Coins,
  FileText,
  Users,
  Activity,
  BarChart3,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Search,
  Filter,
  Download,
  Upload,
  Eye,
  Edit,
  Trash2,
  Plus,
  Settings,
  LogOut,
  Menu,
  X,
  Home,
  Warehouse,
  Wheat,
  Sprout, 
  FileText as Certificate, 
  Scale, 
  Thermometer, 
  Droplets, 
  Camera, 
  QrCode, 
  ExternalLink, 
  RefreshCw, 
  Bell, 
  User, 
  Shield, 
  Lock, 
  Key, 
  History, 
  PieChart, 
  TrendingDown, 
  ArrowUpRight, 
  ArrowDownRight, 
  Minus, 
  Calendar, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  Smartphone, 
  Monitor, 
  Tablet, 
  Info, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Clock3, 
  DollarSign, 
  Percent, 
  Users2, 
  Building2, 
  Truck as TruckIcon, 
  Package as PackageIcon, 
  Coins as CoinsIcon, 
  FileText as FileTextIcon, 
  Activity as ActivityIcon, 
  BarChart3 as BarChart3Icon, 
  TrendingUp as TrendingUpIcon, 
  AlertCircle as AlertCircleIcon, 
  CheckCircle as CheckCircleIcon, 
  Clock as ClockIcon, 
  Search as SearchIcon, 
  Filter as FilterIcon, 
  Download as DownloadIcon, 
  Upload as UploadIcon, 
  Eye as EyeIcon, 
  Edit as EditIcon, 
  Trash2 as Trash2Icon, 
  Plus as PlusIcon, 
  Settings as SettingsIcon, 
  LogOut as LogOutIcon, 
  Menu as MenuIcon, 
  X as XIcon, 
  Home as HomeIcon, 
  Warehouse as WarehouseIcon, 
  Sprout as SeedIcon, 
  FileText as CertificateIcon, 
  Scale as ScaleIcon, 
  Thermometer as ThermometerIcon, 
  Droplets as DropletsIcon, 
  Camera as CameraIcon, 
  QrCode as QrCodeIcon, 
  ExternalLink as ExternalLinkIcon, 
  RefreshCw as RefreshCwIcon, 
  Bell as BellIcon, 
  User as UserIcon, 
  Shield as ShieldIcon, 
  Lock as LockIcon, 
  Key as KeyIcon, 
  History as HistoryIcon, 
  PieChart as PieChartIcon, 
  TrendingDown as TrendingDownIcon, 
  ArrowUpRight as ArrowUpRightIcon, 
  ArrowDownRight as ArrowDownRightIcon, 
  Minus as MinusIcon, 
  Calendar as CalendarIcon, 
  MapPin as MapPinIcon, 
  Phone as PhoneIcon, 
  Mail as MailIcon, 
  Globe as GlobeIcon, 
  Smartphone as SmartphoneIcon, 
  Monitor as MonitorIcon, 
  Tablet as TabletIcon, 
  Info as InfoIcon, 
  AlertTriangle as AlertTriangleIcon, 
  CheckCircle2 as CheckCircle2Icon, 
  XCircle as XCircleIcon, 
  Clock3 as Clock3Icon, 
  DollarSign as DollarSignIcon, 
  Percent as PercentIcon, 
  Users2 as Users2Icon, 
  Building2 as Building2Icon
} from "lucide-react";
import QualityInspection from "./QualityInspection";
import TokenizeReceipts from "./TokenizeReceipts";
import { Toast, ToastType } from "@/components/ui/toast";

interface WarehouseDashboardProps {
  operatorName: string;
  warehouseId: string;
  onLogout: () => void;
}

type DashboardSection = "overview" | "incoming-deliveries" | "quality-inspection" | "tokenize-receipts" | "issued-receipts" | "inventory-stock" | "staff-permissions" | "audit-trail";

interface Delivery {
  id: string;
  farmerName: string;
  farmerId: string;
  cropType: string;
  weight: number;
  unit: string;
  grade: string;
  arrivalDate: string;
  status: "pending" | "inspecting" | "verified" | "rejected";
  priority: "low" | "medium" | "high";
  estimatedValue: number;
  location: string;
  notes?: string;
  moisture?: number;
  temperature?: number;
}

interface QualityInspection {
  id: string;
  deliveryId: string;
  moisture: number;
  impurities: number;
  temperature: number;
  qualityGrade: string;
  inspectorName: string;
  inspectionDate: string;
  testResults: string[];
  photos: string[];
  notes: string;
  status: "pending" | "in-progress" | "completed" | "failed";
}

interface TokenizedReceipt {
  id: string;
  tokenId: string;
  farmerName: string;
  farmerId: string;
  cropType: string;
  grade: string;
  quantity: number;
  unit: string;
  issueDate: string;
  expiryDate: string;
  status: "active" | "pledged" | "redeemed";
  txHash: string;
  ipfsHash: string;
  value: number;
}

export default function WarehouseDashboard({ operatorName, warehouseId, onLogout }: WarehouseDashboardProps) {
  const [currentSection, setCurrentSection] = useState<DashboardSection>("overview");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);
  const [selectedInspection, setSelectedInspection] = useState<QualityInspection | null>(null);
  const [showQualityInspection, setShowQualityInspection] = useState(false);
  const [showTokenizeReceipts, setShowTokenizeReceipts] = useState(false);
  const [recentDeliveries, setRecentDeliveries] = useState<Delivery[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  // Fetch delivery requests and incoming deliveries from API
  useEffect(() => {
    setIsLoading(true);
    fetchDeliveriesData();
  }, [warehouseId]);

  // Calculate stats from real data
  const warehouseStats = {
    totalTokensIssued: 1247, // TODO: Get from backend
    pendingDeliveries: recentDeliveries.filter(d => d.status === "pending").length,
    verifiedToday: recentDeliveries.filter(d => d.status === "verified").length,
    totalValue: recentDeliveries.reduce((sum, d) => sum + d.estimatedValue, 0),
    averageProcessingTime: "2.3 hours", // TODO: Calculate from backend
    staffCount: 8, // TODO: Get from backend
    lastInspection: "2 hours ago" // TODO: Get from backend
  };

  const recentTokens: TokenizedReceipt[] = [
    {
      id: "rec001",
      tokenId: "WH-RICE-001",
      farmerName: "John Smith",
      farmerId: "farmer_001",
      cropType: "Rice",
      grade: "Premium",
      quantity: 500,
      unit: "kg",
      issueDate: "2024-01-15",
      expiryDate: "2024-07-15",
      status: "active",
      txHash: "0x742d...8a9c",
      ipfsHash: "QmXx...9f2a",
      value: 2500
    },
    {
      id: "rec002",
      tokenId: "WH-CORN-002",
      farmerName: "Sarah Johnson",
      farmerId: "farmer_002",
      cropType: "Corn",
      grade: "Grade A",
      quantity: 1200,
      unit: "kg",
      issueDate: "2024-01-15",
      expiryDate: "2024-07-15",
      status: "pledged",
      txHash: "0x8f3a...2b1d",
      ipfsHash: "QmYy...7c4d",
      value: 1800
    }
  ];

  const handleSectionChange = (section: DashboardSection) => {
    setCurrentSection(section);
    setIsMobileMenuOpen(false);
  };

  const showToast = (message: string, type: ToastType = "info") => {
    setToast({ message, type });
  };

  const viewDeliveryDetails = (delivery: Delivery) => {
    // For MVP, show a simple toast. In production, this would open a modal
    showToast(`${delivery.farmerName} - ${delivery.cropType} (${delivery.weight}${delivery.unit})`, "info");
  };

  const receiveDeliveryRequest = async (deliveryId: string, delivery: Delivery) => {
    try {
      const numericId = parseInt(deliveryId.replace('req', ''));
      const response = await fetch(`http://localhost:3001/warehouse/delivery-requests/${numericId}/receive`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          actualWeight: delivery.weight,
          unit: delivery.unit,
          grade: delivery.grade,
          arrivalDate: new Date().toISOString(),
          priority: delivery.priority,
          estimatedValue: delivery.estimatedValue || 0,
          storageLocation: delivery.location,
          notes: 'Delivery received at warehouse'
        })
      });

      if (response.ok) {
        showToast('Delivery received successfully!', 'success');
        // Refetch deliveries instead of reloading the page
        setTimeout(() => {
          setIsLoading(true);
          fetchDeliveriesData();
        }, 1000);
      } else {
        const error = await response.json();
        showToast(`Failed: ${error.message || 'Unknown error'}`, 'error');
      }
    } catch (error) {
      console.error('Error receiving delivery:', error);
      showToast('Error receiving delivery', 'error');
    }
  };

  // Extract fetchDeliveries logic into a separate function for reuse
  const fetchDeliveriesData = async () => {
    try {
      // Fetch both delivery requests and incoming deliveries
      const [deliveryRequestsRes, incomingDeliveriesRes] = await Promise.all([
        fetch(`http://localhost:3001/warehouse/delivery-requests?warehouseId=${warehouseId}`),
        fetch(`http://localhost:3001/warehouse/incoming-deliveries?warehouseId=${warehouseId}`)
      ]);

      const allDeliveries: Delivery[] = [];

      // Process delivery requests (pending deliveries)
      if (deliveryRequestsRes.ok) {
        const deliveryRequests = await deliveryRequestsRes.json();
        const transformedRequests: Delivery[] = deliveryRequests
          .filter((item: any) => {
            // Only show delivery requests that haven't been received yet
            // AND aren't already completed
            return !item.incomingDelivery &&
                   item.status !== 'completed' &&
                   item.status !== 'cancelled';
          })
          .map((item: any) => {
            // Extract farmer name from email (john.kamau@farm.ke -> John Kamau)
            let farmerName = item.farmer?.memberNumber || `Farmer ${item.farmerId}`;
            if (item.farmer?.email) {
              const emailName = item.farmer.email.split('@')[0];
              // Convert john.kamau to John Kamau
              farmerName = emailName.split('.').map((part: string) =>
                part.charAt(0).toUpperCase() + part.slice(1)
              ).join(' ');
            }

            return {
              id: `req${item.id}`,
              farmerName: farmerName,
              farmerId: `farmer_${item.farmerId}`,
              cropType: item.cropType,
              weight: parseFloat(item.estimatedWeight),
              unit: item.unit || "kg",
              grade: item.estimatedGrade || "Pending",
              arrivalDate: new Date(item.scheduledDate).toISOString().split('T')[0],
              status: "pending" as const,
              priority: "medium" as "low" | "medium" | "high",
              estimatedValue: 0,
              location: item.location || "Not assigned",
              notes: item.notes,
              moisture: item.moistureContent,
              temperature: item.temperature
            };
          });
        allDeliveries.push(...transformedRequests);
      }

      // Process incoming deliveries (already received but not yet verified)
      if (incomingDeliveriesRes.ok) {
        const incomingDeliveries = await incomingDeliveriesRes.json();
        const transformedIncoming: Delivery[] = incomingDeliveries
          .filter((item: any) => {
            // Only show incoming deliveries that need action (not verified/rejected)
            return item.status === 'pending' || item.status === 'inspecting';
          })
          .map((item: any) => {
            // Extract farmer name from email if available
            let farmerName = item.farmerName || item.farmer?.memberNumber || `Farmer ${item.farmerId}`;
            if (item.farmer?.email) {
              const emailName = item.farmer.email.split('@')[0];
              // Convert john.kamau to John Kamau
              farmerName = emailName.split('.').map((part: string) =>
                part.charAt(0).toUpperCase() + part.slice(1)
              ).join(' ');
            }

            return {
              id: `del${item.id}`,
              farmerName: farmerName,
              farmerId: `farmer_${item.farmerId}`,
              cropType: item.cropType,
              weight: parseFloat(item.weight),
              unit: item.unit,
              grade: item.grade || "Unknown",
              arrivalDate: new Date(item.arrivalDate).toISOString().split('T')[0],
              status: item.status as "pending" | "inspecting" | "verified" | "rejected",
              priority: item.priority as "low" | "medium" | "high",
              estimatedValue: parseFloat(item.estimatedValue || "0"),
              location: item.storageLocation || "Unknown",
              notes: item.notes
            };
          });
        allDeliveries.push(...transformedIncoming);
      }

      if (allDeliveries.length > 0) {
        // Sort by arrival date
        allDeliveries.sort((a, b) =>
          new Date(a.arrivalDate).getTime() - new Date(b.arrivalDate).getTime()
        );
      }

      // Always set the real data (even if empty array)
      setRecentDeliveries(allDeliveries);
    } catch (error) {
      console.error('Error fetching deliveries:', error);
      // Don't fall back to mock data, just show empty state
      setRecentDeliveries([]);
    } finally {
      setIsLoading(false);
    }
  };

  const updateDeliveryStatus = async (deliveryId: string, newStatus: string) => {
    try {
      // Check if it's a delivery request (req) or incoming delivery (del)
      if (deliveryId.startsWith('req')) {
        // For delivery requests, we need to receive them first
        showToast('Please use the "Receive" button to accept this delivery first', 'warning');
        return;
      }

      const numericId = parseInt(deliveryId.replace('del', ''));
      const response = await fetch(`http://localhost:3001/warehouse/incoming-deliveries/${numericId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
          notes: `Status updated to ${newStatus}`
        })
      });

      if (response.ok) {
        // Refresh deliveries
        const updatedDeliveries = recentDeliveries.map(d =>
          d.id === deliveryId ? { ...d, status: newStatus as any } : d
        );
        setRecentDeliveries(updatedDeliveries);
        showToast(`Status updated to ${newStatus}`, 'success');
      } else {
        showToast('Failed to update delivery status', 'error');
      }
    } catch (error) {
      console.error('Error updating delivery status:', error);
      showToast('Error updating delivery status', 'error');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "text-yellow-600 bg-yellow-100";
      case "inspecting": return "text-blue-600 bg-blue-100";
      case "verified": return "text-green-600 bg-green-100";
      case "rejected": return "text-red-600 bg-red-100";
      case "active": return "text-green-600 bg-green-100";
      case "pledged": return "text-purple-600 bg-purple-100";
      case "redeemed": return "text-gray-600 bg-gray-100";
      default: return "text-gray-600 bg-gray-100";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "text-red-600 bg-red-100";
      case "medium": return "text-yellow-600 bg-yellow-100";
      case "low": return "text-green-600 bg-green-100";
      default: return "text-gray-600 bg-gray-100";
    }
  };

  const renderOverview = () => (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="text-center py-8 bg-gradient-to-r from-green-50 to-amber-50 rounded-2xl">
        <div className="flex items-center justify-center mb-4">
          <div className="p-4 bg-gradient-to-r from-green-600 to-amber-600 rounded-full">
            <Warehouse className="h-8 w-8 text-white" />
          </div>
        </div>
        <h2 className="text-3xl font-bold text-foreground mb-2">
          Welcome, {operatorName}! 🏭
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Manage crop verification, quality inspection, and digital tokenization operations.
        </p>
      </div>

      {/* Key Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-lg transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Tokens Issued</p>
                <p className="text-2xl font-bold text-foreground">{warehouseStats.totalTokensIssued.toLocaleString()}</p>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +12 this week
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <Coins className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Deliveries</p>
                <p className="text-2xl font-bold text-foreground">{warehouseStats.pendingDeliveries}</p>
                <p className="text-xs text-orange-600 flex items-center mt-1">
                  <Clock className="h-3 w-3 mr-1" />
                  Requires attention
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <Truck className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Verified Today</p>
                <p className="text-2xl font-bold text-foreground">{warehouseStats.verifiedToday}</p>
                <p className="text-xs text-blue-600 flex items-center mt-1">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Quality assured
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <FlaskConical className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Value</p>
                <p className="text-2xl font-bold text-foreground">${warehouseStats.totalValue.toLocaleString()}</p>
                <p className="text-xs text-purple-600 flex items-center mt-1">
                  <DollarSign className="h-3 w-3 mr-1" />
                  Tokenized assets
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Deliveries */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Truck className="h-5 w-5 text-orange-600" />
              <span>Recent Deliveries</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentDeliveries.slice(0, 3).map((delivery) => (
              <div key={delivery.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <Package className="h-4 w-4 text-gray-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground">{delivery.farmerName}</h4>
                    <p className="text-sm text-muted-foreground">
                      {delivery.cropType} • {delivery.weight}{delivery.unit}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className={getStatusColor(delivery.status)}>
                    {delivery.status}
                  </Badge>
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => setCurrentSection("incoming-deliveries")}
            >
              View All Deliveries
            </Button>
          </CardContent>
        </Card>

        {/* Recent Tokens */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Coins className="h-5 w-5 text-green-600" />
              <span>Recent Tokens</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentTokens.slice(0, 3).map((token) => (
              <div key={token.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <FileText className="h-4 w-4 text-gray-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground">{token.tokenId}</h4>
                    <p className="text-sm text-muted-foreground">
                      {token.cropType} • {token.quantity}{token.unit}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className={getStatusColor(token.status)}>
                    {token.status}
                  </Badge>
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => setCurrentSection("issued-receipts")}
            >
              View All Tokens
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            <span>Performance Metrics</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">{warehouseStats.averageProcessingTime}</p>
              <p className="text-sm text-muted-foreground">Avg Processing Time</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">{warehouseStats.staffCount}</p>
              <p className="text-sm text-muted-foreground">Active Staff</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">{warehouseStats.lastInspection}</p>
              <p className="text-sm text-muted-foreground">Last Inspection</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderIncomingDeliveries = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Incoming Deliveries</h2>
          <p className="text-muted-foreground">Manage and inspect crop deliveries from farmers</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Delivery
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search deliveries..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
                <option>All Status</option>
                <option>Pending</option>
                <option>Inspecting</option>
                <option>Verified</option>
                <option>Rejected</option>
              </select>
              <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
                <option>All Crops</option>
                <option>Rice</option>
                <option>Corn</option>
                <option>Wheat</option>
                <option>Soybean</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Deliveries Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="text-center py-12">
              <RefreshCw className="h-8 w-8 text-muted-foreground mx-auto mb-4 animate-spin" />
              <p className="text-muted-foreground">Loading deliveries...</p>
            </div>
          ) : recentDeliveries.length === 0 ? (
            <div className="text-center py-12">
              <PackageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No deliveries yet</h3>
              <p className="text-muted-foreground">
                Incoming deliveries will appear here
              </p>
            </div>
          ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Farmer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Crop</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Weight</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grade</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Arrival</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentDeliveries.map((delivery) => (
                  <tr key={delivery.id} className="hover:bg-gray-50">
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
                      <div className="text-sm text-foreground">{delivery.weight} {delivery.unit}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge className={getPriorityColor(delivery.priority)}>
                        {delivery.grade}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-foreground max-w-[150px] truncate" title={delivery.location}>
                        {delivery.location}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {delivery.arrivalDate}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge className={getStatusColor(delivery.status)}>
                        {delivery.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-muted-foreground max-w-[200px] truncate" title={delivery.notes || ''}>
                        {delivery.notes || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => viewDeliveryDetails(delivery)}
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>

                        {/* Show "Receive" button only for delivery requests (req) */}
                        {delivery.id.startsWith('req') && (
                          <Button
                            size="sm"
                            variant="default"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => receiveDeliveryRequest(delivery.id, delivery)}
                            title="Receive Delivery"
                          >
                            <Truck className="h-4 w-4 mr-1" />
                            Receive
                          </Button>
                        )}

                        {/* Show inspection/verification buttons only for incoming deliveries (del) */}
                        {delivery.id.startsWith('del') && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedDelivery(delivery);
                                setShowQualityInspection(true);
                                setCurrentSection("quality-inspection");
                              }}
                              title="Start Quality Inspection"
                            >
                              <FlaskConical className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateDeliveryStatus(delivery.id, delivery.status === 'pending' ? 'inspecting' : 'verified')}
                              title={delivery.status === 'pending' ? 'Start Inspection' : 'Verify Delivery'}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          </>
                        )}
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
              <span className="text-xl font-bold">Warehouse Ops</span>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          
          <nav className="space-y-2">
            {[
              { id: "overview", label: "Overview", icon: Home },
              { id: "incoming-deliveries", label: "Incoming Deliveries", icon: Truck },
              { id: "quality-inspection", label: "Quality Inspection", icon: FlaskConical },
              { id: "tokenize-receipts", label: "Tokenize & Issue", icon: Coins },
              { id: "issued-receipts", label: "Issued Receipts", icon: FileText },
              { id: "inventory-stock", label: "Inventory & Stock", icon: Package },
              { id: "staff-permissions", label: "Staff & Permissions", icon: Users },
              { id: "audit-trail", label: "Audit Trail", icon: Activity }
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSectionChange(item.id as DashboardSection)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    currentSection === item.id 
                      ? 'bg-green-100 text-green-700' 
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
                  <p className="text-xs text-muted-foreground">Warehouse Dashboard</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" className="hidden sm:flex">
                <Bell className="h-5 w-5" />
              </Button>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-green-600 to-amber-600 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
                <span className="hidden sm:block text-sm font-medium text-foreground">{operatorName}</span>
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
              { id: "incoming-deliveries", label: "Incoming Deliveries", icon: Truck },
              { id: "quality-inspection", label: "Quality Inspection", icon: FlaskConical },
              { id: "tokenize-receipts", label: "Tokenize & Issue", icon: Coins },
              { id: "issued-receipts", label: "Issued Receipts", icon: FileText },
              { id: "inventory-stock", label: "Inventory & Stock", icon: Package },
              { id: "staff-permissions", label: "Staff & Permissions", icon: Users },
              { id: "audit-trail", label: "Audit Trail", icon: Activity }
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
          {currentSection === "overview" && renderOverview()}
          {currentSection === "incoming-deliveries" && renderIncomingDeliveries()}
          {currentSection === "quality-inspection" && (
            showQualityInspection ? (
              <QualityInspection 
                deliveryId={selectedDelivery?.id || "del001"} 
                onBack={() => setShowQualityInspection(false)} 
                onComplete={(data) => {
                  console.log("Inspection completed:", data);
                  setShowQualityInspection(false);
                  setCurrentSection("tokenize-receipts");
                }} 
              />
            ) : (
              <div className="text-center py-12">
                <FlaskConical className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Quality Inspection</h3>
                <p className="text-muted-foreground mb-4">
                  Select a delivery from the incoming deliveries to start quality inspection
                </p>
                <Button onClick={() => setCurrentSection("incoming-deliveries")}>
                  View Deliveries
                </Button>
              </div>
            )
          )}
          {currentSection === "tokenize-receipts" && (
            <TokenizeReceipts 
              onBack={() => setCurrentSection("overview")} 
              onComplete={(data) => {
                console.log("Tokenization completed:", data);
                setCurrentSection("issued-receipts");
              }} 
            />
          )}
          {currentSection === "issued-receipts" && <div>Issued Receipts Table</div>}
          {currentSection === "inventory-stock" && <div>Inventory & Stock View</div>}
          {currentSection === "staff-permissions" && <div>Staff & Permissions</div>}
          {currentSection === "audit-trail" && <div>Audit Trail</div>}
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && renderMobileMenu()}

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
