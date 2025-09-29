"use client";

import { useHashPackDirect } from '@/hooks/useHashPackDirect';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wallet, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';

export default function SimpleWalletConnect() {
  const { accountId, isConnected, isLoading, error, connect, disconnect } = useHashPackDirect();

  return (
    <div style={{ padding: '20px', maxWidth: '400px', margin: '0 auto' }}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            HashPack Wallet Connection
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isConnected && (
            <div className="space-y-4">
              <Button
                onClick={connect}
                disabled={isLoading}
                className="w-full gap-2"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Wallet className="h-4 w-4" />
                    Connect HashPack
                  </>
                )}
              </Button>

              {error && (
                <div className="flex items-center gap-2 text-red-600 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}

              {typeof window !== 'undefined' && !window.hedera && (
                <div className="text-sm text-muted-foreground">
                  <p>HashPack wallet not detected.</p>
                  <a
                    href="https://www.hashpack.app/download"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Download HashPack →
                  </a>
                </div>
              )}
            </div>
          )}

          {isConnected && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge className="bg-green-100 text-green-800 border-green-200">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Connected
                  </Badge>
                </div>
                <Button
                  onClick={disconnect}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  Disconnect
                </Button>
              </div>

              <div className="bg-muted p-3 rounded-lg">
                <div className="text-sm font-medium">Connected Account:</div>
                <div className="font-mono text-sm break-all">{accountId}</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
