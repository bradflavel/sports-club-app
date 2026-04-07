'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/shared/page-header';
import { PageSkeleton } from '@/components/shared/loading-skeleton';
import { EventForm } from '@/features/club-events/components/event-form';
import { useAuth } from '@/hooks/use-auth-context';
import { useOrganisation } from '@/hooks/use-organisation';
import { useToast } from '@/components/ui/use-toast';
import {
  createClubEvent,
  getVenuesForEvents,
  getActivitiesForEventPicker,
  setEventTargets,
} from '@/features/club-events/services/club-event-service';
import type { ClubEventInput } from '@/features/club-events/schemas/club-event-schemas';
import type {
  ClubVenue,
  PickerActivity,
} from '@/features/club-events/types/club-event-types';

export default function NewEventPage() {
  const router = useRouter();
  const { profile, user } = useAuth();
  const { organisation } = useOrganisation();
  const { toast } = useToast();

  const [venues, setVenues] = useState<ClubVenue[]>([]);
  const [activities, setActivities] = useState<PickerActivity[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const isAdmin = profile?.role === 'admin' || profile?.role === 'manager';

  const fetchData = useCallback(async () => {
    if (!organisation?.id) return;
    setDataLoading(true);

    const [venueRes, activityRes] = await Promise.all([
      getVenuesForEvents(organisation.id),
      getActivitiesForEventPicker(organisation.id),
    ]);

    setVenues((venueRes.data as ClubVenue[]) ?? []);
    setActivities(activityRes.data ?? []);
    setDataLoading(false);
  }, [organisation?.id]);

  useEffect(() => {
    if (organisation?.id) {
      fetchData();
    }
  }, [organisation?.id, fetchData]);

  async function handleSubmit(data: ClubEventInput) {
    if (!organisation?.id || !user?.id) {
      toast({
        title: 'Error',
        description: 'Organisation or user not found.',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);

    try {
      const { data: created, error } = await createClubEvent({
        organisation_id: organisation.id,
        name: data.name,
        description: data.description ?? null,
        event_type: data.eventType,
        status: data.status ?? 'draft',
        start_time: data.startTime,
        end_time: data.endTime ?? null,
        venue_id: data.venueId ?? null,
        venue_name: data.venueName ?? null,
        venue_address: data.venueAddress ?? null,
        max_attendees: data.maxAttendees ?? null,
        enable_waitlist: data.enableWaitlist ?? false,
        cost_cents: data.costCents ?? 0,
        cost_description: null,
        registration_required: data.registrationRequired ?? false,
        registration_opens: data.registrationOpens || null,
        registration_closes: data.registrationCloses || null,
        registration_requires_approval: data.registrationRequiresApproval ?? false,
        allow_guests: data.allowGuests ?? false,
        max_guests_per_member: data.maxGuestsPerMember ?? 0,
        collect_dietary_requirements: data.collectDietaryRequirements ?? false,
        food_provided: data.foodProvided ?? false,
        alcohol_provided: data.alcoholProvided ?? false,
        is_adults_only: data.isAdultsOnly ?? false,
        contact_name: data.contactName ?? null,
        contact_email: data.contactEmail ?? null,
        contact_phone: data.contactPhone ?? null,
        is_members_only: data.isMembersOnly ?? false,
        cover_image_url: data.coverImageUrl ?? null,
        notes: data.notes ?? null,
        created_by: user.id,
      });

      if (error) throw new Error(error.message);

      // Save audience targets
      const hasTargets =
        (data.targetActivityIds?.length ?? 0) > 0 ||
        (data.targetDivisionIds?.length ?? 0) > 0 ||
        (data.targetTeamIds?.length ?? 0) > 0;
      if (created?.id && hasTargets) {
        await setEventTargets(created.id, {
          activityIds: data.targetActivityIds ?? [],
          divisionIds: data.targetDivisionIds ?? [],
          teamIds: data.targetTeamIds ?? [],
        });
      }

      toast({ title: 'Event created successfully' });
      router.push(`/events/${created?.id}`);
    } catch (err) {
      toast({
        title: 'Error creating event',
        description: err instanceof Error ? err.message : 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  }

  if (!isAdmin) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        You do not have permission to create events.
      </div>
    );
  }

  if (dataLoading) {
    return <PageSkeleton />;
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Create Event" />

      <div className="mx-auto max-w-3xl">
        <EventForm
          onSubmit={handleSubmit}
          loading={submitting}
          venues={venues}
          activities={activities}
          onCancel={() => router.push('/events')}
        />
      </div>
    </div>
  );
}
