import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { grainType, amount } = body;

    // Validate input
    if (!grainType || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields: grainType and amount' },
        { status: 400 }
      );
    }

    if (parseFloat(amount) <= 0) {
      return NextResponse.json(
        { error: 'Amount must be greater than 0' },
        { status: 400 }
      );
    }

    // Mock validation - check if grain type is valid
    const validGrainTypes = ['Rice', 'Corn', 'Wheat', 'Soybean'];
    if (!validGrainTypes.includes(grainType)) {
      return NextResponse.json(
        { error: 'Invalid grain type' },
        { status: 400 }
      );
    }

    // Mock processing delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Mock successful deposit
    const mockResponse = {
      success: true,
      transactionHash: `0x${Math.random().toString(16).substr(2, 64)}`,
      grainType,
      amount,
      timestamp: new Date().toISOString(),
      message: `Successfully deposited ${amount} tokens to ${grainType} pool`
    };

    return NextResponse.json(mockResponse, { status: 200 });

  } catch (error) {
    console.error('Deposit API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
