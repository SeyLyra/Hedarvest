import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000'

export async function GET(request: NextRequest) {
  try {
    // Mock data for now since backend might not be running
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
    })
  } catch (error) {
    console.error("Pools list error:", error)
    
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to fetch pools" },
      { status: 500 }
    )
  }
}
