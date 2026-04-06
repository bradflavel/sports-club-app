'use client';

import Link from 'next/link';
import { Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/format';
import { ACTIVITY_TYPE_CONFIG } from '@/lib/constants';
import { getActivityPath } from '@/lib/utils';
import type { Activity } from '@/lib/supabase/database.types';

interface ActivityCardProps {
  activity: Activity;
  sportType?: string;
}

export function ActivityCard({ activity }: ActivityCardProps) {
  const typeConfig = ACTIVITY_TYPE_CONFIG[activity.activity_type];
  const modeLabel = activity.participation_mode === 'organiser' ? 'Organising' : 'Participating';

  return (
    <Link href={getActivityPath(activity.activity_type, activity.slug)}>
      <Card className="transition-colors hover:bg-accent/50">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base font-semibold leading-tight">
              {activity.name}
            </CardTitle>
            {activity.is_current && (
              <Badge variant="default" className="shrink-0">
                Current
              </Badge>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5 pt-1">
            <Badge variant="secondary">{typeConfig.singularLabel}</Badge>
            <Badge variant="outline">{modeLabel}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            <span>
              {activity.start_date ? formatDate(activity.start_date) : activity.first_round_date ? formatDate(activity.first_round_date) : 'No date set'}
              {activity.end_date ? ` - ${formatDate(activity.end_date)}` : ''}
            </span>
          </div>
          {activity.description && (
            <p className="line-clamp-2 text-sm text-muted-foreground">
              {activity.description}
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
