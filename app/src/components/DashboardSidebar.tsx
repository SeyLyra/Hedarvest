"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Coins, 
  PieChart, 
  Droplets, 
  Wallet,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { useWalletConnect } from "@/hooks/useWalletConnect";

interface DashboardSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export default function DashboardSidebar({ 
  activeTab, 
  onTabChange, 
  isCollapsed, 
  onToggleCollapse 
}: DashboardSidebarProps) {
  const { isConnected, hbarBalance, fetchBalance } = useWalletConnect();

  const tabs = [
    {
      id: 'pools',
      label: 'Pools',
      icon: Coins,
      description: 'View and manage investment pools'
    },
    {
      id: 'portfolio',
      label: 'Portfolio',
      icon: PieChart,
      description: 'Track your investments'
    },
    {
      id: 'faucet',
      label: 'Faucet',
      icon: Droplets,
      description: 'Get test tokens'
    }
  ];

  return (
    <div className={`bg-gradient-to-b from-white/90 via-white/80 to-white/70 backdrop-blur-2xl border-r border-white/20 shadow-2xl transition-all duration-500 ease-in-out ${
      isCollapsed ? 'w-16' : 'w-64'
    }`}>
      {/* Header */}
      <div className="p-4 border-b border-white/20 bg-gradient-to-r from-emerald-500/10 to-teal-500/10">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/25 animate-pulse">
                <Coins className="w-6 h-6 text-white drop-shadow-sm" />
              </div>
              <div>
                <span className="font-bold text-xl bg-gradient-to-r from-emerald-800 to-teal-800 bg-clip-text text-transparent">
                  Hedarvest
                </span>
                <div className="text-xs text-emerald-600 font-medium">DeFi Platform</div>
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleCollapse}
            className="p-2 h-10 w-10 rounded-xl hover:bg-white/20 transition-all duration-300 hover:scale-110"
          >
            {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      {/* Wallet Status */}
      {isConnected && (
        <div className="p-4 border-b border-white/20 bg-gradient-to-r from-emerald-500/5 to-teal-500/5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
              <Wallet className="w-3 h-3 text-white" />
            </div>
            {!isCollapsed && <span className="text-sm font-semibold bg-gradient-to-r from-emerald-700 to-teal-700 bg-clip-text text-transparent">Wallet</span>}
          </div>
          {!isCollapsed && hbarBalance && (
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-3 border border-emerald-200/50 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="text-sm font-mono font-bold text-emerald-700">
                  {hbarBalance} HBAR
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={fetchBalance}
                  className="text-xs h-7 px-3 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded-lg transition-all duration-300 hover:scale-105"
                >
                  Refresh
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Navigation */}
      <nav className="p-4 space-y-3">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <Button
              key={tab.id}
              variant={isActive ? "default" : "ghost"}
              className={`w-full justify-start h-14 rounded-xl transition-all duration-300 group ${
                isActive 
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25 scale-105' 
                  : 'text-emerald-700 hover:bg-gradient-to-r hover:from-emerald-50 hover:to-teal-50 hover:scale-105 hover:shadow-md'
              }`}
              onClick={() => onTabChange(tab.id)}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 ${
                isActive 
                  ? 'bg-white/20' 
                  : 'bg-emerald-100 group-hover:bg-emerald-200'
              }`}>
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-emerald-600'}`} />
              </div>
              {!isCollapsed && (
                <div className="flex flex-col items-start ml-3">
                  <span className="font-semibold text-sm">{tab.label}</span>
                  <span className="text-xs opacity-75">{tab.description}</span>
                </div>
              )}
            </Button>
          );
        })}
      </nav>

      {/* Footer */}
      {!isCollapsed && (
        <div className="absolute bottom-4 left-4 right-4">
          <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10 rounded-xl p-4 border border-white/20 shadow-lg backdrop-blur-sm">
            <div className="flex items-center gap-3 text-emerald-700">
              <div className="w-3 h-3 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full animate-pulse shadow-sm"></div>
              <span className="text-sm font-semibold">Live on Hedera</span>
            </div>
            <div className="text-xs text-emerald-600 mt-1 font-medium">
              Testnet Environment
            </div>
            <div className="text-xs text-emerald-500 mt-1 opacity-75">
              Powered by HashPack
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
