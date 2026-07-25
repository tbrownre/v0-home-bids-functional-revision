-- ============================================================
-- Contractor Landing Pages (public estimate pages)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.contractor_landing_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id UUID NOT NULL REFERENCES public.contractor_profiles(id) ON DELETE CASCADE,
  slug TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'paused', 'published')),
  config JSONB NOT NULL DEFAULT '{"brand":{},"copy":{},"trust":{},"cta":{},"meta":{}}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.contractor_landing_pages ENABLE ROW LEVEL SECURITY;
-- Anyone can view published pages
CREATE POLICY "landing_pages_select_published" ON public.contractor_landing_pages FOR SELECT USING (status = 'published');
-- Contractor can view/manage their own pages
CREATE POLICY "landing_pages_select_own" ON public.contractor_landing_pages FOR SELECT USING (auth.uid() = contractor_id);
CREATE POLICY "landing_pages_insert_own" ON public.contractor_landing_pages FOR INSERT WITH CHECK (auth.uid() = contractor_id);
CREATE POLICY "landing_pages_update_own" ON public.contractor_landing_pages FOR UPDATE USING (auth.uid() = contractor_id);
CREATE POLICY "landing_pages_delete_own" ON public.contractor_landing_pages FOR DELETE USING (auth.uid() = contractor_id);
