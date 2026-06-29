-- Migration 010: Extend bids table with full structured fields for the
-- Bid Builder → homeowner bid detail pipeline.
--
-- Run this once against your Supabase project:
--   psql $DATABASE_URL -f scripts/010_extend_bids.sql
-- or paste into the Supabase SQL editor.
--
-- All columns use ADD COLUMN IF NOT EXISTS so this is safe to re-run.

-- ── Scope & work ──────────────────────────────────────────────────────────────
ALTER TABLE public.bids ADD COLUMN IF NOT EXISTS scope_of_work         TEXT;
ALTER TABLE public.bids ADD COLUMN IF NOT EXISTS materials_included    TEXT;
ALTER TABLE public.bids ADD COLUMN IF NOT EXISTS labor_included        BOOLEAN DEFAULT TRUE;
ALTER TABLE public.bids ADD COLUMN IF NOT EXISTS permits_included      BOOLEAN;
ALTER TABLE public.bids ADD COLUMN IF NOT EXISTS cleanup_included      BOOLEAN;
ALTER TABLE public.bids ADD COLUMN IF NOT EXISTS warranty_note         TEXT;
ALTER TABLE public.bids ADD COLUMN IF NOT EXISTS exclusions            TEXT;
ALTER TABLE public.bids ADD COLUMN IF NOT EXISTS change_order_note     TEXT;
ALTER TABLE public.bids ADD COLUMN IF NOT EXISTS optional_upgrades     TEXT;

-- ── Pricing ───────────────────────────────────────────────────────────────────
-- amount (INT cents) already exists; add structured price fields
ALTER TABLE public.bids ADD COLUMN IF NOT EXISTS price_type            TEXT  -- 'fixed' | 'estimated' | 'inspection_dependent'
  CHECK (price_type IS NULL OR price_type IN ('fixed', 'estimated', 'inspection_dependent'));
ALTER TABLE public.bids ADD COLUMN IF NOT EXISTS price_includes        TEXT;
ALTER TABLE public.bids ADD COLUMN IF NOT EXISTS price_excludes        TEXT;

-- ── Timeline ──────────────────────────────────────────────────────────────────
-- timeline (TEXT) already exists; add numeric range
ALTER TABLE public.bids ADD COLUMN IF NOT EXISTS timeline_business_days_min  INT;
ALTER TABLE public.bids ADD COLUMN IF NOT EXISTS timeline_business_days_max  INT;
ALTER TABLE public.bids ADD COLUMN IF NOT EXISTS timeline_depends_on         TEXT;  -- 'inspection' | 'materials' | 'permits' | 'weather' | 'homeowner_approval'

-- ── Inspection ────────────────────────────────────────────────────────────────
ALTER TABLE public.bids ADD COLUMN IF NOT EXISTS inspection_required               BOOLEAN DEFAULT FALSE;
ALTER TABLE public.bids ADD COLUMN IF NOT EXISTS inspection_is_free                BOOLEAN DEFAULT TRUE;
ALTER TABLE public.bids ADD COLUMN IF NOT EXISTS inspection_fee_cents              INT;     -- 0 = free
ALTER TABLE public.bids ADD COLUMN IF NOT EXISTS inspection_fee_deducted_if_accepted BOOLEAN DEFAULT FALSE;
ALTER TABLE public.bids ADD COLUMN IF NOT EXISTS inspection_note                   TEXT;

-- ── Deposit / payment ─────────────────────────────────────────────────────────
ALTER TABLE public.bids ADD COLUMN IF NOT EXISTS deposit_required        BOOLEAN DEFAULT FALSE;
ALTER TABLE public.bids ADD COLUMN IF NOT EXISTS deposit_amount_cents    INT;
ALTER TABLE public.bids ADD COLUMN IF NOT EXISTS deposit_percentage      NUMERIC(5,2);  -- e.g. 25.00
ALTER TABLE public.bids ADD COLUMN IF NOT EXISTS deposit_refundable      BOOLEAN DEFAULT FALSE;
ALTER TABLE public.bids ADD COLUMN IF NOT EXISTS deposit_note            TEXT;
ALTER TABLE public.bids ADD COLUMN IF NOT EXISTS balance_due_note        TEXT;          -- e.g. 'on completion'
ALTER TABLE public.bids ADD COLUMN IF NOT EXISTS payment_methods         TEXT[];        -- e.g. {'check','zelle','credit_card'}
ALTER TABLE public.bids ADD COLUMN IF NOT EXISTS financing_available     BOOLEAN DEFAULT FALSE;
ALTER TABLE public.bids ADD COLUMN IF NOT EXISTS financing_note          TEXT;

-- ── Contractor message ────────────────────────────────────────────────────────
ALTER TABLE public.bids ADD COLUMN IF NOT EXISTS contractor_message      TEXT;  -- homeowner-facing pitch

-- ── Contractor contact (denormalised for quick display) ────────────────────────
-- Primary source of truth stays in contractor_profiles; these columns cache
-- the values at bid-submission time so the homeowner sees consistent data.
ALTER TABLE public.bids ADD COLUMN IF NOT EXISTS contractor_city         TEXT;
ALTER TABLE public.bids ADD COLUMN IF NOT EXISTS contractor_phone        TEXT;
ALTER TABLE public.bids ADD COLUMN IF NOT EXISTS contractor_email        TEXT;
ALTER TABLE public.bids ADD COLUMN IF NOT EXISTS contractor_website      TEXT;
ALTER TABLE public.bids ADD COLUMN IF NOT EXISTS contractor_response_time TEXT;
ALTER TABLE public.bids ADD COLUMN IF NOT EXISTS contractor_logo_url     TEXT;
ALTER TABLE public.bids ADD COLUMN IF NOT EXISTS contractor_name         TEXT;  -- business display name

-- ── Completeness flag (internal) ─────────────────────────────────────────────
ALTER TABLE public.bids ADD COLUMN IF NOT EXISTS completeness_status TEXT DEFAULT 'incomplete'
  CHECK (completeness_status IN (
    'complete',
    'needs_price',
    'needs_timeline',
    'needs_scope',
    'needs_inspection_deposit',
    'needs_contact',
    'incomplete'
  ));

-- ── Add homeowner_question column for the proposal page ──────────────────────
-- Previously saved homeowner questions had no persistence column.
ALTER TABLE public.bids ADD COLUMN IF NOT EXISTS homeowner_question     TEXT;

-- Index on completeness for admin queries
CREATE INDEX IF NOT EXISTS bids_completeness_idx ON public.bids (completeness_status);
CREATE INDEX IF NOT EXISTS bids_job_id_status_idx ON public.bids (job_id, status);
