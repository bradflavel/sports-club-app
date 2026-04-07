'use client';

import { useState } from 'react';
import { Download, Loader2, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { generateDownloadUrl } from '../services/download-service';
import { useToast } from '@/components/ui/use-toast';
import type { DigitalDownloadWithProduct } from '@/lib/supabase/database.types';

interface DigitalDownloadsProps {
  downloads: DigitalDownloadWithProduct[];
  profileId: string;
}

export function DigitalDownloads({ downloads, profileId }: DigitalDownloadsProps) {
  const { toast } = useToast();
  const [downloading, setDownloading] = useState<string | null>(null);

  if (downloads.length === 0) return null;

  async function handleDownload(downloadId: string) {
    setDownloading(downloadId);
    const { url, error } = await generateDownloadUrl(downloadId, profileId);

    if (error) {
      toast({ title: 'Download error', description: error, variant: 'destructive' });
    } else if (url) {
      window.open(url, '_blank');
    }
    setDownloading(null);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Digital Downloads</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {downloads.map((dl) => {
          const remaining = dl.max_downloads - dl.download_count;
          const isExpired = dl.expires_at && new Date(dl.expires_at) < new Date();
          const canDownload = remaining > 0 && !isExpired;

          return (
            <div key={dl.id} className="flex items-center justify-between rounded-md border p-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded bg-muted">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium">{dl.product.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {dl.download_count}/{dl.max_downloads} downloads used
                  </p>
                  {isExpired && (
                    <Badge variant="destructive" className="text-xs mt-1">Expired</Badge>
                  )}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDownload(dl.id)}
                disabled={!canDownload || downloading === dl.id}
              >
                {downloading === dl.id ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                {canDownload ? 'Download' : 'Unavailable'}
              </Button>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
