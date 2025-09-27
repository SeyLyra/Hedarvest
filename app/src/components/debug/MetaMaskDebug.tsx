'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const MetaMaskDebug = () => {
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const runDebugTest = async () => {
    setIsLoading(true);
    const info: any = {};

    try {
      // Check if window.ethereum exists
      info.hasWindowEthereum = typeof window !== 'undefined' && typeof window.ethereum !== 'undefined';
      
      if (info.hasWindowEthereum) {
        info.ethereumObject = {
          isMetaMask: window.ethereum?.isMetaMask,
          providers: window.ethereum?.providers,
          isConnected: window.ethereum?.isConnected?.(),
          selectedAddress: window.ethereum?.selectedAddress,
        };

        // Test eth_accounts
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          info.ethAccounts = accounts;
          info.hasAccounts = accounts.length > 0;
        } catch (error) {
          info.ethAccountsError = error;
        }

        // Test eth_requestAccounts (this should trigger MetaMask popup)
        try {
          console.log('Testing eth_requestAccounts...');
          const requestAccounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
          info.ethRequestAccounts = requestAccounts;
          info.requestAccountsSuccess = true;
        } catch (error) {
          info.ethRequestAccountsError = error;
          info.requestAccountsSuccess = false;
        }

        // Test chain ID
        try {
          const chainId = await window.ethereum.request({ method: 'eth_chainId' });
          info.chainId = chainId;
        } catch (error) {
          info.chainIdError = error;
        }
      }

      setDebugInfo(info);
    } catch (error) {
      info.generalError = error;
      setDebugInfo(info);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>MetaMask Debug Tool</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={runDebugTest} 
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? 'Running Debug Test...' : 'Run MetaMask Debug Test'}
        </Button>

        {debugInfo && (
          <div className="space-y-4">
            <h3 className="font-semibold">Debug Results:</h3>
            <pre className="bg-muted p-4 rounded-lg text-sm overflow-auto max-h-96">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
        )}

        <div className="text-sm text-muted-foreground">
          <p><strong>What this test does:</strong></p>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li>Checks if window.ethereum exists</li>
            <li>Tests MetaMask detection</li>
            <li>Tests eth_accounts (should not trigger popup)</li>
            <li>Tests eth_requestAccounts (should trigger MetaMask popup)</li>
            <li>Tests chain ID retrieval</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
