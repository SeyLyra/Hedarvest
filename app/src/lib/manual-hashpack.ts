'use client';

// Manual HashPack connection - bypasses all HashConnect API issues
export class ManualHashPack {
  async connect(): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        console.log('🚀 Manual HashPack connection starting...');

        if (typeof window === 'undefined') {
          reject(new Error('Window not available'));
          return;
        }

        // Check if already connected
        const existingAccount = localStorage.getItem('manual_hashpack_account');
        if (existingAccount) {
          console.log('✅ Found existing account:', existingAccount);
          resolve(existingAccount);
          return;
        }

        // Manual approach - prompt user for account ID
        console.log('🔗 Opening manual connection dialog...');
        
        const accountId = prompt(
          'Enter your Hedera account ID (e.g., 0.0.123456):\n\n' +
          'This is a manual connection method that bypasses HashConnect API issues.\n' +
          'You can find your account ID in HashPack wallet.'
        );

        if (accountId && accountId.trim()) {
          const cleanAccountId = accountId.trim();
          
          // Basic validation for Hedera account ID format
          if (cleanAccountId.match(/^\d+\.\d+\.\d+$/)) {
            localStorage.setItem('manual_hashpack_account', cleanAccountId);
            console.log('✅ Manual connection successful:', cleanAccountId);
            resolve(cleanAccountId);
          } else {
            reject(new Error('Invalid account ID format. Please use format: 0.0.123456'));
          }
        } else {
          reject(new Error('No account ID provided'));
        }

      } catch (error) {
        console.error('💥 Manual connection failed:', error);
        reject(error);
      }
    });
  }

  disconnect(): void {
    localStorage.removeItem('manual_hashpack_account');
  }

  isConnected(): boolean {
    return !!localStorage.getItem('manual_hashpack_account');
  }

  getAccount(): string | null {
    return localStorage.getItem('manual_hashpack_account');
  }
}
