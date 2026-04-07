'use client';

import {
  Calendar,
  MapPin,
  DollarSign,
  Users,
  Utensils,
  Wine,
  ShieldAlert,
  Phone,
  Mail,
  User,
  Clock,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/shared/status-badge';
import { RegistrationButton } from './registration-button';
import { formatDateTime, formatCurrency, formatDate } from '@/lib/format';
import { CLUB_EVENT_TYPE_OPTIONS } from '@/lib/constants';
import type { ClubEventWithVenue, ClubEventRegistration } from '@/features/club-events/types/club-event-types';

interface EventDetailProps {
  event: ClubEventWithVenue;
  registration: ClubEventRegistration | null;
  registrationCount: number;
  memberId: string | null;
  onRegister: () => void;
  onCancel: () => void;
}

export function EventDetail({
  event,
  registration,
  registrationCount,
  memberId,
  onRegister,
  onCancel,
}: EventDetailProps) {
  const eventTypeLabel =
    CLUB_EVENT_TYPE_OPTIONS.find((o) => o.value === event.event_type)?.label ?? event.event_type;

  const isFree = event.cost_cents === 0;
  const displayVenueName = event.venue?.name ?? event.venue_name ?? null;
  const displayVenueAddress = event.venue?.address ?? event.venue_address ?? null;

  const spotsLeft =
    event.max_attendees !== null ? event.max_attendees - registrationCount : null;
  const capacityPercent =
    event.max_attendees !== null
      ? Math.min(100, Math.round((registrationCount / event.max_attendees) * 100))
      : null;

  return (
    <div className="space-y-6">
      {/* Hero */}
      {event.cover_image_url ? (
        <div className="h-56 w-full overflow-hidden rounded-xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={event.cover_image_url}
            alt={event.name}
            className="h-full w-full object-cover"
          />
        </div>
      ) : (
        <div className="flex h-48 w-full items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5">
          <Calendar className="h-16 w-16 text-primary/30" />
        </div>
      )}

      {/* Title & Badges */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{eventTypeLabel}</Badge>
          <StatusBadge status={event.status} />
          {event.is_adults_only && (
            <Badge variant="outline" className="border-orange-300 text-orange-700">
              18+
            </Badge>
          )}
        </div>
        <h1 className="text-2xl font-bold leading-tight">{event.name}</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Date & Time */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                Date &amp; Time
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <p className="font-medium">{formatDateTime(event.start_time)}</p>
              {event.end_time && (
                <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  Ends {formatDateTime(event.end_time)}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Venue */}
          {(displayVenueName || displayVenueAddress) && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  Location
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                {displayVenueName && <p className="font-medium">{displayVenueName}</p>}
                {displayVenueAddress && (
                  <p className="text-sm text-muted-foreground">{displayVenueAddress}</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Cost */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                Cost
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {isFree ? (
                <Badge variant="outline" className="border-emerald-300 text-emerald-700">
                  Free
                </Badge>
              ) : (
                <p className="font-medium">{formatCurrency(event.cost_cents)}</p>
              )}
              {event.cost_description && (
                <p className="text-sm text-muted-foreground">{event.cost_description}</p>
              )}
            </CardContent>
          </Card>

          {/* Info pills */}
          {(event.food_provided || event.alcohol_provided || event.is_adults_only) && (
            <div className="flex flex-wrap gap-2">
              {event.food_provided && (
                <div className="flex items-center gap-1.5 rounded-full border bg-muted/50 px-3 py-1 text-sm">
                  <Utensils className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Food Provided</span>
                </div>
              )}
              {event.alcohol_provided && (
                <div className="flex items-center gap-1.5 rounded-full border bg-muted/50 px-3 py-1 text-sm">
                  <Wine className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Licensed Venue</span>
                </div>
              )}
              {event.is_adults_only && (
                <div className="flex items-center gap-1.5 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-sm text-orange-700">
                  <ShieldAlert className="h-3.5 w-3.5" />
                  <span>18+ Only</span>
                </div>
              )}
            </div>
          )}

          {/* Description */}
          {event.description && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">About This Event</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-line text-sm leading-relaxed">{event.description}</p>
              </CardContent>
            </Card>
          )}

          {/* Contact */}
          {(event.contact_name || event.contact_email || event.contact_phone) && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Contact</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {event.contact_name && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{event.contact_name}</span>
                  </div>
                )}
                {event.contact_email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <a
                      href={`mailto:${event.contact_email}`}
                      className="text-primary hover:underline"
                    >
                      {event.contact_email}
                    </a>
                  </div>
                )}
                {event.contact_phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a href={`tel:${event.contact_phone}`} className="text-primary hover:underline">
                      {event.contact_phone}
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Attendees */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                Attendees
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm font-medium">
                {event.max_attendees
                  ? `${registrationCount} / ${event.max_attendees} spots filled`
                  : `${registrationCount} attending`}
              </p>
              {capacityPercent !== null && (
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${capacityPercent}%` }}
                  />
                </div>
              )}
              {spotsLeft !== null && spotsLeft > 0 && (
                <p className="text-xs text-muted-foreground">{spotsLeft} spots remaining</p>
              )}
              {event.enable_waitlist && event.max_attendees !== null && registrationCount >= event.max_attendees && (
                <p className="text-xs text-amber-600">Waitlist available</p>
              )}
            </CardContent>
          </Card>

          {/* Registration deadline */}
          {event.registration_closes && (
            <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-sm font-medium text-amber-800">Registration Deadline</p>
              <p className="text-sm text-amber-700">{formatDate(event.registration_closes)}</p>
            </div>
          )}

          {/* Registration */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Registration</CardTitle>
            </CardHeader>
            <CardContent>
              <RegistrationButton
                event={event}
                registration={registration}
                registrationCount={registrationCount}
                memberId={memberId}
                onRegister={onRegister}
                onCancel={onCancel}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
