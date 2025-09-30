import { NextRequest, NextResponse } from "next/server"
import { backersDepositSchema } from "@/lib/validations"

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate the request body
    const validatedData = backersDepositSchema.parse(body)
    
    // Forward to backend API
    const response = await fetch(`${BACKEND_URL}/pools/deposit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('Authorization') || '',
      },
      body: JSON.stringify({
        poolId: 1, // Default to pool 1 if not specified
        amount: validatedData.depositAmount,
        investmentDuration: validatedData.investmentDuration,
        riskTolerance: validatedData.riskTolerance,
        bankAccount: validatedData.bankAccount,
        taxId: validatedData.taxId,
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
        txId: data.transactionId,
        status: "completed",
        amount: validatedData.depositAmount,
        poolId: data.pool.id,
        timestamp: new Date().toISOString(),
      },
      txId: data.transactionId,
    })
  } catch (error) {
    console.error("Pool deposit error:", error)
    
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
