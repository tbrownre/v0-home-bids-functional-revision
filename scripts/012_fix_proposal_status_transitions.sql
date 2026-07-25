-- Fix proposal status transitions to prevent approval overwrites
-- When homeowner takes an action, stamp the timestamp but only update status if NOT already approved

-- Create or replace the log_proposal_view RPC if needed
CREATE OR REPLACE FUNCTION public.log_proposal_view(
  p_token TEXT,
  p_user_agent TEXT DEFAULT NULL,
  p_referrer TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE proposals
  SET 
    first_viewed_at = COALESCE(first_viewed_at, NOW()),
    last_viewed_at = NOW(),
    view_count = view_count + 1,
    status = CASE 
      WHEN status = 'draft' THEN 'viewed'
      ELSE status
    END
  WHERE share_token = p_token;
END;
$$;

-- Create or replace the log_proposal_action RPC with one-way approval transitions
-- When any homeowner action fires:
-- 1. Always stamp the action's timestamp (approval_clicked_at, question_clicked_at, call_clicked_at)
-- 2. Only update status if NOT already approved
-- 3. Approve always wins (can set approval_clicked unless terminal status exists)
CREATE OR REPLACE FUNCTION public.log_proposal_action(
  p_token TEXT,
  p_event_type TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_proposal_id UUID;
  v_current_status TEXT;
  v_approval_clicked_at TIMESTAMPTZ;
BEGIN
  -- Get current proposal state
  SELECT id, status, approval_clicked_at 
  INTO v_proposal_id, v_current_status, v_approval_clicked_at
  FROM proposals
  WHERE share_token = p_token
  LIMIT 1;
  
  IF v_proposal_id IS NULL THEN
    RETURN;
  END IF;

  -- Determine new status and timestamp updates based on event type
  CASE p_event_type
    WHEN 'accepted_clicked' THEN
      -- Approval always wins (unless already in terminal status - but we don't have terminal statuses currently)
      UPDATE proposals
      SET 
        approval_clicked_at = NOW(),
        status = 'approval_clicked',
        updated_at = NOW()
      WHERE id = v_proposal_id;

    WHEN 'question_clicked' THEN
      -- Only update status if NOT already approved
      UPDATE proposals
      SET 
        question_clicked_at = NOW(),
        status = CASE 
          WHEN approval_clicked_at IS NULL AND status != 'approval_clicked' THEN 'question_asked'
          ELSE status
        END,
        updated_at = NOW()
      WHERE id = v_proposal_id;

    WHEN 'call_clicked' THEN
      -- Only update status if NOT already approved
      UPDATE proposals
      SET 
        call_clicked_at = NOW(),
        status = CASE 
          WHEN approval_clicked_at IS NULL AND status != 'approval_clicked' THEN 'question_asked'
          ELSE status
        END,
        updated_at = NOW()
      WHERE id = v_proposal_id;

    WHEN 'pdf_downloaded' THEN
      -- Just stamp the timestamp, don't change status
      UPDATE proposals
      SET 
        pdf_downloaded_at = NOW(),
        updated_at = NOW()
      WHERE id = v_proposal_id;
  END CASE;
END;
$$;

-- Create or replace the get_proposal_by_share_token RPC if needed
CREATE OR REPLACE FUNCTION public.get_proposal_by_share_token(p_token TEXT)
RETURNS TABLE (
  id UUID,
  share_token TEXT,
  contractor_id UUID,
  contractor_company_name TEXT,
  contractor_phone TEXT,
  contractor_logo_url TEXT,
  homeowner_name TEXT,
  homeowner_phone TEXT,
  project_title TEXT,
  project_summary TEXT,
  scope_items JSONB,
  total_price INT,
  price_note TEXT,
  add_ons JSONB,
  timeline_start TEXT,
  timeline_completion TEXT,
  notes TEXT,
  photos JSONB,
  pdf_url TEXT,
  status TEXT,
  first_viewed_at TIMESTAMPTZ,
  last_viewed_at TIMESTAMPTZ,
  view_count INT,
  approval_clicked_at TIMESTAMPTZ,
  question_clicked_at TIMESTAMPTZ,
  call_clicked_at TIMESTAMPTZ,
  pdf_downloaded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT 
    id, share_token, contractor_id, contractor_company_name, contractor_phone,
    contractor_logo_url, homeowner_name, homeowner_phone, project_title,
    project_summary, scope_items, total_price, price_note, add_ons,
    timeline_start, timeline_completion, notes, photos, pdf_url, status,
    first_viewed_at, last_viewed_at, view_count, approval_clicked_at,
    question_clicked_at, call_clicked_at, pdf_downloaded_at, created_at, updated_at
  FROM proposals
  WHERE share_token = p_token;
$$;
