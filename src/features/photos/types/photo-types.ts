export type {
  PhotoAlbum,
  PhotoItem,
} from '@/lib/supabase/database.types';

export interface AlbumFormData {
  name: string;
  description?: string;
  coverPhotoUrl?: string;
}
