import { NextResponse, type NextRequest } from 'next/server'

/**
 * Mock-mode middleware — bypasses all Supabase auth checks.
 * All route protection is handled client-side via lib/mock-auth.ts.
 * This avoids the Supabase network call on every request and eliminates
 * the server-side redirect loop that caused the contractor dashboard flash.
 */
export async function updateSession(request: NextRequest) {
  return NextResponse.next({ request });
}
