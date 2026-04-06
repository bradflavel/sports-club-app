'use client';

import { useEffect, useState } from 'react';
import { CalendarDays, Clock, Loader2, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getEventsForActivity } from '@/features/activity-events/services/event-service';
import { formatDate, formatDateTime } from '@/lib/format';
import type { ActivityEventWithTeams } from '@/lib/supabase/database.types';

interface CompetitionScheduleMemberProps {
  activityId: string;
}

const STATUS_STYLES: Record<string, string> = {
  scheduled: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  in_progress: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  completed: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
  cancelled: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  postponed: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
  bye: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
};

export function CompetitionScheduleMember({ activityId }: CompetitionScheduleMemberProps) {
  const [events, setEvents] = useState<ActivityEventWithTeams[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await getEventsForActivity(activityId);
      setEvents(data ?? []);
      setLoading(false);
    }
    load();
  }, [activityId]);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (events.length === 0) return null;

  // Split into upcoming and past
  const now = new Date();
  const upcoming = events.filter((e) => new Date(e.date_time) >= now || e.status === 'scheduled');
  const past = events.filter((e) => new Date(e.date_time) < now && e.status !== 'scheduled');

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <CalendarDays className="h-5 w-5 text-blue-500" />
          Schedule
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {upcoming.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Upcoming
            </h4>
            <div className="space-y-2">
              {upcoming.map((event) => (
                <EventRow key={event.id} event={event} />
              ))}
            </div>
          </div>
        )}

        {past.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Results
            </h4>
            <div className="space-y-2">
              {past.map((event) => (
                <EventRow key={event.id} event={event} />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function EventRow({ event }: { event: ActivityEventWithTeams }) {
  const hasScore =
    event.home_score !== null &&
    event.away_score !== null &&
    event.status === 'completed';

  return (
    <div className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-accent/50">
      {/* Round badge */}
      {event.round_number && (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
          R{event.round_number}
        </div>
      )}

      {/* Match info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          {event.home_team && event.away_team ? (
            <span className="text-sm font-medium">
              {event.home_team.name}
              {hasScore ? (
                <span className="mx-2 font-bold">
                  {event.home_score} – {event.away_score}
                </span>
              ) : (
                <span className="mx-2 text-muted-foreground">vs</span>
              )}
              {event.away_team.name}
            </span>
          ) : (
            <span className="text-sm font-medium">
              {event.title || `Round ${event.round_number ?? '—'}`}
            </span>
          )}
          <Badge
            variant="secondary"
            className={`text-xs ${STATUS_STYLES[event.status] ?? ''}`}
          >
            {event.status === 'bye' ? 'Bye' : event.status.replace('_', ' ')}
          </Badge>
        </div>
        <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatDateTime(event.date_time)}
          </span>
          {event.venue && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {event.venue}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
