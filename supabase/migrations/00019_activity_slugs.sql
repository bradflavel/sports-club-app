-- Add slug column to activities
ALTER TABLE activities
  ADD COLUMN IF NOT EXISTS slug text;

-- Backfill slugs for existing activities using name + first 4 chars of id
UPDATE activities
SET slug = LOWER(
  REGEXP_REPLACE(
    REGEXP_REPLACE(name, '[^a-zA-Z0-9 ]', '', 'g'),
    '\s+', '-', 'g'
  )
) || '-' || LEFT(id::text, 4)
WHERE slug IS NULL;

-- Make slug NOT NULL after backfill
ALTER TABLE activities ALTER COLUMN slug SET NOT NULL;

-- Unique slug per organisation (different orgs can have the same slug)
CREATE UNIQUE INDEX IF NOT EXISTS idx_activities_slug_org
  ON activities(organisation_id, slug);
