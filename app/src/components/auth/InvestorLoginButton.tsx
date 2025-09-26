'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { WalletConnectButton } from './WalletConnectButton';
import { useWallet } from '@/hooks/useWallet';
import { Wallet, User, ArrowRight } from 'lucide-react';

interface InvestorLoginButtonProps {
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'default' | 'lg';
}

export const InvestorLoginButton: React.FC<InvestorLoginButtonProps> = ({
  className,
  variant = 'default',
  size = 'default'
}) => {
  const router = useRouter();
  const { isConnected, address, walletType } = useWallet();
  const [isConnecting, setIsConnecting] = useState(false);

  const formatAddress = (addr: string) => {
    if (addr.length <= 10) return addr;
    if (walletType === 'hashpack') {
      // For Hedera addresses (0.0.12345), show last 5 digits
      return `0.0.${addr.split('.').pop()}`;
    }
    // For EVM addresses, show first 6 and last 4
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const handleInvestorLogin = async () => {
    if (isConnected && address) {
      // Already connected, redirect to dashboard
      router.push('/dashboard/investor');
    } else {
      // Not connected, show wallet connection modal
      setIsConnecting(true);
    }
  };

  if (isConnecting) {
    return (
      <WalletConnectButton 
        className={className}
        variant={variant}
        size={size}
        showDropdown={false}
        onConnected={() => {
          setIsConnecting(false);
          router.push('/dashboard/investor');
        }}
      />
    );
  }

  if (isConnected && address) {
    return (
      <Button
        variant={variant}
        size={size}
        className={`gap-2 ${className}`}
        onClick={() => router.push('/dashboard/investor')}
      >
        <User className="w-4 h-4" />
        <span className="font-mono text-sm">{formatAddress(address)}</span>
      </Button>
    );
  }

  return (
    <Button
      variant={variant}
      size={size}
      className={`gap-2 ${className}`}
      onClick={handleInvestorLogin}
    >
      <span className="text-lg">📈</span>
      Login as Investor
      <ArrowRight className="w-5 h-5" />
    </Button>
  );
};
