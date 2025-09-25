import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const txId = params.id
    
    if (!txId) {
      return NextResponse.json(
        { success: false, error: "Transaction ID is required" },
        { status: 400 }
      )
    }

    // Forward to backend tx/:id endpoint
    const response = await fetch(`${BACKEND_URL}/tx/${txId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('Authorization') || '',
      },
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || 'Failed to fetch transaction')
    }

    const data = await response.json()
    
    return NextResponse.json({
      success: true,
      data: data,
    })
  } catch (error) {
    console.error("Transaction fetch error:", error)
    
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to fetch transaction" },
      { status: 500 }
    )
  }
}
