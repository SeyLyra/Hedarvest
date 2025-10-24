import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const token = request.headers.get('authorization')?.replace('Bearer ', '');

    // Forward request to backend
    const response = await fetch('http://localhost:4000/warehouse/delivery-requests', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.message || 'Failed to create delivery request' },
        { status: response.status }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error creating delivery request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const farmerId = searchParams.get('farmerId');
    const token = request.headers.get('authorization')?.replace('Bearer ', '');

    let url = 'http://localhost:4000/warehouse/delivery-requests';
    if (farmerId) {
      url = `http://localhost:4000/warehouse/delivery-requests/farmer/${farmerId}`;
    }

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.message || 'Failed to fetch delivery requests' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching delivery requests:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
