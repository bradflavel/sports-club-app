'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, PartyPopper } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { PageSkeleton } from '@/components/shared/loading-skeleton';
import { SearchInput } from '@/components/shared/search-input';
import { Button } from '@/components/ui/button';
import { EventList } from '@/features/club-events/components/event-list';
import { useAuth } from '@/hooks/use-auth-context';
import { useOrganisation } from '@/hooks/use-organisation';
import { useToast } from '@/components/ui/use-toast';
import {
  getClubEvents,
  getMyRegistration,
  getEventRegistrations,
} from '@/features/club-events/services/club-event-service';
import type {
  ClubEventWithVenue,
  ClubEventRegistration,
  ClubEventType,
} from '@/features/club-events/types/club-event-types';
import { CLUB_EVENT_TYPE_OPTIONS } from '@/lib/constants';

export default function EventsPage() {
  const { profile, loading: userLoading } = useAuth();
  const { organisation, loading: orgLoading } = useOrganisation();
  const { toast } = useToast();

  const [events, setEvents] = useState<ClubEventWithVenue[]>([]);
  const [registrations, setRegistrations] = useState<Map<string, ClubEventRegistration>>(
    new Map()
  );
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('all');

  const isAdmin = profile?.role === 'admin' || profile?.role === 'manager';

  const fetchEvents = useCallback(async () => {
    if (!organisation?.id) return;
    setLoading(true);

    const statusFilter = isAdmin ? undefined : ['published'];
    const { data, error } = await getClubEvents(organisation.id, {
      search: search || undefined,
      status: statusFilter,
      eventType: eventTypeFilter !== 'all' ? [eventTypeFilter] : undefined,
    });

    if (error) {
      toast({ title: 'Error loading events', description: error.message, variant: 'destructive' });
    } else {
      setEvents(data ?? []);
    }

    setLoading(false);
  }, [organisation?.id, isAdmin, search, eventTypeFilter, toast]);

  const fetchRegistrations = useCallback(async () => {
    if (!profile?.id || !organisation?.id || !events.length) return;

    // Find member id for this profile
    const { createClient } = await import('@/lib/supabase/client');
    const supabase = createClient();
    const { data: member } = await supabase
      .from('members')
      .select('id')
      .eq('profile_id', profile.id)
      .eq('organisation_id', organisation.id)
      .single();

    if (!member) return;

    const regMap = new Map<string, ClubEventRegistration>();

    await Promise.all(
      events.map(async (event) => {
        const { data } = await getMyRegistration(event.id, member.id);
        if (data) {
          regMap.set(event.id, data);
        }
      })
    );

    setRegistrations(regMap);
  }, [profile?.id, organisation?.id, events]);

  useEffect(() => {
    if (!orgLoading && !userLoading && organisation?.id) {
      fetchEvents();
    }
  }, [orgLoading, userLoading, organisation?.id, fetchEvents]);

  useEffect(() => {
    if (events.length > 0 && profile?.id) {
      fetchRegistrations();
    }
  }, [events, profile?.id, fetchRegistrations]);

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
  }, []);

  if (orgLoading || userLoading) {
    return <PageSkeleton />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Events"
        description="Club events, socials, and functions"
        actions={
          isAdmin ? (
            <Button asChild size="sm" className="gap-2">
              <Link href="/events/new">
                <Plus className="h-4 w-4" />
                Create Event
              </Link>
            </Button>
          ) : undefined
        }
      />

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput
          placeholder="Search events..."
          onSearch={handleSearch}
          className="w-full sm:max-w-xs"
        />

        {/* Event type filter */}
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setEventTypeFilter('all')}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              eventTypeFilter === 'all'
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-background hover:bg-muted'
            }`}
          >
            All
          </button>
          {CLUB_EVENT_TYPE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setEventTypeFilter(opt.value)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                eventTypeFilter === opt.value
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-background hover:bg-muted'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-64 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : (
        <EventList events={events} registrations={registrations} isAdmin={isAdmin} />
      )}
    </div>
  );
}
