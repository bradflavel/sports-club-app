'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';

interface AnnouncementFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    title: string;
    content: string;
    isPinned: boolean;
    expiresAt: string | null;
  }) => Promise<void>;
  defaultValues?: {
    title: string;
    content: string;
    isPinned: boolean;
    expiresAt: string | null;
  };
}

export function AnnouncementForm({
  open,
  onOpenChange,
  onSubmit,
  defaultValues,
}: AnnouncementFormProps) {
  const [title, setTitle] = useState(defaultValues?.title || '');
  const [content, setContent] = useState(defaultValues?.content || '');
  const [isPinned, setIsPinned] = useState(defaultValues?.isPinned || false);
  const [expiresAt, setExpiresAt] = useState(defaultValues?.expiresAt || '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) return;
    setLoading(true);
    try {
      await onSubmit({
        title: title.trim(),
        content: content.trim(),
        isPinned,
        expiresAt: expiresAt || null,
      });
      if (!defaultValues) {
        setTitle('');
        setContent('');
        setIsPinned(false);
        setExpiresAt('');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {defaultValues ? 'Edit Announcement' : 'New Announcement'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ann-title">Title *</Label>
            <Input
              id="ann-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Announcement title"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ann-content">Content *</Label>
            <Textarea
              id="ann-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your announcement..."
              rows={6}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="ann-pinned">Pin this announcement</Label>
            <Switch id="ann-pinned" checked={isPinned} onCheckedChange={setIsPinned} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ann-expires">Expires at (optional)</Label>
            <Input
              id="ann-expires"
              type="datetime-local"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !title.trim() || !content.trim()}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {defaultValues ? 'Save' : 'Post'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
