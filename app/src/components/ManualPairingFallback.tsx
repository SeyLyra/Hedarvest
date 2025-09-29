'use client';
import { useState, useEffect } from 'react';
import { HashConnect } from 'hashconnect';
import { Button } from "@/components/ui/button";
import { Copy, ExternalLink } from "lucide-react";

export default function ManualPairingFallback() {
  const [pairingString, setPairingString] = useState('');
  const [showManual, setShowManual] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    // Show manual option after 5 seconds if no popup
    const timer = setTimeout(() => {
      setShowManual(true);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  const generatePairingString = async () => {
    setIsGenerating(true);
    try {
      const { LedgerId } = await import('@hashgraph/sdk');
      const hashConnect = new HashConnect(
        LedgerId.TESTNET,
        'manual-pairing',
        {
          name: "HedHarvest",
          description: "Investor Platform", 
          icons: [window.location.origin + "/logo.png"],
          url: window.location.origin
        },
        false
      );

      await hashConnect.init();
      
      // For manual pairing, we'll just show a message
      setPairingString('Manual pairing not available in this version. Please use the Connect button above.');
      
      // Copy to clipboard
      await navigator.clipboard.writeText('Please use the Connect HashPack button above for automatic pairing.');
      alert('Please use the Connect HashPack button above for automatic pairing.');
      
    } catch (error) {
      console.error('Failed to generate pairing string:', error);
      alert('Failed to generate pairing string. Check console for details.');
    } finally {
      setIsGenerating(false);
    }
  };

  const openHashPackExtension = () => {
    try {
      // Try to open HashPack extension directly
      window.open('chrome-extension://gjagmgiddbbciopjhllkdnddhcglnemk/popup.html', '_blank');
    } catch (error) {
      console.log('Could not open extension directly');
    }
  };

  if (!showManual) return null;

  return (
    <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
      <h3 className="font-semibold text-yellow-800 mb-2">HashPack didn't open automatically?</h3>
      <p className="text-yellow-700 text-sm mb-3">
        Try these manual methods to connect:
      </p>
      
      <div className="space-y-2">
        <Button
          onClick={openHashPackExtension}
          variant="outline"
          className="w-full bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          Open HashPack Extension
        </Button>
        
        <Button
          onClick={generatePairingString}
          disabled={isGenerating}
          className="w-full bg-yellow-600 text-white hover:bg-yellow-700"
        >
          <Copy className="h-4 w-4 mr-2" />
          {isGenerating ? 'Generating...' : 'Copy Pairing String'}
        </Button>
      </div>
      
      {pairingString && (
        <div className="mt-3 p-3 bg-white rounded border">
          <p className="text-xs text-gray-600 mb-2">Paste this in HashPack:</p>
          <div className="font-mono text-xs break-all bg-gray-100 p-2 rounded">
            {pairingString}
          </div>
        </div>
      )}
    </div>
  );
}
