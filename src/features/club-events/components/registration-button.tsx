'use client';

import { ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/shared/status-badge';
import type { ClubEventWithVenue, ClubEventRegistration } from '@/features/club-events/types/club-event-types';

interface RegistrationButtonProps {
  event: ClubEventWithVenue;
  registration: ClubEventRegistration | null;
  registrationCount: number;
  memberId: string | null;
  onRegister: () => void;
  onCancel: () => void;
}

export function RegistrationButton({
  event,
  registration,
  registrationCount,
  memberId,
  onRegister,
  onCancel,
}: RegistrationButtonProps) {
  if (!memberId) {
    return (
      <p className="text-sm text-muted-foreground">Sign in as a member to register for events.</p>
    );
  }

  const now = new Date();
  const registrationOpen =
    (!event.registration_opens || new Date(event.registration_opens) <= now) &&
    (!event.registration_closes || new Date(event.registration_closes) >= now);

  const isFull =
    event.max_attendees !== null &&
    registrationCount >= event.max_attendees &&
    !event.enable_waitlist;

  const isCancelled = event.status === 'cancelled' || event.status === 'completed';

  // Already registered
  if (registration) {
    if (registration.status === 'cancelled') {
      // Allow re-registration
      if (!registrationOpen) {
        return (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Your previous registration was cancelled.</p>
            <Badge variant="outline" className="border-gray-300 text-gray-700">
              Registration Closed
            </Badge>
          </div>
        );
      }
      if (isFull) {
        return (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Your previous registration was cancelled.</p>
            <Badge variant="outline" className="border-red-300 text-red-700">
              Event Full
            </Badge>
          </div>
        );
      }
      return (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">Your previous registration was cancelled.</p>
          {event.is_adults_only && (
            <div className="flex items-center gap-2 rounded-md border border-orange-200 bg-orange-50 px-3 py-2">
              <ShieldAlert className="h-4 w-4 text-orange-600" />
              <p className="text-sm text-orange-700">This event is 18+ only.</p>
            </div>
          )}
          <Button onClick={onRegister} className="w-full sm:w-auto">
            Register Again
          </Button>
        </div>
      );
    }

    if (registration.status === 'waitlisted') {
      return (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <StatusBadge status="waitlisted" />
            <p className="text-sm text-muted-foreground">You are on the waitlist.</p>
          </div>
          <Button variant="outline" onClick={onCancel} size="sm">
            Leave Waitlist
          </Button>
        </div>
      );
    }

    // registered or approved or attended
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <StatusBadge status={registration.status} />
          <p className="text-sm text-muted-foreground">
            {registration.status === 'attended'
              ? 'You attended this event.'
              : registration.status === 'approved'
              ? "You're registered and approved."
              : "You're registered for this event."}
          </p>
        </div>
        {registration.status !== 'attended' && isCancelled !== true && (
          <Button variant="outline" onClick={onCancel} size="sm">
            Cancel Registration
          </Button>
        )}
      </div>
    );
  }

  // Not registered
  if (isCancelled) {
    return (
      <Badge variant="outline" className="border-gray-300 text-gray-700">
        {event.status === 'completed' ? 'Event Completed' : 'Event Cancelled'}
      </Badge>
    );
  }

  if (!registrationOpen) {
    return (
      <Badge variant="outline" className="border-gray-300 text-gray-700">
        Registration Closed
      </Badge>
    );
  }

  if (isFull) {
    return (
      <Badge variant="outline" className="border-red-300 text-red-700">
        Event Full
      </Badge>
    );
  }

  return (
    <div className="space-y-3">
      {event.is_adults_only && (
        <div className="flex items-center gap-2 rounded-md border border-orange-200 bg-orange-50 px-3 py-2">
          <ShieldAlert className="h-4 w-4 text-orange-600" />
          <p className="text-sm text-orange-700">This event is 18+ only. You must be 18 or over to register.</p>
        </div>
      )}
      <Button onClick={onRegister} className="w-full sm:w-auto">
        {event.max_attendees !== null && registrationCount >= event.max_attendees
          ? 'Join Waitlist'
          : 'Register'}
      </Button>
    </div>
  );
}
