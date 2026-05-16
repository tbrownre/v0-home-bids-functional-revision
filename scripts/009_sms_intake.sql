-- 009_sms_intake.sql
-- Add SMS intake columns to support text-first job creation

-- jobs: track how a job was created and its intake progress
ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS intake_source TEXT DEFAULT 'form'
    CHECK (intake_source IN ('form', 'sms', 'web'));

ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS intake_status TEXT DEFAULT 'complete'
    CHECK (intake_status IN ('in_progress', 'complete'));

ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS phone_number TEXT;

-- messages: distinguish SMS vs platform messages
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS channel TEXT DEFAULT 'platform'
    CHECK (channel IN ('platform', 'sms'));
