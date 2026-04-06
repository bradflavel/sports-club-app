-- Add 'trials' to activity_type enum
ALTER TYPE activity_type ADD VALUE IF NOT EXISTS 'trials';

-- Add trial fee columns to activities table
ALTER TABLE activities
  ADD COLUMN IF NOT EXISTS trial_fee_type text CHECK (trial_fee_type IN ('one_time', 'per_trial')),
  ADD COLUMN IF NOT EXISTS trial_fee_amount_cents integer DEFAULT 0;

-- Junction table: which divisions trial on which event dates
CREATE TABLE IF NOT EXISTS trial_event_divisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES activity_events(id) ON DELETE CASCADE,
  division_id uuid NOT NULL REFERENCES competition_divisions(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(event_id, division_id)
);

-- Add 'trial_fee' to payment_type enum
ALTER TYPE payment_type ADD VALUE IF NOT EXISTS 'trial_fee';

-- RLS for trial_event_divisions
ALTER TABLE trial_event_divisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "trial_event_divisions_select_same_org"
  ON trial_event_divisions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM activity_events ae
      JOIN activities a ON a.id = ae.activity_id
      WHERE ae.id = trial_event_divisions.event_id
        AND a.organisation_id = auth_org_id()
    )
  );

CREATE POLICY "trial_event_divisions_insert_admin"
  ON trial_event_divisions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM activity_events ae
      JOIN activities a ON a.id = ae.activity_id
      WHERE ae.id = trial_event_divisions.event_id
        AND is_admin_or_manager(a.organisation_id)
    )
  );

CREATE POLICY "trial_event_divisions_update_admin"
  ON trial_event_divisions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM activity_events ae
      JOIN activities a ON a.id = ae.activity_id
      WHERE ae.id = trial_event_divisions.event_id
        AND is_admin_or_manager(a.organisation_id)
    )
  );

CREATE POLICY "trial_event_divisions_delete_admin"
  ON trial_event_divisions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM activity_events ae
      JOIN activities a ON a.id = ae.activity_id
      WHERE ae.id = trial_event_divisions.event_id
        AND is_admin_or_manager(a.organisation_id)
    )
  );

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_trial_event_divisions_event_id ON trial_event_divisions(event_id);
CREATE INDEX IF NOT EXISTS idx_trial_event_divisions_division_id ON trial_event_divisions(division_id);
