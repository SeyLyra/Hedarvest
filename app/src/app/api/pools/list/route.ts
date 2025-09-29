import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000'

export async function GET(request: NextRequest) {
  try {
    // Forward to backend pools endpoint
    const response = await fetch(`${BACKEND_URL}/pools`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('Authorization') || '',
      },
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || 'Failed to fetch pools')
    }

    const data = await response.json()
    
    return NextResponse.json({
      success: true,
      data: data,
    })
  } catch (error) {
    console.error("Pools list error:", error)
    
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to fetch pools" },
      { status: 500 }
    )
  }
}
