-- ============================================================
-- Demo Users Setup
-- Creates two demo accounts that log in through the normal
-- sign-in page but cannot affect production data.
-- Run with the Supabase service role (not anon key).
-- ============================================================

-- Step 1: Create demo users via auth.users insert.
-- Supabase hashes passwords using bcrypt automatically when inserted this way.
-- We use confirmed = true so no email verification is required.

DO $$
DECLARE
  homeowner_id uuid := '00000000-0001-0000-0000-000000000001';
  contractor_id uuid := '00000000-0002-0000-0000-000000000002';
BEGIN

  -- ── Homeowner demo user ────────────────────────────────────────────────────
  -- Delete existing demo users first so this script is idempotent.
  DELETE FROM auth.users WHERE id = homeowner_id;
  DELETE FROM auth.users WHERE id = contractor_id;

  INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_user_meta_data,
    raw_app_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change
  ) VALUES (
    homeowner_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'demo.homeowner@homebids.io',
    crypt('HomeBidsDemo!24', gen_salt('bf')),
    now(),
    jsonb_build_object(
      'user_type', 'homeowner',
      'first_name', 'Alex',
      'last_name', 'Demo',
      'full_name', 'Alex Demo',
      'is_demo', true
    ),
    jsonb_build_object('provider', 'email', 'providers', ARRAY['email']),
    now(),
    now(),
    '', '', '', ''
  );

  -- ── Contractor demo user ───────────────────────────────────────────────────
  INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_user_meta_data,
    raw_app_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change
  ) VALUES (
    contractor_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'demo.contractor@homebids.io',
    crypt('HomeBidsDemo!24', gen_salt('bf')),
    now(),
    jsonb_build_object(
      'user_type', 'contractor',
      'full_name', 'Jordan Demo',
      'business_name', 'Demo Construction Co.',
      'is_demo', true
    ),
    jsonb_build_object('provider', 'email', 'providers', ARRAY['email']),
    now(),
    now(),
    '', '', '', ''
  );

  -- ── Profiles ───────────────────────────────────────────────────────────────
  DELETE FROM public.profiles WHERE id IN (homeowner_id, contractor_id);

  INSERT INTO public.profiles (id, full_name, email, user_type, created_at, updated_at)
  VALUES
    (homeowner_id, 'Alex Demo', 'demo.homeowner@homebids.io', 'homeowner', now(), now()),
    (contractor_id, 'Jordan Demo', 'demo.contractor@homebids.io', 'contractor', now(), now());

  -- ── Contractor profile ─────────────────────────────────────────────────────
  DELETE FROM public.contractor_profiles WHERE id = contractor_id;

  INSERT INTO public.contractor_profiles (
    id, business_name, specialties, service_area, bio,
    license_number, years_experience, approval_status, is_verified, is_approved
  ) VALUES (
    contractor_id,
    'Demo Construction Co.',
    ARRAY['Roofing', 'General Contracting', 'Kitchen Remodel', 'Bathroom Remodel'],
    'Austin, TX and surrounding areas',
    'Award-winning general contractor with over 15 years of experience. Licensed, bonded, and insured. We specialize in residential remodels and repairs.',
    'TX-GC-123456',
    15,
    'approved',
    true,
    true
  );

  -- ── Demo jobs (owned by homeowner demo) ────────────────────────────────────
  -- Use deterministic IDs so re-running is idempotent
  DELETE FROM public.bids WHERE job_id IN (
    '10000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000003'
  );
  DELETE FROM public.jobs WHERE id IN (
    '10000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000003'
  );

  INSERT INTO public.jobs (id, homeowner_id, title, description, category, location, budget_min, budget_max, status, created_at)
  VALUES
    (
      '10000000-0000-0000-0000-000000000001',
      homeowner_id,
      'Roof replacement — 2,200 sq ft shingle',
      'Full tear-off and replacement of existing asphalt shingle roof. House is 2,200 sq ft, single story. Looking for GAF or Owens Corning shingles, 30-year warranty preferred.',
      'Roofing',
      'Austin, TX',
      8000, 14000,
      'open',
      now() - interval '4 days'
    ),
    (
      '10000000-0000-0000-0000-000000000002',
      homeowner_id,
      'Kitchen remodel — full renovation',
      'Complete kitchen remodel including new cabinets, quartz countertops, tile backsplash, and updated lighting. Existing layout stays the same. ~180 sq ft kitchen.',
      'Kitchen',
      'Austin, TX',
      25000, 45000,
      'open',
      now() - interval '9 days'
    ),
    (
      '10000000-0000-0000-0000-000000000003',
      homeowner_id,
      'Master bathroom tile replacement',
      'Replace existing floor and shower tile in master bathroom. Shower is approx 4x5 ft, floor is 80 sq ft. Demo included. Customer has already selected tile.',
      'Bathroom',
      'Austin, TX',
      3500, 6500,
      'open',
      now() - interval '2 days'
    );

  -- ── Demo bids (submitted by contractor demo) ───────────────────────────────
  INSERT INTO public.bids (job_id, contractor_id, amount, message, timeline, status, created_at)
  VALUES
    (
      '10000000-0000-0000-0000-000000000001',
      contractor_id,
      11200,
      'We can complete your roof replacement using GAF Timberline HDZ shingles with a lifetime warranty. Our crew of 4 can typically complete a job this size in 1–2 days. Price includes full tear-off, disposal, and ice & water shield underlayment.',
      '1–2 days',
      'pending',
      now() - interval '3 days'
    ),
    (
      '10000000-0000-0000-0000-000000000002',
      contractor_id,
      38500,
      'We have completed over 60 kitchen remodels in the Austin area. This estimate includes semi-custom cabinetry, quartz countertop installation, tile backsplash, new under-cabinet lighting, and all labor. Lead time is 3 weeks for materials.',
      '4–6 weeks',
      'pending',
      now() - interval '7 days'
    );

END $$;
