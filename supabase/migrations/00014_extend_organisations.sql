-- Migration: 00014_extend_organisations.sql
-- Extends the organisations table with business, financial, legal, and social fields.
-- Adds club_venues and membership_fee_schedule tables.

-- ── Extend organisations ─────────────────────────────────────────────────────

ALTER TABLE organisations
  ADD COLUMN abn                       text,
  ADD COLUMN abn_entity_name           text,
  ADD COLUMN timezone                  text DEFAULT 'Australia/Sydney',
  ADD COLUMN affiliated_body           text,
  ADD COLUMN affiliation_number        text,
  ADD COLUMN insurance_provider        text,
  ADD COLUMN insurance_policy_number   text,
  ADD COLUMN default_payment_terms_days integer DEFAULT 14,
  ADD COLUMN late_fee_cents            integer,
  ADD COLUMN bank_name                 text,
  ADD COLUMN bank_bsb                  text,
  ADD COLUMN bank_account_number       text,
  ADD COLUMN bank_account_name         text,
  ADD COLUMN is_gst_registered         boolean DEFAULT false,
  ADD COLUMN minimum_age               integer,
  ADD COLUMN registration_open         boolean DEFAULT true,
  ADD COLUMN privacy_policy_url        text,
  ADD COLUMN terms_conditions_url      text,
  ADD COLUMN code_of_conduct_url       text,
  ADD COLUMN child_safety_policy_url   text,
  ADD COLUMN registration_consent_text text,
  ADD COLUMN facebook_url              text,
  ADD COLUMN instagram_url             text,
  ADD COLUMN youtube_url               text,
  ADD COLUMN tiktok_url                text,
  ADD COLUMN details_reviewed_at       timestamptz;

-- ── club_venues ──────────────────────────────────────────────────────────────

CREATE TABLE club_venues (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id uuid        NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  name            text        NOT NULL,
  address         text,
  is_primary      boolean     NOT NULL DEFAULT false,
  notes           text,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

CREATE TRIGGER club_venues_updated_at
  BEFORE UPDATE ON club_venues
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Ensure only one primary venue per org
CREATE UNIQUE INDEX idx_club_venues_primary
  ON club_venues (organisation_id) WHERE is_primary = true;

-- ── membership_fee_schedule ──────────────────────────────────────────────────

CREATE TABLE membership_fee_schedule (
  id              uuid            PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id uuid            NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  membership_type membership_type NOT NULL,
  amount_cents    integer         NOT NULL,
  label           text,
  created_at      timestamptz     DEFAULT now(),
  updated_at      timestamptz     DEFAULT now()
);

CREATE TRIGGER fee_schedule_updated_at
  BEFORE UPDATE ON membership_fee_schedule
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE membership_fee_schedule
  ADD CONSTRAINT fee_schedule_unique UNIQUE (organisation_id, membership_type);

-- ── RLS ──────────────────────────────────────────────────────────────────────

ALTER TABLE club_venues             ENABLE ROW LEVEL SECURITY;
ALTER TABLE membership_fee_schedule ENABLE ROW LEVEL SECURITY;

-- club_venues
CREATE POLICY "club_venues_select_same_org"
  ON club_venues FOR SELECT
  USING (organisation_id = auth_org_id());

CREATE POLICY "club_venues_insert_admin"
  ON club_venues FOR INSERT
  WITH CHECK (is_admin_or_manager(organisation_id));

CREATE POLICY "club_venues_update_admin"
  ON club_venues FOR UPDATE
  USING (is_admin_or_manager(organisation_id));

CREATE POLICY "club_venues_delete_admin"
  ON club_venues FOR DELETE
  USING (is_admin_or_manager(organisation_id));

-- membership_fee_schedule
CREATE POLICY "fee_schedule_select_same_org"
  ON membership_fee_schedule FOR SELECT
  USING (organisation_id = auth_org_id());

CREATE POLICY "fee_schedule_insert_admin"
  ON membership_fee_schedule FOR INSERT
  WITH CHECK (is_admin_or_manager(organisation_id));

CREATE POLICY "fee_schedule_update_admin"
  ON membership_fee_schedule FOR UPDATE
  USING (is_admin_or_manager(organisation_id));

CREATE POLICY "fee_schedule_delete_admin"
  ON membership_fee_schedule FOR DELETE
  USING (is_admin_or_manager(organisation_id));

-- ── Indexes ──────────────────────────────────────────────────────────────────

CREATE INDEX idx_club_venues_org ON club_venues (organisation_id);
CREATE INDEX idx_fee_schedule_org ON membership_fee_schedule (organisation_id);
