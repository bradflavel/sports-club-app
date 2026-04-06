-- Add draft mode, skill level, and commitment level to activities

ALTER TABLE activities
  ADD COLUMN IF NOT EXISTS is_draft boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS skill_level text DEFAULT NULL
    CHECK (skill_level IS NULL OR skill_level IN ('beginner', 'intermediate', 'advanced', 'elite', 'all_levels')),
  ADD COLUMN IF NOT EXISTS commitment_level text DEFAULT NULL
    CHECK (commitment_level IS NULL OR commitment_level IN ('casual', 'regular', 'committed', 'competitive'));

COMMENT ON COLUMN activities.is_draft IS 'When true, activity is not visible to non-admin members';
COMMENT ON COLUMN activities.skill_level IS 'Expected skill level: beginner, intermediate, advanced, elite, all_levels';
COMMENT ON COLUMN activities.commitment_level IS 'Expected commitment: casual, regular, committed, competitive';
