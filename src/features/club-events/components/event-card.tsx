'use client';

import Link from 'next/link';
import { Calendar, MapPin, Users, Utensils, Wine } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/shared/status-badge';
import { formatDateTime, formatCurrency } from '@/lib/format';
import { CLUB_EVENT_TYPE_OPTIONS } from '@/lib/constants';
import type { ClubEventWithVenue, ClubEventRegistration } from '@/features/club-events/types/club-event-types';

interface EventCardProps {
  event: ClubEventWithVenue;
  userRegistration?: ClubEventRegistration | null;
  isAdmin: boolean;
}

export function EventCard({ event, userRegistration, isAdmin }: EventCardProps) {
  const eventTypeLabel =
    CLUB_EVENT_TYPE_OPTIONS.find((o) => o.value === event.event_type)?.label ?? event.event_type;

  const isFree = event.cost_cents === 0;
  const displayVenueName = event.venue?.name ?? event.venue_name ?? null;

  return (
    <Link href={`/events/${event.id}`} className="block group">
      <Card className="h-full transition-shadow group-hover:shadow-md">
        {/* Cover image or gradient placeholder */}
        {event.cover_image_url ? (
          <div className="h-36 w-full overflow-hidden rounded-t-lg">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={event.cover_image_url}
              alt={event.name}
              className="h-full w-full object-cover"
            />
          </div>
        ) : (
          <div className="h-36 w-full rounded-t-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <Calendar className="h-10 w-10 text-primary/30" />
          </div>
        )}

        <CardHeader className="pb-2 pt-4">
          <div className="flex flex-wrap items-start gap-2">
            <Badge variant="secondary" className="text-xs">
              {eventTypeLabel}
            </Badge>
            <StatusBadge status={event.status} />
            {event.is_adults_only && (
              <Badge variant="outline" className="text-xs border-orange-300 text-orange-700">
                18+
              </Badge>
            )}
          </div>
          <h3 className="mt-1 font-semibold leading-snug line-clamp-2 group-hover:text-primary transition-colors">
            {event.name}
          </h3>
        </CardHeader>

        <CardContent className="space-y-2 text-sm text-muted-foreground">
          {/* Date/time */}
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 shrink-0" />
            <span className="truncate">{formatDateTime(event.start_time)}</span>
          </div>

          {/* Venue */}
          {displayVenueName && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 shrink-0" />
              <span className="truncate">{displayVenueName}</span>
            </div>
          )}

          {/* Attendees */}
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 shrink-0" />
            <span>
              {event.max_attendees
                ? `${event.registration_count ?? 0} / ${event.max_attendees} spots`
                : `${event.registration_count ?? 0} attending`}
            </span>
          </div>

          {/* Cost */}
          <div className="flex items-center justify-between pt-1">
            <span className="font-medium text-foreground">
              {isFree ? (
                <Badge variant="outline" className="text-xs border-emerald-300 text-emerald-700">
                  Free
                </Badge>
              ) : (
                formatCurrency(event.cost_cents)
              )}
            </span>
            <div className="flex items-center gap-1.5">
              {event.food_provided && (
                <span title="Food provided"><Utensils className="h-3.5 w-3.5 text-muted-foreground" /></span>
              )}
              {event.alcohol_provided && (
                <span title="Licensed venue"><Wine className="h-3.5 w-3.5 text-muted-foreground" /></span>
              )}
            </div>
          </div>

          {/* User registration status */}
          {userRegistration && userRegistration.status !== 'cancelled' && (
            <div className="pt-1">
              <StatusBadge status={userRegistration.status} />
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
