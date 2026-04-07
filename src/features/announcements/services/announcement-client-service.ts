import { createClient } from '@/lib/supabase/client';
import type { Announcement, AnnouncementWithAuthor } from '@/lib/supabase/database.types';

export async function getAnnouncementsClient(orgId: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('announcements')
    .select('*, author:profiles!announcements_author_id_fkey(*)')
    .eq('organisation_id', orgId)
    .order('is_pinned', { ascending: false })
    .order('published_at', { ascending: false });

  return { data: (data as unknown as AnnouncementWithAuthor[]) ?? null, error };
}

export async function createAnnouncementClient(announcementData: {
  organisation_id: string;
  title: string;
  content: string;
  author_id: string;
  is_pinned?: boolean;
  published_at?: string;
  expires_at?: string | null;
}) {
  const supabase = createClient();

  const { error } = await supabase.from('announcements').insert({
    organisation_id: announcementData.organisation_id,
    title: announcementData.title,
    content: announcementData.content,
    is_pinned: announcementData.is_pinned ?? false,
    published_at: announcementData.published_at ?? new Date().toISOString(),
    expires_at: announcementData.expires_at ?? null,
    author_id: announcementData.author_id,
  });

  return { error };
}

export async function updateAnnouncementClient(
  id: string,
  announcementData: Partial<
    Pick<Announcement, 'title' | 'content' | 'is_pinned' | 'expires_at'>
  >
) {
  const supabase = createClient();

  const { error } = await supabase
    .from('announcements')
    .update(announcementData)
    .eq('id', id);

  return { error };
}

export async function deleteAnnouncementClient(id: string) {
  const supabase = createClient();

  const { error } = await supabase.from('announcements').delete().eq('id', id);

  return { error };
}
