'use server'

import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Post-payment account creation for phone-first Pros (Tim + Abir, Sep 25).
 * v2 DPAJREAL — rebuilt against the live database's actual auth trigger
 * (verified Sep 25): handle_new_user reads user_type (NOT role) from the
 * metadata and inserts ONLY the profiles row (id, user_type, full_name,
 * email, phone). The contractor_profiles row is inserted here, mirroring
 * signUpContractor exactly (approved immediately — they just paid).
 *
 * Flow: admin createUser (user_type: contractor, phone) -> trigger builds
 * profiles with phone -> we insert contractor_profiles + attach their paid,
 * phone-keyed subscription row(s) (user_id was NULL until now). Real email
 * means the existing /auth/forgot-password flow works for them later.
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

  // 1) Create the confirmed auth user. handle_new_user inserts the profiles
  //    row from this metadata (user_type + phone are the fields it reads).
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      user_type: 'contractor',
      phone,
    },
  })

  if (createErr || !created?.user?.id) {
    const msg = String(createErr?.message || '').toLowerCase()
    if (msg.includes('already registered') || msg.includes('already exists') || msg.includes('already been registered')) {
      return { ok: false, error: 'email_exists' }
    }
    console.error('[createProAccount] createUser failed:', createErr?.message)
    return { ok: false, error: 'create_failed' }
  }

  const userId = created.user.id

  // 2) Contractor row — same shape signUpContractor writes, minus the details
  //    they haven't given us yet (those come from the Account page later).
  //    Approved immediately: this person has already paid.
  const { error: cpErr } = await admin.from('contractor_profiles').upsert(
    {
      id: userId,
      approval_status: 'approved',
      is_verified: false,
      is_approved: true,
    },
    { onConflict: 'id' },
  )
  if (cpErr) {
    // Non-fatal: they are paid + signed in either way; details save creates it too.
    console.warn('[createProAccount] contractor_profiles upsert skipped:', cpErr.message)
  }

  // 3) Attach their paid, phone-keyed subscription row(s) to the account.
  //    The Stripe webhook stores phone as '+1' + 10 digits — identical
  //    normalization to toE164 above, so eq() matches exactly. Non-fatal:
  //    the phone clause in check_bid_allowance keeps them unlocked anyway.
  const { error: linkErr } = await admin
    .from('subscriptions')
    .update({ user_id: userId })
    .is('user_id', null)
    .eq('phone', phone)
  if (linkErr) {
    console.warn('[createProAccount] subscription link skipped:', linkErr.message)
  }

  return { ok: true }
}
