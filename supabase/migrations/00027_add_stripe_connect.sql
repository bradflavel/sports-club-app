-- Migration: Add Stripe Connect fields to organisations
--
-- Each organisation connects their own Stripe account via Stripe Connect.
-- The stripe_account_id is the connected account ID (e.g. acct_1Nv0FGQ...)
-- which is NOT a secret — it cannot be used to move money without the
-- platform's API key.

ALTER TABLE organisations
  ADD COLUMN IF NOT EXISTS stripe_account_id text,
  ADD COLUMN IF NOT EXISTS stripe_onboarding_complete boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN organisations.stripe_account_id IS 'Stripe Connect account ID (e.g. acct_xxx). Not a secret.';
COMMENT ON COLUMN organisations.stripe_onboarding_complete IS 'Whether the connected Stripe account has completed onboarding and can accept charges.';
