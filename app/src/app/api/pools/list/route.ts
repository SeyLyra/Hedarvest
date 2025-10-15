import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'

export async function GET(request: NextRequest) {
  try {
    console.log('📡 Fetching pools from backend:', BACKEND_URL);
    
    // Fetch real pool data from backend
    const response = await fetch(`${BACKEND_URL}/investor/pools`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store', // Disable caching for real-time data
    });

    if (!response.ok) {
      console.error('Backend response not OK:', response.status);
      throw new Error(`Backend returned ${response.status}`);
    }

    const backendData = await response.json();
    console.log('✅ Received pools from backend:', backendData);

    // Transform backend data to frontend format
    const pools = backendData.map((pool: any, index: number) => ({
      id: index + 1,
      grainType: pool.assetType || pool.grainType,
      address: pool.address || pool.poolAddress,
      lendingTokenAddress: pool.lendingToken || pool.lendingTokenAddress, // Add the token contract address
      price: 250.00, // Default price - can be fetched from oracle later
      availableLiquidity: pool.availableLiquidity || "0",
      totalBorrows: pool.totalBorrows || "0",
      utilizationRate: parseFloat(pool.utilizationRate || "0"),
      apr: parseFloat(pool.currentAPR || pool.apr || "0") / 100, // Convert from basis points
    }));

    return NextResponse.json({
      success: true,
      data: pools,
    })
  } catch (error) {
    console.error("❌ Pools list error:", error)
    
    // Fallback to mock data if backend is down
    const mockPools = [
      {
        id: 1,
        grainType: "Wheat",
        address: "0x1234567890123456789012345678901234567890",
        price: 250.50,
        availableLiquidity: "1000000",
        totalBorrows: "750000",
        utilizationRate: 75,
        apr: 8.5
      },
      {
        id: 2,
        grainType: "Corn",
        address: "0x2345678901234567890123456789012345678901",
        price: 180.25,
        availableLiquidity: "800000",
        totalBorrows: "600000",
        utilizationRate: 75,
        apr: 9.2
      },
      {
        id: 3,
        grainType: "Soybeans",
        address: "0x3456789012345678901234567890123456789012",
        price: 320.75,
        availableLiquidity: "1200000",
        totalBorrows: "900000",
        utilizationRate: 75,
        apr: 7.8
      }
    ];
    
    return NextResponse.json({
      success: true,
      data: mockPools,
      fallback: true,
      error: error instanceof Error ? error.message : "Backend unavailable - using mock data"
    })
  }
}
