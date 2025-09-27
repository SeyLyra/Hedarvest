'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Activity, 
  ArrowUpRight,
  ArrowDownRight,
  Coins,
  Clock,
  Filter,
  Download,
  Search,
  RefreshCw
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Loader } from '@/components/shared/Loader';

interface ActivityItem {
  id: string;
  type: 'deposit' | 'withdraw' | 'loan' | 'repayment';
  grainType: string;
  amount: number;
  shares?: number;
  timestamp: string;
  status: 'pending' | 'completed' | 'failed';
  transactionHash?: string;
  blockNumber?: number;
}

interface ActivitySectionProps {
  activities: ActivityItem[];
  isLoading: boolean;
  onRefresh: () => void;
  onLoadMore: () => void;
  hasMore: boolean;
}

export const ActivitySection = ({ 
  activities, 
  isLoading, 
  onRefresh, 
  onLoadMore, 
  hasMore 
}: ActivitySectionProps) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return <ArrowUpRight className="w-4 h-4 text-green-600" />;
      case 'withdraw':
        return <ArrowDownRight className="w-4 h-4 text-blue-600" />;
      case 'loan':
        return <Coins className="w-4 h-4 text-yellow-600" />;
      case 'repayment':
        return <ArrowUpRight className="w-4 h-4 text-purple-600" />;
      default:
        return <Activity className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'deposit':
        return 'text-green-600 bg-green-100 border-green-200';
      case 'withdraw':
        return 'text-blue-600 bg-blue-100 border-blue-200';
      case 'loan':
        return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'repayment':
        return 'text-purple-600 bg-purple-100 border-purple-200';
      default:
        return 'text-muted-foreground bg-muted border-muted';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100 border-green-200';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'failed':
        return 'text-red-600 bg-red-100 border-red-200';
      default:
        return 'text-muted-foreground bg-muted border-muted';
    }
  };

  const getActivityLabel = (type: string) => {
    switch (type) {
      case 'deposit':
        return 'Deposit';
      case 'withdraw':
        return 'Withdrawal';
      case 'loan':
        return 'Loan';
      case 'repayment':
        return 'Repayment';
      default:
        return 'Activity';
    }
  };

  if (isLoading && activities.length === 0) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-8">
            <Loader size="lg" message="Loading activity history..." />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Activity Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Recent Activity
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                disabled={isLoading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search activities..."
                className="pl-10"
              />
            </div>
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Activity List */}
      <div className="space-y-4">
        {activities.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No Activity Yet</h3>
              <p className="text-muted-foreground">
                Your transaction history will appear here once you start investing.
              </p>
            </CardContent>
          </Card>
        ) : (
          activities.map((activity) => (
            <Card key={activity.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-muted/50 flex items-center justify-center">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">
                          {getActivityLabel(activity.type)} - {activity.grainType}
                        </h3>
                        <Badge className={getActivityColor(activity.type)}>
                          {activity.type}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(activity.timestamp)}
                        </span>
                        {activity.transactionHash && (
                          <span className="font-mono text-xs">
                            {activity.transactionHash.slice(0, 8)}...{activity.transactionHash.slice(-8)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-lg font-semibold">
                        {formatCurrency(activity.amount)}
                      </p>
                      <Badge className={getStatusColor(activity.status)}>
                        {activity.status}
                      </Badge>
                    </div>
                    {activity.shares && (
                      <p className="text-sm text-muted-foreground">
                        {activity.shares.toFixed(4)} shares
                      </p>
                    )}
                  </div>
                </div>
                
                {activity.blockNumber && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Block Number:</span>
                      <span className="font-mono">{activity.blockNumber.toLocaleString()}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Load More */}
      {hasMore && (
        <div className="text-center">
          <Button
            variant="outline"
            onClick={onLoadMore}
            disabled={isLoading}
            className="w-full max-w-md"
          >
            {isLoading ? (
              <>
                <Loader size="sm" />
                Loading more activities...
              </>
            ) : (
              'Load More Activities'
            )}
          </Button>
        </div>
      )}

      {/* Activity Summary */}
      {activities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Activity Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">
                  {activities.filter(a => a.type === 'deposit').length}
                </p>
                <p className="text-sm text-muted-foreground">Deposits</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">
                  {activities.filter(a => a.type === 'withdraw').length}
                </p>
                <p className="text-sm text-muted-foreground">Withdrawals</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">
                  {activities.filter(a => a.type === 'loan').length}
                </p>
                <p className="text-sm text-muted-foreground">Loans</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">
                  {activities.filter(a => a.status === 'completed').length}
                </p>
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ActivitySection;
