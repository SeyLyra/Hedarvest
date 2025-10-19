'use client';

import { useState, useCallback } from 'react';

interface TokenAssociationResult {
  success: boolean;
  data?: {
    transactionId?: string;
    status: string;
    alreadyAssociated: boolean;
  };
  message?: string;
  error?: string;
}

interface UserAndContractAssociationResult {
  success: boolean;
  data?: {
    userAssociation: {
      transactionId?: string;
      status: string;
      alreadyAssociated: boolean;
    };
    contractAssociation: {
      transactionId?: string;
      status: string;
      alreadyAssociated: boolean;
    };
  };
  message?: string;
  error?: string;
}

interface TokenAssociationHook {
  isAssociating: boolean;
  error: string | null;
  associateToken: (tokenId: string, userPrivateKey?: string) => Promise<TokenAssociationResult>;
  checkAssociation: (tokenId: string) => Promise<{ isAssociated: boolean; tokenInfo?: any }>;
  ensureAssociation: (tokenId: string, userPrivateKey?: string) => Promise<TokenAssociationResult>;
  getTokenInfo: (tokenId: string) => Promise<any>;
  associateTokenWithContract: (tokenId: string, contractAddress: string) => Promise<TokenAssociationResult>;
  ensureAssociationForUserAndContract: (
    tokenId: string, 
    contractAddress: string, 
    userPrivateKey?: string
  ) => Promise<UserAndContractAssociationResult>;
}

export function useTokenAssociation(): TokenAssociationHook {
  const [isAssociating, setIsAssociating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get auth token from localStorage or context
  const getAuthToken = useCallback(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('authToken') || localStorage.getItem('accessToken');
  }, []);

  const associateToken = useCallback(async (
    tokenId: string,
    userPrivateKey?: string,
  ): Promise<TokenAssociationResult> => {
    setIsAssociating(true);
    setError(null);

    try {
      const authToken = getAuthToken();
      if (!authToken) {
        throw new Error('Authentication token not found. Please log in.');
      }

      const response = await fetch('/api/tokens/associate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          tokenId,
          userPrivateKey,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to associate token');
      }

      return result;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to associate token';
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setIsAssociating(false);
    }
  }, [getAuthToken]);

  const checkAssociation = useCallback(async (
    tokenId: string,
  ): Promise<{ isAssociated: boolean; tokenInfo?: any }> => {
    try {
      const authToken = getAuthToken();
      if (!authToken) {
        throw new Error('Authentication token not found. Please log in.');
      }

      const response = await fetch(`/api/tokens/association/${tokenId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to check token association');
      }

      return {
        isAssociated: result.data.isAssociated,
        tokenInfo: result.data.tokenInfo,
      };
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to check token association';
      setError(errorMessage);
      return {
        isAssociated: false,
      };
    }
  }, [getAuthToken]);

  const ensureAssociation = useCallback(async (
    tokenId: string,
    userPrivateKey?: string,
  ): Promise<TokenAssociationResult> => {
    setIsAssociating(true);
    setError(null);

    try {
      const authToken = getAuthToken();
      if (!authToken) {
        throw new Error('Authentication token not found. Please log in.');
      }

      const response = await fetch('/api/tokens/ensure-association', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          tokenId,
          userPrivateKey,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to ensure token association');
      }

      return result;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to ensure token association';
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setIsAssociating(false);
    }
  }, [getAuthToken]);

  const getTokenInfo = useCallback(async (tokenId: string): Promise<any> => {
    try {
      const authToken = getAuthToken();
      if (!authToken) {
        throw new Error('Authentication token not found. Please log in.');
      }

      const response = await fetch(`/api/tokens/info/${tokenId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to get token info');
      }

      return result.data;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to get token info';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [getAuthToken]);

  const associateTokenWithContract = useCallback(async (
    tokenId: string,
    contractAddress: string,
  ): Promise<TokenAssociationResult> => {
    setIsAssociating(true);
    setError(null);

    try {
      const authToken = getAuthToken();
      if (!authToken) {
        throw new Error('Authentication token not found. Please log in.');
      }

      const response = await fetch('/api/tokens/associate-contract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          tokenId,
          contractAddress,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to associate token with contract');
      }

      return result;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to associate token with contract';
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setIsAssociating(false);
    }
  }, [getAuthToken]);

  const ensureAssociationForUserAndContract = useCallback(async (
    tokenId: string,
    contractAddress: string,
    userPrivateKey?: string,
  ): Promise<UserAndContractAssociationResult> => {
    setIsAssociating(true);
    setError(null);

    try {
      const authToken = getAuthToken();
      if (!authToken) {
        throw new Error('Authentication token not found. Please log in.');
      }

      const response = await fetch('/api/tokens/ensure-association-user-contract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          tokenId,
          contractAddress,
          userPrivateKey,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to ensure token association for user and contract');
      }

      return result;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to ensure token association for user and contract';
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setIsAssociating(false);
    }
  }, [getAuthToken]);

  return {
    isAssociating,
    error,
    associateToken,
    checkAssociation,
    ensureAssociation,
    getTokenInfo,
    associateTokenWithContract,
    ensureAssociationForUserAndContract,
  };
}
