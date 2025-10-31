"use client";

import { useState } from 'react';
import { toast } from 'sonner';
import { LENDING_POOL_ABI } from '@/lib/contracts';
import { ContractExecuteTransaction, ContractFunctionParameters, AccountId, Hbar, TokenAssociateTransaction, TokenId } from '@hashgraph/sdk';

// Gas configuration for Hedera contract calls
// High gas limit needed because contract may perform token associations as child transactions
const CONTRACT_GAS_LIMIT = 1500000; // Sufficient gas for token associations and contract execution
const MAX_TRANSACTION_FEE = new Hbar(5); // Maximum transaction fee

interface DepositParams {
  poolAddress: string;
  amount: string;
  userAddress: string;
  hashconnect: any;
  USDCTokenId: string; // HTS token ID like "0.0.7115536"
}

interface WithdrawParams {
  poolAddress: string;
  shares: string;
  userAddress: string;
  hashconnect: any;
}

export const useLendingPool = () => {
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Deposit USDC into a lending pool
   * Uses HTS 2-step pattern:
   * 1. Transfer USDC to pool via Hedera SDK
   * 2. Call deposit() contract function
   */
  const deposit = async ({ poolAddress, amount, userAddress, hashconnect, USDCTokenId }: DepositParams) => {
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
      toast.info(`💰 Depositing ${depositAmount} USDC...`, { duration: 3000 });

      // Convert amount to token units (USDC has 6 decimals)
      const amountInUnits = Math.floor(depositAmount * 1e6);

      // Validate minimum deposit
      const MIN_DEPOSIT = 1e6; // 1 USDC
      if (amountInUnits < MIN_DEPOSIT) {
        throw new Error(`Minimum deposit is 1 USDC. You entered: ${depositAmount} USDC`);
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

      // Check if token is associated first
      const tokenId = TokenId.fromString(USDCTokenId);
      const userAccountId = AccountId.fromString(userAddress);

      try {
        const balanceQuery = await fetch(
          `https://testnet.mirrornode.hedera.com/api/v1/accounts/${userAddress}/tokens`
        );
        const balanceData = await balanceQuery.json();
        const isAssociated = balanceData.tokens?.some((token: any) => token.token_id === USDCTokenId);
        
        if (!isAssociated) {
          throw new Error(`Token ${USDCTokenId} is not associated with your account. Please associate the token first using the faucet page or HashPack wallet.`);
        }
      } catch (checkError) {
        console.warn('Could not check token association:', checkError);
        // Continue anyway - let the transfer attempt tell us if there's an issue
      }

      // Step 1: Transfer USDC tokens to pool via HTS
      toast.info('Step 1/2: Transferring USDC to pool...');

      const { TransferTransaction } = await import('@hashgraph/sdk');
      const poolAccountId = AccountId.fromString(contractId);

      const transferTx = new TransferTransaction()
        .addTokenTransfer(tokenId, userAccountId, -amountInUnits)
        .addTokenTransfer(tokenId, poolAccountId, amountInUnits);

      const transferResult = await hashconnect.sendTransaction(userAddress, transferTx);

      if (transferResult.success === false) {
        throw new Error(`Token transfer failed: ${transferResult.error || 'Unknown error'}`);
      }

      toast.info('Step 2/3: Confirming deposit on contract...');

      // Step 2: Call deposit() function on contract
      const depositTx = new ContractExecuteTransaction()
        .setContractId(contractId)
        .setGas(CONTRACT_GAS_LIMIT)
        .setMaxTransactionFee(MAX_TRANSACTION_FEE)
        .setFunction('deposit', new ContractFunctionParameters().addUint256(amountInUnits));

      const depositResult = await hashconnect.sendTransaction(userAddress, depositTx);

      if (depositResult.success === false) {
        if (depositResult.error?.includes('CONTRACT_REVERT_EXECUTED')) {
          throw new Error('Contract execution reverted. Please ensure tokens were transferred successfully.');
        }
        throw new Error(`Deposit failed: ${depositResult.error || 'Unknown error'}`);
      }

      toast.success(`✅ Successfully deposited ${depositAmount} USDT!`, {
        duration: 5000,
        description: '🎉 Your funds are now earning yield!'
      });

      // Log event to HCS (fire and forget - don't block on this)
      try {
        await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'}/hcs/log-deposit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            poolAddress,
            amount: depositAmount,
            depositorAddress: userAddress,
            contractTxHash: 'pending',
            timestamp: new Date().toISOString()
          })
        });
      } catch (hcsError) {
        console.warn('Failed to log to HCS:', hcsError);
      }

      return { success: true };

    } catch (error: any) {
      console.error('❌ Deposit error:', error);
      toast.error(error instanceof Error ? error.message : 'Error processing deposit');
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Withdraw liquidity from a lending pool
   * Calls withdraw(shares) on the contract
   */
  const withdraw = async ({ poolAddress, shares, userAddress, hashconnect }: WithdrawParams) => {
    if (!userAddress || !hashconnect) {
      toast.error('Please connect your wallet first');
      return { success: false, error: 'Wallet not connected' };
    }

    const withdrawShares = parseFloat(shares);
    if (withdrawShares <= 0) {
      toast.error('Please enter a valid amount');
      return { success: false, error: 'Invalid amount' };
    }

    setIsLoading(true);

    try {
      toast.info(`💸 Withdrawing ${withdrawShares} shares...`, { duration: 3000 });

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

      // Call withdraw() function
      const withdrawTx = new ContractExecuteTransaction()
        .setContractId(contractId)
        .setGas(CONTRACT_GAS_LIMIT)
        .setMaxTransactionFee(MAX_TRANSACTION_FEE)
        .setFunction('withdraw', new ContractFunctionParameters().addUint256(Math.floor(withdrawShares)));

      const withdrawResult = await hashconnect.sendTransaction(userAddress, withdrawTx);

      if (withdrawResult.success === false) {
        if (withdrawResult.error?.includes('CONTRACT_REVERT_EXECUTED')) {
          throw new Error('Withdrawal failed. Please ensure you have sufficient LP shares.');
        }
        throw new Error(`Withdrawal failed: ${withdrawResult.error || 'Unknown error'}`);
      }

      toast.success(`✅ Successfully withdrew ${withdrawShares} shares!`, {
        duration: 5000,
        description: '💰 Funds have been returned to your wallet'
      });

      // Log event to HCS (fire and forget - don't block on this)
      try {
        await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'}/hcs/log-withdraw`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            poolAddress,
            shares: withdrawShares,
            depositorAddress: userAddress,
            contractTxHash: 'pending',
            timestamp: new Date().toISOString()
          })
        });
      } catch (hcsError) {
        console.warn('Failed to log to HCS:', hcsError);
      }

      return { success: true };

    } catch (error: any) {
      console.error('❌ Withdraw error:', error);
      toast.error(error instanceof Error ? error.message : 'Error processing withdrawal');
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  return { deposit, withdraw, isLoading };
};
