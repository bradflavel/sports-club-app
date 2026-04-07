'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/shared/page-header';
import { PhotoGallery } from '@/features/photos/components/photo-gallery';
import { PhotoUpload } from '@/features/photos/components/photo-upload';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/use-auth-context';
import { useToast } from '@/components/ui/use-toast';
import { formatDate } from '@/lib/format';
import type { PhotoAlbum, PhotoItem } from '@/lib/supabase/database.types';
import { TableSkeleton } from '@/components/shared/loading-skeleton';

export default function AlbumDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { profile } = useAuth();
  const { toast } = useToast();
  const [album, setAlbum] = useState<PhotoAlbum | null>(null);
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [deleteAlbumOpen, setDeleteAlbumOpen] = useState(false);
  const canEdit = profile?.role === 'admin' || profile?.role === 'manager';

  const fetchData = useCallback(async () => {
    const supabase = createClient();
    const [albumRes, photosRes] = await Promise.all([
      supabase.from('photo_albums').select('*').eq('id', id).single(),
      supabase
        .from('photo_items')
        .select('*')
        .eq('album_id', id)
        .order('created_at', { ascending: false }),
    ]);
    setAlbum(albumRes.data as unknown as PhotoAlbum | null);
    setPhotos((photosRes.data || []) as unknown as PhotoItem[]);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleUpload = async (files: File[]) => {
    if (!profile?.organisation_id) return;
    const supabase = createClient();

    for (const file of files) {
      const filePath = `${profile.organisation_id}/${id}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from('photos').upload(filePath, file);
      if (uploadError) continue;

      const { data: urlData } = supabase.storage.from('photos').getPublicUrl(filePath);
      await supabase.from('photo_items').insert({
        album_id: id,
        file_url: urlData.publicUrl,
        thumbnail_url: null,
        caption: null,
        uploaded_by: profile.id,
        width: null,
        height: null,
      });
    }

    toast({ title: `${files.length} photo(s) uploaded` });
    setShowUpload(false);
    fetchData();
  };

  const handleDeletePhoto = async (photoId: string) => {
    const supabase = createClient();
    // Get file URL before deleting
    const { data: photo } = await supabase.from('photo_items').select('file_url').eq('id', photoId).single();
    await supabase.from('photo_items').delete().eq('id', photoId);
    // Remove the storage object
    if (photo?.file_url) {
      const path = photo.file_url.split('/storage/v1/object/public/photos/')[1];
      if (path) await supabase.storage.from('photos').remove([decodeURIComponent(path)]);
    }
    toast({ title: 'Photo deleted' });
    fetchData();
  };

  const handleDeleteAlbum = async () => {
    const supabase = createClient();
    await supabase.from('photo_albums').delete().eq('id', id);
    toast({ title: 'Album deleted' });
    window.location.href = '/photos';
  };

  if (loading) return <TableSkeleton rows={4} />;
  if (!album) return <p>Album not found.</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/photos">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <PageHeader
          title={album.name}
          description={
            `${album.photo_count} photos · Created ${formatDate(album.created_at)}` +
            (album.description ? ` · ${album.description}` : '')
          }
          actions={
            canEdit ? (
              <div className="flex gap-2">
                <Button onClick={() => setShowUpload(!showUpload)}>
                  <Plus className="mr-2 h-4 w-4" /> Upload Photos
                </Button>
                <Button variant="destructive" size="icon" onClick={() => setDeleteAlbumOpen(true)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ) : undefined
          }
        />
      </div>

      {showUpload && <PhotoUpload onUpload={handleUpload} />}

      <PhotoGallery photos={photos} canDelete={canEdit} onDeletePhoto={handleDeletePhoto} />

      <ConfirmDialog
        open={deleteAlbumOpen}
        onOpenChange={setDeleteAlbumOpen}
        title="Delete Album"
        description={`Are you sure you want to delete "${album.name}" and all its photos?`}
        variant="destructive"
        confirmLabel="Delete Album"
        onConfirm={handleDeleteAlbum}
      />
    </div>
  );
}
