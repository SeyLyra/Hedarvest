'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useWallet } from '@/hooks/useWallet';
import { Wallet, ChevronDown, ExternalLink, Copy, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Loader } from '@/components/shared/Loader';

interface WalletConnectButtonProps {
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'default' | 'lg';
  showDropdown?: boolean;
  onConnected?: () => void;
}

export const WalletConnectButton: React.FC<WalletConnectButtonProps> = ({
  className,
  variant = 'default',
  size = 'default',
  showDropdown = true,
  onConnected
}) => {
  const {
    walletType,
    address,
    isConnected,
    isConnecting,
    error,
    connectMetaMask,
    connectHashPack,
    disconnect,
    isMetaMaskAvailable,
    isHashPackAvailable
  } = useWallet();

  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [connectingWallet, setConnectingWallet] = useState<'metamask' | 'hashpack' | null>(null);

  const handleConnect = async (walletType: 'metamask' | 'hashpack') => {
    setConnectingWallet(walletType);
    try {
      console.log(`=== WALLET CONNECTION STARTED ===`);
      console.log(`Attempting to connect ${walletType}...`);
      console.log('Current wallet state before connection:', { isConnected, isConnecting, error });
      
      if (walletType === 'metamask') {
        console.log('Calling connectMetaMask...');
        await connectMetaMask();
        console.log('connectMetaMask completed');
      } else {
        console.log('Calling connectHashPack...');
        await connectHashPack();
        console.log('connectHashPack completed');
      }
      
      console.log('Connection attempt completed');
      console.log('Wallet state after connection:', { isConnected, isConnecting, error });
      
      // Close modal immediately and let the parent handle the redirect
      setShowModal(false);
      
      // Call the onConnected callback if provided
      if (onConnected) {
        console.log('Calling onConnected callback');
        onConnected();
      }
      
      console.log(`=== WALLET CONNECTION COMPLETED ===`);
    } catch (err) {
      console.error('Connection error:', err);
    } finally {
      setConnectingWallet(null);
    }
  };

  const handleDisconnect = () => {
    disconnect();
    setShowModal(false);
  };

  const copyAddress = async () => {
    if (address) {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatAddress = (addr: string) => {
    if (addr.length <= 10) return addr;
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const getWalletIcon = () => {
    if (walletType === 'metamask') {
      return '🦊';
    } else if (walletType === 'hashpack') {
      return '🔗';
    }
    return <Wallet className="w-4 h-4" />;
  };

  const getWalletName = () => {
    if (walletType === 'metamask') return 'MetaMask';
    if (walletType === 'hashpack') return 'HashPack';
    return 'Wallet';
  };

  if (isConnected && address) {
    return (
      <div className="relative">
        <Button
          variant={variant}
          size={size}
          className={cn('gap-2', className)}
          onClick={() => showDropdown && setShowModal(!showModal)}
        >
          <span className="text-lg">{getWalletIcon()}</span>
          <span className="font-medium">{getWalletName()}</span>
          <span className="text-muted-foreground font-mono text-sm">
            {formatAddress(address)}
          </span>
          {showDropdown && <ChevronDown className="w-4 h-4" />}
        </Button>

        {showDropdown && showModal && (
          <div className="absolute top-full right-0 mt-2 w-64 bg-card border border-border rounded-lg shadow-lg z-50">
            <div className="p-4">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">{getWalletIcon()}</span>
                <div>
                  <div className="font-medium">{getWalletName()}</div>
                  <div className="text-sm text-muted-foreground font-mono">
                    {address}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start gap-2"
                  onClick={copyAddress}
                >
                  {copied ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                  {copied ? 'Copied!' : 'Copy Address'}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start gap-2"
                  onClick={() => window.open('https://hedera.com', '_blank')}
                >
                  <ExternalLink className="w-4 h-4" />
                  View on Explorer
                </Button>

                <Button
                  variant="destructive"
                  size="sm"
                  className="w-full"
                  onClick={handleDisconnect}
                >
                  Disconnect
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
        <Button
          variant={variant}
          size={size}
          className={cn('gap-2', className)}
          onClick={() => setShowModal(true)}
          disabled={isConnecting}
        >
          {isConnecting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Wallet className="w-4 h-4" />
          )}
          {isConnecting ? 'Connecting...' : 'Connect Wallet'}
        </Button>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-lg shadow-lg max-w-md w-full mx-4">
            <div className="p-6">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  Connect Wallet
                </h2>
                <p className="text-muted-foreground">
                  Choose your preferred wallet to connect
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <p className="text-destructive text-sm">{error}</p>
                </div>
              )}

              {connectingWallet && (
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Loader size="sm" />
                    <div>
                      <p className="text-blue-800 font-medium">
                        Connecting to {connectingWallet === 'metamask' ? 'MetaMask' : 'HashPack'}...
                      </p>
                      <p className="text-blue-600 text-sm">
                        {connectingWallet === 'metamask' 
                          ? 'Please approve the connection in MetaMask' 
                          : 'Please approve the connection in HashPack'
                        }
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start gap-3 h-14"
                  onClick={() => handleConnect('metamask')}
                  disabled={!isMetaMaskAvailable || isConnecting || connectingWallet !== null}
                >
                  <span className="text-2xl">🦊</span>
                  <div className="text-left">
                    <div className="font-medium">MetaMask</div>
                    <div className="text-sm text-muted-foreground">
                      {connectingWallet === 'metamask' ? 'Connecting...' : 
                       isConnecting ? 'Connecting...' : 
                       !isMetaMaskAvailable ? 'MetaMask not installed' : 
                       'Connect to MetaMask (EVM)'
                      }
                    </div>
                  </div>
                  {(isConnecting || connectingWallet === 'metamask') && (
                    <div className="ml-auto">
                      <Loader2 className="w-4 h-4 animate-spin" />
                    </div>
                  )}
                </Button>

                <Button
                  variant="outline"
                  className="w-full justify-start gap-3 h-14"
                  onClick={() => handleConnect('hashpack')}
                  disabled={!isHashPackAvailable || isConnecting || connectingWallet !== null}
                >
                  <span className="text-2xl">🔗</span>
                  <div className="text-left">
                    <div className="font-medium">HashPack</div>
                    <div className="text-sm text-muted-foreground">
                      {connectingWallet === 'hashpack' ? 'Connecting...' : 
                       isConnecting ? 'Connecting...' : 
                       !isHashPackAvailable ? 'HashPack not installed' : 
                       'Connect to HashPack (Hedera)'
                      }
                    </div>
                  </div>
                  {(isConnecting || connectingWallet === 'hashpack') && (
                    <div className="ml-auto">
                      <Loader2 className="w-4 h-4 animate-spin" />
                    </div>
                  )}
                </Button>
              </div>

              <div className="mt-6 pt-4 border-t border-border">
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
