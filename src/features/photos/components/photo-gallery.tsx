'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import type { PhotoItem } from '@/lib/supabase/database.types';

interface PhotoGalleryProps {
  photos: PhotoItem[];
  onDeletePhoto?: (id: string) => void;
  canDelete?: boolean;
}

export function PhotoGallery({ photos, onDeletePhoto, canDelete = false }: PhotoGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const selectedPhoto = selectedIndex !== null ? photos[selectedIndex] : null;

  const goNext = () => {
    if (selectedIndex !== null && selectedIndex < photos.length - 1) {
      setSelectedIndex(selectedIndex + 1);
    }
  };

  const goPrev = () => {
    if (selectedIndex !== null && selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1);
    }
  };

  return (
    <>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
        {photos.map((photo, index) => (
          <div
            key={photo.id}
            className="group relative aspect-square cursor-pointer overflow-hidden rounded-lg bg-muted"
            onClick={() => setSelectedIndex(index)}
          >
            <Image
              src={photo.thumbnail_url || photo.file_url}
              alt={photo.caption || 'Photo'}
              fill
              className="object-cover transition-transform group-hover:scale-105"
            />
            {photo.caption && (
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 p-2 opacity-0 transition-opacity group-hover:opacity-100">
                <p className="text-xs text-white truncate">{photo.caption}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      <Dialog open={selectedIndex !== null} onOpenChange={() => setSelectedIndex(null)}>
        <DialogContent className="max-w-4xl border-0 bg-black/90 p-0">
          <div className="relative flex flex-col items-center">
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-2 z-10 text-white hover:bg-white/20"
              onClick={() => setSelectedIndex(null)}
            >
              <X className="h-5 w-5" />
            </Button>

            {selectedPhoto && (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selectedPhoto.file_url}
                  alt={selectedPhoto.caption || 'Photo'}
                  className="max-h-[80vh] object-contain"
                />
                {selectedPhoto.caption && (
                  <p className="mt-2 px-4 pb-4 text-sm text-white">{selectedPhoto.caption}</p>
                )}
              </>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
              onClick={goPrev}
              disabled={selectedIndex === 0}
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
              onClick={goNext}
              disabled={selectedIndex === photos.length - 1}
            >
              <ChevronRight className="h-6 w-6" />
            </Button>

            {canDelete && selectedPhoto && (
              <div className="absolute bottom-2 right-2">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    onDeletePhoto?.(selectedPhoto.id);
                    setSelectedIndex(null);
                  }}
                >
                  Delete
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
