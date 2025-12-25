'use server'

import { createSupabaseServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function signOut() {
  try {
    const supabase = await createSupabaseServerClient()
    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error('Sign out error:', error)
      throw error
    }
  } catch (error) {
    console.error('Failed to sign out:', error)
    throw error
  }

  redirect('/auth/login')
}
