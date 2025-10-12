import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { grainType, amount, depositorAddress } = body;

    // Validate input
    if (!grainType || !amount || !depositorAddress) {
      return NextResponse.json(
        { error: 'Missing required fields: grainType, amount, and depositorAddress' },
        { status: 400 }
      );
    }

    if (parseFloat(amount) <= 0) {
      return NextResponse.json(
        { error: 'Amount must be greater than 0' },
        { status: 400 }
      );
    }

    console.log('💰 Deposit request:', { grainType, amount, depositorAddress });

    // Call backend API
    const response = await fetch(`${BACKEND_URL}/api/investor/deposit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grainType,
        amount: parseFloat(amount),
        depositorAddress,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('❌ Backend deposit failed:', result);
      return NextResponse.json(
        { error: result.message || 'Deposit failed' },
        { status: response.status }
      );
    }

    console.log('✅ Deposit successful:', result);

    return NextResponse.json(result, { status: 200 });

  } catch (error) {
    console.error('❌ Deposit API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
