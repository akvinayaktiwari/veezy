import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

// Public endpoint - no auth required
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ meetingToken: string }> }
) {
  try {
    const { meetingToken } = await params;

    // Fetch booking from backend by meeting token
    const response = await fetch(`${API_URL}/bookings/meeting/${meetingToken}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { error: 'Meeting not found' },
          { status: 404 }
        );
      }
      throw new Error('Failed to fetch meeting');
    }

    const booking = await response.json();

    return NextResponse.json(booking, { status: 200 });
  } catch (error) {
    console.error('Error fetching meeting:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
