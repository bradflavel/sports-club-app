-- Migration: 00023_tighten_rls_policies.sql
-- Addresses security audit findings:
-- 1. Coaches can only see payments for members on their teams
-- 2. Members can always read their own member record
-- 3. Safe directory function limits exposed profile fields

-- ── Tighten coach payment access ──────────────────────────────────────────────
DROP POLICY IF EXISTS "payments_select_coach" ON payments;

CREATE POLICY "payments_select_coach_team_only"
  ON payments FOR SELECT
  USING (
    organisation_id = auth_org_id()
    AND is_coach(organisation_id)
    AND member_id IN (
      SELECT tm.member_id
      FROM team_members tm
      JOIN teams t ON t.id = tm.team_id
      WHERE t.coach_id = auth.uid()
    )
  );

-- ── Members can always read their own record ──────────────────────────────────
CREATE POLICY "members_select_own"
  ON members FOR SELECT
  USING (profile_id = auth.uid());

-- ── Safe directory function (returns only public fields) ──────────────────────
CREATE OR REPLACE FUNCTION get_member_directory(p_org_id uuid)
RETURNS TABLE (
  id uuid,
  first_name text,
  last_name text,
  email text,
  phone text,
  avatar_url text,
  role user_role
) AS $$
BEGIN
  IF p_org_id != auth_org_id() THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT p.id, p.first_name, p.last_name, p.email, p.phone, p.avatar_url, p.role
  FROM profiles p
  WHERE p.organisation_id = p_org_id;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
