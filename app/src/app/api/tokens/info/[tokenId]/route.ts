import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tokenId: string }> }
) {
  try {
    const { tokenId } = await params
    
    if (!tokenId) {
      return NextResponse.json(
        { success: false, message: 'Token ID is required' },
        { status: 400 }
      )
    }
    
    // Forward to backend API
    const response = await fetch(`${BACKEND_URL}/tokens/info/${tokenId}`, {
      method: 'GET',
      headers: {
        'Authorization': request.headers.get('Authorization') || '',
      },
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || 'Backend request failed')
    }

    const data = await response.json()
    
    return NextResponse.json(data)
  } catch (error) {
    console.error("Token info error:", error)
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Token info request failed' 
      },
      { status: 500 }
    )
  }
}

