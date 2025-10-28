import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const poolId = searchParams.get('poolId')

    // poolId is required
    if (!poolId) {
      return NextResponse.json({
        success: false,
        error: "poolId is required"
      }, {
        status: 400
      })
    }

    // Forward to backend pools/:id/stats endpoint
    const response = await fetch(`${BACKEND_URL}/pools/${poolId}/stats`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('Authorization') || '',
      },
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || 'Failed to fetch pool stats')
    }

    const data = await response.json()

    return NextResponse.json({
      success: true,
      data: data,
    })
  } catch (error) {
    console.error("Pool stats error:", error)

    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to fetch pool stats" },
      { status: 500 }
    )
  }
}
