'use client';

import { CalendarDays } from 'lucide-react';
import { EmptyState } from '@/components/shared/empty-state';
import { ActivityCard } from './activity-card';
import type { Activity } from '@/lib/supabase/database.types';

interface ActivityListProps {
  activities: Activity[];
  emptyMessage?: string;
}

export function ActivityList({ activities, emptyMessage }: ActivityListProps) {
  if (activities.length === 0) {
    return (
      <EmptyState
        icon={CalendarDays}
        title="No activities found"
        description={emptyMessage ?? 'Get started by creating your first activity.'}
      />
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {activities.map((activity) => (
        <ActivityCard key={activity.id} activity={activity} />
      ))}
    </div>
  );
}
