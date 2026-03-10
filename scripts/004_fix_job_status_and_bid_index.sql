-- Migration: Fix job status constraint and add contractor_id index on bids
-- Root cause: jobs.status CHECK constraint was missing 'contractor_selected'
-- which the app code uses after a bid is accepted. Also adds an index on
-- bids.contractor_id to speed up the contractor_profiles enrichment lookup.

-- 1. Drop the old status constraint and replace it with one that includes
--    'contractor_selected' (used when homeowner accepts a bid before work starts).
ALTER TABLE public.jobs
  DROP CONSTRAINT IF EXISTS jobs_status_check;

ALTER TABLE public.jobs
  ADD CONSTRAINT jobs_status_check
  CHECK (status IN ('open', 'contractor_selected', 'in_progress', 'completed', 'cancelled'));

-- 2. Add index on bids.contractor_id to speed up the two-step enrichment query
--    in getJobBids (select contractor_profiles IN contractorIds).
CREATE INDEX IF NOT EXISTS bids_contractor_id_idx ON public.bids (contractor_id);

-- 3. Add index on bids.job_id to speed up per-job bid fetches.
CREATE INDEX IF NOT EXISTS bids_job_id_idx ON public.bids (job_id);
