import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Forward to backend farmers/register endpoint
    const response = await fetch(`${BACKEND_URL}/farmers/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('Authorization') || '',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || 'Farmer registration failed')
    }

    const data = await response.json()
    
    return NextResponse.json({
      success: true,
      data: {
        farmer: data.farmer,
        qrCode: data.qrCode,
      },
    })
  } catch (error) {
    console.error("Farmer registration error:", error)
    
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Registration failed" },
      { status: 500 }
    )
  }
}
