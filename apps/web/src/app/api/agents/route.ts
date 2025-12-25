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
