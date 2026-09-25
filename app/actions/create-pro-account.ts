'use server'

import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Post-payment account creation for phone-first Pros (Tim + Abir, Sep 25).
 * The contractor pays on /upgrade with just a phone number; on the "You're in!"
 * screen they can optionally add email + password. This action births the
 * account THROUGH the same database rail the SMS side uses:
 *
 *   admin createUser (role: contractor) -> on_auth_user_created trigger
 *   (handle_new_user) builds profiles (role + phone) + contractor_profiles
 *   + an affiliate_links row automatically.
 *
 * Then it attaches their already-paid, phone-keyed subscription row(s) to the
 * new account (user_id was NULL until now). Real email = the existing
 * /auth/forgot-password flow works for them in the future.
 */

export interface CreateProAccountResult {
  ok: boolean
  error?: 'invalid_email' | 'weak_password' | 'invalid_phone' | 'email_exists' | 'create_failed'
}

function toE164(raw: string): string | null {
  const d = String(raw || '').replace(/\D/g, '').slice(-10)
  return d.length === 10 ? '+1' + d : null
}

export async function createProAccount(input: {
  phone: string
  email: string
  password: string
}): Promise<CreateProAccountResult> {
  const email = String(input.email || '').trim().toLowerCase()
  const password = String(input.password || '')
  const phone = toE164(input.phone)

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: 'invalid_email' }
  if (password.length < 8) return { ok: false, error: 'weak_password' }
  if (!phone) return { ok: false, error: 'invalid_phone' }

  const admin = createAdminClient()

  // 1) Create the confirmed auth user. The DB trigger does the rest
  //    (profile with phone, contractor_profiles, affiliate link).
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      role: 'contractor',
      tenant_slug: 'public',
      phone,
    },
  })

  if (createErr || !created?.user?.id) {
    const msg = String(createErr?.message || '').toLowerCase()
    const code = String((createErr as { code?: string } | null)?.code || '')
    if (msg.includes('already') || code === 'email_exists') {
      return { ok: false, error: 'email_exists' }
    }
    console.error('[createProAccount] createUser failed:', createErr?.message)
    return { ok: false, error: 'create_failed' }
  }

  const userId = created.user.id

  // 2) Attach their paid, phone-keyed subscription row(s) to the account.
  //    The Stripe webhook stores phone as '+1' + 10 digits — identical
  //    normalization to toE164 above, so eq() matches exactly.
  //    Non-fatal: the phone clause in check_bid_allowance keeps their number
  //    unlocked even if this linking write ever fails.
  const { error: linkErr } = await admin
    .from('subscriptions')
    .update({ user_id: userId })
    .is('user_id', null)
    .eq('phone', phone)
  if (linkErr) {
    console.warn('[createProAccount] subscription link skipped:', linkErr.message)
  }

  // 3) Belt-and-braces: make sure the profile carries the phone even if the
  //    trigger's metadata path ever changes. Only fills an empty value.
  const { error: profErr } = await admin
    .from('profiles')
    .update({ phone })
    .eq('id', userId)
    .is('phone', null)
  if (profErr) {
    console.warn('[createProAccount] profile phone backfill skipped:', profErr.message)
  }

  return { ok: true }
}
