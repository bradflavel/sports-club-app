import { createClient } from '@/lib/supabase/server';
import type { PhotoAlbum, PhotoItem } from '@/lib/supabase/database.types';

const PHOTOS_BUCKET = 'photos';

export async function getAlbums(orgId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('photo_albums')
    .select('*')
    .eq('organisation_id', orgId)
    .order('created_at', { ascending: false });

  return { data: data as PhotoAlbum[] | null, error };
}

export async function getAlbumById(id: string) {
  const supabase = await createClient();

  const { data: album, error: albumError } = await supabase
    .from('photo_albums')
    .select('*')
    .eq('id', id)
    .single();

  if (albumError) return { data: null, error: albumError };

  const { data: photos, error: photosError } = await supabase
    .from('photo_items')
    .select('*')
    .eq('album_id', id)
    .order('created_at', { ascending: true });

  if (photosError) return { data: null, error: photosError };

  return {
    data: { ...(album as PhotoAlbum), photos: photos as PhotoItem[] },
    error: null,
  };
}

export async function createAlbum(albumData: {
  organisation_id: string;
  name: string;
  description?: string | null;
  cover_photo_url?: string | null;
  created_by: string;
}) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('photo_albums')
    .insert({
      organisation_id: albumData.organisation_id,
      name: albumData.name,
      description: albumData.description ?? null,
      cover_photo_url: albumData.cover_photo_url ?? null,
      created_by: albumData.created_by,
    })
    .select()
    .single();

  return { data: data as PhotoAlbum | null, error };
}

export async function updateAlbum(
  id: string,
  albumData: Partial<Pick<PhotoAlbum, 'name' | 'description' | 'cover_photo_url'>>
) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('photo_albums')
    .update({ ...albumData, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  return { data: data as PhotoAlbum | null, error };
}

export async function deleteAlbum(id: string) {
  const supabase = await createClient();

  // Fetch all photos in the album to remove from storage
  const { data: photos } = await supabase
    .from('photo_items')
    .select('file_url')
    .eq('album_id', id);

  // Delete all photo records (cascade may handle this, but be explicit)
  await supabase.from('photo_items').delete().eq('album_id', id);

  // Delete storage files
  if (photos && photos.length > 0) {
    const filePaths = photos
      .map((p) => {
        try {
          const urlPath = new URL(p.file_url).pathname;
          const bucketPrefix = `/storage/v1/object/public/${PHOTOS_BUCKET}/`;
          return urlPath.startsWith(bucketPrefix)
            ? urlPath.slice(bucketPrefix.length)
            : null;
        } catch {
          return null;
        }
      })
      .filter((p): p is string => p !== null);

    if (filePaths.length > 0) {
      await supabase.storage.from(PHOTOS_BUCKET).remove(filePaths);
    }
  }

  const { error } = await supabase
    .from('photo_albums')
    .delete()
    .eq('id', id);

  return { data: null, error };
}

export async function getAlbumPhotos(albumId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('photo_items')
    .select('*')
    .eq('album_id', albumId)
    .order('created_at', { ascending: true });

  return { data: data as PhotoItem[] | null, error };
}

export async function uploadPhoto(
  albumId: string,
  file: File,
  caption?: string | null,
  uploadedBy?: string
) {
  const supabase = await createClient();

  const fileExt = file.name.split('.').pop();
  const fileName = `${albumId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from(PHOTOS_BUCKET)
    .upload(fileName, file, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) return { data: null, error: uploadError };

  const {
    data: { publicUrl },
  } = supabase.storage.from(PHOTOS_BUCKET).getPublicUrl(fileName);

  const { data, error } = await supabase
    .from('photo_items')
    .insert({
      album_id: albumId,
      file_url: publicUrl,
      thumbnail_url: null,
      caption: caption ?? null,
      uploaded_by: uploadedBy ?? '',
      width: null,
      height: null,
    })
    .select()
    .single();

  if (error) return { data: null, error };

  // Increment the album's photo_count
  await supabase.rpc('increment_photo_count' as never, { album_id: albumId } as never).maybeSingle();

  return { data: data as PhotoItem | null, error: null };
}

export async function deletePhoto(id: string) {
  const supabase = await createClient();

  const { data: photo, error: fetchError } = await supabase
    .from('photo_items')
    .select('file_url, album_id')
    .eq('id', id)
    .single();

  if (fetchError) return { data: null, error: fetchError };

  const { error: deleteError } = await supabase
    .from('photo_items')
    .delete()
    .eq('id', id);

  if (deleteError) return { data: null, error: deleteError };

  // Best-effort storage deletion
  if (photo?.file_url) {
    try {
      const urlPath = new URL(photo.file_url).pathname;
      const bucketPrefix = `/storage/v1/object/public/${PHOTOS_BUCKET}/`;
      const filePath = urlPath.startsWith(bucketPrefix)
        ? urlPath.slice(bucketPrefix.length)
        : null;

      if (filePath) {
        await supabase.storage.from(PHOTOS_BUCKET).remove([filePath]);
      }
    } catch {
      // Non-fatal
    }
  }

  return { data: null, error: null };
}

export async function updatePhotoCaption(id: string, caption: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('photo_items')
    .update({ caption })
    .eq('id', id)
    .select()
    .single();

  return { data: data as PhotoItem | null, error };
}
