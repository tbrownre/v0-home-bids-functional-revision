-- Add Founding Contractor fields to contractor_profiles
ALTER TABLE public.contractor_profiles
ADD COLUMN IF NOT EXISTS is_founding_contractor BOOLEAN DEFAULT FALSE;

ALTER TABLE public.contractor_profiles
ADD COLUMN IF NOT EXISTS founding_timestamp TIMESTAMPTZ;

-- Create index for faster queries filtering by founding contractors
CREATE INDEX IF NOT EXISTS idx_contractor_profiles_founding 
ON public.contractor_profiles(is_founding_contractor) 
WHERE is_founding_contractor = TRUE;
