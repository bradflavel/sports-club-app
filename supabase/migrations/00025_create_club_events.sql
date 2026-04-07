-- Migration: 00025_create_club_events.sql
-- Creates club_events and club_event_registrations tables
-- Also extends club_venues with categories

-- ── Extend club_venues with categories ────────────────────────────────────────

ALTER TABLE club_venues ADD COLUMN categories text[] NOT NULL DEFAULT '{}';

-- ── Club Events ───────────────────────────────────────────────────────────────

CREATE TABLE club_events (
  id                           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id              uuid        NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  name                         text        NOT NULL,
  description                  text,
  event_type                   text        NOT NULL DEFAULT 'social',
  status                       text        NOT NULL DEFAULT 'draft',
  start_time                   timestamptz NOT NULL,
  end_time                     timestamptz,
  -- Venue
  venue_id                     uuid        REFERENCES club_venues(id) ON DELETE SET NULL,
  venue_name                   text,
  venue_address                text,
  -- Capacity
  max_attendees                integer,
  enable_waitlist              boolean     NOT NULL DEFAULT false,
  -- Cost
  cost_cents                   integer     NOT NULL DEFAULT 0,
  cost_description             text,
  -- Registration
  registration_required        boolean     NOT NULL DEFAULT true,
  registration_opens           timestamptz,
  registration_closes          timestamptz,
  registration_requires_approval boolean   NOT NULL DEFAULT false,
  -- Guests
  allow_guests                 boolean     NOT NULL DEFAULT false,
  max_guests_per_member        integer     NOT NULL DEFAULT 1,
  -- Dietary / special
  collect_dietary_requirements boolean     NOT NULL DEFAULT false,
  -- Food & drink
  food_provided                boolean     NOT NULL DEFAULT false,
  alcohol_provided             boolean     NOT NULL DEFAULT false,
  is_adults_only               boolean     NOT NULL DEFAULT false,
  -- Contact
  contact_name                 text,
  contact_email                text,
  contact_phone                text,
  -- Visibility
  is_members_only              boolean     NOT NULL DEFAULT true,
  -- Media
  cover_image_url              text,
  -- Admin
  notes                        text,
  created_by                   uuid        REFERENCES profiles(id) ON DELETE SET NULL,
  created_at                   timestamptz DEFAULT now(),
  updated_at                   timestamptz DEFAULT now()
);

CREATE TRIGGER club_events_updated_at
  BEFORE UPDATE ON club_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── Club Event Registrations ──────────────────────────────────────────────────

CREATE TABLE club_event_registrations (
  id                     uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id               uuid        NOT NULL REFERENCES club_events(id) ON DELETE CASCADE,
  member_id              uuid        NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  status                 text        NOT NULL DEFAULT 'registered',
  guest_count            integer     NOT NULL DEFAULT 0,
  guest_names            text,
  dietary_requirements   text,
  notes                  text,
  registered_at          timestamptz NOT NULL DEFAULT now(),
  approved_at            timestamptz,
  cancelled_at           timestamptz,
  created_at             timestamptz DEFAULT now(),
  updated_at             timestamptz DEFAULT now(),
  CONSTRAINT club_event_registrations_unique UNIQUE (event_id, member_id)
);

CREATE TRIGGER club_event_registrations_updated_at
  BEFORE UPDATE ON club_event_registrations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── RLS ───────────────────────────────────────────────────────────────────────

ALTER TABLE club_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_event_registrations ENABLE ROW LEVEL SECURITY;

-- Events: all org members can read published events
CREATE POLICY "club_events_select_published"
  ON club_events FOR SELECT
  USING (
    organisation_id = auth_org_id()
    AND status != 'draft'
  );

-- Events: admins/managers can read all (including drafts)
CREATE POLICY "club_events_select_admin"
  ON club_events FOR SELECT
  USING (is_admin_or_manager(organisation_id));

-- Events: admins/managers can create
CREATE POLICY "club_events_insert_admin"
  ON club_events FOR INSERT
  WITH CHECK (is_admin_or_manager(organisation_id));

-- Events: admins/managers can update
CREATE POLICY "club_events_update_admin"
  ON club_events FOR UPDATE
  USING (is_admin_or_manager(organisation_id));

-- Events: admins/managers can delete
CREATE POLICY "club_events_delete_admin"
  ON club_events FOR DELETE
  USING (is_admin_or_manager(organisation_id));

-- Registrations: members can read their own
CREATE POLICY "club_event_registrations_select_own"
  ON club_event_registrations FOR SELECT
  USING (
    member_id IN (SELECT id FROM members WHERE profile_id = auth.uid())
  );

-- Registrations: admins/managers can read all for their org's events
CREATE POLICY "club_event_registrations_select_admin"
  ON club_event_registrations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM club_events ce
      WHERE ce.id = club_event_registrations.event_id
        AND is_admin_or_manager(ce.organisation_id)
    )
  );

-- Registrations: members can insert their own
CREATE POLICY "club_event_registrations_insert_own"
  ON club_event_registrations FOR INSERT
  WITH CHECK (
    member_id IN (SELECT id FROM members WHERE profile_id = auth.uid())
  );

-- Registrations: members can update their own (cancel, change dietary, guests)
CREATE POLICY "club_event_registrations_update_own"
  ON club_event_registrations FOR UPDATE
  USING (
    member_id IN (SELECT id FROM members WHERE profile_id = auth.uid())
  );

-- Registrations: admins can update any (approve, mark attended)
CREATE POLICY "club_event_registrations_update_admin"
  ON club_event_registrations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM club_events ce
      WHERE ce.id = club_event_registrations.event_id
        AND is_admin_or_manager(ce.organisation_id)
    )
  );

-- Registrations: members can delete their own
CREATE POLICY "club_event_registrations_delete_own"
  ON club_event_registrations FOR DELETE
  USING (
    member_id IN (SELECT id FROM members WHERE profile_id = auth.uid())
  );

-- Registrations: admins can delete any
CREATE POLICY "club_event_registrations_delete_admin"
  ON club_event_registrations FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM club_events ce
      WHERE ce.id = club_event_registrations.event_id
        AND is_admin_or_manager(ce.organisation_id)
    )
  );

-- ── Indexes ───────────────────────────────────────────────────────────────────

CREATE INDEX idx_club_events_org ON club_events (organisation_id);
CREATE INDEX idx_club_events_start_time ON club_events (start_time);
CREATE INDEX idx_club_events_status ON club_events (organisation_id, status);
CREATE INDEX idx_club_events_type ON club_events (organisation_id, event_type);
CREATE INDEX idx_club_event_registrations_event ON club_event_registrations (event_id);
CREATE INDEX idx_club_event_registrations_member ON club_event_registrations (member_id);
CREATE INDEX idx_club_event_registrations_status ON club_event_registrations (event_id, status);
CREATE INDEX idx_club_venues_categories ON club_venues USING gin (categories);
