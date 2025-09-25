import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Forward to backend agents/register endpoint
    const response = await fetch(`${BACKEND_URL}/agents/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('Authorization') || '',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || 'Agent registration failed')
    }

    const data = await response.json()
    
    return NextResponse.json({
      success: true,
      data: {
        agent: data.agent,
      },
    })
  } catch (error) {
    console.error("Agent registration error:", error)
    
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Registration failed" },
      { status: 500 }
    )
  }
}
