-- Link a trials activity to a specific competition division
ALTER TABLE activities
  ADD COLUMN IF NOT EXISTS competition_division_id uuid REFERENCES competition_divisions(id) ON DELETE SET NULL;

-- Index for looking up trials by division
CREATE INDEX IF NOT EXISTS idx_activities_competition_division_id ON activities(competition_division_id);
