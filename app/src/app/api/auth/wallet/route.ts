import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Forward to backend auth/wallet-connect endpoint
    const response = await fetch(`${BACKEND_URL}/auth/wallet-connect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || 'Authentication failed')
    }

    const data = await response.json()
    
    return NextResponse.json({
      success: true,
      data: {
        accessToken: data.accessToken,
        user: data.user,
      },
    })
  } catch (error) {
    console.error("Wallet connect error:", error)
    
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Authentication failed" },
      { status: 500 }
    )
  }
}
