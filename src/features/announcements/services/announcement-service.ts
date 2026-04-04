import { createClient } from '@/lib/supabase/server';
import type { Announcement, AnnouncementWithAuthor } from '@/lib/supabase/database.types';

export async function getAnnouncements(orgId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('announcements')
    .select('*, author:profiles(*)')
    .eq('organisation_id', orgId)
    .order('is_pinned', { ascending: false })
    .order('published_at', { ascending: false });

  return { data: data as AnnouncementWithAuthor[] | null, error };
}

export async function getAnnouncementById(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('announcements')
    .select('*, author:profiles(*)')
    .eq('id', id)
    .single();

  return { data: data as AnnouncementWithAuthor | null, error };
}

export async function createAnnouncement(announcementData: {
  organisation_id: string;
  title: string;
  content: string;
  author_id: string;
  is_pinned?: boolean;
  published_at?: string;
  expires_at?: string | null;
}) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('announcements')
    .insert({
      organisation_id: announcementData.organisation_id,
      title: announcementData.title,
      content: announcementData.content,
      author_id: announcementData.author_id,
      is_pinned: announcementData.is_pinned ?? false,
      published_at: announcementData.published_at ?? new Date().toISOString(),
      expires_at: announcementData.expires_at ?? null,
    })
    .select('*, author:profiles(*)')
    .single();

  return { data: data as AnnouncementWithAuthor | null, error };
}

export async function updateAnnouncement(
  id: string,
  announcementData: Partial<
    Pick<
      Announcement,
      'title' | 'content' | 'is_pinned' | 'published_at' | 'expires_at'
    >
  >
) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('announcements')
    .update({ ...announcementData, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*, author:profiles(*)')
    .single();

  return { data: data as AnnouncementWithAuthor | null, error };
}

export async function deleteAnnouncement(id: string) {
  const supabase = await createClient();

  const { error } = await supabase.from('announcements').delete().eq('id', id);

  return { data: null, error };
}

export async function getRecentAnnouncements(orgId: string, limit = 5) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('announcements')
    .select('*, author:profiles(*)')
    .eq('organisation_id', orgId)
    .order('published_at', { ascending: false })
    .limit(limit);

  return { data: data as AnnouncementWithAuthor[] | null, error };
}
