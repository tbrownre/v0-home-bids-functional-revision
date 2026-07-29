-- Add job_ref column to jobs table
-- job_ref is a short, human-friendly job reference like "HB-1234" for SMS and sharing

ALTER TABLE public.jobs 
ADD COLUMN IF NOT EXISTS job_ref TEXT UNIQUE;

-- Generate job_ref for existing rows (HB-{id first 8 chars})
UPDATE public.jobs 
SET job_ref = 'HB-' || SUBSTRING(id::TEXT FROM 1 FOR 8)
WHERE job_ref IS NULL;

-- Create function to auto-generate job_ref on insert
CREATE OR REPLACE FUNCTION generate_job_ref()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.job_ref IS NULL THEN
    NEW.job_ref := 'HB-' || SUBSTRING(NEW.id::TEXT FROM 1 FOR 8);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate job_ref
DROP TRIGGER IF EXISTS set_job_ref ON public.jobs;
CREATE TRIGGER set_job_ref
  BEFORE INSERT ON public.jobs
  FOR EACH ROW
  EXECUTE FUNCTION generate_job_ref();
