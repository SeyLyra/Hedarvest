"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Truck,
  Package,
  CheckCircle,
  Clock,
  XCircle,
  MapPin,
  Calendar,
  Scale,
  ArrowLeft,
  RefreshCw,
  Eye,
  AlertCircle
} from "lucide-react";
import { BACKEND_URL } from "@/lib/config";
import { logError } from "@/lib/log";

interface DeliveryTrackingProps {
  farmerId: number;
  onBack: () => void;
}

interface DeliveryRequest {
  id: number;
  warehouseId: string;
  cropType: string;
  variety?: string;
  estimatedWeight: number;
  unit: string;
  estimatedGrade?: string;
  moistureContent?: number;
  temperature?: number;
  scheduledDate: string;
  location?: string;
  status: string;
  notes?: string;
  createdAt: string;
  arrivalDate?: string;
  actualWeight?: number;
  actualGrade?: string;
  storageLocation?: string;
}

export default function DeliveryTracking({ farmerId, onBack }: DeliveryTrackingProps) {
  const [deliveries, setDeliveries] = useState<DeliveryRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDelivery, setSelectedDelivery] = useState<DeliveryRequest | null>(null);

  useEffect(() => {
    fetchDeliveries();
  }, [farmerId]);

  const fetchDeliveries = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');

      const response = await fetch(
        `${BACKEND_URL}/warehouse/deliveries/farmer/${farmerId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setDeliveries(data);
      } else {
        logError('Failed to fetch deliveries');
      }
    } catch (error) {
      logError('Error fetching deliveries:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "text-yellow-600 bg-yellow-100";
      case "confirmed":
        return "text-blue-600 bg-blue-100";
      case "in_transit":
        return "text-purple-600 bg-purple-100";
      case "received":
        return "text-indigo-600 bg-indigo-100";
      case "completed":
        return "text-green-600 bg-green-100";
      case "cancelled":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case "confirmed":
        return <CheckCircle className="h-5 w-5 text-blue-600" />;
      case "in_transit":
        return <Truck className="h-5 w-5 text-purple-600" />;
      case "received":
        return <Package className="h-5 w-5 text-indigo-600" />;
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "cancelled":
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusSteps = (status: string) => {
    const steps = [
      { key: "pending", label: "Submitted" },
      { key: "confirmed", label: "Confirmed" },
      { key: "in_transit", label: "In Transit" },
      { key: "received", label: "Received" },
      { key: "completed", label: "Completed" }
    ];

    const statusOrder = ["pending", "confirmed", "in_transit", "received", "completed"];
    const currentIndex = statusOrder.indexOf(status);

    return steps.map((step, index) => ({
      ...step,
      isActive: index <= currentIndex,
      isCurrent: index === currentIndex
    }));
  };

  const renderDeliveryDetails = (delivery: DeliveryRequest) => (
    <div className="space-y-6">
      {/* Status Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Truck className="h-5 w-5" />
            <span>Delivery Status</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            {getStatusSteps(delivery.status).map((step, index) => (
              <div key={step.key} className="flex flex-col items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    step.isActive
                      ? step.isCurrent
                        ? "bg-blue-600 text-white"
                        : "bg-green-600 text-white"
                      : "bg-gray-200 text-gray-400"
                  }`}
                >
                  {step.isActive ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <span className="text-sm">{index + 1}</span>
                  )}
                </div>
                <p className="text-xs mt-2 text-center font-medium">{step.label}</p>
                {index < 4 && (
                  <div
                    className={`h-1 w-full mt-5 ${
                      step.isActive ? "bg-green-600" : "bg-gray-200"
                    }`}
                    style={{ marginLeft: "50%", marginTop: "-20px" }}
                  />
                )}
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              {getStatusIcon(delivery.status)}
              <div>
                <p className="font-semibold text-foreground">Current Status: {delivery.status.replace('_', ' ').toUpperCase()}</p>
                {delivery.notes && (
                  <p className="text-sm text-muted-foreground mt-1">{delivery.notes}</p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delivery Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Crop Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Crop Type:</span>
              <span className="font-medium">{delivery.cropType}</span>
            </div>
            {delivery.variety && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Variety:</span>
                <span className="font-medium">{delivery.variety}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Estimated Weight:</span>
              <span className="font-medium">{delivery.estimatedWeight} {delivery.unit}</span>
            </div>
            {delivery.estimatedGrade && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Grade:</span>
                <Badge variant="outline">{delivery.estimatedGrade}</Badge>
              </div>
            )}
            {delivery.moistureContent && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Moisture Content:</span>
                <span className="font-medium">{delivery.moistureContent}%</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Delivery Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Warehouse ID:</span>
              <span className="font-medium">{delivery.warehouseId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Scheduled Date:</span>
              <span className="font-medium">
                {new Date(delivery.scheduledDate).toLocaleDateString()}
              </span>
            </div>
            {delivery.location && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pickup Location:</span>
                <span className="font-medium">{delivery.location}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Submitted:</span>
              <span className="font-medium">
                {new Date(delivery.createdAt).toLocaleDateString()}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delivery Info (if received) */}
      {delivery.arrivalDate && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center space-x-2">
              <Package className="h-5 w-5 text-green-600" />
              <span className="text-green-900">Warehouse Receipt</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Actual Weight:</span>
              <span className="font-medium">{delivery.actualWeight} {delivery.unit}</span>
            </div>
            {delivery.actualGrade && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Verified Grade:</span>
                <Badge className="bg-green-600 text-white">{delivery.actualGrade}</Badge>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Arrival Date:</span>
              <span className="font-medium">
                {new Date(delivery.arrivalDate).toLocaleDateString()}
              </span>
            </div>
            {delivery.storageLocation && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Storage Location:</span>
                <span className="font-medium">{delivery.storageLocation}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Warehouse Status:</span>
              <Badge className={getStatusColor(delivery.status)}>
                {delivery.status}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold text-foreground">My Deliveries</h2>
          <p className="text-muted-foreground">Track your crop deliveries to warehouses</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={fetchDeliveries} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <RefreshCw className="h-8 w-8 text-muted-foreground animate-spin" />
            <span className="ml-3 text-muted-foreground">Loading deliveries...</span>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!isLoading && deliveries.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No Deliveries Yet</h3>
            <p className="text-muted-foreground">
              You haven't submitted any crop deliveries yet.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Delivery Details View */}
      {selectedDelivery && (
        <div className="space-y-6">
          {renderDeliveryDetails(selectedDelivery)}
          <Button
            variant="outline"
            onClick={() => setSelectedDelivery(null)}
            className="w-full"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to All Deliveries
          </Button>
        </div>
      )}

      {/* Deliveries List */}
      {!isLoading && !selectedDelivery && deliveries.length > 0 && (
        <div className="space-y-4">
          {deliveries.map((delivery) => (
            <Card
              key={delivery.id}
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setSelectedDelivery(delivery)}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      {getStatusIcon(delivery.status)}
                      <h3 className="text-xl font-semibold text-foreground">
                        {delivery.cropType} {delivery.variety ? `(${delivery.variety})` : ''}
                      </h3>
                      <Badge className={getStatusColor(delivery.status)}>
                        {delivery.status.replace('_', ' ')}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                      <div className="flex items-center space-x-2">
                        <Scale className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Weight</p>
                          <p className="text-sm font-medium">{delivery.estimatedWeight} {delivery.unit}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Scheduled</p>
                          <p className="text-sm font-medium">
                            {new Date(delivery.scheduledDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Warehouse</p>
                          <p className="text-sm font-medium">{delivery.warehouseId}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Submitted</p>
                          <p className="text-sm font-medium">
                            {new Date(delivery.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Button variant="ghost" size="sm">
                    <Eye className="h-5 w-5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
