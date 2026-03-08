import { updateSession } from '@/lib/supabase/middleware'
import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

// Routes requiring login
const PROTECTED = ['/homeowners', '/contractors/dashboard', '/contractors/jobs', '/contractors/bids', '/admin', '/inbox']
// Routes only contractors can access
const CONTRACTOR_ONLY = ['/contractors/dashboard', '/contractors/jobs', '/contractors/bids']
// Routes only homeowners can access  
const HOMEOWNER_ONLY = ['/homeowners']
// Routes only admins can access
const ADMIN_ONLY = ['/admin']
// Auth pages — bounce logged-in users away
const AUTH_PAGES = ['/auth/sign-in', '/auth/sign-up', '/signup', '/contractors/signup']

function matchesAny(path: string, routes: string[]) {
  return routes.some(r => path === r || path.startsWith(r + '/'))
}

export async function middleware(request: NextRequest) {
  // 1. Always refresh the session first (keeps cookies fresh)
  const response = await updateSession(request)
  const { pathname } = request.nextUrl

  // 2. Build a lightweight Supabase client to read the user
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: () => {}, // updateSession already handled this
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const role = user?.user_metadata?.role as string | undefined

  // 3. Redirect logged-in users away from auth pages
  if (user && matchesAny(pathname, AUTH_PAGES)) {
    const dest = role === 'homeowner' ? '/homeowners/dashboard'
      : role === 'contractor' ? '/contractors/dashboard'
      : role === 'admin' ? '/admin'
      : '/'
    return NextResponse.redirect(new URL(dest, request.url))
  }

  // 4. Require login for protected routes
  if (!user && matchesAny(pathname, PROTECTED)) {
    const url = new URL('/auth/sign-in', request.url)
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  // 5. Role-based access
  if (user) {
    if (matchesAny(pathname, ADMIN_ONLY) && role !== 'admin')
      return NextResponse.redirect(new URL('/', request.url))
    if (matchesAny(pathname, HOMEOWNER_ONLY) && role !== 'homeowner')
      return NextResponse.redirect(new URL('/', request.url))
    if (matchesAny(pathname, CONTRACTOR_ONLY) && role !== 'contractor')
      return NextResponse.redirect(new URL('/', request.url))

    // 6. Contractor approval gate
    if (role === 'contractor' && matchesAny(pathname, CONTRACTOR_ONLY)) {
      const { data: contractor } = await supabase
        .from('contractors')
        .select('approval_status')
        .eq('user_id', user.id)
        .single()

      if (!contractor)
        return NextResponse.redirect(new URL('/contractors/signup', request.url))
      if (contractor.approval_status === 'pending_approval')
        return NextResponse.redirect(new URL('/contractors/signup/pending', request.url))
      if (contractor.approval_status === 'rejected' || contractor.approval_status === 'suspended')
        return NextResponse.redirect(new URL('/contractors/signup/rejected', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
