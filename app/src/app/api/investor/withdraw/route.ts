import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { grainType, shares, depositorAddress } = body;

    // Validate input
    if (!grainType || !shares || !depositorAddress) {
      return NextResponse.json(
        { error: 'Missing required fields: grainType, shares, and depositorAddress' },
        { status: 400 }
      );
    }

    if (parseFloat(shares) <= 0) {
      return NextResponse.json(
        { error: 'Shares amount must be greater than 0' },
        { status: 400 }
      );
    }

    console.log('💸 Withdraw request:', { grainType, shares, depositorAddress });

    // Call backend API
    const response = await fetch(`${BACKEND_URL}/investor/withdraw`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grainType,
        shares: parseFloat(shares),
        depositorAddress,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('❌ Backend withdrawal failed:', result);
      return NextResponse.json(
        { error: result.message || 'Withdrawal failed' },
        { status: response.status }
      );
    }

    console.log('✅ Withdrawal successful:', result);

    return NextResponse.json(result, { status: 200 });

  } catch (error) {
    console.error('❌ Withdraw API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
