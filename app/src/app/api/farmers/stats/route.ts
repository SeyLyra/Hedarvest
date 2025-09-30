import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    // Mock farmer stats data
    const mockStats = {
      totalFarmers: 25,
      activeLoans: 12,
      totalVolume: 2500000,
      averageLoanSize: 208333,
      successRate: 94.5
    };
    
    return NextResponse.json({
      success: true,
      data: mockStats,
    })
  } catch (error) {
    console.error("Farmer stats error:", error)
    
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to fetch farmer stats" },
      { status: 500 }
    )
  }
}
