import { NextRequest, NextResponse } from "next/server"
import { farmerAdvanceSchema } from "@/lib/validations"

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate the request body
    const validatedData = farmerAdvanceSchema.parse(body)
    
    // Forward to backend API (assuming there's a farmer loan endpoint)
    const response = await fetch(`${BACKEND_URL}/farmers/loans`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('Authorization') || '',
      },
      body: JSON.stringify({
        farmerId: validatedData.farmerId || 1, // Default farmer ID
        amount: validatedData.requestedAmount,
        grainType: validatedData.grainType,
        expectedHarvestDate: validatedData.expectedHarvestDate,
        farmerAddress: validatedData.walletAddress,
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
        amount: validatedData.requestedAmount,
        interestRate: data.interestRate || 8.5,
        timestamp: new Date().toISOString(),
      },
      txId: data.transactionId || data.hederaTxId,
    })
  } catch (error) {
    console.error("Farmer advance error:", error)
    
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
