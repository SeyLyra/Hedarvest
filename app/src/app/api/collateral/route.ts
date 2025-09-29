import { NextRequest, NextResponse } from 'next/server';

// Mock data for collateral management
let collateralData: any[] = [
  {
    id: 1,
    farmerId: 1,
    cropType: 'Rice',
    amountKg: 100,
    tokenBalance: 100,
    createdAt: new Date().toISOString(),
  },
  {
    id: 2,
    farmerId: 1,
    cropType: 'Wheat',
    amountKg: 50,
    tokenBalance: 50,
    createdAt: new Date().toISOString(),
  },
];

export async function GET() {
  try {
    return NextResponse.json(collateralData);
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
    const { farmerId, cropType, amountKg } = body;

    // Validate required fields
    if (!farmerId || !cropType || !amountKg) {
      return NextResponse.json(
        { error: 'Missing required fields: farmerId, cropType, amountKg' },
        { status: 400 }
      );
    }

    // Create new collateral entry
    const newCollateral = {
      id: collateralData.length + 1,
      farmerId: parseInt(farmerId),
      cropType,
      amountKg: parseFloat(amountKg),
      tokenBalance: parseFloat(amountKg), // 1 kg = 1 token
      createdAt: new Date().toISOString(),
    };

    collateralData.push(newCollateral);

    return NextResponse.json(newCollateral, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to add collateral' },
      { status: 500 }
    );
  }
}
