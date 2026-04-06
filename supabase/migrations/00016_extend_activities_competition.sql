-- Migration: 00016_extend_activities_competition.sql
-- Adds detailed competition fields and competition_divisions table.

-- ── Extend activities ────────────────────────────────────────────────────────

ALTER TABLE activities
  ADD COLUMN host_name            text,
  ADD COLUMN host_type            text,
  ADD COLUMN registration_opens   date,
  ADD COLUMN registration_closes  date,
  ADD COLUMN first_round_date     date,
  ADD COLUMN finals_start_date    date,
  ADD COLUMN schedule_frequency   text,
  ADD COLUMN has_byes             boolean DEFAULT false,
  ADD COLUMN finals_description   text,
  ADD COLUMN finals_weeks         integer,
  ADD COLUMN trials_required      boolean DEFAULT false,
  ADD COLUMN trial_date           date,
  ADD COLUMN training_required    boolean DEFAULT false,
  ADD COLUMN training_details     text,
  ADD COLUMN round_dates          jsonb;

-- start_date no longer required (new competitions use specific date fields)
ALTER TABLE activities ALTER COLUMN start_date DROP NOT NULL;

-- ── competition_divisions ────────────────────────────────────────────────────

CREATE TABLE competition_divisions (
  id            uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id   uuid    NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  name          text    NOT NULL,
  max_teams     integer,
  age_group     text,
  gender        text,
  display_order integer NOT NULL DEFAULT 0,
  created_at    timestamptz DEFAULT now()
);

-- ── RLS ──────────────────────────────────────────────────────────────────────

ALTER TABLE competition_divisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "comp_divisions_select_same_org"
  ON competition_divisions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM activities a
      WHERE a.id = competition_divisions.activity_id
        AND a.organisation_id = auth_org_id()
    )
  );

CREATE POLICY "comp_divisions_insert_admin"
  ON competition_divisions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM activities a
      WHERE a.id = competition_divisions.activity_id
        AND is_admin_or_manager(a.organisation_id)
    )
  );

CREATE POLICY "comp_divisions_update_admin"
  ON competition_divisions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM activities a
      WHERE a.id = competition_divisions.activity_id
        AND is_admin_or_manager(a.organisation_id)
    )
  );

CREATE POLICY "comp_divisions_delete_admin"
  ON competition_divisions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM activities a
      WHERE a.id = competition_divisions.activity_id
        AND is_admin_or_manager(a.organisation_id)
    )
  );

-- ── Indexes ──────────────────────────────────────────────────────────────────

CREATE INDEX idx_comp_divisions_activity ON competition_divisions (activity_id);
