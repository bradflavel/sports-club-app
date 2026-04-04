-- Migration: 00006_create_seasons_fixtures.sql
-- Creates the fixtures table

CREATE TABLE fixtures (
  id               uuid           PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id  uuid           NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  season_id        uuid           REFERENCES seasons(id) ON DELETE SET NULL,
  team_id          uuid           NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  opponent_name    text           NOT NULL,
  venue            text,
  date_time        timestamptz    NOT NULL,
  is_home          boolean        NOT NULL DEFAULT true,
  status           fixture_status NOT NULL DEFAULT 'scheduled',
  home_score       integer,
  away_score       integer,
  round_number     integer,
  notes            text,
  created_at       timestamptz    DEFAULT now(),
  updated_at       timestamptz    DEFAULT now()
);

CREATE TRIGGER fixtures_updated_at
  BEFORE UPDATE ON fixtures
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
