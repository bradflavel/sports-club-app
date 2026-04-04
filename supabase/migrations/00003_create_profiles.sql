-- Migration: 00003_create_profiles.sql
-- Creates the profiles table (extends auth.users) and auto-creation trigger

CREATE TABLE profiles (
  id                      uuid      PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  first_name              text      NOT NULL,
  last_name               text      NOT NULL,
  email                   text      NOT NULL,
  phone                   text,
  date_of_birth           date,
  avatar_url              text,
  organisation_id         uuid      REFERENCES organisations(id),
  role                    user_role DEFAULT 'member',
  emergency_contact_name  text,
  emergency_contact_phone text,
  created_at              timestamptz DEFAULT now(),
  updated_at              timestamptz DEFAULT now()
);

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Automatically create a minimal profile row whenever a new auth user is created.
-- The application should update first_name / last_name after sign-up.
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
