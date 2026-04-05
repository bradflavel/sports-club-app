-- Migration: 00011_create_indexes.sql
-- Performance indexes for common query patterns

-- ── organisations ─────────────────────────────────────────────────────────────
CREATE INDEX idx_organisations_slug
  ON organisations (slug);

-- ── profiles ──────────────────────────────────────────────────────────────────
CREATE INDEX idx_profiles_organisation_id
  ON profiles (organisation_id);

CREATE INDEX idx_profiles_role
  ON profiles (organisation_id, role);

-- ── members ───────────────────────────────────────────────────────────────────
CREATE INDEX idx_members_organisation_id
  ON members (organisation_id);

CREATE INDEX idx_members_profile_id
  ON members (profile_id);

CREATE INDEX idx_members_membership_status
  ON members (organisation_id, membership_status);

-- ── seasons ───────────────────────────────────────────────────────────────────
CREATE INDEX idx_seasons_organisation_id
  ON seasons (organisation_id);

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

CREATE INDEX idx_fixtures_team_id
  ON fixtures (team_id);

CREATE INDEX idx_fixtures_season_id
  ON fixtures (season_id);

CREATE INDEX idx_fixtures_date_time
  ON fixtures (date_time);

CREATE INDEX idx_fixtures_status
  ON fixtures (organisation_id, status);

-- ── payments ──────────────────────────────────────────────────────────────────
CREATE INDEX idx_payments_organisation_id
  ON payments (organisation_id);

CREATE INDEX idx_payments_member_id
  ON payments (member_id);

CREATE INDEX idx_payments_status
  ON payments (organisation_id, payment_status);

CREATE INDEX idx_payments_due_date
  ON payments (due_date);

-- ── documents ─────────────────────────────────────────────────────────────────
CREATE INDEX idx_documents_organisation_id
  ON documents (organisation_id);

CREATE INDEX idx_documents_category
  ON documents (organisation_id, category);

-- ── photo_albums ──────────────────────────────────────────────────────────────
CREATE INDEX idx_photo_albums_organisation_id
  ON photo_albums (organisation_id);

-- ── photo_items ───────────────────────────────────────────────────────────────
CREATE INDEX idx_photo_items_album_id
  ON photo_items (album_id);

-- ── announcements ─────────────────────────────────────────────────────────────
CREATE INDEX idx_announcements_organisation_id
  ON announcements (organisation_id);

CREATE INDEX idx_announcements_published_at
  ON announcements (organisation_id, published_at DESC);
