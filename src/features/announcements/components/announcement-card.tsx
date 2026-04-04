'use client';

import { Pin, MoreVertical, Edit, Trash2 } from 'lucide-react';
import { formatRelativeDate } from '@/lib/format';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';
import type { AnnouncementWithAuthor } from '@/lib/supabase/database.types';
import { useState } from 'react';

interface AnnouncementCardProps {
  announcement: AnnouncementWithAuthor;
  canEdit?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function AnnouncementCard({
  announcement,
  canEdit = false,
  onEdit,
  onDelete,
}: AnnouncementCardProps) {
  const [expanded, setExpanded] = useState(false);
  const isLong = announcement.content.length > 200;

  return (
    <div className="rounded-lg border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          {announcement.is_pinned && (
            <Pin className="mt-1 h-4 w-4 shrink-0 text-primary" />
          )}
          <div>
            <h3 className="font-semibold">{announcement.title}</h3>
            <div className="mt-1 flex items-center gap-2">
              <Avatar className="h-5 w-5">
                <AvatarImage src={announcement.author?.avatar_url || undefined} />
                <AvatarFallback className="text-[10px]">
                  {announcement.author
                    ? getInitials(announcement.author.first_name, announcement.author.last_name)
                    : '?'}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs text-muted-foreground">
                {announcement.author
                  ? `${announcement.author.first_name} ${announcement.author.last_name}`
                  : 'Unknown'}
              </span>
              <span className="text-xs text-muted-foreground">
                &middot; {formatRelativeDate(announcement.published_at)}
              </span>
            </div>
          </div>
        </div>
        {canEdit && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>
                <Edit className="mr-2 h-4 w-4" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem className="text-destructive" onClick={onDelete}>
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <div className="mt-3">
        <p className="whitespace-pre-wrap text-sm text-muted-foreground">
          {expanded || !isLong
            ? announcement.content
            : announcement.content.slice(0, 200) + '...'}
        </p>
        {isLong && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-1 text-sm font-medium text-primary hover:underline"
          >
            {expanded ? 'Show less' : 'Read more'}
          </button>
        )}
      </div>
    </div>
  );
}
