-- Migration: 00024_storage_policies.sql
-- Adds storage bucket policies for documents and photos.
-- Documents bucket is private (signed URLs required).
-- Photos bucket is public (direct access allowed).

-- ── Create buckets if they don't exist ────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO UPDATE SET public = false;

INSERT INTO storage.buckets (id, name, public)
VALUES ('photos', 'photos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- ── Documents bucket policies (private) ───────────────────────────────────────

-- Authenticated users in the same org can upload
CREATE POLICY "documents_upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'documents'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth_org_id()::text
  );

-- Authenticated users in the same org can read (via signed URLs)
CREATE POLICY "documents_read"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'documents'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth_org_id()::text
  );

-- Admin/manager can delete
CREATE POLICY "documents_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'documents'
    AND is_admin_or_manager(auth_org_id())
    AND (storage.foldername(name))[1] = auth_org_id()::text
  );

-- ── Photos bucket policies (public read, org-scoped write) ───────────────────

-- Anyone can read photos (public bucket)
CREATE POLICY "photos_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'photos');

-- Authenticated users in the same org can upload
CREATE POLICY "photos_upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'photos'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth_org_id()::text
  );

-- Admin/manager can delete
CREATE POLICY "photos_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'photos'
    AND is_admin_or_manager(auth_org_id())
    AND (storage.foldername(name))[1] = auth_org_id()::text
  );
