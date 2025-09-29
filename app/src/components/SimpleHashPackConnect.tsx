'use client';

import { useState } from 'react';
import { useHashPackDirect } from '@/hooks/useHashPackDirect';
import ManualPairingFallback from './ManualPairingFallback';
import HashConnectDebug from './HashConnectDebug';
import { Button } from "@/components/ui/button";
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";

export default function SimpleHashPackConnect() {
  const { connect, isConnected, accountId, isLoading, error } = useHashPackDirect();
  const [showInstallGuide, setShowInstallGuide] = useState(false);

  const handleConnect = async () => {
    try {
      await connect();
    } catch (err) {
      console.error('Connection failed:', err);
    }
  };

  const handleInstallGuide = () => {
    setShowInstallGuide(true);
  };

  const handleBackToConnection = () => {
    setShowInstallGuide(false);
  };

  if (showInstallGuide) {
    return (
      <div className="w-full max-w-md mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-6 border border-border">
          <h2 className="text-xl font-bold mb-4">Install HashPack Extension</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Chrome/Brave:</h3>
              <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1">
                <li>Go to Chrome Web Store</li>
                <li>Search for "HashPack Wallet"</li>
                <li>Click "Add to Chrome"</li>
                <li>Follow the setup instructions</li>
                <li>Refresh this page after installation</li>
              </ol>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Firefox:</h3>
              <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1">
                <li>Go to Firefox Add-ons</li>
                <li>Search for "HashPack Wallet"</li>
                <li>Click "Add to Firefox"</li>
                <li>Follow the setup instructions</li>
                <li>Refresh this page after installation</li>
              </ol>
            </div>
            <Button
              onClick={handleBackToConnection}
              variant="outline"
              className="w-full"
            >
              Back to Connection
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6 border border-border">
        <h2 className="text-xl font-bold text-center mb-6">Connect HashPack Extension</h2>
        
        {/* Connection Status */}
        {isConnected && accountId && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <CheckCircle className="text-green-500 mr-3" />
              <div>
                <p className="font-semibold text-green-800">Connected Successfully</p>
                <p className="text-sm text-green-600 mt-1">Account: {accountId}</p>
              </div>
            </div>
          </div>
        )}

        {/* Connection Button */}
        <Button
          onClick={handleConnect}
          disabled={isLoading}
          className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
        >
          {isLoading ? (
            <>
              <Loader2 className="animate-spin h-5 w-5 mr-2" />
              Connecting to Extension...
            </>
          ) : (
            'Connect HashPack Extension'
          )}
        </Button>

        {/* Error Display */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="text-red-500 mr-3" />
              <div>
                <p className="font-semibold text-red-800">Connection Failed</p>
                <p className="text-sm text-red-600 mt-1">{error}</p>
              </div>
            </div>
            <Button
              onClick={handleConnect}
              className="mt-3 w-full bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 text-sm"
            >
              Try Again
            </Button>
          </div>
        )}

        {/* Debug Info */}
        <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h3 className="font-semibold text-gray-800 mb-2">Debug Info:</h3>
          <div className="text-xs text-gray-600 space-y-1">
            <div>HashPack Extension: {typeof window !== 'undefined' && (window as any).hashconnect ? '✅ Detected' : '❌ Not detected'}</div>
            <div>HashPack Object: {typeof window !== 'undefined' && (window as any).HashPack ? '✅ Available' : '❌ Not available'}</div>
            <div>User Agent: {typeof window !== 'undefined' ? (navigator.userAgent.includes('Chrome') ? 'Chrome' : 'Other') : 'Unknown'}</div>
          </div>
        </div>

        {/* Manual Pairing Fallback */}
        <ManualPairingFallback />

        {/* HashConnect Debug */}
        <HashConnectDebug />

        {/* Instructions */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-800 mb-2">Connection Instructions:</h3>
          <ol className="text-sm text-blue-700 list-decimal list-inside space-y-1">
            <li>Ensure HashPack extension is installed and unlocked</li>
            <li>Click "Connect HashPack Extension" button above</li>
            <li>HashPack popup should open automatically</li>
            <li>If popup doesn't appear, use the manual options below</li>
            <li>Approve the connection in HashPack</li>
            <li>Wait for automatic redirect to dashboard</li>
          </ol>
        </div>

        {/* Install Guide Button */}
        <Button
          onClick={handleInstallGuide}
          variant="outline"
          className="w-full mt-4"
        >
          Need to Install HashPack?
        </Button>
      </div>
    </div>
  );
}
