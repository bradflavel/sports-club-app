-- Migration: 00015_dynamic_membership_types.sql
-- Replaces the hardcoded membership_type enum with a dynamic per-org membership_types table.
-- Separates age group (minor/adult from DOB) from membership tier.
-- Absorbs membership_fee_schedule into membership_types.
-- Adds state column to organisations.

-- ── Add state to organisations ───────────────────────────────────────────────

ALTER TABLE organisations ADD COLUMN state text;

-- ── Create membership_types table ────────────────────────────────────────────

CREATE TABLE membership_types (
  id                     uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id        uuid        NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  name                   text        NOT NULL,
  description            text,
  fee_cents              integer,
  has_expiry             boolean     NOT NULL DEFAULT true,
  default_duration_months integer,
  auto_renewal           boolean     NOT NULL DEFAULT false,
  grace_period_days      integer     NOT NULL DEFAULT 0,
  is_active              boolean     NOT NULL DEFAULT true,
  display_order          integer     NOT NULL DEFAULT 0,
  created_at             timestamptz DEFAULT now(),
  updated_at             timestamptz DEFAULT now()
);

CREATE TRIGGER membership_types_updated_at
  BEFORE UPDATE ON membership_types
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── RLS ──────────────────────────────────────────────────────────────────────

ALTER TABLE membership_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "membership_types_select_same_org"
  ON membership_types FOR SELECT
  USING (organisation_id = auth_org_id());

CREATE POLICY "membership_types_insert_admin"
  ON membership_types FOR INSERT
  WITH CHECK (is_admin_or_manager(organisation_id));

CREATE POLICY "membership_types_update_admin"
  ON membership_types FOR UPDATE
  USING (is_admin_or_manager(organisation_id));

CREATE POLICY "membership_types_delete_admin"
  ON membership_types FOR DELETE
  USING (is_admin_or_manager(organisation_id));

-- ── Indexes ──────────────────────────────────────────────────────────────────

CREATE INDEX idx_membership_types_org ON membership_types (organisation_id);
CREATE INDEX idx_membership_types_active ON membership_types (organisation_id) WHERE is_active = true;

-- ── Add membership_type_id to members ────────────────────────────────────────

ALTER TABLE members ADD COLUMN membership_type_id uuid REFERENCES membership_types(id) ON DELETE SET NULL;

CREATE INDEX idx_members_membership_type_id ON members (membership_type_id);

-- ── Data migration ───────────────────────────────────────────────────────────

-- For each org, create default membership_types from the enum values
-- and migrate fees from membership_fee_schedule if they exist.

DO $$
DECLARE
  org RECORD;
  type_name TEXT;
  type_order INT;
  new_type_id UUID;
  fee_amount INT;
  enum_values TEXT[] := ARRAY['Senior', 'Junior', 'Social', 'Life', 'Volunteer'];
  enum_db_values TEXT[] := ARRAY['senior', 'junior', 'social', 'life', 'volunteer'];
  has_expiry_val BOOLEAN;
  duration_val INT;
BEGIN
  FOR org IN SELECT id FROM organisations LOOP
    FOR i IN 1..array_length(enum_values, 1) LOOP
      type_name := enum_values[i];
      type_order := i - 1;

      -- Check for existing fee
      SELECT amount_cents INTO fee_amount
      FROM membership_fee_schedule
      WHERE organisation_id = org.id
        AND membership_type = enum_db_values[i]::membership_type;

      -- Life members don't expire by default
      IF enum_db_values[i] = 'life' THEN
        has_expiry_val := false;
        duration_val := NULL;
      ELSE
        has_expiry_val := true;
        duration_val := 12;
      END IF;

      INSERT INTO membership_types (organisation_id, name, fee_cents, has_expiry, default_duration_months, display_order)
      VALUES (org.id, type_name, COALESCE(fee_amount, 0), has_expiry_val, duration_val, type_order)
      RETURNING id INTO new_type_id;

      -- Update members with this type
      UPDATE members
      SET membership_type_id = new_type_id
      WHERE organisation_id = org.id
        AND membership_type = enum_db_values[i]::membership_type;
    END LOOP;
  END LOOP;
END $$;

-- ── Drop membership_fee_schedule (absorbed into membership_types) ────────────

DROP TABLE IF EXISTS membership_fee_schedule;
