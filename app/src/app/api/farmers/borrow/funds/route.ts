import { NextRequest, NextResponse } from 'next/server';

import { BACKEND_URL } from "@/lib/config";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const token = request.headers.get('Authorization')?.split(' ')[1];

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized: No token provided' }, { status: 401 });
    }

    console.log(`🔍 Proxying borrow request...`);

    const response = await fetch(`${BACKEND_URL}/farmers/borrow/funds`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        grainType: body.grainType,
        amount: body.amount,
      }),
      cache: 'no-store',
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('❌ Backend borrow failed:', result);
      return NextResponse.json(
        { success: false, error: result.message || result.error || 'Failed to borrow funds' },
        { status: response.status }
      );
    }

    console.log('✅ Backend borrow successful:', result);
    return NextResponse.json(result, { status: 200 });

  } catch (error) {
    console.error('❌ API error borrowing funds:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

