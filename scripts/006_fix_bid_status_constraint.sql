-- Migration 006: Fix bids.status constraint and add missing updated_at columns
-- The original constraint only allowed 'pending','accepted','declined','withdrawn'
-- but the application writes 'rejected' when a homeowner selects another bid.
-- We expand the constraint to include both 'rejected' and 'declined' so both
-- code paths work without a DB error.

-- 1. Fix bids status constraint
ALTER TABLE bids DROP CONSTRAINT IF EXISTS bids_status_check;
ALTER TABLE bids ADD CONSTRAINT bids_status_check
  CHECK (status IN ('pending', 'accepted', 'rejected', 'declined', 'withdrawn'));

-- 2. Add updated_at to messages (was missing, inconsistent with other tables)
ALTER TABLE messages ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS messages_updated_at ON messages;
CREATE TRIGGER messages_updated_at
  BEFORE UPDATE ON messages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 3. Add updated_at to subscriptions (needed by webhook handler to record last update)
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

DROP TRIGGER IF EXISTS subscriptions_updated_at ON subscriptions;
CREATE TRIGGER subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 4. Add stripe_customer_id to subscriptions so webhook can look up by customer
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
CREATE INDEX IF NOT EXISTS subscriptions_stripe_customer_id_idx ON subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS subscriptions_stripe_subscription_id_idx ON subscriptions(stripe_subscription_id);
