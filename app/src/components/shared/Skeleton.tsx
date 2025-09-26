'use client';

import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  variant?: 'default' | 'card' | 'text' | 'circle';
}

export const Skeleton = ({ 
  className, 
  variant = 'default' 
}: SkeletonProps) => {
  const baseClasses = 'animate-pulse bg-muted rounded';
  
  const variantClasses = {
    default: 'h-4 w-full',
    card: 'h-32 w-full rounded-xl',
    text: 'h-4 w-3/4',
    circle: 'h-8 w-8 rounded-full'
  };

  return (
    <div 
      className={cn(baseClasses, variantClasses[variant], className)} 
    />
  );
};

// Pool Card Skeleton
export const PoolCardSkeleton = () => (
  <div className="bg-card rounded-xl p-6 border animate-pulse">
    <div className="flex items-center justify-between mb-4">
      <Skeleton className="h-6 w-20" />
      <Skeleton className="h-4 w-16" />
    </div>
    <div className="space-y-3">
      <div className="flex justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-16" />
      </div>
      <div className="flex justify-between">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-12" />
      </div>
      <div className="flex justify-between">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-4 w-14" />
      </div>
    </div>
    <div className="mt-4 pt-4 border-t">
      <Skeleton className="h-10 w-full" />
    </div>
  </div>
);

// Dashboard Stats Skeleton
export const StatsSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="bg-card rounded-xl p-6 border animate-pulse">
        <Skeleton className="h-4 w-20 mb-2" />
        <Skeleton className="h-8 w-24 mb-1" />
        <Skeleton className="h-3 w-16" />
      </div>
    ))}
  </div>
);

// Wallet Connection Skeleton
export const WalletSkeleton = () => (
  <div className="bg-card rounded-xl p-6 border animate-pulse">
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-3 w-40" />
      </div>
      <Skeleton className="h-8 w-24" />
    </div>
  </div>
);

export default Skeleton;
