-- Migration: 00002_create_organisations.sql
-- Creates the organisations table (top-level multi-tenancy entity)

CREATE TABLE organisations (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name             text        NOT NULL,
  slug             text        UNIQUE NOT NULL,
  sport_type       sport_type  NOT NULL,
  logo_url         text,
  primary_colour   text        DEFAULT '#1e40af',
  secondary_colour text        DEFAULT '#ffffff',
  contact_email    text,
  contact_phone    text,
  address          text,
  website          text,
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);

-- Auto-update updated_at on row modification
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER organisations_updated_at
  BEFORE UPDATE ON organisations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
