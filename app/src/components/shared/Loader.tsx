'use client';

import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoaderProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
  className?: string;
  variant?: 'default' | 'card' | 'overlay';
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8'
};

const messageSizeClasses = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg'
};

export const Loader = ({ 
  size = 'md', 
  message, 
  className,
  variant = 'default'
}: LoaderProps) => {
  const baseClasses = 'flex items-center justify-center';
  const variantClasses = {
    default: 'p-4',
    card: 'p-8 bg-card rounded-xl border',
    overlay: 'fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center'
  };

  return (
    <div className={cn(baseClasses, variantClasses[variant], className)}>
      <div className="flex flex-col items-center gap-3">
        <Loader2 className={cn('animate-spin text-primary', sizeClasses[size])} />
        {message && (
          <p className={cn('text-muted-foreground font-medium', messageSizeClasses[size])}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
};

export default Loader;
