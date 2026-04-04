-- Migration: 00005_create_teams.sql
-- Creates seasons, teams, and team_members tables

-- ── Seasons ──────────────────────────────────────────────────────────────────

CREATE TABLE seasons (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id uuid        NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  name            text        NOT NULL,
  start_date      date,
  end_date        date,
  is_current      boolean     DEFAULT false,
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
  season_id       uuid        REFERENCES seasons(id) ON DELETE SET NULL,
  name            text        NOT NULL,
  age_group       text,                        -- e.g. "Under 18", "Senior"
  gender          text,                        -- e.g. "Mixed", "Male", "Female"
  coach_id        uuid        REFERENCES profiles(id) ON DELETE SET NULL,
  manager_id      uuid        REFERENCES profiles(id) ON DELETE SET NULL,
  colour          text,
  notes           text,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

CREATE TRIGGER teams_updated_at
  BEFORE UPDATE ON teams
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── Team Members ──────────────────────────────────────────────────────────────

CREATE TABLE team_members (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id    uuid        NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  member_id  uuid        NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  position   text,
  is_captain boolean     DEFAULT false,
  joined_at  timestamptz DEFAULT now(),

  CONSTRAINT team_members_unique UNIQUE (team_id, member_id)
);
