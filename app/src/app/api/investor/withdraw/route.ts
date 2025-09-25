import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { grainType, shares } = body;

    // Validate input
    if (!grainType || !shares) {
      return NextResponse.json(
        { error: 'Missing required fields: grainType and shares' },
        { status: 400 }
      );
    }

    if (parseFloat(shares) <= 0) {
      return NextResponse.json(
        { error: 'Shares amount must be greater than 0' },
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

    // Mock successful withdrawal
    const mockResponse = {
      success: true,
      transactionHash: `0x${Math.random().toString(16).substr(2, 64)}`,
      grainType,
      shares,
      timestamp: new Date().toISOString(),
      message: `Successfully withdrew ${shares} shares from ${grainType} pool`
    };

    return NextResponse.json(mockResponse, { status: 200 });

  } catch (error) {
    console.error('Withdraw API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
