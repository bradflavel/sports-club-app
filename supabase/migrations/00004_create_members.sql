-- Migration: 00004_create_members.sql
-- Creates the members table linking profiles to organisations with membership details

CREATE TABLE members (
  id                uuid             PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id        uuid             NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  organisation_id   uuid             NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  membership_number text,
  membership_type   membership_type  NOT NULL DEFAULT 'senior',
  membership_status membership_status NOT NULL DEFAULT 'pending',
  join_date         date             NOT NULL DEFAULT CURRENT_DATE,
  renewal_date      date,
  jersey_number     text,
  position          text,
  notes             text,
  medical_notes     text,
  wwc_number        text,                       -- Working With Children check
  wwc_expiry        date,
  created_at        timestamptz      DEFAULT now(),
  updated_at        timestamptz      DEFAULT now(),

  CONSTRAINT members_profile_org_unique UNIQUE (profile_id, organisation_id)
);

CREATE TRIGGER members_updated_at
  BEFORE UPDATE ON members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
