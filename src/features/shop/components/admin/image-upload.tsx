'use client';

import { useState } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface ImageUploadProps {
  orgId: string;
  imageUrls: string[];
  onImagesChange: (urls: string[]) => void;
}

export function ImageUpload({ orgId, imageUrls, onImagesChange }: ImageUploadProps) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const supabase = createClient();
    const newUrls: string[] = [];

    for (const file of Array.from(files)) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${orgId}/products/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('shop-products')
        .upload(fileName, file, { contentType: file.type });

      if (uploadError) {
        toast({ title: 'Upload failed', description: uploadError.message, variant: 'destructive' });
        continue;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('shop-products')
        .getPublicUrl(fileName);

      newUrls.push(publicUrl);
    }

    onImagesChange([...imageUrls, ...newUrls]);
    setUploading(false);
    e.target.value = '';
  }

  function handleRemove(index: number) {
    const updated = imageUrls.filter((_, i) => i !== index);
    onImagesChange(updated);
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        {imageUrls.map((url, i) => (
          <div key={i} className="group relative h-24 w-24 overflow-hidden rounded-md border">
            <Image src={url} alt="" fill className="object-cover" />
            <button
              type="button"
              onClick={() => handleRemove(i)}
              className="absolute right-1 top-1 rounded-full bg-black/60 p-1 opacity-0 transition-opacity group-hover:opacity-100"
            >
              <X className="h-3 w-3 text-white" />
            </button>
          </div>
        ))}
        <label className="flex h-24 w-24 cursor-pointer items-center justify-center rounded-md border-2 border-dashed border-muted-foreground/25 transition-colors hover:border-muted-foreground/50">
          {uploading ? (
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          ) : (
            <Upload className="h-6 w-6 text-muted-foreground" />
          )}
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleUpload}
            className="hidden"
            disabled={uploading}
          />
        </label>
      </div>
    </div>
  );
}
