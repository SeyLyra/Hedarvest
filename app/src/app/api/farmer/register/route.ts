import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate required fields
    const { name, phoneNumber, cropType, collateralAmount } = body
    
    if (!name || !phoneNumber || !cropType || !collateralAmount) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Validate phone number format
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/
    if (!phoneRegex.test(phoneNumber)) {
      return NextResponse.json(
        { error: "Invalid phone number format" },
        { status: 400 }
      )
    }

    // Validate collateral amount
    if (collateralAmount < 1) {
      return NextResponse.json(
        { error: "Collateral amount must be at least 1 kg" },
        { status: 400 }
      )
    }

    // Mock farmer registration - in real app, save to database
    const farmerId = `FARM-${Date.now()}`
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Mock response
    return NextResponse.json({
      success: true,
      farmerId,
      message: "Registration successful. An agent will contact you shortly.",
      data: {
        name,
        phoneNumber,
        cropType,
        collateralAmount,
        tokens: collateralAmount, // 1 kg = 1 token
        status: "pending_verification",
        estimatedResponseTime: "2-4 hours"
      }
    })

  } catch (error) {
    console.error("Farmer registration error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
