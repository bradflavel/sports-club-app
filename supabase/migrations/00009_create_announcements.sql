-- Migration: 00009_create_announcements.sql
-- Creates the announcements table

CREATE TABLE announcements (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id uuid        NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  title           text        NOT NULL,
  body            text        NOT NULL,
  is_pinned       boolean     DEFAULT false,
  is_published    boolean     DEFAULT true,
  published_at    timestamptz DEFAULT now(),
  expires_at      timestamptz,
  target_team_id  uuid        REFERENCES teams(id) ON DELETE SET NULL,  -- NULL = all teams
  created_by      uuid        REFERENCES profiles(id) ON DELETE SET NULL,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

CREATE TRIGGER announcements_updated_at
  BEFORE UPDATE ON announcements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
