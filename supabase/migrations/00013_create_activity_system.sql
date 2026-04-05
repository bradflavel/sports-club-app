-- Migration: 00013_create_activity_system.sql
-- Replaces the rigid seasons/fixtures hierarchy with a modular activity system.
-- Activity types: competition, tournament, training_session, training_camp.
-- Each org enables the types they need. Activities support participant and organiser modes.

-- ── New enums ────────────────────────────────────────────────────────────────

CREATE TYPE activity_type AS ENUM (
  'competition',
  'tournament',
  'training_session',
  'training_camp'
);

CREATE TYPE participation_mode AS ENUM (
  'participant',
  'organiser'
);

CREATE TYPE event_status AS ENUM (
  'scheduled',
  'in_progress',
  'completed',
  'cancelled',
  'postponed',
  'bye'
);

CREATE TYPE attendance_status AS ENUM (
  'attending',
  'not_attending',
  'maybe',
  'attended',
  'absent',
  'late'
);

CREATE TYPE tournament_stage AS ENUM (
  'pool',
  'quarterfinal',
  'semifinal',
  'final',
  'third_place',
  'round_robin'
);

-- ── organisation_modules ─────────────────────────────────────────────────────

CREATE TABLE organisation_modules (
  id              uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id uuid          NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  activity_type   activity_type NOT NULL,
  is_enabled      boolean       NOT NULL DEFAULT true,
  display_order   integer       NOT NULL DEFAULT 0,
  created_at      timestamptz   DEFAULT now(),

  CONSTRAINT org_modules_unique UNIQUE (organisation_id, activity_type)
);

-- ── activities ───────────────────────────────────────────────────────────────

CREATE TABLE activities (
  id                       uuid               PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id          uuid               NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  activity_type            activity_type      NOT NULL,
  participation_mode       participation_mode NOT NULL DEFAULT 'participant',
  name                     text               NOT NULL,
  description              text,
  start_date               date               NOT NULL,
  end_date                 date,
  is_current               boolean            NOT NULL DEFAULT false,
  -- Competition-specific
  total_rounds             integer,
  has_finals               boolean            DEFAULT false,
  -- Tournament-specific
  pool_count               integer,
  -- Training session-specific
  recurrence_rule          text,
  default_venue            text,
  default_start_time       time,
  default_duration_minutes integer,
  -- Link training to a parent competition/tournament
  parent_activity_id       uuid               REFERENCES activities(id) ON DELETE SET NULL,
  created_at               timestamptz        DEFAULT now(),
  updated_at               timestamptz        DEFAULT now()
);

CREATE TRIGGER activities_updated_at
  BEFORE UPDATE ON activities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── activity_teams ───────────────────────────────────────────────────────────

CREATE TABLE activity_teams (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id     uuid        NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  organisation_id uuid        NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  name            text        NOT NULL,
  division        text,
  age_group       text,
  coach_id        uuid        REFERENCES profiles(id) ON DELETE SET NULL,
  manager_id      uuid        REFERENCES profiles(id) ON DELETE SET NULL,
  max_players     integer     NOT NULL DEFAULT 30,
  is_own_team     boolean     NOT NULL DEFAULT true,
  source_team_id  uuid        REFERENCES activity_teams(id) ON DELETE SET NULL,
  -- Tournament-specific
  pool_number     integer,
  seed_number     integer,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

CREATE TRIGGER activity_teams_updated_at
  BEFORE UPDATE ON activity_teams
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── activity_team_members ────────────────────────────────────────────────────

CREATE TABLE activity_team_members (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_team_id uuid        NOT NULL REFERENCES activity_teams(id) ON DELETE CASCADE,
  member_id        uuid        NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  jersey_number    integer,
  position         text,
  is_captain       boolean     NOT NULL DEFAULT false,
  joined_at        timestamptz DEFAULT now(),

  CONSTRAINT activity_team_members_unique UNIQUE (activity_team_id, member_id)
);

-- ── activity_events ──────────────────────────────────────────────────────────

CREATE TABLE activity_events (
  id               uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id      uuid         NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  organisation_id  uuid         NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  -- Match/game fields
  home_team_id     uuid         REFERENCES activity_teams(id) ON DELETE SET NULL,
  away_team_id     uuid         REFERENCES activity_teams(id) ON DELETE SET NULL,
  opponent_name    text,
  is_home          boolean,
  home_score       integer,
  away_score       integer,
  round_number     integer,
  -- Tournament fields
  tournament_stage tournament_stage,
  pool_number      integer,
  bracket_position integer,
  -- Common fields
  title            text,
  venue            text,
  date_time        timestamptz  NOT NULL,
  end_time         timestamptz,
  status           event_status NOT NULL DEFAULT 'scheduled',
  notes            text,
  -- Training camp fields
  day_number       integer,
  session_number   integer,
  created_at       timestamptz  DEFAULT now(),
  updated_at       timestamptz  DEFAULT now()
);

CREATE TRIGGER activity_events_updated_at
  BEFORE UPDATE ON activity_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── activity_event_attendance ────────────────────────────────────────────────

CREATE TABLE activity_event_attendance (
  id            uuid              PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id      uuid              NOT NULL REFERENCES activity_events(id) ON DELETE CASCADE,
  member_id     uuid              NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  status        attendance_status NOT NULL DEFAULT 'attending',
  checked_in_at timestamptz,
  notes         text,
  created_at    timestamptz       DEFAULT now(),

  CONSTRAINT event_attendance_unique UNIQUE (event_id, member_id)
);

-- ── activity_standings ───────────────────────────────────────────────────────

CREATE TABLE activity_standings (
  id             uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id    uuid    NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  team_id        uuid    NOT NULL REFERENCES activity_teams(id) ON DELETE CASCADE,
  played         integer NOT NULL DEFAULT 0,
  wins           integer NOT NULL DEFAULT 0,
  losses         integer NOT NULL DEFAULT 0,
  draws          integer NOT NULL DEFAULT 0,
  points_for     integer NOT NULL DEFAULT 0,
  points_against integer NOT NULL DEFAULT 0,
  bonus_points   integer NOT NULL DEFAULT 0,
  ladder_points  integer NOT NULL DEFAULT 0,
  updated_at     timestamptz DEFAULT now(),

  CONSTRAINT standings_unique UNIQUE (activity_id, team_id)
);

-- ── RLS ──────────────────────────────────────────────────────────────────────

ALTER TABLE organisation_modules      ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities                ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_teams            ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_team_members     ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_events           ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_event_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_standings        ENABLE ROW LEVEL SECURITY;

-- ── organisation_modules policies ────────────────────────────────────────────

CREATE POLICY "org_modules_select_same_org"
  ON organisation_modules FOR SELECT
  USING (organisation_id = auth_org_id());

CREATE POLICY "org_modules_insert_admin"
  ON organisation_modules FOR INSERT
  WITH CHECK (is_admin_or_manager(organisation_id));

CREATE POLICY "org_modules_update_admin"
  ON organisation_modules FOR UPDATE
  USING (is_admin_or_manager(organisation_id));

CREATE POLICY "org_modules_delete_admin"
  ON organisation_modules FOR DELETE
  USING (is_admin_or_manager(organisation_id));

-- ── activities policies ──────────────────────────────────────────────────────

CREATE POLICY "activities_select_same_org"
  ON activities FOR SELECT
  USING (organisation_id = auth_org_id());

CREATE POLICY "activities_insert_admin"
  ON activities FOR INSERT
  WITH CHECK (is_admin_or_manager(organisation_id));

CREATE POLICY "activities_update_admin"
  ON activities FOR UPDATE
  USING (is_admin_or_manager(organisation_id));

CREATE POLICY "activities_delete_admin"
  ON activities FOR DELETE
  USING (is_admin_or_manager(organisation_id));

-- ── activity_teams policies ──────────────────────────────────────────────────

CREATE POLICY "activity_teams_select_same_org"
  ON activity_teams FOR SELECT
  USING (organisation_id = auth_org_id());

CREATE POLICY "activity_teams_insert_admin"
  ON activity_teams FOR INSERT
  WITH CHECK (is_admin_or_manager(organisation_id));

CREATE POLICY "activity_teams_update_admin"
  ON activity_teams FOR UPDATE
  USING (is_admin_or_manager(organisation_id));

CREATE POLICY "activity_teams_update_coach"
  ON activity_teams FOR UPDATE
  USING (coach_id = auth.uid() AND organisation_id = auth_org_id());

CREATE POLICY "activity_teams_delete_admin"
  ON activity_teams FOR DELETE
  USING (is_admin_or_manager(organisation_id));

-- ── activity_team_members policies ───────────────────────────────────────────

CREATE POLICY "activity_team_members_select_same_org"
  ON activity_team_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM activity_teams t
      WHERE t.id = activity_team_members.activity_team_id
        AND t.organisation_id = auth_org_id()
    )
  );

CREATE POLICY "activity_team_members_insert_admin_coach"
  ON activity_team_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM activity_teams t
      WHERE t.id = activity_team_members.activity_team_id
        AND (
          is_admin_or_manager(t.organisation_id)
          OR (t.coach_id = auth.uid() AND t.organisation_id = auth_org_id())
        )
    )
  );

CREATE POLICY "activity_team_members_update_admin_coach"
  ON activity_team_members FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM activity_teams t
      WHERE t.id = activity_team_members.activity_team_id
        AND (
          is_admin_or_manager(t.organisation_id)
          OR (t.coach_id = auth.uid() AND t.organisation_id = auth_org_id())
        )
    )
  );

CREATE POLICY "activity_team_members_delete_admin_coach"
  ON activity_team_members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM activity_teams t
      WHERE t.id = activity_team_members.activity_team_id
        AND (
          is_admin_or_manager(t.organisation_id)
          OR (t.coach_id = auth.uid() AND t.organisation_id = auth_org_id())
        )
    )
  );

-- ── activity_events policies ─────────────────────────────────────────────────

CREATE POLICY "activity_events_select_same_org"
  ON activity_events FOR SELECT
  USING (organisation_id = auth_org_id());

CREATE POLICY "activity_events_insert_admin"
  ON activity_events FOR INSERT
  WITH CHECK (is_admin_or_manager(organisation_id));

CREATE POLICY "activity_events_update_admin"
  ON activity_events FOR UPDATE
  USING (is_admin_or_manager(organisation_id));

CREATE POLICY "activity_events_update_coach"
  ON activity_events FOR UPDATE
  USING (
    organisation_id = auth_org_id()
    AND (
      EXISTS (
        SELECT 1 FROM activity_teams t
        WHERE t.coach_id = auth.uid()
          AND (t.id = activity_events.home_team_id OR t.id = activity_events.away_team_id)
      )
    )
  );

CREATE POLICY "activity_events_delete_admin"
  ON activity_events FOR DELETE
  USING (is_admin_or_manager(organisation_id));

-- ── activity_event_attendance policies ───────────────────────────────────────

CREATE POLICY "attendance_select_same_org"
  ON activity_event_attendance FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM activity_events e
      WHERE e.id = activity_event_attendance.event_id
        AND e.organisation_id = auth_org_id()
    )
  );

CREATE POLICY "attendance_insert_admin_coach"
  ON activity_event_attendance FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM activity_events e
      WHERE e.id = activity_event_attendance.event_id
        AND (
          is_admin_or_manager(e.organisation_id)
          OR is_coach(e.organisation_id)
        )
    )
  );

CREATE POLICY "attendance_update_admin_coach"
  ON activity_event_attendance FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM activity_events e
      WHERE e.id = activity_event_attendance.event_id
        AND (
          is_admin_or_manager(e.organisation_id)
          OR is_coach(e.organisation_id)
        )
    )
  );

-- Members can update their own attendance
CREATE POLICY "attendance_update_own"
  ON activity_event_attendance FOR UPDATE
  USING (
    member_id IN (
      SELECT m.id FROM members m WHERE m.profile_id = auth.uid()
    )
  );

CREATE POLICY "attendance_delete_admin"
  ON activity_event_attendance FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM activity_events e
      WHERE e.id = activity_event_attendance.event_id
        AND is_admin_or_manager(e.organisation_id)
    )
  );

-- ── activity_standings policies ──────────────────────────────────────────────

CREATE POLICY "standings_select_same_org"
  ON activity_standings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM activities a
      WHERE a.id = activity_standings.activity_id
        AND a.organisation_id = auth_org_id()
    )
  );

CREATE POLICY "standings_insert_admin"
  ON activity_standings FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM activities a
      WHERE a.id = activity_standings.activity_id
        AND is_admin_or_manager(a.organisation_id)
    )
  );

CREATE POLICY "standings_update_admin"
  ON activity_standings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM activities a
      WHERE a.id = activity_standings.activity_id
        AND is_admin_or_manager(a.organisation_id)
    )
  );

CREATE POLICY "standings_delete_admin"
  ON activity_standings FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM activities a
      WHERE a.id = activity_standings.activity_id
        AND is_admin_or_manager(a.organisation_id)
    )
  );

-- ── Indexes ──────────────────────────────────────────────────────────────────

-- organisation_modules
CREATE INDEX idx_org_modules_org ON organisation_modules (organisation_id);

-- activities
CREATE INDEX idx_activities_org ON activities (organisation_id);
CREATE INDEX idx_activities_type ON activities (organisation_id, activity_type);
CREATE INDEX idx_activities_parent ON activities (parent_activity_id);

-- activity_teams
CREATE INDEX idx_activity_teams_activity ON activity_teams (activity_id);
CREATE INDEX idx_activity_teams_org ON activity_teams (organisation_id);
CREATE INDEX idx_activity_teams_coach ON activity_teams (coach_id);
CREATE INDEX idx_activity_teams_source ON activity_teams (source_team_id);

-- activity_team_members
CREATE INDEX idx_activity_team_members_team ON activity_team_members (activity_team_id);
CREATE INDEX idx_activity_team_members_member ON activity_team_members (member_id);

-- activity_events
CREATE INDEX idx_activity_events_activity ON activity_events (activity_id);
CREATE INDEX idx_activity_events_org ON activity_events (organisation_id);
CREATE INDEX idx_activity_events_datetime ON activity_events (date_time);
CREATE INDEX idx_activity_events_status ON activity_events (organisation_id, status);
CREATE INDEX idx_activity_events_home_team ON activity_events (home_team_id);
CREATE INDEX idx_activity_events_away_team ON activity_events (away_team_id);

-- activity_event_attendance
CREATE INDEX idx_event_attendance_event ON activity_event_attendance (event_id);
CREATE INDEX idx_event_attendance_member ON activity_event_attendance (member_id);

-- activity_standings
CREATE INDEX idx_standings_activity ON activity_standings (activity_id);
