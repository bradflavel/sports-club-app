-- Migration: 00010_create_rls_policies.sql
-- Enables Row Level Security on all tables and defines comprehensive access policies.
--
-- Design principles:
--   • All data is scoped to an organisation_id matched via the authenticated user's profile.
--   • Helper functions keep policy expressions readable and evaluated once per query.
--   • Roles follow a hierarchy: admin ≥ manager > coach > player/member/guardian.

-- ── Helper functions ──────────────────────────────────────────────────────────

-- Returns the profile row for the currently authenticated user.
CREATE OR REPLACE FUNCTION auth_profile()
RETURNS profiles AS $$
  SELECT * FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Returns the organisation_id of the current user.
CREATE OR REPLACE FUNCTION auth_org_id()
RETURNS uuid AS $$
  SELECT organisation_id FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Returns the role of the current user.
CREATE OR REPLACE FUNCTION auth_role()
RETURNS user_role AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- True when the current user is an admin or manager for the given organisation.
CREATE OR REPLACE FUNCTION is_admin_or_manager(org_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
      AND organisation_id = org_id
      AND role IN ('admin', 'manager')
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- True when the current user is a coach for the given organisation.
CREATE OR REPLACE FUNCTION is_coach(org_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
      AND organisation_id = org_id
      AND role = 'coach'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ── Enable RLS on all tables ──────────────────────────────────────────────────

ALTER TABLE organisations    ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE members          ENABLE ROW LEVEL SECURITY;
ALTER TABLE seasons          ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams            ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members     ENABLE ROW LEVEL SECURITY;
ALTER TABLE fixtures         ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments         ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents        ENABLE ROW LEVEL SECURITY;
ALTER TABLE photo_albums     ENABLE ROW LEVEL SECURITY;
ALTER TABLE photo_items      ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements    ENABLE ROW LEVEL SECURITY;

-- ── organisations ─────────────────────────────────────────────────────────────

-- Any authenticated user may read their own organisation.
CREATE POLICY "organisations_select_own"
  ON organisations FOR SELECT
  USING (id = auth_org_id());

-- Only admins may update or insert their own organisation record.
CREATE POLICY "organisations_update_admin"
  ON organisations FOR UPDATE
  USING (is_admin_or_manager(id));

CREATE POLICY "organisations_insert_admin"
  ON organisations FOR INSERT
  WITH CHECK (is_admin_or_manager(id));

-- ── profiles ──────────────────────────────────────────────────────────────────

-- All members of the same organisation may read profiles in that org.
CREATE POLICY "profiles_select_same_org"
  ON profiles FOR SELECT
  USING (organisation_id = auth_org_id());

-- A user may always read their own profile (e.g. before organisation_id is set).
CREATE POLICY "profiles_select_own"
  ON profiles FOR SELECT
  USING (id = auth.uid());

-- A user may update their own profile.
CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  USING (id = auth.uid());

-- Admins/managers may update any profile in their org.
CREATE POLICY "profiles_update_admin"
  ON profiles FOR UPDATE
  USING (is_admin_or_manager(organisation_id));

-- The handle_new_user() trigger (SECURITY DEFINER) handles INSERT; no RLS insert needed.
-- Admins may delete profiles in their org (e.g. deactivation).
CREATE POLICY "profiles_delete_admin"
  ON profiles FOR DELETE
  USING (is_admin_or_manager(organisation_id));

-- ── members ───────────────────────────────────────────────────────────────────

CREATE POLICY "members_select_same_org"
  ON members FOR SELECT
  USING (organisation_id = auth_org_id());

CREATE POLICY "members_insert_admin"
  ON members FOR INSERT
  WITH CHECK (is_admin_or_manager(organisation_id));

CREATE POLICY "members_update_admin"
  ON members FOR UPDATE
  USING (is_admin_or_manager(organisation_id));

-- Coaches may read members in their org.
CREATE POLICY "members_select_coach"
  ON members FOR SELECT
  USING (is_coach(organisation_id));

CREATE POLICY "members_delete_admin"
  ON members FOR DELETE
  USING (is_admin_or_manager(organisation_id));

-- ── seasons ───────────────────────────────────────────────────────────────────

CREATE POLICY "seasons_select_same_org"
  ON seasons FOR SELECT
  USING (organisation_id = auth_org_id());

CREATE POLICY "seasons_insert_admin"
  ON seasons FOR INSERT
  WITH CHECK (is_admin_or_manager(organisation_id));

CREATE POLICY "seasons_update_admin"
  ON seasons FOR UPDATE
  USING (is_admin_or_manager(organisation_id));

CREATE POLICY "seasons_delete_admin"
  ON seasons FOR DELETE
  USING (is_admin_or_manager(organisation_id));

-- ── teams ─────────────────────────────────────────────────────────────────────

-- All org members may read teams.
CREATE POLICY "teams_select_same_org"
  ON teams FOR SELECT
  USING (organisation_id = auth_org_id());

CREATE POLICY "teams_insert_admin"
  ON teams FOR INSERT
  WITH CHECK (is_admin_or_manager(organisation_id));

-- Admins/managers may update any team; coaches may update teams they coach.
CREATE POLICY "teams_update_admin"
  ON teams FOR UPDATE
  USING (is_admin_or_manager(organisation_id));

CREATE POLICY "teams_update_coach"
  ON teams FOR UPDATE
  USING (coach_id = auth.uid() AND organisation_id = auth_org_id());

CREATE POLICY "teams_delete_admin"
  ON teams FOR DELETE
  USING (is_admin_or_manager(organisation_id));

-- ── team_members ──────────────────────────────────────────────────────────────

CREATE POLICY "team_members_select_same_org"
  ON team_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM teams t
      WHERE t.id = team_members.team_id
        AND t.organisation_id = auth_org_id()
    )
  );

CREATE POLICY "team_members_insert_admin_coach"
  ON team_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM teams t
      WHERE t.id = team_members.team_id
        AND (
          is_admin_or_manager(t.organisation_id)
          OR (t.coach_id = auth.uid() AND t.organisation_id = auth_org_id())
        )
    )
  );

CREATE POLICY "team_members_update_admin_coach"
  ON team_members FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM teams t
      WHERE t.id = team_members.team_id
        AND (
          is_admin_or_manager(t.organisation_id)
          OR (t.coach_id = auth.uid() AND t.organisation_id = auth_org_id())
        )
    )
  );

CREATE POLICY "team_members_delete_admin_coach"
  ON team_members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM teams t
      WHERE t.id = team_members.team_id
        AND (
          is_admin_or_manager(t.organisation_id)
          OR (t.coach_id = auth.uid() AND t.organisation_id = auth_org_id())
        )
    )
  );

-- ── fixtures ──────────────────────────────────────────────────────────────────

-- All org members may read fixtures.
CREATE POLICY "fixtures_select_same_org"
  ON fixtures FOR SELECT
  USING (organisation_id = auth_org_id());

CREATE POLICY "fixtures_insert_admin"
  ON fixtures FOR INSERT
  WITH CHECK (is_admin_or_manager(organisation_id));

-- Admins/managers full update; coaches may update fixtures for their teams.
CREATE POLICY "fixtures_update_admin"
  ON fixtures FOR UPDATE
  USING (is_admin_or_manager(organisation_id));

CREATE POLICY "fixtures_update_coach"
  ON fixtures FOR UPDATE
  USING (
    organisation_id = auth_org_id()
    AND EXISTS (
      SELECT 1 FROM teams t
      WHERE t.coach_id = auth.uid()
        AND t.id = fixtures.team_id
    )
  );

CREATE POLICY "fixtures_delete_admin"
  ON fixtures FOR DELETE
  USING (is_admin_or_manager(organisation_id));

-- ── payments ──────────────────────────────────────────────────────────────────

-- Admins/managers see all payments in their org.
CREATE POLICY "payments_select_admin"
  ON payments FOR SELECT
  USING (is_admin_or_manager(organisation_id));

-- Coaches may read (but not modify) payments in their org.
CREATE POLICY "payments_select_coach"
  ON payments FOR SELECT
  USING (is_coach(organisation_id));

-- Members/players/guardians see only their own payments.
CREATE POLICY "payments_select_own"
  ON payments FOR SELECT
  USING (
    organisation_id = auth_org_id()
    AND member_id IN (
      SELECT m.id FROM members m WHERE m.profile_id = auth.uid()
    )
  );

CREATE POLICY "payments_insert_admin"
  ON payments FOR INSERT
  WITH CHECK (is_admin_or_manager(organisation_id));

CREATE POLICY "payments_update_admin"
  ON payments FOR UPDATE
  USING (is_admin_or_manager(organisation_id));

CREATE POLICY "payments_delete_admin"
  ON payments FOR DELETE
  USING (is_admin_or_manager(organisation_id));

-- ── documents ─────────────────────────────────────────────────────────────────

-- Public documents are visible to everyone in the org.
CREATE POLICY "documents_select_public"
  ON documents FOR SELECT
  USING (
    organisation_id = auth_org_id()
    AND is_public = true
  );

-- Non-public documents are only visible to admins/managers.
CREATE POLICY "documents_select_private_admin"
  ON documents FOR SELECT
  USING (
    is_public = false
    AND is_admin_or_manager(organisation_id)
  );

CREATE POLICY "documents_insert_admin"
  ON documents FOR INSERT
  WITH CHECK (is_admin_or_manager(organisation_id));

CREATE POLICY "documents_update_admin"
  ON documents FOR UPDATE
  USING (is_admin_or_manager(organisation_id));

CREATE POLICY "documents_delete_admin"
  ON documents FOR DELETE
  USING (is_admin_or_manager(organisation_id));

-- ── photo_albums ──────────────────────────────────────────────────────────────

-- All org members may read albums.
CREATE POLICY "photo_albums_select_same_org"
  ON photo_albums FOR SELECT
  USING (organisation_id = auth_org_id());

CREATE POLICY "photo_albums_insert_admin"
  ON photo_albums FOR INSERT
  WITH CHECK (is_admin_or_manager(organisation_id));

CREATE POLICY "photo_albums_update_admin"
  ON photo_albums FOR UPDATE
  USING (is_admin_or_manager(organisation_id));

CREATE POLICY "photo_albums_delete_admin"
  ON photo_albums FOR DELETE
  USING (is_admin_or_manager(organisation_id));

-- ── photo_items ───────────────────────────────────────────────────────────────

-- Visible if the parent album is in the user's org.
CREATE POLICY "photo_items_select_via_album"
  ON photo_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM photo_albums pa
      WHERE pa.id = photo_items.album_id
        AND pa.organisation_id = auth_org_id()
    )
  );

CREATE POLICY "photo_items_insert_admin"
  ON photo_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM photo_albums pa
      WHERE pa.id = photo_items.album_id
        AND is_admin_or_manager(pa.organisation_id)
    )
  );

CREATE POLICY "photo_items_delete_admin"
  ON photo_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM photo_albums pa
      WHERE pa.id = photo_items.album_id
        AND is_admin_or_manager(pa.organisation_id)
    )
  );

-- ── announcements ─────────────────────────────────────────────────────────────

-- All org members may read announcements.
CREATE POLICY "announcements_select_same_org"
  ON announcements FOR SELECT
  USING (organisation_id = auth_org_id());

CREATE POLICY "announcements_insert_admin"
  ON announcements FOR INSERT
  WITH CHECK (is_admin_or_manager(organisation_id));

CREATE POLICY "announcements_update_admin"
  ON announcements FOR UPDATE
  USING (is_admin_or_manager(organisation_id));

CREATE POLICY "announcements_delete_admin"
  ON announcements FOR DELETE
  USING (is_admin_or_manager(organisation_id));
