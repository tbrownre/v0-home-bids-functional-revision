import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get('session_id')
  if (!sessionId?.startsWith('cs_')) {
    return NextResponse.redirect(new URL('/subscribe?type=contractor', request.url))
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.redirect(new URL('/subscribe?type=contractor', request.url))
  }

  const session = await stripe.checkout.sessions.retrieve(sessionId)
  if (session.metadata?.userId !== user.id || session.status !== 'complete') {
    return NextResponse.redirect(new URL(`/subscribe?type=contractor&userId=${user.id}`, request.url))
  }

  return NextResponse.redirect(new URL('/contractors/dashboard', request.url))
}
