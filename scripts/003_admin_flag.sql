-- Add is_admin column to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false;

-- Admin-only SELECT policy on contractor_profiles (admins can see everything)
DROP POLICY IF EXISTS contractor_profiles_select_admin ON public.contractor_profiles;
CREATE POLICY contractor_profiles_select_admin
  ON public.contractor_profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.is_admin = true
    )
  );

-- Admin UPDATE policy on contractor_profiles (admins can update approval_status)
DROP POLICY IF EXISTS contractor_profiles_update_admin ON public.contractor_profiles;
CREATE POLICY contractor_profiles_update_admin
  ON public.contractor_profiles
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.is_admin = true
    )
  );

-- Admin SELECT policy on profiles (admins can see all profiles)
DROP POLICY IF EXISTS profiles_select_admin ON public.profiles;
CREATE POLICY profiles_select_admin
  ON public.profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles self
      WHERE self.id = auth.uid()
        AND self.is_admin = true
    )
  );
