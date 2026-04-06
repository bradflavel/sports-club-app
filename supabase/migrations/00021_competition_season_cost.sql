-- Add season/registration cost fields to activities table
-- Supports: free, fixed amount, price range, or TBD

ALTER TABLE activities
  ADD COLUMN IF NOT EXISTS season_fee_type text DEFAULT 'tbd'
    CHECK (season_fee_type IN ('free', 'fixed', 'range', 'tbd')),
  ADD COLUMN IF NOT EXISTS season_fee_amount_cents integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS season_fee_min_cents integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS season_fee_max_cents integer DEFAULT 0;

COMMENT ON COLUMN activities.season_fee_type IS 'How the season/registration cost is specified: free, fixed, range, or tbd';
COMMENT ON COLUMN activities.season_fee_amount_cents IS 'Fixed season fee in cents (used when season_fee_type = fixed)';
COMMENT ON COLUMN activities.season_fee_min_cents IS 'Minimum season fee in cents (used when season_fee_type = range)';
COMMENT ON COLUMN activities.season_fee_max_cents IS 'Maximum season fee in cents (used when season_fee_type = range)';
