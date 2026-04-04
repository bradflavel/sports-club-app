-- Migration: 00009_create_announcements.sql
-- Creates the announcements table

CREATE TABLE announcements (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id uuid        NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  title           text        NOT NULL,
  content         text        NOT NULL,
  author_id       uuid        NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  is_pinned       boolean     NOT NULL DEFAULT false,
  published_at    timestamptz NOT NULL DEFAULT now(),
  expires_at      timestamptz,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

CREATE TRIGGER announcements_updated_at
  BEFORE UPDATE ON announcements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
