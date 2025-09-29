'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";

function HashPackCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [accountId, setAccountId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        console.log('🔄 HashPack callback received');
        console.log('📊 URL params:', Object.fromEntries(searchParams.entries()));
        
        // Check for pairing data in storage first
        const pairingData = localStorage.getItem('hashconnect_pairing_data');
        const hashconnectData = localStorage.getItem('hashconnectData');
        
        let foundAccountId = null;
        
        if (pairingData) {
          try {
            const data = JSON.parse(pairingData);
            foundAccountId = data.accountIds?.[0];
            console.log('✅ Found account ID from pairing data:', foundAccountId);
          } catch (e) {
            console.warn('⚠️ Failed to parse pairing data');
          }
        }
        
        if (hashconnectData) {
          try {
            const data = JSON.parse(hashconnectData);
            foundAccountId = data.accountIds?.[0] || data.accountId;
            console.log('✅ Found account ID from hashconnect data:', foundAccountId);
          } catch (e) {
            console.warn('⚠️ Failed to parse hashconnect data');
          }
        }
        
        // Check URL parameters as fallback
        const urlAccountId = searchParams.get('accountId') || searchParams.get('account');
        const topic = searchParams.get('topic');
        
        if (urlAccountId) {
          foundAccountId = urlAccountId;
          console.log('✅ Found account ID from URL params:', foundAccountId);
        }
        
        if (foundAccountId) {
          setAccountId(foundAccountId);
          setStatus('success');
          
          // Store the confirmed account ID
          localStorage.setItem('hedarvest_confirmed_account', foundAccountId);
          localStorage.setItem('hedarvest_connection_timestamp', Date.now().toString());
          
          // Redirect to dashboard after short delay
          setTimeout(() => {
            router.push('/investor-login?paired=true&accountId=' + foundAccountId);
          }, 2000);
        } else {
          console.error('❌ No account ID found in callback');
          setErrorMessage('No account information received from HashPack');
          setStatus('error');
        }
      } catch (error) {
        console.error('❌ Callback error:', error);
        setErrorMessage(error instanceof Error ? error.message : 'Unknown error occurred');
        setStatus('error');
      }
    };

    handleCallback();
  }, [router, searchParams]);

  const handleRetry = () => {
    // Clear any stored data and go back to login
    localStorage.removeItem('hashconnect_pairing_data');
    localStorage.removeItem('hashconnectData');
    localStorage.removeItem('hedarvest_confirmed_account');
    router.push('/investor-login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full bg-card rounded-lg shadow-lg p-8 text-center border border-border">
        {status === 'processing' && (
          <>
            <div className="flex justify-center mb-6">
              <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
            </div>
            <h2 className="text-2xl font-semibold text-foreground mb-3">
              Processing Connection...
            </h2>
            <p className="text-muted-foreground mb-4">
              Completing your HashPack wallet connection...
            </p>
            <div className="text-sm text-muted-foreground">
              Please wait while we verify your account information.
            </div>
          </>
        )}
        
        {status === 'success' && (
          <>
            <div className="flex justify-center mb-6">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
            <h2 className="text-2xl font-semibold text-foreground mb-3">
              Connection Successful! 🎉
            </h2>
            <p className="text-muted-foreground mb-2">
              Your wallet has been connected successfully.
            </p>
            {accountId && (
              <p className="text-sm text-muted-foreground mb-4 font-mono">
                Account: {accountId}
              </p>
            )}
            <p className="text-muted-foreground mb-4">
              Redirecting you to your dashboard...
            </p>
            <div className="flex justify-center">
              <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
            </div>
          </>
        )}
        
        {status === 'error' && (
          <>
            <div className="flex justify-center mb-6">
              <AlertCircle className="h-12 w-12 text-red-600" />
            </div>
            <h2 className="text-2xl font-semibold text-foreground mb-3">
              Connection Failed
            </h2>
            <p className="text-muted-foreground mb-4">
              {errorMessage || 'There was an issue connecting your wallet.'}
            </p>
            <div className="space-y-3">
              <Button
                onClick={handleRetry}
                className="w-full"
              >
                Try Again
              </Button>
              <Button
                onClick={() => router.push('/investor-login')}
                variant="outline"
                className="w-full"
              >
                Back to Login
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function HashPackCallback() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="max-w-md w-full bg-card rounded-lg shadow-lg p-8 text-center border border-border">
          <div className="flex justify-center mb-6">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
          </div>
          <h2 className="text-2xl font-semibold text-foreground mb-3">
            Loading...
          </h2>
          <p className="text-muted-foreground">
            Please wait while we process your connection.
          </p>
        </div>
      </div>
    }>
      <HashPackCallbackContent />
    </Suspense>
  );
}
