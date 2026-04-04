'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Megaphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/shared/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import { AnnouncementCard } from './announcement-card';
import { AnnouncementForm } from './announcement-form';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/hooks/use-user';
import { useToast } from '@/components/ui/use-toast';
import type { AnnouncementWithAuthor } from '@/lib/supabase/database.types';
import { TableSkeleton } from '@/components/shared/loading-skeleton';

export function AnnouncementFeed() {
  const { profile } = useUser();
  const { toast } = useToast();
  const [announcements, setAnnouncements] = useState<AnnouncementWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editAnnouncement, setEditAnnouncement] = useState<AnnouncementWithAuthor | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const canEdit = profile?.role === 'admin' || profile?.role === 'manager';

  const fetchAnnouncements = useCallback(async () => {
    if (!profile?.organisation_id) return;
    const supabase = createClient();
    const { data } = await supabase
      .from('announcements')
      .select('*, author:profiles!announcements_author_id_fkey(*)')
      .eq('organisation_id', profile.organisation_id)
      .order('is_pinned', { ascending: false })
      .order('published_at', { ascending: false });
    setAnnouncements((data as unknown as AnnouncementWithAuthor[]) || []);
    setLoading(false);
  }, [profile?.organisation_id]);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const handleCreate = async (data: {
    title: string;
    content: string;
    isPinned: boolean;
    expiresAt: string | null;
  }) => {
    if (!profile?.organisation_id) return;
    const supabase = createClient();
    const { error } = await supabase.from('announcements').insert({
      organisation_id: profile.organisation_id,
      title: data.title,
      content: data.content,
      is_pinned: data.isPinned,
      published_at: new Date().toISOString(),
      expires_at: data.expiresAt,
      author_id: profile.id,
    });
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Announcement posted' });
    setFormOpen(false);
    fetchAnnouncements();
  };

  const handleUpdate = async (data: {
    title: string;
    content: string;
    isPinned: boolean;
    expiresAt: string | null;
  }) => {
    if (!editAnnouncement) return;
    const supabase = createClient();
    const { error } = await supabase
      .from('announcements')
      .update({
        title: data.title,
        content: data.content,
        is_pinned: data.isPinned,
        expires_at: data.expiresAt,
      })
      .eq('id', editAnnouncement.id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Announcement updated' });
    setEditAnnouncement(null);
    fetchAnnouncements();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const supabase = createClient();
    const { error } = await supabase.from('announcements').delete().eq('id', deleteId);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Announcement deleted' });
    setDeleteId(null);
    fetchAnnouncements();
  };

  if (loading) return <TableSkeleton rows={3} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Announcements"
        actions={
          canEdit ? (
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> New Announcement
            </Button>
          ) : undefined
        }
      />

      {announcements.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title="No announcements yet"
          description="Post your first announcement to keep members informed."
          actionLabel={canEdit ? 'New Announcement' : undefined}
          onAction={canEdit ? () => setFormOpen(true) : undefined}
        />
      ) : (
        <div className="space-y-4">
          {announcements.map((announcement) => (
            <AnnouncementCard
              key={announcement.id}
              announcement={announcement}
              canEdit={canEdit}
              onEdit={() => setEditAnnouncement(announcement)}
              onDelete={() => setDeleteId(announcement.id)}
            />
          ))}
        </div>
      )}

      <AnnouncementForm open={formOpen} onOpenChange={setFormOpen} onSubmit={handleCreate} />

      {editAnnouncement && (
        <AnnouncementForm
          open={!!editAnnouncement}
          onOpenChange={(open) => !open && setEditAnnouncement(null)}
          onSubmit={handleUpdate}
          defaultValues={{
            title: editAnnouncement.title,
            content: editAnnouncement.content,
            isPinned: editAnnouncement.is_pinned,
            expiresAt: editAnnouncement.expires_at,
          }}
        />
      )}

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete Announcement"
        description="Are you sure you want to delete this announcement? This action cannot be undone."
        variant="destructive"
        confirmLabel="Delete"
        onConfirm={handleDelete}
      />
    </div>
  );
}
