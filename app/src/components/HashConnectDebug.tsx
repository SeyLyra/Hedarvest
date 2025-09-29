'use client';
import { useState, useEffect } from 'react';
import { HashConnect } from 'hashconnect';

export default function HashConnectDebug() {
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const runDebug = async () => {
    setIsLoading(true);
    try {
      console.log('🔍 Running HashConnect debug...');
      
      // Test 1: Check if HashConnect can be imported
      const { LedgerId } = await import('@hashgraph/sdk');
      const hashConnect = new HashConnect(
        LedgerId.TESTNET,
        'debug-test',
        {
          name: "Debug Test",
          description: "Debug Description",
          icons: [window.location.origin + "/logo.png"],
          url: window.location.origin
        },
        false
      );
      console.log('✅ HashConnect instance created:', !!hashConnect);
      
      // Test 2: Check available methods
      const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(hashConnect));
      console.log('📋 Available methods:', methods);
      
      // Check specific connection methods
      const hasOpenPairingModal = typeof hashConnect.openPairingModal === 'function';
      const hasInit = typeof hashConnect.init === 'function';
      
      console.log('🔗 Connection methods:');
      console.log('   - openPairingModal:', hasOpenPairingModal);
      console.log('   - init:', hasInit);
      
      // Test 3: Check for event properties
      const hasPairingEvent = !!(hashConnect as any).pairingEvent;
      const hasConnectionStatusEvent = !!(hashConnect as any).connectionStatusEvent;
      const hasOnMethod = typeof (hashConnect as any).on === 'function';
      const hasAddEventListener = typeof (hashConnect as any).addEventListener === 'function';
      const hasOffMethod = typeof (hashConnect as any).off === 'function';
      const hasRemoveEventListener = typeof (hashConnect as any).removeEventListener === 'function';
      
      console.log('🎯 Event properties:');
      console.log('   - pairingEvent:', hasPairingEvent);
      console.log('   - connectionStatusEvent:', hasConnectionStatusEvent);
      console.log('   - on method:', hasOnMethod);
      console.log('   - addEventListener method:', hasAddEventListener);
      console.log('   - off method:', hasOffMethod);
      console.log('   - removeEventListener method:', hasRemoveEventListener);
      
      // Check pairingEvent methods if it exists
      let pairingEventMethods: string[] = [];
      if ((hashConnect as any).pairingEvent) {
        pairingEventMethods = Object.getOwnPropertyNames(Object.getPrototypeOf((hashConnect as any).pairingEvent));
        console.log('   - pairingEvent methods:', pairingEventMethods);
      }
      
      // Check connectionStatusEvent methods if it exists
      let statusEventMethods: string[] = [];
      if ((hashConnect as any).connectionStatusEvent) {
        statusEventMethods = Object.getOwnPropertyNames(Object.getPrototypeOf((hashConnect as any).connectionStatusEvent));
        console.log('   - connectionStatusEvent methods:', statusEventMethods);
      }
      
      // Test 4: Try initialization
      await hashConnect.init();
      
      console.log('✅ Initialization successful');
      
      // Test 5: Check pairing data
      const pairingData = (hashConnect as any).pairingData;
      console.log('✅ Pairing data available:', !!pairingData);
      
      setDebugInfo({
        hashConnectCreated: true,
        methods: methods,
        hasOpenPairingModal,
        hasInit,
        hasPairingEvent,
        hasConnectionStatusEvent,
        hasOnMethod,
        hasAddEventListener,
        hasOffMethod,
        hasRemoveEventListener,
        pairingEventMethods,
        statusEventMethods,
        initSuccessful: true,
        pairingDataAvailable: !!pairingData
      });
      
    } catch (error) {
      console.error('❌ Debug failed:', error);
      setDebugInfo({
        error: error instanceof Error ? error.message : 'Unknown error',
        hashConnectCreated: false
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
      <h3 className="font-semibold text-gray-800 mb-2">HashConnect Debug</h3>
      
      <button
        onClick={runDebug}
        disabled={isLoading}
        className="w-full bg-gray-600 text-white py-2 px-4 rounded hover:bg-gray-700 disabled:opacity-50 text-sm"
      >
        {isLoading ? 'Running Debug...' : 'Run HashConnect Debug'}
      </button>
      
      {debugInfo && (
        <div className="mt-3 p-3 bg-white rounded border text-xs">
          <div className="space-y-1">
            <div><strong>HashConnect Created:</strong> {debugInfo.hashConnectCreated ? '✅' : '❌'}</div>
            {debugInfo.methods && (
              <div><strong>Methods:</strong> {debugInfo.methods.length} found</div>
            )}
            <div><strong>OpenPairingModal:</strong> {debugInfo.hasOpenPairingModal ? '✅' : '❌'}</div>
            <div><strong>Init:</strong> {debugInfo.hasInit ? '✅' : '❌'}</div>
            <div><strong>Pairing Event:</strong> {debugInfo.hasPairingEvent ? '✅' : '❌'}</div>
            <div><strong>Connection Status Event:</strong> {debugInfo.hasConnectionStatusEvent ? '✅' : '❌'}</div>
            <div><strong>On Method:</strong> {debugInfo.hasOnMethod ? '✅' : '❌'}</div>
            <div><strong>AddEventListener:</strong> {debugInfo.hasAddEventListener ? '✅' : '❌'}</div>
            <div><strong>Off Method:</strong> {debugInfo.hasOffMethod ? '✅' : '❌'}</div>
            <div><strong>RemoveEventListener:</strong> {debugInfo.hasRemoveEventListener ? '✅' : '❌'}</div>
            {debugInfo.pairingEventMethods && (
              <div><strong>Pairing Event Methods:</strong> {debugInfo.pairingEventMethods.join(', ')}</div>
            )}
            {debugInfo.statusEventMethods && (
              <div><strong>Status Event Methods:</strong> {debugInfo.statusEventMethods.join(', ')}</div>
            )}
            <div><strong>Init Successful:</strong> {debugInfo.initSuccessful ? '✅' : '❌'}</div>
            <div><strong>Pairing Data:</strong> {debugInfo.pairingDataAvailable ? '✅' : '❌'}</div>
            {debugInfo.error && (
              <div className="text-red-600"><strong>Error:</strong> {debugInfo.error}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
