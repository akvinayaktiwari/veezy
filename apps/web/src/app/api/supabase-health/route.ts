import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, user: data.user });
  } catch (err) {
    console.error('Supabase connection failed:', err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
