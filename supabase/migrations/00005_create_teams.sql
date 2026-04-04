-- Migration: 00005_create_teams.sql
-- Creates seasons, teams, and team_members tables

-- ── Seasons ──────────────────────────────────────────────────────────────────

CREATE TABLE seasons (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id uuid        NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  name            text        NOT NULL,
  start_date      date        NOT NULL,
  end_date        date        NOT NULL,
  is_current      boolean     NOT NULL DEFAULT false,
  created_at      timestamptz DEFAULT now()
);

-- Only one season per organisation may be flagged as current at a time.
CREATE UNIQUE INDEX seasons_one_current_per_org
  ON seasons (organisation_id)
  WHERE is_current = true;

-- ── Teams ─────────────────────────────────────────────────────────────────────

CREATE TABLE teams (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id uuid        NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  name            text        NOT NULL,
  division        text,
  age_group       text,                        -- e.g. "Under 18", "Senior"
  season_id       uuid        REFERENCES seasons(id) ON DELETE SET NULL,
  coach_id        uuid        REFERENCES profiles(id) ON DELETE SET NULL,
  manager_id      uuid        REFERENCES profiles(id) ON DELETE SET NULL,
  max_players     integer     NOT NULL DEFAULT 30,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

CREATE TRIGGER teams_updated_at
  BEFORE UPDATE ON teams
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── Team Members ──────────────────────────────────────────────────────────────

CREATE TABLE team_members (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id        uuid        NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  member_id      uuid        NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  jersey_number  integer,
  position       text,
  is_captain     boolean     NOT NULL DEFAULT false,
  joined_at      timestamptz DEFAULT now(),

  CONSTRAINT team_members_unique UNIQUE (team_id, member_id)
);
