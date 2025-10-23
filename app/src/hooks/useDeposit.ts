import { useState } from 'react';
import { toast } from 'sonner';

interface DepositParams {
  grainType: string;
  amount: string;
  userAddress: string;
  hashconnect: any;
}

export const useDeposit = () => {
  const [isLoading, setIsLoading] = useState(false);

  const deposit = async ({ grainType, amount, userAddress, hashconnect }: DepositParams) => {
    if (!userAddress || !hashconnect) {
      toast.error('Please connect your wallet first');
      return;
    }

    const depositAmount = parseFloat(amount);
    if (depositAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setIsLoading(true);
    
    try {
      toast.info(`💰 Depositing ${depositAmount} USDT to ${grainType} pool...`, { duration: 3000 });
      
      // Get pool address
      const poolsResponse = await fetch('/api/pools/list');
      const poolsData = await poolsResponse.json();
      const pool = poolsData.data.find((p: any) => p.grainType.toUpperCase() === grainType.toUpperCase());
      
      if (!pool) {
        const availableTypes = poolsData.data.map((p: any) => p.grainType).join(', ');
        throw new Error(`Pool not found for ${grainType}. Available types: ${availableTypes}`);
      }

      // Create deposit transaction
      const { ContractExecuteTransaction, ContractFunctionParameters } = await import('@hashgraph/sdk');
      
      const poolEvmAddress = pool.address;
      const amountInWei = Math.floor(depositAmount * 1e6); // 6 decimals
      
      // Get contract ID from mirror node
      const mirrorNodeResponse = await fetch(`https://testnet.mirrornode.hedera.com/api/v1/contracts/${poolEvmAddress}`);
      
      if (!mirrorNodeResponse.ok) {
        throw new Error(`Failed to get contract ID: ${mirrorNodeResponse.status}`);
      }
      
      const mirrorNodeData = await mirrorNodeResponse.json();
      const contractId = mirrorNodeData.contract_id;
      
      if (!contractId) {
        throw new Error(`Contract not found for address: ${poolEvmAddress}`);
      }

      // Validate minimum deposit
      const MIN_DEPOSIT = 1e6;
      if (amountInWei < MIN_DEPOSIT) {
        throw new Error(`Amount too small. Minimum deposit is 1 AUSD token. You entered: ${depositAmount} AUSD`);
      }

      // Create transaction
      // High gas limit needed because contract may perform token associations as child transactions
      const depositTx = new ContractExecuteTransaction()
        .setContractId(contractId)
        .setGas(1500000) // Increased from 300000 to handle token association child transactions
        .setFunction('deposit', new ContractFunctionParameters().addUint256(amountInWei));

      // Execute transaction
      const transactionResult = await hashconnect.sendTransaction(userAddress, depositTx);
      
      if (transactionResult.success === false) {
        if (transactionResult.error?.includes('CONTRACT_REVERT_EXECUTED')) {
          throw new Error('Transaction failed: Contract execution reverted. Please ensure you have enough AUSD tokens and proper approvals.');
        }
        throw new Error(`Deposit failed: ${transactionResult.error || 'Unknown error'}`);
      }

      toast.success(`✅ Successfully deposited ${depositAmount} USDT to ${grainType} pool!`, {
        duration: 5000,
        description: '🎉 Your funds are now earning yield!'
      });

      return { success: true };
      
    } catch (error: any) {
      console.error('❌ Deposit error:', error);
      toast.error(error instanceof Error ? error.message : 'Error processing deposit');
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  return { deposit, isLoading };
};
