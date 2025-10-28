"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  MapPin, 
  Search, 
  Navigation, 
  Phone, 
  Mail, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Star,
  Truck,
  Package,
  Shield,
  Users,
  DollarSign,
  Calendar,
  Filter,
  Map,
  List,
  ExternalLink,
  Info
} from "lucide-react";

interface FindWarehouseProps {
  onBack: () => void;
  onNext: (warehouseId: string) => void;
}

interface Warehouse {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  distance: number; // in km
  rating: number;
  capacity: number; // in tons
  available: number; // in tons
  utilization: number; // percentage
  services: string[];
  contact: {
    phone: string;
    email: string;
    manager: string;
  };
  operatingHours: {
    weekdays: string;
    weekends: string;
  };
  features: string[];
  pricing: {
    storage: number; // per ton per month
    handling: number; // per ton
  };
  certifications: string[];
  lastUpdated: string;
  status: "available" | "full" | "maintenance";
}

export default function FindWarehouse({ onBack, onNext }: FindWarehouseProps) {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedWarehouse, setSelectedWarehouse] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [sortBy, setSortBy] = useState<"distance" | "rating" | "price" | "availability">("distance");
  const [filterStatus, setFilterStatus] = useState<"all" | "available" | "full">("all");

  // Fetch warehouses from backend
  useEffect(() => {
    const fetchWarehouses = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/warehouse/list`);
        if (response.ok) {
          const data = await response.json();
          // Calculate distance from user's location (mock for now)
          const warehousesWithDistance = data.map((wh: any) => ({
            ...wh,
            distance: calculateDistance(wh.latitude, wh.longitude), // Mock distance calculation
            lastUpdated: getTimeAgo(new Date()) // Mock last updated
          }));
          setWarehouses(warehousesWithDistance);
        } else {
          console.error('Failed to fetch warehouses');
        }
      } catch (error) {
        console.error('Error fetching warehouses:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWarehouses();
  }, []);

  // Mock distance calculation (in a real app, use geolocation API)
  const calculateDistance = (lat?: number, lng?: number) => {
    if (!lat || !lng) return Math.random() * 20 + 1; // Random 1-20 km
    // For now, return random distance
    return Math.random() * 20 + 1;
  };

  // Get time ago string
  const getTimeAgo = (date: Date) => {
    const hours = Math.floor(Math.random() * 5) + 1;
    return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
  };

  const filteredWarehouses = warehouses
    .filter(warehouse => 
      warehouse.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      warehouse.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      warehouse.address.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter(warehouse => filterStatus === "all" || warehouse.status === filterStatus)
    .sort((a, b) => {
      switch (sortBy) {
        case "distance":
          return a.distance - b.distance;
        case "rating":
          return b.rating - a.rating;
        case "price":
          return a.pricing.storage - b.pricing.storage;
        case "availability":
          return b.available - a.available;
        default:
          return 0;
      }
    });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "text-green-600 bg-green-100";
      case "full":
        return "text-red-600 bg-red-100";
      case "maintenance":
        return "text-yellow-600 bg-yellow-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getUtilizationColor = (utilization: number) => {
    if (utilization < 50) return "text-green-600";
    if (utilization < 80) return "text-yellow-600";
    return "text-red-600";
  };

  const handleSelectWarehouse = (warehouseId: string) => {
    setSelectedWarehouse(warehouseId);
  };

  const handleConfirmSelection = () => {
    if (selectedWarehouse) {
      onNext(selectedWarehouse);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center py-6 mb-8">
        <div className="flex items-center justify-center mb-4">
          <div className="p-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full">
            <MapPin className="h-8 w-8 text-white" />
          </div>
        </div>
        <h2 className="text-3xl font-bold text-foreground mb-2">Find Warehouse</h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Locate nearby storage facilities for your harvested crops. Compare prices, capacity, and services.
        </p>
      </div>

      {/* Loading State */}
      {isLoading && (
        <Card className="mb-6">
          <CardContent className="p-12 text-center">
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="text-lg text-muted-foreground">Loading warehouses...</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search and Filters */}
      {!isLoading && <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, city, or address..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="distance">Sort by Distance</option>
                <option value="rating">Sort by Rating</option>
                <option value="price">Sort by Price</option>
                <option value="availability">Sort by Availability</option>
              </select>
              
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="all">All Status</option>
                <option value="available">Available Only</option>
                <option value="full">Full Only</option>
              </select>
              
              <Button
                variant="outline"
                onClick={() => setViewMode(viewMode === "list" ? "map" : "list")}
              >
                {viewMode === "list" ? <Map className="h-4 w-4" /> : <List className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>}

      {/* Warehouses List */}
      {!isLoading && <div className="space-y-4">
        {filteredWarehouses.map((warehouse) => (
          <Card 
            key={warehouse.id} 
            className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
              selectedWarehouse === warehouse.id 
                ? 'ring-2 ring-primary shadow-lg' 
                : 'hover:shadow-md'
            }`}
            onClick={() => handleSelectWarehouse(warehouse.id)}
          >
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-xl font-semibold text-foreground mb-1">
                        {warehouse.name}
                      </h3>
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>{warehouse.address}, {warehouse.city}, {warehouse.state}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor(warehouse.status)}>
                        {warehouse.status.toUpperCase()}
                      </Badge>
                      <div className="flex items-center space-x-1">
                        <Star className="h-4 w-4 text-yellow-500 fill-current" />
                        <span className="text-sm font-medium">{warehouse.rating}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center space-x-2">
                      <Navigation className="h-4 w-4 text-blue-500" />
                      <span className="text-sm text-muted-foreground">Distance:</span>
                      <span className="text-sm font-medium">{warehouse.distance} km</span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Package className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-muted-foreground">Available:</span>
                      <span className="text-sm font-medium">{warehouse.available} tons</span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <DollarSign className="h-4 w-4 text-purple-500" />
                      <span className="text-sm text-muted-foreground">Storage:</span>
                      <span className="text-sm font-medium">${warehouse.pricing.storage}/ton/month</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Capacity Utilization</span>
                      <span className={`font-medium ${getUtilizationColor(warehouse.utilization)}`}>
                        {warehouse.utilization}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          warehouse.utilization < 50 
                            ? 'bg-gradient-to-r from-green-500 to-green-400' 
                            : warehouse.utilization < 80 
                              ? 'bg-gradient-to-r from-yellow-500 to-yellow-400'
                              : 'bg-gradient-to-r from-red-500 to-red-400'
                        }`}
                        style={{ width: `${warehouse.utilization}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-4">
                    {warehouse.services.slice(0, 3).map((service) => (
                      <Badge key={service} variant="outline" className="text-xs">
                        {service}
                      </Badge>
                    ))}
                    {warehouse.services.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{warehouse.services.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex flex-col space-y-2 lg:min-w-[200px]">
                  <div className="text-right text-sm text-muted-foreground">
                    <p>Manager: {warehouse.contact.manager}</p>
                    <p>Phone: {warehouse.contact.phone}</p>
                    <p>Updated: {warehouse.lastUpdated}</p>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Handle contact action
                      }}
                    >
                      <Phone className="h-4 w-4 mr-1" />
                      Contact
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Handle details action
                      }}
                    >
                      <Info className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>}

      {/* Empty State */}
      {!isLoading && filteredWarehouses.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No warehouses found</h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your search terms or filters
            </p>
            <Button 
              variant="outline" 
              onClick={() => {
                setSearchTerm("");
                setFilterStatus("all");
              }}
            >
              Clear Filters
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Selection Summary */}
      {!isLoading && selectedWarehouse && (
        <Card className="mt-6 bg-primary/5 border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-6 w-6 text-green-500" />
                <div>
                  <h4 className="font-semibold text-foreground">
                    Selected: {warehouses.find(w => w.id === selectedWarehouse)?.name}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Ready to proceed with warehouse selection
                  </p>
                </div>
              </div>
              <Button onClick={handleConfirmSelection}>
                <ArrowRight className="h-4 w-4 mr-2" />
                Confirm Selection
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex justify-between mt-8">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
        {selectedWarehouse && (
          <Button onClick={handleConfirmSelection}>
            Continue to Tokenization
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
}
