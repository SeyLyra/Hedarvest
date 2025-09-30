'use client';

import { useHashPackDirect } from '@/hooks/useHashPackDirect';

export default function ConnectionStatus() {
  const { isConnected, isLoading: isConnecting, error } = useHashPackDirect();

  if (!isConnected && !isConnecting && !error) {
    return null;
  }

  const getStatusConfig = () => {
    if (error) {
      return {
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        textColor: 'text-red-800',
        icon: '❌',
        message: error || 'Connection failed'
      };
    }
    
    if (isConnecting) {
      return {
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        textColor: 'text-blue-800',
        icon: '🔄',
        message: 'Connecting to HashPack...'
      };
    }
    
    if (isConnected) {
      return {
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        textColor: 'text-green-800',
        icon: '✅',
        message: 'Connected to HashPack'
      };
    }

    return {
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200',
      textColor: 'text-gray-800',
      icon: 'ℹ️',
      message: 'Disconnected'
    };
  };

  const status = getStatusConfig();

  return (
    <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 ${status.bgColor} ${status.borderColor} border rounded-lg p-4 shadow-lg max-w-md w-full mx-4`}>
      <div className="flex items-center space-x-3">
        <span className="text-xl">{status.icon}</span>
        <div className="flex-1">
          <p className={`font-medium ${status.textColor}`}>
            {status.message}
          </p>
          {isConnecting && (
            <div className="w-full bg-blue-200 rounded-full h-1 mt-2">
              <div className="bg-blue-600 h-1 rounded-full animate-pulse"></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
