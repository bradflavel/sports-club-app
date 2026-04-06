-- Add gender to profiles for trial/division filtering
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS gender text CHECK (gender IN ('male', 'female', 'other'));
