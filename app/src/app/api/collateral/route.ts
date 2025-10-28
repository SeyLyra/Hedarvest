import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

export async function GET() {
  try {
    // Collateral data is stored on-chain in smart contracts
    // Frontend should query the contract directly or use farmer profile endpoint
    return NextResponse.json(
      { error: 'Use smart contract to fetch collateral data' },
      { status: 501 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch collateral data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { farmerId, cropType, amountKg, poolAddress, farmerAddress } = body;

    // Validate required fields
    if (!farmerId || !cropType || !amountKg || !poolAddress || !farmerAddress) {
      return NextResponse.json(
        { error: 'Missing required fields: farmerId, cropType, amountKg, poolAddress, farmerAddress' },
        { status: 400 }
      );
    }

    // Forward to backend API
    const response = await fetch(`${BACKEND_URL}/farmers/collateral/deposit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        farmerId: parseInt(farmerId),
        cropType,
        amountKg: parseFloat(amountKg),
        poolAddress,
        farmerAddress,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error depositing collateral:', error);
    return NextResponse.json(
      { error: 'Failed to deposit collateral' },
      { status: 500 }
    );
  }
}
