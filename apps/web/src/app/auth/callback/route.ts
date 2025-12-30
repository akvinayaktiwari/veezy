import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

const API_URL = process.env.API_URL || 'http://localhost:4000';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const origin = requestUrl.origin;

  if (code) {
    const supabase = await createSupabaseServerClient();
    
    // Exchange code for session
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (error) {
      console.error('Error exchanging code for session:', error.message);
      return NextResponse.redirect(`${origin}/auth/login?error=auth_failed`);
    }

    // Get the authenticated user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      // Check if tenant exists for this user
      try {
        const tenantResponse = await fetch(`${API_URL}/tenants/by-user/${user.id}`);
        
        if (!tenantResponse.ok) {
          // Tenant doesn't exist, create one
          console.log('Creating tenant for new user:', user.id);
          
          const createResponse = await fetch(`${API_URL}/tenants`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: user.id,
              name: user.email?.split('@')[0] || 'My Organization',
            }),
          });
          
          if (!createResponse.ok) {
            console.error('Failed to create tenant:', await createResponse.text());
          } else {
            console.log('Tenant created successfully');
          }
        } else {
          console.log('Tenant already exists for user:', user.id);
        }
      } catch (error) {
        console.error('Error checking/creating tenant:', error);
      }
    }
  }

  // Redirect to dashboard after successful authentication
  return NextResponse.redirect(`${origin}/dashboard`);
}
