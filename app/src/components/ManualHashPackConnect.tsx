'use client';
import { useManualHashPack } from '@/hooks/useManualHashPack';

export default function ManualHashPackConnect() {
  const { connect, status, error } = useManualHashPack();

  return (
    <div className="w-full max-w-md mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6 text-center">
        <h1 className="text-2xl font-bold mb-2">HedHarvest</h1>
        <p className="text-gray-600 mb-6">Manual HashPack Connection</p>
        
        <button
          onClick={connect}
          disabled={status === 'loading'}
          className="w-full bg-gradient-to-r from-orange-600 to-red-600 text-white py-4 px-6 rounded-lg font-semibold text-lg disabled:opacity-50 transition-all hover:from-orange-700 hover:to-red-700"
        >
          {status === 'loading' ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
              Connecting...
            </div>
          ) : (
            'Connect Manually (Bypass API Issues)'
          )}
        </button>

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="text-red-700">
              <strong>Connection Failed:</strong> {error}
            </div>
            <button
              onClick={() => window.location.reload()}
              className="mt-3 w-full bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        )}

        <div className="mt-6 text-sm text-gray-500 space-y-2">
          <p><strong>This bypasses HashConnect API issues:</strong></p>
          <p>1. Click the button above</p>
          <p>2. Enter your Hedera account ID (e.g., 0.0.123456)</p>
          <p>3. You can find this in your HashPack wallet</p>
          <p>4. Get redirected to the dashboard</p>
        </div>
      </div>
    </div>
  );
}
