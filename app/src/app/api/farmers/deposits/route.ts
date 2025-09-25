import { NextRequest, NextResponse } from "next/server"
import { agentDepositSchema } from "@/lib/validations"

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate the request body
    const validatedData = agentDepositSchema.parse(body)
    
    // Forward to backend API (assuming there's an agent deposit endpoint)
    const response = await fetch(`${BACKEND_URL}/agents/deposits`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('Authorization') || '',
      },
      body: JSON.stringify({
        agentId: validatedData.agentId || 1, // Default agent ID
        grainType: validatedData.grainType,
        quantity: validatedData.quantity,
        estimatedValue: validatedData.estimatedValue,
        qualityGrade: validatedData.qualityGrade,
        storageLocation: validatedData.storageLocation,
        agentAddress: validatedData.walletAddress,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || 'Backend request failed')
    }

    const data = await response.json()
    
    return NextResponse.json({
      success: true,
      data: {
        txId: data.transactionId || data.hederaTxId,
        status: "completed",
        amount: validatedData.estimatedValue,
        timestamp: new Date().toISOString(),
      },
      txId: data.transactionId || data.hederaTxId,
    })
  } catch (error) {
    console.error("Agent deposit error:", error)
    
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { success: false, error: "Invalid form data" },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}
