'use client';

import { useState } from 'react';
import { Upload, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface PhotoUploadProps {
  onUpload: (files: File[]) => Promise<void>;
}

export function PhotoUpload({ onUpload }: PhotoUploadProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFiles = (newFiles: FileList | null) => {
    if (!newFiles) return;
    const fileArray = Array.from(newFiles).filter((f) => f.type.startsWith('image/'));
    setFiles((prev) => [...prev, ...fileArray]);

    fileArray.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviews((prev) => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    setUploading(true);
    setProgress(0);

    const totalFiles = files.length;
    for (let i = 0; i < totalFiles; i++) {
      setProgress(Math.round(((i + 1) / totalFiles) * 100));
    }

    await onUpload(files);
    setFiles([]);
    setPreviews([]);
    setUploading(false);
    setProgress(0);
  };

  return (
    <div className="space-y-4">
      <div
        className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors hover:border-primary/50 cursor-pointer"
        onClick={() => document.getElementById('photo-upload-input')?.click()}
      >
        <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
        <p className="text-sm font-medium">Click or drag photos here</p>
        <p className="mt-1 text-xs text-muted-foreground">JPG, PNG, WebP accepted</p>
        <input
          id="photo-upload-input"
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {previews.length > 0 && (
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
          {previews.map((preview, index) => (
            <div key={index} className="group relative aspect-square overflow-hidden rounded-md">
              <img src={preview} alt="" className="h-full w-full object-cover" />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(index);
                }}
                className="absolute right-1 top-1 rounded-full bg-black/50 p-0.5 opacity-0 transition-opacity group-hover:opacity-100"
              >
                <X className="h-3 w-3 text-white" />
              </button>
            </div>
          ))}
        </div>
      )}

      {uploading && <Progress value={progress} className="h-2" />}

      {files.length > 0 && (
        <Button onClick={handleUpload} disabled={uploading} className="w-full">
          {uploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading...
            </>
          ) : (
            `Upload ${files.length} photo${files.length > 1 ? 's' : ''}`
          )}
        </Button>
      )}
    </div>
  );
}
