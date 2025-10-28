import { NextResponse } from "next/server"

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'

export async function GET() {
  try {
    // Fetch real pool data from backend with shorter timeout for better UX
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000); // Reduced from 10s to 5s
    const response = await fetch(`${BACKEND_URL}/pools`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
      signal: controller.signal,
    }).finally(() => {
      clearTimeout(timeout);
    });

    if (!response.ok) {
      throw new Error(`Backend returned ${response.status}`);
    }

    const backendData = await response.json();

    // Transform backend data to frontend format
    const pools = backendData.map((pool: any, index: number) => ({
      id: index + 1,
      grainType: pool.assetType || pool.grainType,
      address: pool.address || pool.poolAddress,
      lendingTokenAddress: pool.lendingToken || pool.lendingTokenAddress,
      collateralTokenAddress: pool.collateralToken || pool.collateralTokenAddress,
      price: 250.50, // Default price - can be enhanced with oracle data later
      availableLiquidity: pool.availableLiquidity || "0",
      totalBorrows: pool.totalBorrows || "0",
      utilizationRate: parseFloat(pool.utilizationRate || "0"),
      apr: parseFloat(pool.currentAPR || pool.apr || "0"), // Already in percentage
    }));

    return NextResponse.json({
      success: true,
      data: pools,
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60', // Cache for 30s, stale for 60s
      }
    })
  } catch (error) {
    console.error("Failed to fetch pools from backend:", error);

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch pools from backend"
    }, {
      status: 500
    })
  }
}
