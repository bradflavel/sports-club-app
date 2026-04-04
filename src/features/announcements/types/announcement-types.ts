export type {
  Announcement,
  AnnouncementWithAuthor,
} from '@/lib/supabase/database.types';

export interface AnnouncementFormData {
  title: string;
  content: string;
  isPinned: boolean;
  publishedAt: string;
  expiresAt?: string;
}
