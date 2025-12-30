import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ publicLink: string }> }
) {
  try {
    const { publicLink } = await params;

    // Fetch agent from backend by public link
    const response = await fetch(`${API_URL}/agents/by-link/${publicLink}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { error: 'Agent not found' },
          { status: 404 }
        );
      }
      throw new Error('Failed to fetch agent');
    }

    const agent = await response.json();

    return NextResponse.json(agent, { status: 200 });
  } catch (error) {
    console.error('Error fetching agent by link:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
