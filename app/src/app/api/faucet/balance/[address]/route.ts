import { NextRequest, NextResponse } from 'next/server';

import { BACKEND_URL } from "@/lib/config";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const { address } = await params;

    if (!address) {
      return NextResponse.json(
        { error: 'Address is required' },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const tokenType = searchParams.get('tokenType') || 'usdc';

    

    // Call backend faucet balance API
    const response = await fetch(`${BACKEND_URL}/faucet/balance/${address}?tokenType=${encodeURIComponent(tokenType)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    const result = await response.json();

    if (!response.ok) {
      
      return NextResponse.json(
        { error: result.message || 'Failed to fetch balance' },
        { status: response.status }
      );
    }

    

    return NextResponse.json({
      success: true,
      balance: result.balance,
      tokenId: result.tokenId,
      address: result.address,
      isAssociated: result.isAssociated,
      hbarBalance: result.hbarBalance,
      tokenType: tokenType,
    }, { status: 200 });

  } catch (error) {
    
    return NextResponse.json(
      { 
        success: false,
        balance: '0',
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

