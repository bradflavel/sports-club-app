import { createClient } from '@/lib/supabase/client';
import type { PhotoAlbum } from '@/lib/supabase/database.types';

export async function getAlbumsClient(orgId: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('photo_albums')
    .select('*')
    .eq('organisation_id', orgId)
    .order('created_at', { ascending: false });

  return { data: (data as PhotoAlbum[] | null) ?? null, error };
}

export async function createAlbumClient(albumData: {
  organisation_id: string;
  name: string;
  description?: string | null;
  cover_photo_url?: string | null;
  created_by: string;
}) {
  const supabase = createClient();

  const { error } = await supabase.from('photo_albums').insert({
    organisation_id: albumData.organisation_id,
    name: albumData.name,
    description: albumData.description ?? null,
    cover_photo_url: albumData.cover_photo_url ?? null,
    created_by: albumData.created_by,
  });

  return { error };
}
