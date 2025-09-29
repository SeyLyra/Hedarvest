/**
 * Utility functions for Hedera account ID mapping
 */

/**
 * Convert an EVM address to a Hedera account ID using Hedera Mirror Node API
 * 
 * @param evmAddress - The EVM address (0x...)
 * @returns Promise<Hedera account ID (0.0.123456)>
 */
export async function evmAddressToHederaAccountId(evmAddress: string): Promise<string> {
  try {
    // Call Hedera Mirror Node to resolve Hedera account ID
    const mirrorUrl = `https://testnet.mirrornode.hedera.com/api/v1/accounts/${evmAddress}`;
    console.log(`Looking up Hedera account for EVM address: ${evmAddress}`);
    console.log(`Mirror Node URL: ${mirrorUrl}`);
    
    const res = await fetch(mirrorUrl);
    console.log(`Response status: ${res.status}`);
    
    if (!res.ok) {
      throw new Error(`Hedera account not found for EVM address ${evmAddress} (status: ${res.status})`);
    }
    
    const data = await res.json();
    console.log('Mirror Node response:', data);
    
    // Check if the response has the account directly (single account response)
    if (data.account) {
      const accountId = data.account;
      console.log(`Found Hedera account ID (direct): ${accountId}`);
      return accountId;
    }
    
    // Check if the response has an accounts array (multiple accounts response)
    if (data.accounts && data.accounts.length > 0) {
      const accountId = data.accounts[0].account;
      console.log(`Found Hedera account ID (array): ${accountId}`);
      return accountId;
    }
    
    throw new Error(`No account found in response for EVM address ${evmAddress}. Response structure: ${JSON.stringify(data)}`);
    
  } catch (error) {
    console.error('Failed to resolve Hedera account ID:', error);
    throw new Error(`Failed to resolve Hedera account ID: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}


/**
 * Get Hedera account ID from wallet address
 * 
 * @param walletAddress - The wallet address (could be EVM or Hedera)
 * @returns Promise<Hedera account ID>
 */
export async function getHederaAccountId(walletAddress: string): Promise<string> {
  console.log(`getHederaAccountId called with: ${walletAddress}`);
  
  // If it's already a Hedera account ID format, return as is
  if (walletAddress.match(/^\d+\.\d+\.\d+$/)) {
    console.log(`Already a Hedera account ID: ${walletAddress}`);
    return walletAddress;
  }
  
  // If it's an EVM address, convert it using Mirror Node
  if (walletAddress.startsWith('0x')) {
    console.log(`Converting EVM address to Hedera account ID: ${walletAddress}`);
    const result = await evmAddressToHederaAccountId(walletAddress);
    console.log(`Conversion result: ${result}`);
    return result;
  }
  
  // Invalid address format
  throw new Error(`Invalid wallet address format: ${walletAddress}`);
}

/**
 * Validate if a string is a valid Hedera account ID
 * 
 * @param accountId - The account ID to validate
 * @returns true if valid
 */
export function isValidHederaAccountId(accountId: string): boolean {
  return /^\d+\.\d+\.\d+$/.test(accountId);
}
