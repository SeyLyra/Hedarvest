'use client';

import { Button, ButtonProps } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingButtonProps extends ButtonProps {
  isLoading?: boolean;
  loadingText?: string;
  children: React.ReactNode;
}

export const LoadingButton = ({ 
  isLoading = false, 
  loadingText,
  children,
  className,
  disabled,
  ...props 
}: LoadingButtonProps) => {
  return (
    <Button
      {...props}
      disabled={disabled || isLoading}
      className={cn('relative', className)}
    >
      {isLoading && (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      )}
      {isLoading && loadingText ? loadingText : children}
    </Button>
  );
};

export default LoadingButton;
