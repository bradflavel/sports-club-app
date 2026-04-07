'use client';

import { Edit, Trash2, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EventDetail } from './event-detail';
import { AttendeeList } from './attendee-list';
import { CLUB_EVENT_STATUS_OPTIONS } from '@/lib/constants';
import type {
  ClubEventWithVenue,
  ClubEventRegistrationWithMember,
  ClubEventStatus,
} from '@/features/club-events/types/club-event-types';

interface EventAdminDetailProps {
  event: ClubEventWithVenue;
  registrations: ClubEventRegistrationWithMember[];
  registrationCount: number;
  onEdit: () => void;
  onDelete: () => void;
  onStatusChange: (status: ClubEventStatus) => Promise<void>;
  onApprove: (registrationId: string) => Promise<void>;
  onMarkAttended: (registrationId: string) => Promise<void>;
  onRemoveRegistration: (registrationId: string) => Promise<void>;
}

export function EventAdminDetail({
  event,
  registrations,
  registrationCount,
  onEdit,
  onDelete,
  onStatusChange,
  onApprove,
  onMarkAttended,
  onRemoveRegistration,
}: EventAdminDetailProps) {
  return (
    <div className="space-y-6">
      {/* Admin action bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/30 px-4 py-3">
        <p className="text-sm text-muted-foreground">Admin controls</p>
        <div className="flex items-center gap-2">
          {/* Status quick actions */}
          {event.status === 'draft' && (
            <Button
              size="sm"
              variant="default"
              onClick={() => onStatusChange('published')}
            >
              Publish Event
            </Button>
          )}
          {event.status === 'published' && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onStatusChange('completed')}
            >
              Mark Complete
            </Button>
          )}

          {/* Status dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline" className="gap-1">
                Change Status
                <ChevronDown className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {CLUB_EVENT_STATUS_OPTIONS.map((opt) => (
                <DropdownMenuItem
                  key={opt.value}
                  disabled={event.status === opt.value}
                  onClick={() => onStatusChange(opt.value as ClubEventStatus)}
                >
                  {opt.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button size="sm" variant="outline" onClick={onEdit} className="gap-1.5">
            <Edit className="h-3.5 w-3.5" />
            Edit
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={onDelete}
            className="gap-1.5 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="attendees">
            Attendees ({registrationCount})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="mt-6">
          <EventDetail
            event={event}
            registration={null}
            registrationCount={registrationCount}
            memberId={null}
            onRegister={() => {}}
            onCancel={() => {}}
          />
        </TabsContent>

        <TabsContent value="attendees" className="mt-6">
          <AttendeeList
            registrations={registrations}
            event={event}
            onApprove={onApprove}
            onMarkAttended={onMarkAttended}
            onRemove={onRemoveRegistration}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
