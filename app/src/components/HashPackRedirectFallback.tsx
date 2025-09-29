'use client';

import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowRight, RefreshCw } from "lucide-react";

interface Props {
  isVisible: boolean;
  onRedirect: () => void;
  onRetry: () => void;
  accountId?: string | null;
}

export default function HashPackRedirectFallback({ 
  isVisible, 
  onRedirect, 
  onRetry,
  accountId 
}: Props) {
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    if (isVisible && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      
      return () => clearTimeout(timer);
    } else if (isVisible && countdown === 0) {
      onRedirect();
    }
  }, [isVisible, countdown, onRedirect]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-card rounded-lg shadow-xl p-8 max-w-md mx-4 border border-border">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <CheckCircle className="h-16 w-16 text-green-600" />
          </div>
          
          <h3 className="text-2xl font-bold text-foreground mb-4">
            Wallet Connected Successfully! 🎉
          </h3>
          
          {accountId && (
            <div className="bg-muted rounded-lg p-4 mb-6">
              <p className="text-sm text-muted-foreground mb-1">Connected Account:</p>
              <p className="font-mono text-sm text-foreground break-all">
                {accountId}
              </p>
            </div>
          )}
          
          <p className="text-muted-foreground mb-6">
            Your HashPack wallet has been connected successfully. 
            You'll be redirected automatically in {countdown} seconds.
          </p>
          
          <div className="space-y-3">
            <Button
              onClick={onRedirect}
              className="w-full gap-2"
              size="lg"
            >
              <ArrowRight className="h-4 w-4" />
              Continue to Dashboard
            </Button>
            
            <Button
              onClick={onRetry}
              variant="outline"
              className="w-full gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
          </div>
          
          <p className="text-xs text-muted-foreground mt-4">
            If you're not redirected automatically, click "Continue to Dashboard" above.
          </p>
        </div>
      </div>
    </div>
  );
}
