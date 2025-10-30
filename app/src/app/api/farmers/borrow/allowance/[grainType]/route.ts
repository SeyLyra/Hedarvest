import { NextRequest, NextResponse } from 'next/server';

import { BACKEND_URL } from "@/lib/config";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ grainType: string }> }
) {
  try {
    const { grainType } = await params;
    const auth = request.headers.get('authorization');
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const res = await fetch(`${BACKEND_URL}/farmers/borrow/allowance/${encodeURIComponent(grainType)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': auth,
      },
      cache: 'no-store',
    });

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json({ error: data?.message || 'Failed to fetch allowance' }, { status: res.status });
    }
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


