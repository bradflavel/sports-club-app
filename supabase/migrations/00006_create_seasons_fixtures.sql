-- Migration: 00006_create_seasons_fixtures.sql
-- Creates the fixtures table

CREATE TABLE fixtures (
  id               uuid           PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id  uuid           NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  season_id        uuid           REFERENCES seasons(id) ON DELETE SET NULL,
  home_team_id     uuid           REFERENCES teams(id) ON DELETE SET NULL,
  away_team_id     uuid           REFERENCES teams(id) ON DELETE SET NULL,
  opponent_name    text,                          -- for external / visiting teams
  round_number     integer,
  round_label      text,                          -- e.g. "Round 1", "Grand Final"
  scheduled_at     timestamptz,
  venue            text,
  address          text,
  status           fixture_status NOT NULL DEFAULT 'scheduled',
  home_score       integer,
  away_score       integer,
  result_notes     text,
  is_home_game     boolean        DEFAULT true,
  transport_notes  text,
  created_at       timestamptz    DEFAULT now(),
  updated_at       timestamptz    DEFAULT now()
);

CREATE TRIGGER fixtures_updated_at
  BEFORE UPDATE ON fixtures
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
