// API route to start a voice session for a booking
import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const LIVEKIT_URL = process.env.NEXT_PUBLIC_LIVEKIT_URL || 'ws://localhost:7880';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bookingId } = body;

    if (!bookingId) {
      return NextResponse.json(
        { error: 'bookingId is required' },
        { status: 400 }
      );
    }

    // Forward request to NestJS backend
    const response = await fetch(`${API_URL}/voice-agent/sessions/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingId }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to start session' }));
      return NextResponse.json(error, { status: response.status });
    }

    const data = await response.json();
    
    // Transform response to use consistent field names and proper LiveKit URL
    return NextResponse.json({
      sessionId: data.sessionId,
      livekitUrl: LIVEKIT_URL,
      livekitToken: data.roomToken,
      roomName: data.roomName,
      status: data.status || 'connected',
    });
  } catch (error) {
    console.error('Error starting voice session:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
