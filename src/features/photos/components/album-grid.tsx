'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Camera } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/shared/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import { AlbumForm } from './album-form';
import {
  getAlbumsClient,
  createAlbumClient,
} from '@/features/photos/services/photo-client-service';
import { useUser } from '@/hooks/use-user';
import { useToast } from '@/components/ui/use-toast';
import Image from 'next/image';
import { formatDate } from '@/lib/format';
import type { PhotoAlbum } from '@/lib/supabase/database.types';
import { CardSkeleton } from '@/components/shared/loading-skeleton';

export function AlbumGrid() {
  const { profile } = useUser();
  const { toast } = useToast();
  const [albums, setAlbums] = useState<PhotoAlbum[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const canEdit = profile?.role === 'admin' || profile?.role === 'manager';

  const fetchAlbums = useCallback(async () => {
    if (!profile?.organisation_id) return;
    const { data } = await getAlbumsClient(profile.organisation_id);
    setAlbums(data || []);
    setLoading(false);
  }, [profile?.organisation_id]);

  useEffect(() => {
    fetchAlbums();
  }, [fetchAlbums]);

  const handleCreate = async (data: { name: string; description: string }) => {
    if (!profile?.organisation_id) return;
    const { error } = await createAlbumClient({
      organisation_id: profile.organisation_id,
      name: data.name,
      description: data.description || null,
      cover_photo_url: null,
      created_by: profile.id,
    });
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Album created' });
    setFormOpen(false);
    fetchAlbums();
  };

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Photos"
        actions={
          canEdit ? (
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Create Album
            </Button>
          ) : undefined
        }
      />

      {albums.length === 0 ? (
        <EmptyState
          icon={Camera}
          title="No photo albums yet"
          description="Create your first album to start sharing photos."
          actionLabel={canEdit ? 'Create Album' : undefined}
          onAction={canEdit ? () => setFormOpen(true) : undefined}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {albums.map((album) => (
            <Link key={album.id} href={`/photos/${album.id}`}>
              <div className="group overflow-hidden rounded-lg border bg-card shadow-sm transition-shadow hover:shadow-md">
                <div className="relative aspect-video bg-muted">
                  {album.cover_photo_url ? (
                    <Image
                      src={album.cover_photo_url}
                      alt={album.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <Camera className="h-12 w-12 text-muted-foreground/50" />
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold group-hover:text-primary">{album.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {album.photo_count} photos &middot; {formatDate(album.created_at)}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <AlbumForm open={formOpen} onOpenChange={setFormOpen} onSubmit={handleCreate} />
    </div>
  );
}
