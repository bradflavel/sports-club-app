-- Migration: 00025_preferred_name_and_protect_profile_fields.sql
-- 1. Adds preferred_name column to profiles
-- 2. Creates a trigger that prevents non-admin/manager users from changing
--    protected fields (first_name, last_name, date_of_birth, gender, email, role)
--    on their own profile. Admins/managers can still edit any profile via the
--    existing profiles_update_admin policy.

-- ── Add preferred_name column ────────────────────────────────────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS preferred_name text;

-- ── Trigger: protect immutable profile fields for non-admin self-updates ─────
CREATE OR REPLACE FUNCTION protect_profile_fields()
RETURNS TRIGGER AS $$
BEGIN
  -- Only restrict when a user is updating their own row
  IF NEW.id = auth.uid() THEN
    -- Check if the user is admin or manager (they can change anything)
    IF EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'manager')
    ) THEN
      RETURN NEW;
    END IF;

    -- For non-admin/manager users, revert protected fields to their old values.
    -- Exception: allow setting a field for the first time (NULL → value) during onboarding.
    IF OLD.first_name IS NOT NULL THEN NEW.first_name := OLD.first_name; END IF;
    IF OLD.last_name IS NOT NULL THEN NEW.last_name := OLD.last_name; END IF;
    IF OLD.date_of_birth IS NOT NULL THEN NEW.date_of_birth := OLD.date_of_birth; END IF;
    IF OLD.gender IS NOT NULL THEN NEW.gender := OLD.gender; END IF;
    NEW.email       := OLD.email;
    NEW.role        := OLD.role;
    NEW.organisation_id := OLD.organisation_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS protect_profile_fields_trigger ON profiles;

CREATE TRIGGER protect_profile_fields_trigger
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION protect_profile_fields();
