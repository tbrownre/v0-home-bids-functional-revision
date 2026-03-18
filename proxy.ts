import { NextResponse, NextRequest } from 'next/server'

/**
 * Proxy (formerly middleware). Kept minimal — no external imports — so the
 * Edge Runtime can always initialize this module and Next.js can always find
 * the `proxy` export. Auth protection is handled at the page/action level:
 *   - Admin pages: requireAdmin() in app/admin/actions.ts
 *   - Contractor pages: createClient().auth.getUser() in each page
 *   - Session refresh: @supabase/ssr handles token refresh client-side
 */
export async function proxy(request: NextRequest) {
  return NextResponse.next({ request })
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
