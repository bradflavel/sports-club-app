'use client';

import Link from 'next/link';
import { MapPin, Calendar, ArrowRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import type { FixtureWithTeam } from '@/lib/supabase/database.types';

interface UpcomingFixturesWidgetProps {
  fixtures: FixtureWithTeam[];
  loading?: boolean;
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

export function UpcomingFixturesWidget({ fixtures, loading = false }: UpcomingFixturesWidgetProps) {
  return (
    <div className="rounded-lg border bg-card shadow-sm">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h3 className="font-semibold">Upcoming Fixtures</h3>
        <Link
          href="/fixtures"
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
        ) : fixtures.length === 0 ? (
          <p className="p-6 text-center text-sm text-muted-foreground">No upcoming fixtures.</p>
        ) : (
          fixtures.slice(0, 5).map((fixture) => (
            <div key={fixture.id} className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-medium text-sm">
                    {fixture.team.name}{' '}
                    <span className="text-muted-foreground font-normal">vs</span>{' '}
                    {fixture.opponent_name}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDateTime(fixture.date_time)}
                    </span>
                    {fixture.venue && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {fixture.venue}
                      </span>
                    )}
                  </div>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                    fixture.is_home
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-sky-100 text-sky-700'
                  }`}
                >
                  {fixture.is_home ? 'Home' : 'Away'}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
