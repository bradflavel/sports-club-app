import { createClient } from '@/lib/supabase/client';
import type {
  ClubEvent,
  ClubEventWithVenue,
  ClubEventRegistration,
  ClubEventRegistrationWithMember,
  ClubEventRegistrationStatus,
  ClubEventStatus,
  ClubEventType,
} from '@/lib/supabase/database.types';
import type { ClubEventFilters } from '../types/club-event-types';

const EVENT_SELECT = '*, venue:club_venues(*)';
const REGISTRATION_SELECT = '*, member:members(*, profile:profiles(*))';

// ── Events ────────────────────────────────────────────────────────────────────

export async function getClubEvents(orgId: string, filters?: ClubEventFilters) {
  const supabase = createClient();
  let query = supabase
    .from('club_events')
    .select(EVENT_SELECT)
    .eq('organisation_id', orgId)
    .order('start_time', { ascending: true });

  if (filters?.eventType && filters.eventType.length > 0) {
    query = query.in('event_type', filters.eventType as ClubEventType[]);
  }
  if (filters?.status && filters.status.length > 0) {
    query = query.in('status', filters.status as ClubEventStatus[]);
  }
  if (filters?.dateFrom) {
    query = query.gte('start_time', filters.dateFrom);
  }
  if (filters?.dateTo) {
    query = query.lte('start_time', filters.dateTo);
  }
  if (filters?.search) {
    query = query.ilike('name', `%${filters.search}%`);
  }

  const { data, error } = await query;
  return { data: (data ?? []) as unknown as ClubEventWithVenue[], error };
}

export async function getClubEventById(eventId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('club_events')
    .select(EVENT_SELECT)
    .eq('id', eventId)
    .single();

  return { data: data as unknown as ClubEventWithVenue | null, error };
}

export async function getUpcomingClubEvents(orgId: string, limit = 3) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('club_events')
    .select(EVENT_SELECT)
    .eq('organisation_id', orgId)
    .eq('status', 'published')
    .gte('start_time', new Date().toISOString())
    .order('start_time', { ascending: true })
    .limit(limit);

  return { data: (data ?? []) as unknown as ClubEventWithVenue[], error };
}

export async function createClubEvent(eventData: Omit<ClubEvent, 'id' | 'created_at' | 'updated_at'>) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('club_events')
    .insert(eventData)
    .select(EVENT_SELECT)
    .single();

  return { data: data as unknown as ClubEventWithVenue | null, error };
}

export async function updateClubEvent(eventId: string, eventData: Partial<ClubEvent>) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('club_events')
    .update({ ...eventData, updated_at: new Date().toISOString() })
    .eq('id', eventId)
    .select(EVENT_SELECT)
    .single();

  return { data: data as unknown as ClubEventWithVenue | null, error };
}

export async function deleteClubEvent(eventId: string) {
  const supabase = createClient();
  const { error } = await supabase.from('club_events').delete().eq('id', eventId);
  return { error };
}

// ── Registrations ─────────────────────────────────────────────────────────────

export async function getEventRegistrations(eventId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('club_event_registrations')
    .select(REGISTRATION_SELECT)
    .eq('event_id', eventId)
    .order('registered_at', { ascending: true });

  return { data: (data ?? []) as unknown as ClubEventRegistrationWithMember[], error };
}

export async function getMyRegistration(eventId: string, memberId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('club_event_registrations')
    .select('*')
    .eq('event_id', eventId)
    .eq('member_id', memberId)
    .maybeSingle();

  return { data: data as ClubEventRegistration | null, error };
}

export async function registerForEvent(
  eventId: string,
  memberId: string,
  details?: { guestCount?: number; guestNames?: string; dietaryRequirements?: string; notes?: string }
) {
  const supabase = createClient();

  // Check capacity
  const { data: event } = await supabase
    .from('club_events')
    .select('max_attendees, enable_waitlist, registration_requires_approval')
    .eq('id', eventId)
    .single();

  let status: ClubEventRegistrationStatus = 'registered';

  if (event?.registration_requires_approval) {
    status = 'registered'; // Will need admin approval
  }

  if (event?.max_attendees) {
    const { count } = await supabase
      .from('club_event_registrations')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', eventId)
      .in('status', ['registered', 'approved']);

    if (count !== null && count >= event.max_attendees) {
      if (event.enable_waitlist) {
        status = 'waitlisted';
      } else {
        return { data: null, error: { message: 'This event is full.' } };
      }
    }
  }

  const { data, error } = await supabase
    .from('club_event_registrations')
    .insert({
      event_id: eventId,
      member_id: memberId,
      status,
      guest_count: details?.guestCount ?? 0,
      guest_names: details?.guestNames ?? null,
      dietary_requirements: details?.dietaryRequirements ?? null,
      notes: details?.notes ?? null,
      registered_at: new Date().toISOString(),
    })
    .select('*')
    .single();

  return { data: data as ClubEventRegistration | null, error };
}

export async function cancelRegistration(registrationId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('club_event_registrations')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', registrationId)
    .select('*')
    .single();

  return { data: data as ClubEventRegistration | null, error };
}

export async function approveRegistration(registrationId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('club_event_registrations')
    .update({
      status: 'approved',
      approved_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', registrationId)
    .select('*')
    .single();

  return { data: data as ClubEventRegistration | null, error };
}

export async function markAttended(registrationId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('club_event_registrations')
    .update({
      status: 'attended',
      updated_at: new Date().toISOString(),
    })
    .eq('id', registrationId)
    .select('*')
    .single();

  return { data: data as ClubEventRegistration | null, error };
}

export async function getRegistrationCount(eventId: string) {
  const supabase = createClient();
  const { count, error } = await supabase
    .from('club_event_registrations')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', eventId)
    .in('status', ['registered', 'approved', 'attended']);

  return { count: count ?? 0, error };
}

// ── Venues ────────────────────────────────────────────────────────────────────

export async function getVenuesForEvents(orgId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('club_venues')
    .select('*')
    .eq('organisation_id', orgId)
    .order('name');

  return { data: data ?? [], error };
}
