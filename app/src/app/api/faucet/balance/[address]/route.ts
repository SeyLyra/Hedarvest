import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

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

    console.log('🔍 Fetching USDT balance for:', address);

    // Call backend faucet balance API
    const response = await fetch(`${BACKEND_URL}/faucet/balance/${address}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('❌ Backend balance fetch failed:', result);
      return NextResponse.json(
        { error: result.message || 'Failed to fetch balance' },
        { status: response.status }
      );
    }

    console.log('✅ USDT balance fetched:', result);

    return NextResponse.json({
      success: true,
      balance: result.balance,
      tokenId: result.tokenId,
      address: result.address,
      isAssociated: result.isAssociated,
      hbarBalance: result.hbarBalance
    }, { status: 200 });

  } catch (error) {
    console.error('❌ Balance API error:', error);
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

