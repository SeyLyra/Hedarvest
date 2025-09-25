import { NextRequest, NextResponse } from 'next/server';

const mockPrices: { [key: string]: number } = {
  'Rice': 200,
  'Corn': 180,
  'Wheat': 220,
  'Soybean': 190,
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ grainType: string }> }
) {
  try {
    const { grainType } = await params;
    const grainTypeFormatted = grainType.charAt(0).toUpperCase() + grainType.slice(1).toLowerCase();

    if (!mockPrices[grainTypeFormatted]) {
      return NextResponse.json(
        { error: 'Invalid grain type' },
        { status: 404 }
      );
    }

    // Add some random variation to simulate price changes
    const basePrice = mockPrices[grainTypeFormatted];
    const variation = (Math.random() - 0.5) * 10; // ±5% variation
    const currentPrice = Math.max(0, basePrice + variation);

    const response = {
      grainType: grainTypeFormatted,
      price: Math.round(currentPrice * 100) / 100,
      timestamp: new Date().toISOString(),
      change24h: (Math.random() - 0.5) * 20, // Random 24h change
    };

    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    console.error('Price API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
