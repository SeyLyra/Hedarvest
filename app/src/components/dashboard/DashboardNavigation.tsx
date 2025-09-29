'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
  BarChart3, 
  Coins, 
  Briefcase, 
  Activity,
  TrendingUp,
  DollarSign,
  PieChart,
  Droplets
} from 'lucide-react';

export type DashboardSection = 'overview' | 'pools' | 'portfolio' | 'activity' | 'faucet';

interface DashboardNavigationProps {
  activeSection: DashboardSection;
  onSectionChange: (section: DashboardSection) => void;
  className?: string;
}

const sections = [
  {
    id: 'overview' as DashboardSection,
    label: 'Overview',
    icon: BarChart3,
    description: 'Dashboard summary and analytics'
  },
  {
    id: 'pools' as DashboardSection,
    label: 'Pools',
    icon: Coins,
    description: 'Available investment pools'
  },
  {
    id: 'portfolio' as DashboardSection,
    label: 'Portfolio',
    icon: Briefcase,
    description: 'Your investment positions'
  },
  {
    id: 'activity' as DashboardSection,
    label: 'Activity',
    icon: Activity,
    description: 'Transaction history'
  },
  {
    id: 'faucet' as DashboardSection,
    label: 'Faucet',
    icon: Droplets,
    description: 'Mint mock USDT tokens'
  }
];

export const DashboardNavigation = ({ 
  activeSection, 
  onSectionChange, 
  className 
}: DashboardNavigationProps) => {
  return (
    <div className={cn('border-b bg-card/50 backdrop-blur-sm', className)}>
      <div className="w-full px-8 py-4">
        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-1">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <Button
                key={section.id}
                variant={activeSection === section.id ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onSectionChange(section.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2',
                  activeSection === section.id
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
              >
                <Icon className="w-4 h-4" />
                <span className="font-medium">{section.label}</span>
              </Button>
            );
          })}
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {sections.map((section) => {
                const Icon = section.icon;
                return (
                  <Button
                    key={section.id}
                    variant={activeSection === section.id ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => onSectionChange(section.id)}
                    className={cn(
                      'p-2',
                      activeSection === section.id
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                  </Button>
                );
              })}
            </div>
            <div className="text-sm text-muted-foreground">
              {sections.find(s => s.id === activeSection)?.label}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardNavigation;
