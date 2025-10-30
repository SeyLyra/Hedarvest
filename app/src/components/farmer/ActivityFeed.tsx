"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Truck,
  Package,
  DollarSign,
  CheckCircle,
  Clock,
  Coins,
  ArrowUpRight,
  ArrowDownRight,
  Scale,
  MapPin,
  Calendar,
  RefreshCw,
  Filter,
  Activity as ActivityIcon,
  TrendingUp,
  AlertCircle,
  Eye
} from "lucide-react";

interface ActivityFeedProps {
  farmerId: number;
}

type ActivityType = "all" | "deliveries" | "transactions" | "loans";

interface ActivityItem {
  id: string;
  type: "delivery" | "transaction" | "loan";
  title: string;
  description: string;
  status: string;
  amount?: number;
  currency?: string;
  timestamp: string;
  icon: any;
  iconColor: string;
  details?: any;
}

export default function ActivityFeed({ farmerId }: ActivityFeedProps) {
  const [activeFilter, setActiveFilter] = useState<ActivityType>("all");
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedActivity, setSelectedActivity] = useState<ActivityItem | null>(null);

  useEffect(() => {
    fetchAllActivity();
  }, [farmerId]);

  const fetchAllActivity = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

      // Fetch deliveries
      const deliveriesResponse = await fetch(
        `${BACKEND_URL}/warehouse/deliveries/farmer/${farmerId}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      // Fetch transactions (you'd implement this endpoint)
      // const transactionsResponse = await fetch(...)

      // Fetch loans (existing endpoint)
      // const loansResponse = await fetch(...)

      let allActivities: ActivityItem[] = [];

      // Process deliveries
      if (deliveriesResponse.ok) {
        const deliveries = await deliveriesResponse.json();
        const deliveryActivities = deliveries.map((delivery: any) => ({
          id: `delivery-${delivery.id}`,
          type: "delivery" as const,
          title: `${delivery.cropType} Delivery`,
          description: `${delivery.estimatedWeight} ${delivery.unit} ${delivery.variety ? `(${delivery.variety})` : ''} - ${delivery.status}`,
          status: delivery.status,
          timestamp: delivery.createdAt,
          icon: Truck,
          iconColor: getDeliveryColor(delivery.status),
          details: delivery
        }));
        allActivities = [...allActivities, ...deliveryActivities];
      }

      // Sort by timestamp (most recent first)
      allActivities.sort((a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      setActivities(allActivities);
    } catch (error) {
      console.error('Error fetching activity:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getDeliveryColor = (status: string) => {
    switch (status) {
      case "pending": return "text-yellow-600 bg-yellow-100";
      case "confirmed": return "text-blue-600 bg-blue-100";
      case "in_transit": return "text-purple-600 bg-purple-100";
      case "received": return "text-indigo-600 bg-indigo-100";
      case "completed": return "text-green-600 bg-green-100";
      case "cancelled": return "text-red-600 bg-red-100";
      default: return "text-gray-600 bg-gray-100";
    }
  };

  const filteredActivities = activities.filter(activity => {
    if (activeFilter === "all") return true;
    if (activeFilter === "deliveries") return activity.type === "delivery";
    if (activeFilter === "transactions") return activity.type === "transaction";
    if (activeFilter === "loans") return activity.type === "loan";
    return true;
  });

  const getActivityIcon = (activity: ActivityItem) => {
    const Icon = activity.icon;
    return (
      <div className={`p-3 rounded-full ${activity.iconColor}`}>
        <Icon className="h-5 w-5" />
      </div>
    );
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  const renderActivityDetails = (activity: ActivityItem) => {
    if (activity.type === "delivery") {
      const delivery = activity.details;
      return (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Truck className="h-5 w-5" />
              <span>Delivery Details</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Status Timeline */}
            <div className="flex items-center space-x-2 p-4 bg-gray-50 rounded-lg">
              <div className={`p-2 rounded-full ${getDeliveryColor(delivery.status)}`}>
                <CheckCircle className="h-4 w-4" />
              </div>
              <div>
                <p className="font-semibold">Status: {delivery.status.replace('_', ' ').toUpperCase()}</p>
                <p className="text-sm text-muted-foreground">
                  {delivery.notes || 'No additional notes'}
                </p>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Crop Type</p>
                <p className="font-medium">{delivery.cropType}</p>
              </div>
              {delivery.variety && (
                <div>
                  <p className="text-sm text-muted-foreground">Variety</p>
                  <p className="font-medium">{delivery.variety}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Weight</p>
                <p className="font-medium">{delivery.estimatedWeight} {delivery.unit}</p>
              </div>
              {delivery.estimatedGrade && (
                <div>
                  <p className="text-sm text-muted-foreground">Grade</p>
                  <Badge variant="outline">{delivery.estimatedGrade}</Badge>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Warehouse</p>
                <p className="font-medium">{delivery.warehouseId}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Scheduled Date</p>
                <p className="font-medium">{new Date(delivery.scheduledDate).toLocaleDateString()}</p>
              </div>
              {delivery.location && (
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p className="font-medium">{delivery.location}</p>
                </div>
              )}
            </div>

            {/* Delivery Receipt Info */}
            {delivery.arrivalDate && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="font-semibold text-green-900 mb-2 flex items-center">
                  <Package className="h-4 w-4 mr-2" />
                  Warehouse Receipt
                </h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Actual Weight: </span>
                    <span className="font-medium">{delivery.actualWeight} {delivery.unit}</span>
                  </div>
                  {delivery.actualGrade && (
                    <div>
                      <span className="text-muted-foreground">Verified Grade: </span>
                      <Badge className="bg-green-600 text-white">{delivery.actualGrade}</Badge>
                    </div>
                  )}
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Arrival: </span>
                    <span className="font-medium">
                      {new Date(delivery.arrivalDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      );
    }

    return null;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground flex items-center space-x-3">
            <ActivityIcon className="h-8 w-8" />
            <span>Activity Feed</span>
          </h2>
          <p className="text-muted-foreground">
            Track all your deliveries, transactions, and loans in one place
          </p>
        </div>
        <Button
          variant="outline"
          onClick={fetchAllActivity}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Filter Tabs */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-muted-foreground" />
            <div className="flex space-x-2">
              {[
                { key: "all", label: "All Activity", icon: ActivityIcon },
                { key: "deliveries", label: "Deliveries", icon: Truck },
                { key: "transactions", label: "Transactions", icon: Coins },
                { key: "loans", label: "Loans", icon: DollarSign }
              ].map(filter => {
                const Icon = filter.icon;
                return (
                  <Button
                    key={filter.key}
                    variant={activeFilter === filter.key ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveFilter(filter.key as ActivityType)}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {filter.label}
                  </Button>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {isLoading && (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <RefreshCw className="h-8 w-8 text-muted-foreground animate-spin" />
            <span className="ml-3 text-muted-foreground">Loading activity...</span>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!isLoading && filteredActivities.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <ActivityIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No {activeFilter !== "all" ? activeFilter : "activity"} yet
            </h3>
            <p className="text-muted-foreground">
              {activeFilter === "all"
                ? "Your activity will appear here"
                : `No ${activeFilter} to display`}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Activity Timeline */}
      {!isLoading && filteredActivities.length > 0 && (
        <div className="space-y-4">
          {filteredActivities.map((activity, index) => (
            <Card
              key={activity.id}
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setSelectedActivity(
                selectedActivity?.id === activity.id ? null : activity
              )}
            >
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  {/* Icon */}
                  {getActivityIcon(activity)}

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-foreground">
                          {activity.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {activity.description}
                        </p>
                      </div>
                      <div className="flex items-center space-x-3 ml-4">
                        <Badge className={getDeliveryColor(activity.status)}>
                          {activity.status.replace('_', ' ')}
                        </Badge>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Timestamp and Amount */}
                    <div className="flex items-center space-x-4 mt-3">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Clock className="h-4 w-4 mr-1" />
                        {formatTimestamp(activity.timestamp)}
                      </div>
                      {activity.amount && (
                        <div className="flex items-center text-sm font-medium">
                          <DollarSign className="h-4 w-4 mr-1" />
                          {activity.amount} {activity.currency}
                        </div>
                      )}
                    </div>

                    {/* Expanded Details */}
                    {selectedActivity?.id === activity.id && (
                      <div className="mt-4">
                        {renderActivityDetails(activity)}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Stats Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>Activity Summary</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-foreground">
                {activities.filter(a => a.type === "delivery").length}
              </p>
              <p className="text-sm text-muted-foreground">Total Deliveries</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-foreground">
                {activities.filter(a => a.type === "transaction").length}
              </p>
              <p className="text-sm text-muted-foreground">Total Transactions</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-foreground">
                {activities.filter(a => a.type === "loan").length}
              </p>
              <p className="text-sm text-muted-foreground">Total Loans</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
