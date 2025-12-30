import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

// GET /api/leads/stats - Fetch lead statistics for a specific agent
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

    // Fetch stats from backend
    const statsResponse = await fetch(
      `${API_URL}/leads/stats?tenantId=${tenant.id}&agentId=${agentId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!statsResponse.ok) {
      throw new Error('Failed to fetch lead stats');
    }

    const stats = await statsResponse.json();

    // Calculate conversion rate
    const conversionRate = stats.total > 0 
      ? Math.round((stats.completed / stats.total) * 100) 
      : 0;

    return NextResponse.json({
      ...stats,
      conversionRate,
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching lead stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
