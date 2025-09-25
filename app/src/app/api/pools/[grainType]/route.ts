import { NextRequest, NextResponse } from 'next/server';

const mockPoolData: { [key: string]: any } = {
  'Rice': {
    availableLiquidity: "100000",
    totalBorrows: "40000",
    utilizationRate: 40,
    price: 200,
    totalAssets: "140000",
    exchangeRate: "1.05",
    baseLTV: 7500, // 75%
    riskPremium: 200, // 2%
    debtCeiling: "500000",
    protocolFee: 100, // 1%
  },
  'Corn': {
    availableLiquidity: "85000",
    totalBorrows: "35000",
    utilizationRate: 41,
    price: 180,
    totalAssets: "120000",
    exchangeRate: "1.03",
    baseLTV: 7000, // 70%
    riskPremium: 250, // 2.5%
    debtCeiling: "400000",
    protocolFee: 100, // 1%
  },
  'Wheat': {
    availableLiquidity: "120000",
    totalBorrows: "50000",
    utilizationRate: 42,
    price: 220,
    totalAssets: "170000",
    exchangeRate: "1.08",
    baseLTV: 8000, // 80%
    riskPremium: 180, // 1.8%
    debtCeiling: "600000",
    protocolFee: 100, // 1%
  },
  'Soybean': {
    availableLiquidity: "95000",
    totalBorrows: "38000",
    utilizationRate: 40,
    price: 190,
    totalAssets: "133000",
    exchangeRate: "1.04",
    baseLTV: 7200, // 72%
    riskPremium: 220, // 2.2%
    debtCeiling: "450000",
    protocolFee: 100, // 1%
  },
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ grainType: string }> }
) {
  try {
    const { grainType } = await params;
    const grainTypeFormatted = grainType.charAt(0).toUpperCase() + grainType.slice(1).toLowerCase();

    if (!mockPoolData[grainTypeFormatted]) {
      return NextResponse.json(
        { error: 'Invalid grain type' },
        { status: 404 }
      );
    }

    // Add some random variation to simulate real-time changes
    const baseData = mockPoolData[grainTypeFormatted];
    const variation = (Math.random() - 0.5) * 0.1; // ±5% variation
    
    const response = {
      ...baseData,
      availableLiquidity: Math.round(parseFloat(baseData.availableLiquidity) * (1 + variation)).toString(),
      totalBorrows: Math.round(parseFloat(baseData.totalBorrows) * (1 + variation)).toString(),
      utilizationRate: Math.round(baseData.utilizationRate * (1 + variation)),
      price: Math.round(baseData.price * (1 + variation) * 100) / 100,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    console.error('Pool API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
