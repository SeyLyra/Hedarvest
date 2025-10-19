"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  History, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  ArrowUpRight, 
  ArrowDownRight, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Upload,
  DollarSign,
  RotateCcw,
  Coins,
  Package,
  ExternalLink,
  Calendar,
  FileText
} from "lucide-react";

interface Transaction {
  id: string;
  type: "mint" | "borrow" | "repay" | "redeem" | "deposit" | "withdraw";
  description: string;
  amount: string;
  date: string;
  time: string;
  status: "completed" | "pending" | "failed";
  hash?: string;
  details: {
    cropType?: string;
    quantity?: string;
    poolName?: string;
    interestRate?: string;
    collateral?: string;
  };
}

const mockTransactions: Transaction[] = [
  {
    id: "tx001",
    type: "mint",
    description: "Tokenized 500kg Rice",
    amount: "+2,500",
    date: "2024-01-15",
    time: "14:30",
    status: "completed",
    hash: "0x742d...8a9c",
    details: {
      cropType: "Rice",
      quantity: "500kg"
    }
  },
  {
    id: "tx002",
    type: "borrow",
    description: "Borrowed against Rice tokens",
    amount: "-1,800",
    date: "2024-01-14",
    time: "09:15",
    status: "completed",
    hash: "0x8f3a...2b1d",
    details: {
      poolName: "RICE Pool",
      interestRate: "8.5%",
      collateral: "500kg Rice"
    }
  },
  {
    id: "tx003",
    type: "repay",
    description: "Partial loan repayment",
    amount: "+500",
    date: "2024-01-13",
    time: "16:45",
    status: "completed",
    hash: "0x5c7e...9f2a",
    details: {
      poolName: "RICE Pool"
    }
  },
  {
    id: "tx004",
    type: "deposit",
    description: "Deposited Corn tokens as collateral",
    amount: "300kg",
    date: "2024-01-12",
    time: "11:20",
    status: "completed",
    hash: "0x3a8b...7c4d",
    details: {
      cropType: "Corn",
      quantity: "300kg",
      poolName: "CORN Pool"
    }
  },
  {
    id: "tx005",
    type: "withdraw",
    description: "Withdrew borrowed funds",
    amount: "+1,200",
    date: "2024-01-11",
    time: "13:10",
    status: "completed",
    hash: "0x9e2f...5a8c",
    details: {}
  },
  {
    id: "tx006",
    type: "redeem",
    description: "Redeemed Wheat tokens",
    amount: "200kg",
    date: "2024-01-10",
    time: "10:30",
    status: "pending",
    details: {
      cropType: "Wheat",
      quantity: "200kg"
    }
  }
];

export default function TransactionHistory() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | Transaction["type"]>("all");
  const [filterStatus, setFilterStatus] = useState<"all" | Transaction["status"]>("all");
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  const filteredTransactions = mockTransactions
    .filter(tx => 
      tx.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.id.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter(tx => filterType === "all" || tx.type === filterType)
    .filter(tx => filterStatus === "all" || tx.status === filterStatus)
    .sort((a, b) => new Date(b.date + " " + b.time).getTime() - new Date(a.date + " " + a.time).getTime());

  const getTransactionIcon = (type: Transaction["type"]) => {
    switch (type) {
      case "mint": return Upload;
      case "borrow": return DollarSign;
      case "repay": return RotateCcw;
      case "redeem": return Coins;
      case "deposit": return Package;
      case "withdraw": return ArrowUpRight;
      default: return FileText;
    }
  };

  const getStatusColor = (status: Transaction["status"]) => {
    switch (status) {
      case "completed": return "text-green-600 bg-green-100";
      case "pending": return "text-yellow-600 bg-yellow-100";
      case "failed": return "text-red-600 bg-red-100";
      default: return "text-gray-600 bg-gray-100";
    }
  };

  const getAmountColor = (amount: string) => {
    return amount.startsWith("+") ? "text-green-600" : "text-red-600";
  };

  const exportTransactions = () => {
    // In a real app, this would generate and download a CSV/PDF
    alert("Exporting transaction history...");
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center py-6">
        <div className="flex items-center justify-center mb-4">
          <div className="p-4 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full">
            <History className="h-8 w-8 text-white" />
          </div>
        </div>
        <h2 className="text-3xl font-bold text-foreground mb-2">Transaction History</h2>
        <p className="text-lg text-muted-foreground">
          View all your farming and DeFi transactions in one place
        </p>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="all">All Types</option>
                <option value="mint">Mint</option>
                <option value="borrow">Borrow</option>
                <option value="repay">Repay</option>
                <option value="redeem">Redeem</option>
                <option value="deposit">Deposit</option>
                <option value="withdraw">Withdraw</option>
              </select>
              
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </select>
              
              <Button variant="outline" onClick={exportTransactions}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions List */}
      <div className="space-y-4">
        {filteredTransactions.map((transaction) => {
          const Icon = getTransactionIcon(transaction.type);
          return (
            <Card 
              key={transaction.id} 
              className="cursor-pointer hover:shadow-md transition-all duration-200"
              onClick={() => setSelectedTransaction(transaction)}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-gray-100 rounded-lg">
                      <Icon className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{transaction.description}</h3>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <span className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          <span>{transaction.date}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>{transaction.time}</span>
                        </span>
                        <span>ID: {transaction.id}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className={`text-lg font-semibold ${getAmountColor(transaction.amount)}`}>
                        {transaction.amount}
                      </p>
                      <Badge className={getStatusColor(transaction.status)}>
                        {transaction.status}
                      </Badge>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredTransactions.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No transactions found</h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your search terms or filters
            </p>
            <Button 
              variant="outline" 
              onClick={() => {
                setSearchTerm("");
                setFilterType("all");
                setFilterStatus("all");
              }}
            >
              Clear Filters
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Transaction Details Modal */}
      {selectedTransaction && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Transaction Details</CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setSelectedTransaction(null)}
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Transaction ID</p>
                  <p className="font-medium">{selectedTransaction.id}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Type</p>
                  <p className="font-medium capitalize">{selectedTransaction.type}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Amount</p>
                  <p className={`font-medium ${getAmountColor(selectedTransaction.amount)}`}>
                    {selectedTransaction.amount}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge className={getStatusColor(selectedTransaction.status)}>
                    {selectedTransaction.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-medium">{selectedTransaction.date} at {selectedTransaction.time}</p>
                </div>
                {selectedTransaction.hash && (
                  <div>
                    <p className="text-sm text-muted-foreground">Transaction Hash</p>
                    <p className="font-mono text-sm">{selectedTransaction.hash}</p>
                  </div>
                )}
              </div>
              
              {Object.keys(selectedTransaction.details).length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Additional Details</p>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    {Object.entries(selectedTransaction.details).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-sm text-muted-foreground capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}:
                        </span>
                        <span className="text-sm font-medium">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View on Explorer
                </Button>
                <Button className="flex-1">
                  <Download className="h-4 w-4 mr-2" />
                  Download Receipt
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
