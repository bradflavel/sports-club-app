'use client';

import { Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/format';
import { ACTIVITY_TYPE_CONFIG } from '@/lib/constants';
import type { Activity } from '@/lib/supabase/database.types';

interface ActivityDetailHeaderProps {
  activity: Activity;
}

export function ActivityDetailHeader({ activity }: ActivityDetailHeaderProps) {
  const typeConfig = ACTIVITY_TYPE_CONFIG[activity.activity_type];
  const modeLabel = activity.participation_mode === 'organiser' ? 'Organising' : 'Participating';

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight">{activity.name}</h1>
        {activity.is_current && <Badge variant="default">Current</Badge>}
      </div>

      <div className="flex flex-wrap gap-1.5">
        <Badge variant="secondary">{typeConfig.singularLabel}</Badge>
        <Badge variant="outline">{modeLabel}</Badge>
      </div>

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Calendar className="h-4 w-4" />
        <span>
          {formatDate(activity.start_date)}
          {activity.end_date ? ` - ${formatDate(activity.end_date)}` : ''}
        </span>
      </div>

      {activity.description && (
        <p className="text-sm text-muted-foreground">{activity.description}</p>
      )}
    </div>
  );
}
