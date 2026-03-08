-- ============================================================
-- Migration: Contractor approval status + RLS fixes
-- ============================================================

-- 1. Add approval_status column to contractor_profiles
ALTER TABLE public.contractor_profiles
  ADD COLUMN IF NOT EXISTS approval_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (approval_status IN ('pending', 'approved', 'rejected'));

-- 2. Drop the old boolean columns (replaced by approval_status)
--    Safe to keep is_approved / is_verified for backwards compat, just leave them.

-- 3. Ensure the handle_new_user trigger updates phone too when provided
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, user_type, full_name, email, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'homeowner'),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'phone', NULL)
  )
  ON CONFLICT (id) DO UPDATE SET
    user_type  = EXCLUDED.user_type,
    full_name  = EXCLUDED.full_name,
    phone      = EXCLUDED.phone;
  RETURN NEW;
END;
$$;

-- 4. Allow contractors to insert their own contractor_profile row
--    (policy already exists from 001 but re-create to be safe)
DROP POLICY IF EXISTS "contractor_profiles_insert_own" ON public.contractor_profiles;
CREATE POLICY "contractor_profiles_insert_own"
  ON public.contractor_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 5. Function to check if a contractor is approved (used in dashboard guard)
CREATE OR REPLACE FUNCTION public.is_contractor_approved(user_id UUID)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.contractor_profiles
    WHERE id = user_id AND approval_status = 'approved'
  );
$$;
