import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const phone = searchParams.get('phone')
    
    if (!phone) {
      return NextResponse.json(
        { error: "Phone number is required" },
        { status: 400 }
      )
    }

    // Mock status check - in real app, query database by phone number
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 300))

    // Mock response with different statuses based on phone number
    const mockStatuses = {
      "pending": {
        status: "pending_verification",
        message: "Your registration is being reviewed. An agent will contact you shortly.",
        estimatedTime: "2-4 hours"
      },
      "assigned": {
        status: "agent_assigned",
        message: "Your agent has been assigned and will contact you within 24 hours.",
        agentName: "Sarah Johnson",
        agentPhone: "+1-555-0123"
      },
      "active": {
        status: "loan_active",
        message: "Your loan is now active. Check your dashboard for details.",
        loanAmount: 50000,
        interestRate: 8.5
      }
    }

    // Simple hash to determine status based on phone number
    const phoneHash = phone.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0)
      return a & a
    }, 0)
    
    const statusKey = Math.abs(phoneHash) % 3
    const statusKeys = Object.keys(mockStatuses)
    const currentStatus = statusKeys[statusKey]

    return NextResponse.json({
      success: true,
      data: {
        phone,
        ...mockStatuses[currentStatus as keyof typeof mockStatuses],
        lastUpdated: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error("Status check error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
