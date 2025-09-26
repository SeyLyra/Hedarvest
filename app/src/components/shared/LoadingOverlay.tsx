'use client';

import { Loader } from './Loader';

interface LoadingOverlayProps {
  isVisible: boolean;
  message?: string;
  className?: string;
}

export const LoadingOverlay = ({ 
  isVisible, 
  message = 'Loading...', 
  className 
}: LoadingOverlayProps) => {
  if (!isVisible) return null;

  return (
    <div className={`fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center ${className}`}>
      <Loader size="lg" message={message} variant="overlay" />
    </div>
  );
};

export default LoadingOverlay;
