'use client';

import Link from 'next/link';
import { MapPin, Calendar, ArrowRight, CalendarDays } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import type { ActivityEventWithTeams } from '@/lib/supabase/database.types';
import type { SportType } from '@/lib/constants';
import { SPORT_CONFIGS } from '@/lib/constants';

interface UpcomingEventsWidgetProps {
  events: ActivityEventWithTeams[];
  loading?: boolean;
  sportType?: SportType;
}

function formatDateTime(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleString('en-AU', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function getEventDisplayName(event: ActivityEventWithTeams): string {
  if (event.home_team && event.away_team) {
    return `${event.home_team.name} vs ${event.away_team.name}`;
  }
  if (event.home_team && event.opponent_name) {
    return `${event.home_team.name} vs ${event.opponent_name}`;
  }
  if (event.title) {
    return event.title;
  }
  if (event.home_team) {
    return event.home_team.name;
  }
  return 'Event';
}

/** @deprecated Use UpcomingEventsWidget instead */
export const UpcomingFixturesWidget = UpcomingEventsWidget;

export function UpcomingEventsWidget({ events, loading = false, sportType }: UpcomingEventsWidgetProps) {
  const matchLabel = sportType ? SPORT_CONFIGS[sportType].matchLabel : 'Event';
  const heading = `Upcoming ${matchLabel}s`;

  return (
    <div className="rounded-xl border bg-card shadow-sm">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h3 className="font-semibold">{heading}</h3>
        <Link
          href="/competitions"
          className="flex items-center gap-1 text-xs text-primary hover:underline"
        >
          View all <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="divide-y">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2 p-4">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          ))
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center gap-2 p-6 text-center text-muted-foreground">
            <CalendarDays className="h-8 w-8 opacity-40" />
            <p className="text-sm">No upcoming events.</p>
          </div>
        ) : (
          events.slice(0, 5).map((event) => (
            <div key={event.id} className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-medium text-sm">
                    {getEventDisplayName(event)}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
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
                {event.is_home != null && (
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                      event.is_home
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-sky-100 text-sky-700'
                    }`}
                  >
                    {event.is_home ? 'Home' : 'Away'}
                  </span>
                )}
                <span
                  className="shrink-0 rounded-full px-2 py-0.5 text-xs font-medium bg-muted text-muted-foreground capitalize"
                >
                  {event.status.replace(/_/g, ' ')}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
