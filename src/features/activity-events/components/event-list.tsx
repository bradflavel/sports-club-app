'use client';

import { EventCard } from './event-card';
import type { ActivityEventWithTeams } from '@/features/activity-events/types/event-types';

interface EventListProps {
  events: ActivityEventWithTeams[];
  sportType?: string;
  emptyMessage?: string;
}

export function EventList({
  events,
  sportType,
  emptyMessage = 'No events found.',
}: EventListProps) {
  if (events.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        {emptyMessage}
      </p>
    );
  }

  // Check if events have round numbers for grouping
  const hasRounds = events.some((e) => e.round_number !== null);

  if (hasRounds) {
    const grouped = new Map<number | null, ActivityEventWithTeams[]>();
    for (const event of events) {
      const key = event.round_number;
      const existing = grouped.get(key) ?? [];
      existing.push(event);
      grouped.set(key, existing);
    }

    const sortedKeys = [...grouped.keys()].sort((a, b) => {
      if (a === null) return 1;
      if (b === null) return -1;
      return a - b;
    });

    return (
      <div className="space-y-6">
        {sortedKeys.map((roundNum) => {
          const roundEvents = grouped.get(roundNum) ?? [];
          return (
            <div key={roundNum ?? 'unassigned'}>
              <h3 className="mb-3 text-sm font-semibold text-muted-foreground">
                {roundNum !== null ? `Round ${roundNum}` : 'Unassigned'}
              </h3>
              <div className="space-y-3">
                {roundEvents.map((event) => (
                  <EventCard key={event.id} event={event} sportType={sportType} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  const sorted = [...events].sort(
    (a, b) => new Date(a.date_time).getTime() - new Date(b.date_time).getTime()
  );

  return (
    <div className="space-y-3">
      {sorted.map((event) => (
        <EventCard key={event.id} event={event} sportType={sportType} />
      ))}
    </div>
  );
}
