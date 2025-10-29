import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

export async function POST(request: NextRequest) {
  try {
    const auth = request.headers.get('authorization');
    const token = auth?.startsWith('Bearer ') ? auth.substring(7) : null;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { grainType, amount } = body;

    if (!grainType || !amount || Number(amount) <= 0) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const res = await fetch(`${BACKEND_URL}/farmers/collateral/deposit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ grainType, amount: Number(amount) }),
    });

    const result = await res.json();
    if (!res.ok) {
      return NextResponse.json({ error: result?.message || 'Deposit failed' }, { status: res.status });
    }
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


