import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate required fields
    if (!body.tokenId || !body.contractAddress) {
      return NextResponse.json(
        { success: false, message: 'Token ID and contract address are required' },
        { status: 400 }
      )
    }
    
    // Forward to backend API
    const response = await fetch(`${BACKEND_URL}/tokens/associate-contract`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('Authorization') || '',
      },
      body: JSON.stringify({
        tokenId: body.tokenId,
        contractAddress: body.contractAddress,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || 'Backend request failed')
    }

    const data = await response.json()
    
    return NextResponse.json(data)
  } catch (error) {
    console.error("Contract token association error:", error)
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Contract token association failed' 
      },
      { status: 500 }
    )
  }
}

