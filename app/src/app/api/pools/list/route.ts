import { NextResponse } from "next/server"

import { BACKEND_URL } from "@/lib/config"

export async function GET() {
  try {
    // Fetch real pool data from backend with longer timeout
    // Backend might need time to query blockchain contracts
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000); // 30 seconds timeout
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
    
    // Check if it's a timeout/abort error
    if (error instanceof Error && (error.name === 'AbortError' || error.message.includes('aborted'))) {
      console.error("Backend request timed out after 30 seconds");
      return NextResponse.json({
        success: false,
        error: "Backend request timed out. The blockchain query may be taking longer than expected. Please try again.",
        timeout: true
      }, {
        status: 504 // Gateway Timeout
      });
    }

    // Check if it's a connection error
    if (error instanceof Error && (error.message.includes('ECONNREFUSED') || error.message.includes('fetch failed'))) {
      console.error("Cannot connect to backend server");
      return NextResponse.json({
        success: false,
        error: "Cannot connect to backend server. Please ensure the backend is running on port 3001.",
        connectionError: true
      }, {
        status: 503 // Service Unavailable
      });
    }

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch pools from backend"
    }, {
      status: 500
    })
  }
}
