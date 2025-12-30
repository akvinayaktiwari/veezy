import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

// GET /api/leads - Fetch leads for a specific agent
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get agentId from query params
    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get('agentId');

    if (!agentId) {
      return NextResponse.json(
        { error: 'Agent ID is required' },
        { status: 400 }
      );
    }

    // Fetch tenant for this user
    const tenantResponse = await fetch(`${API_URL}/tenants/by-user/${user.id}`);
    
    if (!tenantResponse.ok) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      );
    }

    const tenant = await tenantResponse.json();

    // Fetch leads for this agent and tenant
    const leadsResponse = await fetch(
      `${API_URL}/leads?tenantId=${tenant.id}&agentId=${agentId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!leadsResponse.ok) {
      throw new Error('Failed to fetch leads');
    }

    const leads = await leadsResponse.json();

    return NextResponse.json(leads, { status: 200 });
  } catch (error) {
    console.error('Error fetching leads:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
