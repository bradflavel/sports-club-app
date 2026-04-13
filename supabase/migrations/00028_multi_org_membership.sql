-- Migration: 00028_multi_org_membership.sql
-- Allows a user to be a member (and admin) of multiple organisations.
--
-- Design:
--   • Roles move from profiles.role (single, global) to members.role (per
--     membership). A user can be admin of org A and player at org B.
--   • profiles.organisation_id and profiles.role are kept, but their meaning
--     changes: they now represent the user's *active* organisation context
--     (the org they are currently working in). RLS continues to scope to the
--     active context, so most existing policies and queries keep working
--     unchanged.
--   • Switching org updates profiles.organisation_id and profiles.role to
--     reflect the chosen membership, via a SECURITY DEFINER RPC that
--     validates the user is actually a member of the target org.
--   • Joining an additional org no longer requires leaving the current one.
--   • The join flow remains a single trusted RPC, assign_user_to_organisation,
--     which now upserts a members row with the requested role and sets the
--     active context atomically.

-- ── Schema change: per-membership role ────────────────────────────────────────

ALTER TABLE members
  ADD COLUMN IF NOT EXISTS role user_role NOT NULL DEFAULT 'member';

-- Backfill role on existing member rows from the profile's current role.
-- For users whose profile points at the same org as the membership row, copy
-- their profile.role onto that row. Other existing rows retain the default.
UPDATE members m
   SET role = p.role
  FROM profiles p
 WHERE m.profile_id = p.id
   AND m.organisation_id = p.organisation_id
   AND p.role IS NOT NULL;

-- Backfill: ensure every profile that has an active organisation also has a
-- corresponding members row (with their profile role). This preserves
-- existing affiliations — including Brad Flavel's admin role on the current
-- organisation — when the schema flips to per-membership roles.
INSERT INTO members (profile_id, organisation_id, role, membership_status)
SELECT p.id, p.organisation_id, COALESCE(p.role, 'member'), 'active'
  FROM profiles p
 WHERE p.organisation_id IS NOT NULL
ON CONFLICT (profile_id, organisation_id) DO UPDATE
  SET role = EXCLUDED.role;

-- ── Helper: resolve the caller's role in a given organisation ─────────────────
-- Uses members.role rather than profiles.role so that role checks work for any
-- organisation the user belongs to, not only the active one.

CREATE OR REPLACE FUNCTION auth_role_in(org_id uuid)
RETURNS user_role AS $$
  SELECT role FROM members
   WHERE profile_id = auth.uid()
     AND organisation_id = org_id;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Replace is_admin_or_manager / is_coach to consult members rather than
-- profiles. This means admin/coach checks now apply to the *target* org, not
-- only the user's currently-active org — which is what multi-org requires.

CREATE OR REPLACE FUNCTION is_admin_or_manager(org_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM members
    WHERE profile_id = auth.uid()
      AND organisation_id = org_id
      AND role IN ('admin', 'manager')
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_coach(org_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM members
    WHERE profile_id = auth.uid()
      AND organisation_id = org_id
      AND role = 'coach'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ── RPC: assign_user_to_organisation ─────────────────────────────────────────
-- Trusted entry point used by the create-club, join-club and staff-invite
-- flows. Upserts a members row with the requested role and sets the user's
-- active context to that org. Safe to call when the user is already a member
-- of other organisations.

CREATE OR REPLACE FUNCTION assign_user_to_organisation(
  p_user_id uuid,
  p_org_id  uuid,
  p_role    user_role
)
RETURNS void AS $$
BEGIN
  INSERT INTO members (profile_id, organisation_id, role, membership_status)
  VALUES (p_user_id, p_org_id, p_role, 'active')
  ON CONFLICT (profile_id, organisation_id) DO UPDATE
    SET role = EXCLUDED.role;

  UPDATE profiles
     SET organisation_id = p_org_id,
         role            = p_role,
         updated_at      = now()
   WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── RPC: switch_active_organisation ───────────────────────────────────────────
-- Sets the caller's active organisation to one they already belong to. The
-- profile's denormalised role is updated to match the membership row so RLS
-- helpers reading profiles.role stay consistent.

CREATE OR REPLACE FUNCTION switch_active_organisation(p_org_id uuid)
RETURNS void AS $$
DECLARE
  v_role user_role;
BEGIN
  SELECT role INTO v_role
    FROM members
   WHERE profile_id = auth.uid()
     AND organisation_id = p_org_id;

  IF v_role IS NULL THEN
    RAISE EXCEPTION 'Not a member of organisation %', p_org_id
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  UPDATE profiles
     SET organisation_id = p_org_id,
         role            = v_role,
         updated_at      = now()
   WHERE id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── RPC: get_user_organisations ──────────────────────────────────────────────
-- Returns every organisation the caller is a member of, along with the role
-- they hold there. Used by the org switcher UI. SECURITY DEFINER bypasses RLS
-- on organisations so the user can see all their orgs even though
-- organisations.RLS only exposes the active one.

CREATE OR REPLACE FUNCTION get_user_organisations()
RETURNS TABLE (
  id              uuid,
  name            text,
  slug            text,
  logo_url        text,
  primary_colour  text,
  role            user_role,
  is_active       boolean
) AS $$
  SELECT o.id,
         o.name,
         o.slug,
         o.logo_url,
         o.primary_colour,
         m.role,
         (o.id = (SELECT organisation_id FROM profiles WHERE id = auth.uid())) AS is_active
    FROM members m
    JOIN organisations o ON o.id = m.organisation_id
   WHERE m.profile_id = auth.uid()
   ORDER BY o.name;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ── Allow self-insert into members for the join flow ─────────────────────────
-- The legacy policy only allowed admins to insert. Joining an org goes through
-- the assign_user_to_organisation RPC (SECURITY DEFINER), so this is mainly a
-- safety net for upsert-style writes from the client.

CREATE POLICY "members_insert_self"
  ON members FOR INSERT
  WITH CHECK (profile_id = auth.uid());

-- A user may always update their own membership row (e.g. medical info).
CREATE POLICY "members_update_own"
  ON members FOR UPDATE
  USING (profile_id = auth.uid());
