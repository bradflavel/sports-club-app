'use client';

import { Calendar } from 'lucide-react';
import { EventCard } from './event-card';
import { EmptyState } from '@/components/shared/empty-state';
import type { ClubEventWithVenue, ClubEventRegistration } from '@/features/club-events/types/club-event-types';

interface EventListProps {
  events: ClubEventWithVenue[];
  registrations: Map<string, ClubEventRegistration>;
  isAdmin: boolean;
}

export function EventList({ events, registrations, isAdmin }: EventListProps) {
  if (events.length === 0) {
    return (
      <EmptyState
        icon={Calendar}
        title="No events found"
        description="There are no events to display. Check back later or adjust your filters."
      />
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {events.map((event) => (
        <EventCard
          key={event.id}
          event={event}
          userRegistration={registrations.get(event.id) ?? null}
          isAdmin={isAdmin}
        />
      ))}
    </div>
  );
}
