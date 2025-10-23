'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWalletConnect } from '@/hooks/useWalletConnect';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wallet, ArrowLeft, Loader2 } from 'lucide-react';
import { Loader } from '@/components/shared/Loader';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  fallback
}) => {
  const router = useRouter();
  const { isConnected, isConnecting } = useWalletConnect();
  const [isChecking, setIsChecking] = useState(true);
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    // Minimum check time to show loading state (prevents flash)
    const minCheckTime = setTimeout(() => {
      setHasChecked(true);
    }, 1500); // Show loading for at least 1.5 seconds

    return () => clearTimeout(minCheckTime);
  }, []);

  useEffect(() => {
    // Only stop checking after minimum time has passed AND wallet state is determined
    if (hasChecked && !isConnecting) {
      setIsChecking(false);
    }
  }, [hasChecked, isConnecting, isConnected]);

  // Show loading while checking wallet state
  if (isChecking || isConnecting) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="p-8 text-center">
            <Loader 
              size="lg" 
              message={isConnecting ? "Connecting wallet..." : "Checking wallet connection..."}
              variant="card"
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  // If not connected, show login prompt
  if (!isConnected) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Wallet className="w-8 h-8 text-muted-foreground" />
            </div>
            <CardTitle className="text-2xl font-bold text-foreground">
              Wallet Required
            </CardTitle>
            <p className="text-muted-foreground">
              Please connect your HashPack wallet to access the investor dashboard.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={() => router.push('/investor-login')}
              className="w-full"
            >
              <Wallet className="w-4 h-4 mr-2" />
              Connect Wallet
            </Button>
            <Button
              onClick={() => router.push('/')}
              variant="outline"
              className="w-full"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If connected, render the protected content
  return <>{children}</>;
};
