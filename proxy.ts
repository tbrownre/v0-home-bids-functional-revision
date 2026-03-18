import { type NextRequest, NextResponse } from 'next/server'

export async function proxy(request: NextRequest) {
  // In demo mode skip all Supabase auth entirely — the env vars are not
  // present on the demo project, so importing the Supabase client would throw.
  if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
    return NextResponse.next({ request })
  }

  // Dynamic import keeps @supabase/ssr out of the module graph when demo mode
  // is active, preventing any Edge Runtime initialization errors.
  const { updateSession } = await import('@/lib/supabase/middleware')
  return await updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
