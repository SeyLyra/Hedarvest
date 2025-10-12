import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { address, amount } = body;

    // Validate input
    if (!address || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields: address and amount' },
        { status: 400 }
      );
    }

    if (parseFloat(amount) <= 0) {
      return NextResponse.json(
        { error: 'Amount must be greater than 0' },
        { status: 400 }
      );
    }

    // Validate Hedera address format (0.0.xxxxx)
    const hederaAddressRegex = /^\d+\.\d+\.\d+$/;
    if (!hederaAddressRegex.test(address)) {
      return NextResponse.json(
        { error: 'Invalid Hedera address format. Expected: 0.0.xxxxx' },
        { status: 400 }
      );
    }

    console.log('🪙 Faucet mint request:', { address, amount });

    // Call backend faucet API
    const response = await fetch(`${BACKEND_URL}/faucet/mint`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        address,
        amount: parseFloat(amount),
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('❌ Backend faucet mint failed:', result);
      return NextResponse.json(
        { 
          success: false,
          error: result.message || result.error || 'Mint failed' 
        },
        { status: response.status }
      );
    }

    console.log('✅ Faucet mint successful:', result);

    return NextResponse.json({
      success: true,
      transactionHash: result.transactionHash,
      mintTransactionId: result.mintTransactionId,
      transferTransactionId: result.transferTransactionId,
      amount: result.amount,
      address: result.address,
      message: `Successfully minted ${amount} USDT to ${address}`
    }, { status: 200 });

  } catch (error) {
    console.error('❌ Faucet mint API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

