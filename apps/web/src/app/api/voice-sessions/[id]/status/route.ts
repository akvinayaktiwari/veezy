// API route to get voice session status
import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Forward request to NestJS backend
    const response = await fetch(
      `${API_URL}/voice-agent/sessions/${id}/status`,
      { method: 'GET' }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to get status' }));
      return NextResponse.json(error, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error getting session status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
