import { type NextRequest } from 'next/server'
import { refreshAuthSession } from '@/lib/supabase/middleware'

/**
 * Runs on every request to refresh auth session and protect routes
 */
export async function middleware(request: NextRequest) {
  return await refreshAuthSession(request)
}

/**
 * Runs middleware on all routes except static files and images
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
