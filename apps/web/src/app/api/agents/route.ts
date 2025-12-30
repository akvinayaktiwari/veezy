import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

const API_URL = process.env.API_URL || 'http://localhost:4000'

export async function GET(request: NextRequest) {
  try {
    // Get current user from Supabase
    const supabase = await createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch tenant by userId
    const tenantResponse = await fetch(`${API_URL}/tenants/by-user/${user.id}`)
    
    if (!tenantResponse.ok) {
      if (tenantResponse.status === 404) {
        // No tenant found, return empty agents array
        return NextResponse.json([])
      }
      throw new Error(`Failed to fetch tenant: ${tenantResponse.statusText}`)
    }

    const tenant = await tenantResponse.json()

    // Fetch agents for this tenant
    const agentsResponse = await fetch(`${API_URL}/agents?tenantId=${tenant.id}`)
    
    if (!agentsResponse.ok) {
      throw new Error(`Failed to fetch agents: ${agentsResponse.statusText}`)
    }

    const agents = await agentsResponse.json()
    return NextResponse.json(agents)

  } catch (error) {
    console.error('Error in /api/agents:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch agents' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get current user
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { name, knowledge, linkExpiryHours } = body;

    // Validate required fields
    if (!name || !knowledge) {
      return NextResponse.json(
        { error: 'Name and knowledge are required' },
        { status: 400 }
      );
    }

    // Validate field constraints
    if (name.length < 1 || name.length > 100) {
      return NextResponse.json(
        { error: 'Name must be between 1 and 100 characters' },
        { status: 400 }
      );
    }

    if (knowledge.length < 10) {
      return NextResponse.json(
        { error: 'Knowledge must be at least 10 characters' },
        { status: 400 }
      );
    }

    if (linkExpiryHours !== undefined) {
      const hours = Number(linkExpiryHours);
      if (isNaN(hours) || hours < 1 || hours > 168) {
        return NextResponse.json(
          { error: 'Link expiry must be between 1 and 168 hours' },
          { status: 400 }
        );
      }
    }

    // Fetch tenant for current user
    const tenantResponse = await fetch(
      `${API_URL}/tenants/by-user/${user.id}`
    );

    if (!tenantResponse.ok) {
      return NextResponse.json(
        { error: 'Tenant not found. Please complete onboarding.' },
        { status: 404 }
      );
    }

    const tenant = await tenantResponse.json();

    // Create agent
    const agentResponse = await fetch(`${API_URL}/agents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tenantId: tenant.id,
        name,
        knowledge,
        linkExpiryHours: linkExpiryHours || 24,
      }),
    });

    if (!agentResponse.ok) {
      const errorData = await agentResponse.json();
      return NextResponse.json(
        { error: errorData.message || 'Failed to create agent' },
        { status: agentResponse.status }
      );
    }

    const agent = await agentResponse.json();

    return NextResponse.json(agent, { status: 201 });
  } catch (error) {
    console.error('Create agent error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
