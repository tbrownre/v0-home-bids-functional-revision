-- ============================================================
-- Migration 005: Fix infinite recursion in profiles RLS policies
-- Root cause: profiles_select_admin policy in 003_admin_flag.sql
-- uses EXISTS (SELECT 1 FROM public.profiles ...) which causes
-- Postgres to re-evaluate the same policy infinitely.
-- ============================================================

-- STEP 1: Create a SECURITY DEFINER function that checks admin status
-- by reading profiles WITHOUT triggering RLS (bypasses all policies).
-- This is the correct pattern for self-referential admin checks.
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_id
      AND is_admin = true
  );
$$;

-- STEP 2: Drop all policies on profiles that cause or contribute to recursion.
DROP POLICY IF EXISTS profiles_select_admin ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_admin" ON public.profiles;

-- STEP 3: Re-create profiles_select_admin using the SECURITY DEFINER function.
-- The function reads profiles bypassing RLS, so no recursion occurs.
CREATE POLICY profiles_select_admin
  ON public.profiles
  FOR SELECT
  USING (public.is_admin(auth.uid()));

-- STEP 4: Fix contractor_profiles admin policies — they also do
-- EXISTS (SELECT 1 FROM public.profiles ...) which triggers the recursive chain.
DROP POLICY IF EXISTS contractor_profiles_select_admin ON public.contractor_profiles;
DROP POLICY IF EXISTS "contractor_profiles_select_admin" ON public.contractor_profiles;
DROP POLICY IF EXISTS contractor_profiles_update_admin ON public.contractor_profiles;
DROP POLICY IF EXISTS "contractor_profiles_update_admin" ON public.contractor_profiles;

CREATE POLICY contractor_profiles_select_admin
  ON public.contractor_profiles
  FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE POLICY contractor_profiles_update_admin
  ON public.contractor_profiles
  FOR UPDATE
  USING (public.is_admin(auth.uid()));

-- STEP 5: Verify the existing profiles policies are clean (non-recursive).
-- These policies from 001_create_schema.sql are safe — they only use auth.uid()
-- or read column values on the row being evaluated, so no changes needed:
--   profiles_select_own:         auth.uid() = id               (safe)
--   profiles_insert_own:         auth.uid() = id               (safe)
--   profiles_update_own:         auth.uid() = id               (safe)
--   profiles_select_contractors: user_type = 'contractor'      (safe — reads the row itself)

-- STEP 6: Grant execute permission on the new helper function
GRANT EXECUTE ON FUNCTION public.is_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin(UUID) TO service_role;
