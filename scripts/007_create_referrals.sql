-- Migration 007: Create referrals table for affiliate tracking
-- Tracks referral links clicked and attributed sign-ups / subscriptions.

CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  referred_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  referral_code TEXT NOT NULL,
  referral_type TEXT NOT NULL DEFAULT 'contractor'
    CHECK (referral_type IN ('contractor', 'homeowner')),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'converted', 'paid', 'expired')),
  commission_amount INTEGER DEFAULT 0, -- in cents
  converted_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS referrals_referrer_id_idx ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS referrals_referral_code_idx ON referrals(referral_code);
CREATE UNIQUE INDEX IF NOT EXISTS referrals_code_unique ON referrals(referral_code);

DROP TRIGGER IF EXISTS referrals_updated_at ON referrals;
CREATE TRIGGER referrals_updated_at
  BEFORE UPDATE ON referrals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- Referrers can see their own referrals
CREATE POLICY "referrals_select_own"
  ON referrals FOR SELECT
  USING (auth.uid() = referrer_id);

-- Only service role can insert/update (done via webhook or admin action)
CREATE POLICY "referrals_insert_service"
  ON referrals FOR INSERT
  WITH CHECK (auth.uid() = referrer_id);
