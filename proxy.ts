import { type NextRequest, NextResponse } from 'next/server'

// Next.js 16 requires the function to be directly declared as `export async function proxy`
// (or a default export). Aliased re-exports like `export { fn as proxy }` are NOT recognised
// by Turbopack's static analysis of the proxy file.
export async function proxy(request: NextRequest) {
  if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
    return NextResponse.next({ request })
  }
  const { updateSession } = await import('@/lib/supabase/middleware')
  return await updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
