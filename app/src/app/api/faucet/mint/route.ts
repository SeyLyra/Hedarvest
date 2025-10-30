import { NextRequest, NextResponse } from 'next/server';

import { BACKEND_URL } from "@/lib/config";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { address, amount, tokenType = 'usdc' } = body;

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

    // Validate token type
    const validTokenTypes = ['usdc', 'wheat', 'rice', 'corn'];
    if (!validTokenTypes.includes(tokenType)) {
      return NextResponse.json(
        { error: `Invalid token type. Must be one of: ${validTokenTypes.join(', ')}` },
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

    

    // Call backend faucet API
    const response = await fetch(`${BACKEND_URL}/faucet/mint`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        address,
        amount: parseFloat(amount),
        tokenType,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      
      return NextResponse.json(
        { 
          success: false,
          error: result.message || result.error || 'Mint failed' 
        },
        { status: response.status }
      );
    }

    

    return NextResponse.json({
      success: true,
      transactionHash: result.transactionHash,
      mintTransactionId: result.mintTransactionId,
      transferTransactionId: result.transferTransactionId,
      amount: result.amount,
      address: result.address,
      tokenType: result.tokenType || tokenType,
      tokenSymbol: result.tokenSymbol || tokenType.toUpperCase(),
      message: `Successfully minted ${amount} ${tokenType.toUpperCase()} to ${address}`
    }, { status: 200 });

  } catch (error) {
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

