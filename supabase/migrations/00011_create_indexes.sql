-- Migration: 00011_create_indexes.sql
-- Performance indexes for common query patterns

-- ── organisations ─────────────────────────────────────────────────────────────
CREATE INDEX idx_organisations_slug
  ON organisations (slug);

CREATE INDEX idx_organisations_sport_type
  ON organisations (sport_type);

-- ── profiles ──────────────────────────────────────────────────────────────────
CREATE INDEX idx_profiles_organisation_id
  ON profiles (organisation_id);

CREATE INDEX idx_profiles_email
  ON profiles (email);

CREATE INDEX idx_profiles_role
  ON profiles (organisation_id, role);

-- ── members ───────────────────────────────────────────────────────────────────
CREATE INDEX idx_members_organisation_id
  ON members (organisation_id);

CREATE INDEX idx_members_profile_id
  ON members (profile_id);

CREATE INDEX idx_members_membership_status
  ON members (organisation_id, membership_status);

CREATE INDEX idx_members_membership_type
  ON members (organisation_id, membership_type);

CREATE INDEX idx_members_renewal_date
  ON members (renewal_date)
  WHERE renewal_date IS NOT NULL;

-- ── seasons ───────────────────────────────────────────────────────────────────
CREATE INDEX idx_seasons_organisation_id
  ON seasons (organisation_id);

CREATE INDEX idx_seasons_is_current
  ON seasons (organisation_id, is_current);

-- ── teams ─────────────────────────────────────────────────────────────────────
CREATE INDEX idx_teams_organisation_id
  ON teams (organisation_id);

CREATE INDEX idx_teams_season_id
  ON teams (season_id);

CREATE INDEX idx_teams_coach_id
  ON teams (coach_id);

-- ── team_members ──────────────────────────────────────────────────────────────
CREATE INDEX idx_team_members_team_id
  ON team_members (team_id);

CREATE INDEX idx_team_members_member_id
  ON team_members (member_id);

-- ── fixtures ──────────────────────────────────────────────────────────────────
CREATE INDEX idx_fixtures_organisation_id
  ON fixtures (organisation_id);

CREATE INDEX idx_fixtures_season_id
  ON fixtures (season_id);

CREATE INDEX idx_fixtures_scheduled_at
  ON fixtures (scheduled_at);

CREATE INDEX idx_fixtures_home_team_id
  ON fixtures (home_team_id);

CREATE INDEX idx_fixtures_away_team_id
  ON fixtures (away_team_id);

CREATE INDEX idx_fixtures_status
  ON fixtures (organisation_id, status);

CREATE INDEX idx_fixtures_round_number
  ON fixtures (season_id, round_number);

-- ── payments ──────────────────────────────────────────────────────────────────
CREATE INDEX idx_payments_organisation_id
  ON payments (organisation_id);

CREATE INDEX idx_payments_member_id
  ON payments (member_id);

CREATE INDEX idx_payments_status
  ON payments (organisation_id, payment_status);

CREATE INDEX idx_payments_due_date
  ON payments (due_date)
  WHERE due_date IS NOT NULL;

CREATE INDEX idx_payments_type
  ON payments (organisation_id, payment_type);

-- ── documents ─────────────────────────────────────────────────────────────────
CREATE INDEX idx_documents_organisation_id
  ON documents (organisation_id);

CREATE INDEX idx_documents_category
  ON documents (organisation_id, category);

CREATE INDEX idx_documents_is_public
  ON documents (organisation_id, is_public);

-- ── photo_albums ──────────────────────────────────────────────────────────────
CREATE INDEX idx_photo_albums_organisation_id
  ON photo_albums (organisation_id);

CREATE INDEX idx_photo_albums_is_public
  ON photo_albums (organisation_id, is_public);

-- ── photo_items ───────────────────────────────────────────────────────────────
CREATE INDEX idx_photo_items_album_id
  ON photo_items (album_id);

-- ── announcements ─────────────────────────────────────────────────────────────
CREATE INDEX idx_announcements_organisation_id
  ON announcements (organisation_id);

CREATE INDEX idx_announcements_is_pinned
  ON announcements (organisation_id, is_pinned)
  WHERE is_pinned = true;

CREATE INDEX idx_announcements_published_at
  ON announcements (organisation_id, published_at DESC);

CREATE INDEX idx_announcements_target_team
  ON announcements (target_team_id)
  WHERE target_team_id IS NOT NULL;
