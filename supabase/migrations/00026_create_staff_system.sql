-- Migration: 00026_create_staff_system.sql
-- Creates the Staff management system: staff types, custom fields, accreditations,
-- invite tokens, and accreditation templates.

-- ── New enums ────────────────────────────────────────────────────────────────

CREATE TYPE staff_status AS ENUM ('active', 'inactive', 'on_leave', 'pending');

CREATE TYPE staff_field_type AS ENUM (
  'text', 'textarea', 'url', 'date', 'select', 'boolean', 'file', 'email', 'phone'
);

CREATE TYPE accreditation_status AS ENUM ('current', 'expired', 'pending', 'revoked');

-- ── staff_types ──────────────────────────────────────────────────────────────

CREATE TABLE staff_types (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id       uuid        NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  name                  text        NOT NULL,
  description           text,
  icon                  text,
  requires_wwc          boolean     NOT NULL DEFAULT false,
  is_publicly_visible   boolean     NOT NULL DEFAULT false,
  is_active             boolean     NOT NULL DEFAULT true,
  display_order         integer     NOT NULL DEFAULT 0,
  created_at            timestamptz DEFAULT now(),
  updated_at            timestamptz DEFAULT now()
);

CREATE TRIGGER staff_types_updated_at
  BEFORE UPDATE ON staff_types
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── staff_type_fields ────────────────────────────────────────────────────────

CREATE TABLE staff_type_fields (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_type_id     uuid        NOT NULL REFERENCES staff_types(id) ON DELETE CASCADE,
  organisation_id   uuid        NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  name              text        NOT NULL,
  field_type        staff_field_type NOT NULL DEFAULT 'text',
  is_required       boolean     NOT NULL DEFAULT false,
  options           jsonb,
  placeholder       text,
  display_order     integer     NOT NULL DEFAULT 0,
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
);

CREATE TRIGGER staff_type_fields_updated_at
  BEFORE UPDATE ON staff_type_fields
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── staff ────────────────────────────────────────────────────────────────────

CREATE TABLE staff (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id        uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  organisation_id   uuid        NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  staff_type_id     uuid        NOT NULL REFERENCES staff_types(id) ON DELETE RESTRICT,
  member_id         uuid        REFERENCES members(id) ON DELETE SET NULL,
  status            staff_status NOT NULL DEFAULT 'pending',
  position          text,
  start_date        date,
  end_date          date,
  notes             text,
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now(),
  UNIQUE(profile_id, organisation_id, staff_type_id)
);

CREATE TRIGGER staff_updated_at
  BEFORE UPDATE ON staff
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── staff_field_values ───────────────────────────────────────────────────────

CREATE TABLE staff_field_values (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id            uuid        NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  staff_type_field_id uuid        NOT NULL REFERENCES staff_type_fields(id) ON DELETE CASCADE,
  organisation_id     uuid        NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  value               text,
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now(),
  UNIQUE(staff_id, staff_type_field_id)
);

CREATE TRIGGER staff_field_values_updated_at
  BEFORE UPDATE ON staff_field_values
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── staff_accreditations ─────────────────────────────────────────────────────

CREATE TABLE staff_accreditations (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id          uuid        NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  organisation_id   uuid        NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  name              text        NOT NULL,
  issuing_body      text,
  credential_number text,
  issue_date        date,
  expiry_date       date,
  status            accreditation_status NOT NULL DEFAULT 'current',
  document_url      text,
  notes             text,
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
);

CREATE TRIGGER staff_accreditations_updated_at
  BEFORE UPDATE ON staff_accreditations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── staff_accreditation_templates ────────────────────────────────────────────

CREATE TABLE staff_accreditation_templates (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_type_id     uuid        NOT NULL REFERENCES staff_types(id) ON DELETE CASCADE,
  organisation_id   uuid        NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  name              text        NOT NULL,
  issuing_body      text,
  is_required       boolean     NOT NULL DEFAULT false,
  display_order     integer     NOT NULL DEFAULT 0,
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
);

CREATE TRIGGER staff_accreditation_templates_updated_at
  BEFORE UPDATE ON staff_accreditation_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── staff_invites ────────────────────────────────────────────────────────────

CREATE TABLE staff_invites (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id   uuid        NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  staff_type_id     uuid        NOT NULL REFERENCES staff_types(id) ON DELETE CASCADE,
  token             text        UNIQUE NOT NULL,
  email             text,
  created_by        uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  expires_at        timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  accepted_at       timestamptz,
  accepted_by       uuid        REFERENCES profiles(id),
  is_single_use     boolean     NOT NULL DEFAULT true,
  created_at        timestamptz DEFAULT now()
);

-- ── Indexes ──────────────────────────────────────────────────────────────────

CREATE INDEX idx_staff_types_org ON staff_types (organisation_id);
CREATE INDEX idx_staff_types_active ON staff_types (organisation_id) WHERE is_active = true;

CREATE INDEX idx_staff_type_fields_type ON staff_type_fields (staff_type_id);
CREATE INDEX idx_staff_type_fields_org ON staff_type_fields (organisation_id);

CREATE INDEX idx_staff_org ON staff (organisation_id);
CREATE INDEX idx_staff_profile ON staff (profile_id);
CREATE INDEX idx_staff_type ON staff (staff_type_id);
CREATE INDEX idx_staff_status ON staff (organisation_id, status);
CREATE INDEX idx_staff_member ON staff (member_id) WHERE member_id IS NOT NULL;

CREATE INDEX idx_staff_field_values_staff ON staff_field_values (staff_id);
CREATE INDEX idx_staff_field_values_org ON staff_field_values (organisation_id);

CREATE INDEX idx_staff_accreditations_staff ON staff_accreditations (staff_id);
CREATE INDEX idx_staff_accreditations_expiry ON staff_accreditations (expiry_date) WHERE expiry_date IS NOT NULL;
CREATE INDEX idx_staff_accreditations_org ON staff_accreditations (organisation_id);

CREATE INDEX idx_staff_accreditation_templates_type ON staff_accreditation_templates (staff_type_id);
CREATE INDEX idx_staff_accreditation_templates_org ON staff_accreditation_templates (organisation_id);

CREATE INDEX idx_staff_invites_token ON staff_invites (token);
CREATE INDEX idx_staff_invites_org ON staff_invites (organisation_id);

-- ── RLS ──────────────────────────────────────────────────────────────────────

ALTER TABLE staff_types                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_type_fields              ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff                          ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_field_values             ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_accreditations           ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_accreditation_templates  ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_invites                  ENABLE ROW LEVEL SECURITY;

-- staff_types: all org members read, admin/manager write
CREATE POLICY "staff_types_select_same_org"
  ON staff_types FOR SELECT
  USING (organisation_id = auth_org_id());

CREATE POLICY "staff_types_insert_admin"
  ON staff_types FOR INSERT
  WITH CHECK (is_admin_or_manager(organisation_id));

CREATE POLICY "staff_types_update_admin"
  ON staff_types FOR UPDATE
  USING (is_admin_or_manager(organisation_id));

CREATE POLICY "staff_types_delete_admin"
  ON staff_types FOR DELETE
  USING (is_admin_or_manager(organisation_id));

-- staff_type_fields: all org members read, admin/manager write
CREATE POLICY "staff_type_fields_select_same_org"
  ON staff_type_fields FOR SELECT
  USING (organisation_id = auth_org_id());

CREATE POLICY "staff_type_fields_insert_admin"
  ON staff_type_fields FOR INSERT
  WITH CHECK (is_admin_or_manager(organisation_id));

CREATE POLICY "staff_type_fields_update_admin"
  ON staff_type_fields FOR UPDATE
  USING (is_admin_or_manager(organisation_id));

CREATE POLICY "staff_type_fields_delete_admin"
  ON staff_type_fields FOR DELETE
  USING (is_admin_or_manager(organisation_id));

-- staff: all org members read, admin/manager full CRUD, staff can update own
CREATE POLICY "staff_select_same_org"
  ON staff FOR SELECT
  USING (organisation_id = auth_org_id());

CREATE POLICY "staff_insert_admin"
  ON staff FOR INSERT
  WITH CHECK (is_admin_or_manager(organisation_id));

CREATE POLICY "staff_update_admin"
  ON staff FOR UPDATE
  USING (is_admin_or_manager(organisation_id));

CREATE POLICY "staff_update_own"
  ON staff FOR UPDATE
  USING (profile_id = auth.uid() AND organisation_id = auth_org_id());

CREATE POLICY "staff_delete_admin"
  ON staff FOR DELETE
  USING (is_admin_or_manager(organisation_id));

-- staff_field_values: all org members read, admin/manager CRUD, staff update own
CREATE POLICY "staff_field_values_select_same_org"
  ON staff_field_values FOR SELECT
  USING (organisation_id = auth_org_id());

CREATE POLICY "staff_field_values_insert_admin"
  ON staff_field_values FOR INSERT
  WITH CHECK (is_admin_or_manager(organisation_id));

CREATE POLICY "staff_field_values_insert_own"
  ON staff_field_values FOR INSERT
  WITH CHECK (
    organisation_id = auth_org_id()
    AND EXISTS (
      SELECT 1 FROM staff s WHERE s.id = staff_field_values.staff_id AND s.profile_id = auth.uid()
    )
  );

CREATE POLICY "staff_field_values_update_admin"
  ON staff_field_values FOR UPDATE
  USING (is_admin_or_manager(organisation_id));

CREATE POLICY "staff_field_values_update_own"
  ON staff_field_values FOR UPDATE
  USING (
    organisation_id = auth_org_id()
    AND EXISTS (
      SELECT 1 FROM staff s WHERE s.id = staff_field_values.staff_id AND s.profile_id = auth.uid()
    )
  );

CREATE POLICY "staff_field_values_delete_admin"
  ON staff_field_values FOR DELETE
  USING (is_admin_or_manager(organisation_id));

-- staff_accreditations: all org members read, admin/manager CRUD, staff update own
CREATE POLICY "staff_accreditations_select_same_org"
  ON staff_accreditations FOR SELECT
  USING (organisation_id = auth_org_id());

CREATE POLICY "staff_accreditations_insert_admin"
  ON staff_accreditations FOR INSERT
  WITH CHECK (is_admin_or_manager(organisation_id));

CREATE POLICY "staff_accreditations_insert_own"
  ON staff_accreditations FOR INSERT
  WITH CHECK (
    organisation_id = auth_org_id()
    AND EXISTS (
      SELECT 1 FROM staff s WHERE s.id = staff_accreditations.staff_id AND s.profile_id = auth.uid()
    )
  );

CREATE POLICY "staff_accreditations_update_admin"
  ON staff_accreditations FOR UPDATE
  USING (is_admin_or_manager(organisation_id));

CREATE POLICY "staff_accreditations_update_own"
  ON staff_accreditations FOR UPDATE
  USING (
    organisation_id = auth_org_id()
    AND EXISTS (
      SELECT 1 FROM staff s WHERE s.id = staff_accreditations.staff_id AND s.profile_id = auth.uid()
    )
  );

CREATE POLICY "staff_accreditations_delete_admin"
  ON staff_accreditations FOR DELETE
  USING (is_admin_or_manager(organisation_id));

-- staff_accreditation_templates: all org members read, admin/manager write
CREATE POLICY "staff_accreditation_templates_select_same_org"
  ON staff_accreditation_templates FOR SELECT
  USING (organisation_id = auth_org_id());

CREATE POLICY "staff_accreditation_templates_insert_admin"
  ON staff_accreditation_templates FOR INSERT
  WITH CHECK (is_admin_or_manager(organisation_id));

CREATE POLICY "staff_accreditation_templates_update_admin"
  ON staff_accreditation_templates FOR UPDATE
  USING (is_admin_or_manager(organisation_id));

CREATE POLICY "staff_accreditation_templates_delete_admin"
  ON staff_accreditation_templates FOR DELETE
  USING (is_admin_or_manager(organisation_id));

-- staff_invites: admin/manager only
CREATE POLICY "staff_invites_select_admin"
  ON staff_invites FOR SELECT
  USING (is_admin_or_manager(organisation_id));

CREATE POLICY "staff_invites_insert_admin"
  ON staff_invites FOR INSERT
  WITH CHECK (is_admin_or_manager(organisation_id));

CREATE POLICY "staff_invites_update_admin"
  ON staff_invites FOR UPDATE
  USING (is_admin_or_manager(organisation_id));

CREATE POLICY "staff_invites_delete_admin"
  ON staff_invites FOR DELETE
  USING (is_admin_or_manager(organisation_id));

-- Allow unauthenticated/any authenticated user to read invite by token (for onboarding page)
CREATE POLICY "staff_invites_select_by_token"
  ON staff_invites FOR SELECT
  USING (true);
