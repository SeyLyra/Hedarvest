import { NextRequest, NextResponse } from 'next/server';

// Mock data for loans
let loansData: any[] = [
  {
    id: 1,
    farmerId: 1,
    amount: 5000,
    interestRate: 8.5,
    status: 'active',
    createdAt: new Date().toISOString(),
    dueDate: '2024-12-31',
  },
  {
    id: 2,
    farmerId: 2,
    amount: 3000,
    interestRate: 7.0,
    status: 'pending',
    createdAt: new Date().toISOString(),
    dueDate: '2024-11-15',
  },
];

export async function GET() {
  try {
    return NextResponse.json(loansData);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch loans data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { farmerId, amount, interestRate, dueDate } = body;

    // Validate required fields
    if (!farmerId || !amount || !interestRate || !dueDate) {
      return NextResponse.json(
        { error: 'Missing required fields: farmerId, amount, interestRate, dueDate' },
        { status: 400 }
      );
    }

    // Create new loan
    const newLoan = {
      id: loansData.length + 1,
      farmerId: parseInt(farmerId),
      amount: parseFloat(amount),
      interestRate: parseFloat(interestRate),
      status: 'pending',
      createdAt: new Date().toISOString(),
      dueDate,
    };

    loansData.push(newLoan);

    return NextResponse.json(newLoan, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create loan' },
      { status: 500 }
    );
  }
}
