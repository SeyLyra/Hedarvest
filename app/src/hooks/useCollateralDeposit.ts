"use client";

import { useState } from 'react';
import { toast } from 'sonner';
import { LENDING_POOL_ABI } from '@/lib/contracts';
import {
  ContractExecuteTransaction,
  ContractFunctionParameters,
  AccountId,
  Hbar,
  TokenId,
  TransferTransaction
} from '@hashgraph/sdk';

// Gas configuration for Hedera contract calls
const CONTRACT_GAS_LIMIT = 1500000;
const MAX_TRANSACTION_FEE = new Hbar(5);

interface DepositCollateralParams {
  poolAddress: string;
  amount: string; // Amount of collateral tokens to deposit
  userAddress: string;
  hashconnect: any;
  collateralTokenId: string; // HTS token ID for collateral (e.g., WHEAT token)
}

interface BorrowParams {
  poolAddress: string;
  amount: string; // Amount to borrow (in USDC)
  userAddress: string;
  hashconnect: any;
}

export const useCollateralDeposit = () => {
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Deposit collateral tokens into a lending pool
   * This allows farmers to lock their crop tokens as collateral for borrowing
   */
  const depositCollateral = async ({
    poolAddress,
    amount,
    userAddress,
    hashconnect,
    collateralTokenId
  }: DepositCollateralParams) => {
    if (!userAddress || !hashconnect) {
      toast.error('Please connect your wallet first');
      return { success: false, error: 'Wallet not connected' };
    }

    const depositAmount = parseFloat(amount);
    if (depositAmount <= 0) {
      toast.error('Please enter a valid amount');
      return { success: false, error: 'Invalid amount' };
    }

    setIsLoading(true);

    try {
      toast.info(`🔒 Depositing ${depositAmount} collateral tokens...`, { duration: 3000 });

      // Convert amount to token units (assuming 8 decimals for crop tokens)
      const amountInUnits = Math.floor(depositAmount * 1e8);

      // Validate minimum deposit
      const MIN_DEPOSIT = 1e8; // 1 token
      if (amountInUnits < MIN_DEPOSIT) {
        throw new Error(`Minimum deposit is 1 token. You entered: ${depositAmount} tokens`);
      }

      // Get contract ID from mirror node
      const mirrorNodeResponse = await fetch(
        `https://testnet.mirrornode.hedera.com/api/v1/contracts/${poolAddress}`
      );

      if (!mirrorNodeResponse.ok) {
        throw new Error(`Failed to get contract ID: ${mirrorNodeResponse.status}`);
      }

      const mirrorNodeData = await mirrorNodeResponse.json();
      const contractId = mirrorNodeData.contract_id;

      if (!contractId) {
        throw new Error(`Contract not found for address: ${poolAddress}`);
      }

      // Check if collateral token is associated
      const tokenId = TokenId.fromString(collateralTokenId);
      const userAccountId = AccountId.fromString(userAddress);

      try {
        const balanceQuery = await fetch(
          `https://testnet.mirrornode.hedera.com/api/v1/accounts/${userAddress}/tokens`
        );
        const balanceData = await balanceQuery.json();
        const isAssociated = balanceData.tokens?.some((token: any) => token.token_id === collateralTokenId);

        if (!isAssociated) {
          throw new Error(`Collateral token ${collateralTokenId} is not associated with your account. Please associate it first.`);
        }

        // Check if user has enough balance
        const tokenBalance = balanceData.tokens?.find((token: any) => token.token_id === collateralTokenId)?.balance || 0;
        if (parseInt(tokenBalance) < amountInUnits) {
          throw new Error(`Insufficient balance. You have ${parseInt(tokenBalance) / 1e8} tokens, but trying to deposit ${depositAmount} tokens.`);
        }
      } catch (checkError: any) {
        if (checkError.message.includes('Insufficient balance') || checkError.message.includes('not associated')) {
          throw checkError;
        }
        console.warn('Could not check token association:', checkError);
      }

      // Step 1: Transfer collateral tokens to pool contract
      toast.info('Step 1/2: Transferring collateral to pool...');

      const poolAccountId = AccountId.fromString(contractId);

      const transferTx = new TransferTransaction()
        .addTokenTransfer(tokenId, userAccountId, -amountInUnits)
        .addTokenTransfer(tokenId, poolAccountId, amountInUnits);

      const transferResult = await hashconnect.sendTransaction(userAddress, transferTx);

      if (transferResult.success === false) {
        throw new Error(`Token transfer failed: ${transferResult.error || 'Unknown error'}`);
      }

      toast.info('Step 2/2: Registering collateral deposit on contract...');

      // Step 2: Call depositCollateral() function on contract
      const depositTx = new ContractExecuteTransaction()
        .setContractId(contractId)
        .setGas(CONTRACT_GAS_LIMIT)
        .setMaxTransactionFee(MAX_TRANSACTION_FEE)
        .setFunction('depositCollateral', new ContractFunctionParameters().addUint256(amountInUnits));

      const depositResult = await hashconnect.sendTransaction(userAddress, depositTx);

      if (depositResult.success === false) {
        if (depositResult.error?.includes('CONTRACT_REVERT_EXECUTED')) {
          throw new Error('Contract execution reverted. Please ensure tokens were transferred successfully.');
        }
        throw new Error(`Collateral deposit failed: ${depositResult.error || 'Unknown error'}`);
      }

      toast.success(`✅ Successfully deposited ${depositAmount} tokens as collateral!`, {
        duration: 5000,
        description: '🔒 Your collateral is now locked and you can borrow against it'
      });

      // Log event to backend (fire and forget)
      try {
        await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'}/hcs/log-collateral-deposit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            poolAddress,
            amount: depositAmount,
            collateralTokenId,
            depositorAddress: userAddress,
            contractTxHash: depositResult.transactionId || 'unknown',
            timestamp: new Date().toISOString()
          })
        });
      } catch (hcsError) {
        console.warn('Failed to log to HCS:', hcsError);
      }

      return { success: true, transactionId: depositResult.transactionId };

    } catch (error: any) {
      console.error('❌ Collateral deposit error:', error);
      toast.error(error instanceof Error ? error.message : 'Error depositing collateral');
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Borrow funds from a lending pool using deposited collateral
   */
  const borrow = async ({ poolAddress, amount, userAddress, hashconnect }: BorrowParams) => {
    if (!userAddress || !hashconnect) {
      toast.error('Please connect your wallet first');
      return { success: false, error: 'Wallet not connected' };
    }

    const borrowAmount = parseFloat(amount);
    if (borrowAmount <= 0) {
      toast.error('Please enter a valid amount');
      return { success: false, error: 'Invalid amount' };
    }

    setIsLoading(true);

    try {
      toast.info(`💵 Borrowing ${borrowAmount} USDC...`, { duration: 3000 });

      // Convert amount to token units (USDC has 6 decimals)
      const amountInUnits = Math.floor(borrowAmount * 1e6);

      // Get contract ID from mirror node
      const mirrorNodeResponse = await fetch(
        `https://testnet.mirrornode.hedera.com/api/v1/contracts/${poolAddress}`
      );

      if (!mirrorNodeResponse.ok) {
        throw new Error(`Failed to get contract ID: ${mirrorNodeResponse.status}`);
      }

      const mirrorNodeData = await mirrorNodeResponse.json();
      const contractId = mirrorNodeData.contract_id;

      if (!contractId) {
        throw new Error(`Contract not found for address: ${poolAddress}`);
      }

      // Call borrow() function on contract
      const borrowTx = new ContractExecuteTransaction()
        .setContractId(contractId)
        .setGas(CONTRACT_GAS_LIMIT)
        .setMaxTransactionFee(MAX_TRANSACTION_FEE)
        .setFunction('borrow', new ContractFunctionParameters().addUint256(amountInUnits));

      const borrowResult = await hashconnect.sendTransaction(userAddress, borrowTx);

      if (borrowResult.success === false) {
        if (borrowResult.error?.includes('CONTRACT_REVERT_EXECUTED')) {
          throw new Error('Borrow failed. Possible reasons: insufficient collateral, health factor too low, or insufficient liquidity in pool.');
        }
        throw new Error(`Borrow failed: ${borrowResult.error || 'Unknown error'}`);
      }

      toast.success(`✅ Successfully borrowed ${borrowAmount} USDC!`, {
        duration: 5000,
        description: '💰 Funds have been transferred to your wallet'
      });

      // Log event to backend (fire and forget)
      try {
        await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'}/hcs/log-borrow`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            poolAddress,
            amount: borrowAmount,
            borrowerAddress: userAddress,
            contractTxHash: borrowResult.transactionId || 'unknown',
            timestamp: new Date().toISOString()
          })
        });
      } catch (hcsError) {
        console.warn('Failed to log to HCS:', hcsError);
      }

      return { success: true, transactionId: borrowResult.transactionId };

    } catch (error: any) {
      console.error('❌ Borrow error:', error);
      toast.error(error instanceof Error ? error.message : 'Error processing borrow');
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  return { depositCollateral, borrow, isLoading };
};
