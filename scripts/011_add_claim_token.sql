-- Add claim_token and claimed_at to profiles for homeowner account claiming

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS claim_token TEXT UNIQUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMPTZ;

-- Index on claim_token for fast lookups
CREATE INDEX IF NOT EXISTS idx_profiles_claim_token ON public.profiles(claim_token) WHERE claim_token IS NOT NULL;
