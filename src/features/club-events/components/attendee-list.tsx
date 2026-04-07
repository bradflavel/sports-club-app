'use client';

import { CheckCircle, UserX, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/shared/status-badge';
import { AvatarWithName } from '@/components/shared/avatar-with-name';
import { formatDate } from '@/lib/format';
import type {
  ClubEventRegistrationWithMember,
  ClubEventWithVenue,
} from '@/features/club-events/types/club-event-types';

interface AttendeeListProps {
  registrations: ClubEventRegistrationWithMember[];
  event: ClubEventWithVenue;
  onApprove: (registrationId: string) => Promise<void>;
  onMarkAttended: (registrationId: string) => Promise<void>;
  onRemove: (registrationId: string) => Promise<void>;
}

export function AttendeeList({
  registrations,
  event,
  onApprove,
  onMarkAttended,
  onRemove,
}: AttendeeListProps) {
  const now = new Date();
  const eventStart = new Date(event.start_time);
  const isPastOrToday = eventStart <= now || event.status === 'completed';

  const active = registrations.filter((r) => r.status !== 'cancelled');
  const totalGuests = active.reduce((sum, r) => sum + (r.guest_count ?? 0), 0);
  const totalAttendees = active.length + totalGuests;

  if (registrations.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">No registrations yet.</p>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex flex-wrap gap-4 rounded-lg border bg-muted/30 px-4 py-3 text-sm">
        <span>
          <span className="font-semibold">{active.length}</span> registered
        </span>
        <span>
          <span className="font-semibold">{totalGuests}</span> guests
        </span>
        <span>
          <span className="font-semibold">{totalAttendees}</span> total attendees
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Member</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Guests</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Dietary</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Registered</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {registrations.map((reg) => (
              <tr key={reg.id} className="hover:bg-muted/20">
                <td className="px-4 py-3">
                  <AvatarWithName
                    firstName={reg.member.profile.first_name}
                    lastName={reg.member.profile.last_name}
                    avatarUrl={reg.member.profile.avatar_url}
                    subtitle={reg.member.profile.email}
                    size="sm"
                  />
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={reg.status} />
                </td>
                <td className="px-4 py-3">
                  {reg.guest_count > 0 ? (
                    <span>
                      {reg.guest_count}
                      {reg.guest_names && (
                        <span className="ml-1 text-xs text-muted-foreground">
                          ({reg.guest_names})
                        </span>
                      )}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {reg.dietary_requirements ? (
                    <span className="text-xs">{reg.dietary_requirements}</span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {formatDate(reg.registered_at)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    {event.registration_requires_approval && reg.status === 'registered' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 gap-1 text-xs"
                        onClick={() => onApprove(reg.id)}
                      >
                        <UserCheck className="h-3 w-3" />
                        Approve
                      </Button>
                    )}
                    {isPastOrToday &&
                      (reg.status === 'registered' || reg.status === 'approved') && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 gap-1 text-xs"
                          onClick={() => onMarkAttended(reg.id)}
                        >
                          <CheckCircle className="h-3 w-3" />
                          Attended
                        </Button>
                      )}
                    {reg.status !== 'cancelled' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 gap-1 text-xs text-destructive hover:text-destructive"
                        onClick={() => onRemove(reg.id)}
                      >
                        <UserX className="h-3 w-3" />
                        Remove
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
