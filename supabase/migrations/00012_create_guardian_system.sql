-- Migration: 00012_create_guardian_system.sql
-- Introduces the guardian/minor system: links adult guardians to junior members,
-- enforces scoped access via RLS, and restricts what guardians may update.

-- ── New enum ─────────────────────────────────────────────────────────────────

CREATE TYPE guardian_relationship AS ENUM (
  'parent',
  'grandparent',
  'legal_guardian',
  'other'
);

-- ── member_guardians table ───────────────────────────────────────────────────

CREATE TABLE member_guardians (
  id                     uuid                 PRIMARY KEY DEFAULT gen_random_uuid(),
  guardian_member_id     uuid                 NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  minor_member_id        uuid                 NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  relationship           guardian_relationship NOT NULL DEFAULT 'parent',
  is_primary             boolean              NOT NULL DEFAULT false,
  parental_consent_given boolean              NOT NULL DEFAULT false,
  consent_date           timestamptz,
  created_at             timestamptz          DEFAULT now(),
  updated_at             timestamptz          DEFAULT now(),

  CONSTRAINT member_guardians_unique UNIQUE (guardian_member_id, minor_member_id),
  CONSTRAINT member_guardians_no_self CHECK (guardian_member_id != minor_member_id)
);

CREATE TRIGGER member_guardians_updated_at
  BEFORE UPDATE ON member_guardians
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── Helper functions ─────────────────────────────────────────────────────────

-- Returns all minor member IDs for which the current user is a guardian.
CREATE OR REPLACE FUNCTION guardian_minor_ids()
RETURNS SETOF uuid AS $$
  SELECT mg.minor_member_id
  FROM member_guardians mg
  JOIN members m ON m.id = mg.guardian_member_id
  WHERE m.profile_id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- True when the current user is a guardian of the given member.
CREATE OR REPLACE FUNCTION is_guardian_of(target_member_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1
    FROM member_guardians mg
    JOIN members m ON m.id = mg.guardian_member_id
    WHERE mg.minor_member_id = target_member_id
      AND m.profile_id = auth.uid()
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ── RLS on member_guardians ──────────────────────────────────────────────────

ALTER TABLE member_guardians ENABLE ROW LEVEL SECURITY;

-- Admins/managers may perform all operations on guardian links within their org.
CREATE POLICY "member_guardians_select_admin"
  ON member_guardians FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM members m
      WHERE m.id = member_guardians.guardian_member_id
        AND is_admin_or_manager(m.organisation_id)
    )
  );

CREATE POLICY "member_guardians_insert_admin"
  ON member_guardians FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM members m
      WHERE m.id = member_guardians.guardian_member_id
        AND is_admin_or_manager(m.organisation_id)
    )
  );

CREATE POLICY "member_guardians_update_admin"
  ON member_guardians FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM members m
      WHERE m.id = member_guardians.guardian_member_id
        AND is_admin_or_manager(m.organisation_id)
    )
  );

CREATE POLICY "member_guardians_delete_admin"
  ON member_guardians FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM members m
      WHERE m.id = member_guardians.guardian_member_id
        AND is_admin_or_manager(m.organisation_id)
    )
  );

-- Guardians may read their own guardian links.
CREATE POLICY "member_guardians_select_own"
  ON member_guardians FOR SELECT
  USING (
    guardian_member_id IN (
      SELECT m.id FROM members m WHERE m.profile_id = auth.uid()
    )
  );

-- ── Guardian RLS on existing tables ──────────────────────────────────────────

-- Guardians may view their dependents' payments (read-only).
CREATE POLICY "payments_select_guardian"
  ON payments FOR SELECT
  USING (
    organisation_id = auth_org_id()
    AND member_id IN (SELECT guardian_minor_ids())
  );

-- ── Indexes ──────────────────────────────────────────────────────────────────

CREATE INDEX idx_member_guardians_guardian
  ON member_guardians (guardian_member_id);

CREATE INDEX idx_member_guardians_minor
  ON member_guardians (minor_member_id);
