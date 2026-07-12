-- ============================================================
-- HomeBids Database Schema
-- ============================================================

-- PROFILES (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  user_type TEXT NOT NULL CHECK (user_type IN ('homeowner', 'contractor')),
  full_name TEXT,
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  notifications_seen_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);
-- Contractors are publicly viewable for homeowners to see bidder info
CREATE POLICY "profiles_select_contractors" ON public.profiles FOR SELECT USING (user_type = 'contractor');

-- CONTRACTOR PROFILES (extra contractor-specific fields)
CREATE TABLE IF NOT EXISTS public.contractor_profiles (
  id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  business_name TEXT,
  license_number TEXT,
  years_experience INT,
  bio TEXT,
  service_area TEXT,
  specialties TEXT[],
  google_rating NUMERIC(3,1),
  review_count INT DEFAULT 0,
  is_verified BOOLEAN DEFAULT FALSE,
  is_approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.contractor_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "contractor_profiles_select_all" ON public.contractor_profiles FOR SELECT USING (TRUE);
CREATE POLICY "contractor_profiles_insert_own" ON public.contractor_profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "contractor_profiles_update_own" ON public.contractor_profiles FOR UPDATE USING (auth.uid() = id);

-- JOBS
CREATE TABLE IF NOT EXISTS public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  homeowner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  location TEXT NOT NULL,
  zip_code TEXT,
  budget_min INT,
  budget_max INT,
  urgency TEXT CHECK (urgency IN ('flexible', 'within_week', 'within_month', 'asap')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'completed', 'cancelled')),
  images TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
-- Anyone authenticated can view open jobs
CREATE POLICY "jobs_select_open" ON public.jobs FOR SELECT USING (status = 'open' OR auth.uid() = homeowner_id);
-- Only homeowner can insert their own jobs
CREATE POLICY "jobs_insert_own" ON public.jobs FOR INSERT WITH CHECK (auth.uid() = homeowner_id);
-- Only homeowner can update their own jobs
CREATE POLICY "jobs_update_own" ON public.jobs FOR UPDATE USING (auth.uid() = homeowner_id);
CREATE POLICY "jobs_delete_own" ON public.jobs FOR DELETE USING (auth.uid() = homeowner_id);

-- BIDS
CREATE TABLE IF NOT EXISTS public.bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  contractor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount INT NOT NULL, -- in cents
  message TEXT NOT NULL,
  timeline TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'withdrawn')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(job_id, contractor_id)
);

ALTER TABLE public.bids ENABLE ROW LEVEL SECURITY;
-- Homeowner can see bids on their jobs
CREATE POLICY "bids_select_homeowner" ON public.bids FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.jobs WHERE jobs.id = bids.job_id AND jobs.homeowner_id = auth.uid())
);
-- Contractor can see their own bids
CREATE POLICY "bids_select_contractor" ON public.bids FOR SELECT USING (auth.uid() = contractor_id);
-- Contractor can insert bids
CREATE POLICY "bids_insert_contractor" ON public.bids FOR INSERT WITH CHECK (auth.uid() = contractor_id);
-- Contractor can update/withdraw their own bid; homeowner can accept/decline
CREATE POLICY "bids_update_contractor" ON public.bids FOR UPDATE USING (auth.uid() = contractor_id);
CREATE POLICY "bids_update_homeowner" ON public.bids FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.jobs WHERE jobs.id = bids.job_id AND jobs.homeowner_id = auth.uid())
);

-- MESSAGES
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "messages_select_own" ON public.messages FOR SELECT USING (
  auth.uid() = sender_id OR auth.uid() = recipient_id
);
CREATE POLICY "messages_insert_own" ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "messages_update_own" ON public.messages FOR UPDATE USING (auth.uid() = recipient_id);

-- SUBSCRIPTIONS
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  plan_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'trialing' CHECK (status IN ('trialing', 'active', 'past_due', 'cancelled')),
  trial_ends_at TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "subscriptions_select_own" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "subscriptions_insert_own" ON public.subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "subscriptions_update_own" ON public.subscriptions FOR UPDATE USING (auth.uid() = user_id);

-- PROPOSALS (hosted proposals generated by the Bid Builder)
CREATE TABLE IF NOT EXISTS public.proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  share_token TEXT NOT NULL UNIQUE,
  contractor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  contractor_company_name TEXT,
  contractor_phone TEXT,
  contractor_logo_url TEXT,
  homeowner_name TEXT,
  homeowner_phone TEXT,
  project_title TEXT NOT NULL,
  project_summary TEXT,
  scope_items JSONB DEFAULT '[]'::jsonb,
  total_price INT,
  price_note TEXT,
  add_ons JSONB DEFAULT '[]'::jsonb,
  timeline_start TEXT,
  timeline_completion TEXT,
  notes TEXT,
  photos JSONB DEFAULT '[]'::jsonb,
  pdf_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'viewed', 'question_asked', 'approval_clicked', 'accepted', 'changes_requested')),
  first_viewed_at TIMESTAMPTZ,
  last_viewed_at TIMESTAMPTZ,
  view_count INT DEFAULT 0,
  approval_clicked_at TIMESTAMPTZ,
  question_clicked_at TIMESTAMPTZ,
  call_clicked_at TIMESTAMPTZ,
  pdf_downloaded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "proposals_select_own" ON public.proposals FOR SELECT USING (auth.uid() = contractor_id);
CREATE POLICY "proposals_insert_own" ON public.proposals FOR INSERT WITH CHECK (auth.uid() = contractor_id);
CREATE POLICY "proposals_update_own" ON public.proposals FOR UPDATE USING (auth.uid() = contractor_id);

-- AUTO-CREATE PROFILE TRIGGER
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, user_type, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'homeowner'),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- UPDATED_AT TRIGGER
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER jobs_updated_at BEFORE UPDATE ON public.jobs FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER bids_updated_at BEFORE UPDATE ON public.bids FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER proposals_updated_at BEFORE UPDATE ON public.proposals FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
