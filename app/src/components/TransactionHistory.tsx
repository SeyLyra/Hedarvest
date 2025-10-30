"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  RefreshCw,
  ExternalLink,
  Clock,
  CheckCircle2
} from "lucide-react";

interface HCSEvent {
  id?: string;
  eventType: string;
  payload: {
    poolAddress?: string;
    grainType?: string;
    amount?: number;
    shares?: number;
    depositorAddress?: string;
    farmerAddress?: string;
    contractTxHash?: string;
    timestamp?: string;
  };
  timestamp: string;
  transactionId?: string;
}

interface TransactionHistoryProps {
  userAddress: string;
  transactions?: any[];
}

export default function TransactionHistory({ userAddress, transactions }: TransactionHistoryProps) {
  const [events, setEvents] = useState<HCSEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
      const response = await fetch(`${BACKEND_URL}/hcs/events?address=${userAddress}&limit=50`);

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setEvents(result.events || []);
        } else {
          setError(result.error || 'Failed to load events');
        }
      } else {
        setError('Failed to connect to HCS service');
      }
    } catch (err) {
      setError('Error loading transaction history');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (transactions && transactions.length > 0) {
      // Use transactions from portfolio data if available
      const formattedEvents = transactions.map(tx => ({
        id: tx.id?.toString(),
        eventType: tx.type || 'Unknown',
        payload: {
          poolAddress: tx.poolAddress,
          grainType: tx.grainType,
          amount: tx.amount,
          shares: tx.shares,
          depositorAddress: tx.depositorAddress,
          contractTxHash: tx.transactionHash,
          timestamp: tx.timestamp
        },
        timestamp: tx.timestamp,
        transactionId: tx.transactionHash
      }));
      setEvents(formattedEvents);
      setIsLoading(false);
    } else if (userAddress) {
      fetchEvents();
    }
  }, [userAddress, transactions]);

  const getEventIcon = (eventType: string) => {
    if (eventType.includes('Deposit') || eventType.includes('deposit')) {
      return <ArrowDownCircle className="w-5 h-5 text-green-500" />;
    } else if (eventType.includes('Withdraw') || eventType.includes('withdraw')) {
      return <ArrowUpCircle className="w-5 h-5 text-orange-500" />;
    } else if (eventType.includes('Loan') || eventType.includes('loan')) {
      return <ArrowUpCircle className="w-5 h-5 text-blue-500" />;
    } else if (eventType.includes('Repay') || eventType.includes('repay')) {
      return <ArrowDownCircle className="w-5 h-5 text-purple-500" />;
    }
    return <CheckCircle2 className="w-5 h-5 text-gray-500" />;
  };

  const getEventBadgeColor = (eventType: string) => {
    if (eventType.includes('Deposit')) return 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400';
    if (eventType.includes('Withdraw')) return 'bg-orange-100 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400';
    if (eventType.includes('Loan')) return 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400';
    if (eventType.includes('Repay')) return 'bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400';
    return 'bg-gray-100 text-gray-700 dark:bg-gray-500/10 dark:text-gray-400';
  };

  const formatDate = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch {
      return 'Unknown';
    }
  };

  const formatEventType = (eventType: string) => {
    return eventType.replace(/([A-Z])/g, ' $1').trim();
  };

  if (isLoading) {
    return (
      <Card className="bg-white/95 dark:bg-[#121a16]/90 backdrop-blur-sm border-emerald-100/60 dark:border-emerald-500/15 shadow-md">
        <CardHeader>
          <CardTitle className="text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Transaction History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <RefreshCw className="w-6 h-6 animate-spin text-emerald-500" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/95 dark:bg-[#121a16]/90 backdrop-blur-sm border-emerald-100/60 dark:border-emerald-500/15 shadow-md">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Transaction History
            <Badge variant="secondary" className="ml-2 bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
              {events.length} events
            </Badge>
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchEvents}
            className="text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20 hover:bg-emerald-50/80 dark:hover:bg-emerald-500/10"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {error ? (
          <div className="text-center py-8 text-red-600 dark:text-red-400">
            {error}
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="w-12 h-12 text-emerald-400 dark:text-emerald-500 mx-auto mb-2" />
            <p className="text-emerald-600/80 dark:text-emerald-300/70">No transactions yet</p>
            <p className="text-sm text-emerald-600/60 dark:text-emerald-400/60 mt-1">
              Your deposits and withdrawals will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {events.map((event, index) => (
              <div
                key={event.id || index}
                className="flex items-center gap-4 p-4 rounded-lg bg-gradient-to-r from-emerald-50/50 to-teal-50/50 dark:from-emerald-500/5 dark:to-teal-500/5 hover:from-emerald-50/80 hover:to-teal-50/80 dark:hover:from-emerald-500/10 dark:hover:to-teal-500/10 transition-all"
              >
                <div className="flex-shrink-0">
                  {getEventIcon(event.eventType)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="secondary" className={`${getEventBadgeColor(event.eventType)} border-0 text-xs`}>
                      {formatEventType(event.eventType)}
                    </Badge>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(event.timestamp)}
                    </span>
                  </div>

                  <p className="text-sm font-medium text-emerald-800 dark:text-emerald-200">
                    {event.payload.amount && `${event.payload.amount} USDT`}
                    {event.payload.shares && `${event.payload.shares} shares`}
                  </p>

                  {event.payload.poolAddress && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 font-mono mt-1">
                      Pool: {event.payload.poolAddress.slice(0, 8)}...{event.payload.poolAddress.slice(-6)}
                    </p>
                  )}
                </div>

                {event.payload.contractTxHash && event.payload.contractTxHash !== 'unknown' && (
                  <a
                    href={`https://hashscan.io/testnet/transaction/${event.payload.contractTxHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-shrink-0 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
