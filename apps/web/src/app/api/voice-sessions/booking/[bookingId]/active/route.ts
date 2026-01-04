// API route to get active voice session for a booking
import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const LIVEKIT_URL = process.env.NEXT_PUBLIC_LIVEKIT_URL || 'ws://localhost:7880';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  try {
    const { bookingId } = await params;

    // Get active session from NestJS backend
    const response = await fetch(`${API_URL}/voice-agent/sessions/booking/${bookingId}/active`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { error: 'No active session found' },
          { status: 404 }
        );
      }
      const error = await response.json().catch(() => ({ message: 'Failed to get session' }));
      return NextResponse.json(error, { status: response.status });
    }

    const data = await response.json();
    
    // Transform response to use consistent field names
    return NextResponse.json({
      sessionId: data.sessionId,
      livekitUrl: LIVEKIT_URL,
      livekitToken: data.roomToken,
      roomName: data.roomName,
      status: data.status || 'connected',
    });
  } catch (error) {
    console.error('Error getting active voice session:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
