'use client';

import Link from 'next/link';
import { ArrowRight, Megaphone } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import type { AnnouncementWithAuthor } from '@/lib/supabase/database.types';
import { truncate } from '@/lib/utils';

interface RecentAnnouncementsWidgetProps {
  announcements: AnnouncementWithAuthor[];
  loading?: boolean;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function RecentAnnouncementsWidget({
  announcements,
  loading = false,
}: RecentAnnouncementsWidgetProps) {
  return (
    <div className="rounded-lg border bg-card shadow-sm">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h3 className="font-semibold">Recent Announcements</h3>
        <Link
          href="/announcements"
          className="flex items-center gap-1 text-xs text-primary hover:underline"
        >
          View all <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="divide-y">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2 p-4">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/4" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          ))
        ) : announcements.length === 0 ? (
          <div className="flex flex-col items-center gap-2 p-6 text-center text-muted-foreground">
            <Megaphone className="h-8 w-8 opacity-40" />
            <p className="text-sm">No announcements yet.</p>
          </div>
        ) : (
          announcements.slice(0, 3).map((announcement) => (
            <div key={announcement.id} className="p-4">
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium text-sm leading-snug">{announcement.title}</p>
                {announcement.is_pinned && (
                  <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                    Pinned
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {formatDate(announcement.published_at)} &middot;{' '}
                {announcement.author.first_name} {announcement.author.last_name}
              </p>
              <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                {truncate(announcement.content, 160)}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
