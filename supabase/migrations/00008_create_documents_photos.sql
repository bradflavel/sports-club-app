-- Migration: 00008_create_documents_photos.sql
-- Creates documents, photo_albums, and photo_items tables
-- Includes trigger to keep photo_albums.photo_count in sync

-- ── Documents ─────────────────────────────────────────────────────────────────

CREATE TABLE documents (
  id              uuid              PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id uuid              NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  title           text              NOT NULL,
  description     text,
  file_url        text              NOT NULL,
  file_name       text              NOT NULL,
  file_size_bytes integer,
  file_type       text,
  uploaded_by     uuid              NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  category        document_category NOT NULL DEFAULT 'other',
  is_public       boolean           NOT NULL DEFAULT false,
  created_at      timestamptz       DEFAULT now()
);

-- ── Photo Albums ──────────────────────────────────────────────────────────────

CREATE TABLE photo_albums (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id uuid        NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  name            text        NOT NULL,
  description     text,
  cover_photo_url text,
  created_by      uuid        NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  photo_count     integer     NOT NULL DEFAULT 0,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

CREATE TRIGGER photo_albums_updated_at
  BEFORE UPDATE ON photo_albums
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── Photo Items ───────────────────────────────────────────────────────────────

CREATE TABLE photo_items (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  album_id      uuid        NOT NULL REFERENCES photo_albums(id) ON DELETE CASCADE,
  file_url      text        NOT NULL,
  thumbnail_url text,
  caption       text,
  uploaded_by   uuid        NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  width         integer,
  height        integer,
  created_at    timestamptz DEFAULT now()
);

-- ── Trigger: keep photo_count in sync ────────────────────────────────────────

CREATE OR REPLACE FUNCTION sync_photo_album_count()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE photo_albums
    SET photo_count = photo_count + 1,
        updated_at  = now()
    WHERE id = NEW.album_id;
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE photo_albums
    SET photo_count = GREATEST(photo_count - 1, 0),
        updated_at  = now()
    WHERE id = OLD.album_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER photo_items_count_insert
  AFTER INSERT ON photo_items
  FOR EACH ROW EXECUTE FUNCTION sync_photo_album_count();

CREATE TRIGGER photo_items_count_delete
  AFTER DELETE ON photo_items
  FOR EACH ROW EXECUTE FUNCTION sync_photo_album_count();
