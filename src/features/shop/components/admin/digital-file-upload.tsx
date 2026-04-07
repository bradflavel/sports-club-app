'use client';

import { useState } from 'react';
import { Upload, FileText, X, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface DigitalFileUploadProps {
  orgId: string;
  fileUrls: string[];
  onFilesChange: (urls: string[]) => void;
}

export function DigitalFileUpload({ orgId, fileUrls, onFilesChange }: DigitalFileUploadProps) {
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
      const fileName = `${orgId}/digital/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('shop-digital')
        .upload(fileName, file, { contentType: file.type });

      if (uploadError) {
        toast({ title: 'Upload failed', description: uploadError.message, variant: 'destructive' });
        continue;
      }

      newUrls.push(fileName);
    }

    onFilesChange([...fileUrls, ...newUrls]);
    setUploading(false);
    e.target.value = '';
  }

  function handleRemove(index: number) {
    const updated = fileUrls.filter((_, i) => i !== index);
    onFilesChange(updated);
  }

  return (
    <div className="space-y-3">
      {fileUrls.length > 0 && (
        <div className="space-y-2">
          {fileUrls.map((url, i) => (
            <div key={i} className="flex items-center gap-2 rounded-md border p-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="flex-1 truncate text-sm">{url.split('/').pop()}</span>
              <button type="button" onClick={() => handleRemove(i)}>
                <X className="h-4 w-4 text-muted-foreground hover:text-destructive" />
              </button>
            </div>
          ))}
        </div>
      )}
      <label className="flex cursor-pointer items-center gap-2 rounded-md border-2 border-dashed p-4 transition-colors hover:border-muted-foreground/50">
        {uploading ? (
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        ) : (
          <Upload className="h-5 w-5 text-muted-foreground" />
        )}
        <span className="text-sm text-muted-foreground">
          {uploading ? 'Uploading...' : 'Upload digital files'}
        </span>
        <input
          type="file"
          multiple
          onChange={handleUpload}
          className="hidden"
          disabled={uploading}
        />
      </label>
    </div>
  );
}
