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

// ── Event Targets (audience) ─────────────────────────────────────────────────

export interface AudienceTargets {
  activityIds: string[];
  divisionIds: string[];
  teamIds: string[];
}

export async function setEventTargets(eventId: string, targets: AudienceTargets) {
  const supabase = createClient();
  await supabase.from('club_event_targets').delete().eq('event_id', eventId);
  const rows = [
    ...targets.activityIds.map((id) => ({
      event_id: eventId,
      activity_id: id,
      division_id: null,
      activity_team_id: null,
    })),
    ...targets.divisionIds.map((id) => ({
      event_id: eventId,
      activity_id: null,
      division_id: id,
      activity_team_id: null,
    })),
    ...targets.teamIds.map((id) => ({
      event_id: eventId,
      activity_id: null,
      division_id: null,
      activity_team_id: id,
    })),
  ];
  if (rows.length === 0) return { error: null };
  const { error } = await supabase.from('club_event_targets').insert(rows as any);
  return { error };
}

export async function getEventTargets(eventId: string): Promise<AudienceTargets & { error: unknown }> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('club_event_targets')
    .select('activity_id, division_id, activity_team_id')
    .eq('event_id', eventId);
  const rows = (data ?? []) as unknown as Array<{ activity_id: string | null; division_id: string | null; activity_team_id: string | null }>;
  return {
    activityIds: rows.filter((r) => r.activity_id).map((r) => r.activity_id as string),
    divisionIds: rows.filter((r) => r.division_id).map((r) => r.division_id as string),
    teamIds: rows.filter((r) => r.activity_team_id).map((r) => r.activity_team_id as string),
    error,
  };
}

// Hierarchical data for the audience picker:
// Activity → Divisions → Teams (+ child activities like training/trials)
export interface PickerTeam {
  id: string;
  name: string;
}
export interface PickerDivision {
  id: string;
  name: string;
  teams: PickerTeam[];
}
export interface PickerActivity {
  id: string;
  name: string;
  activity_type: string;
  divisions: PickerDivision[];
  childActivities: { id: string; name: string; activity_type: string }[];
}

export async function getActivitiesForEventPicker(orgId: string) {
  const supabase = createClient();

  const [activitiesRes, divisionsRes, teamsRes] = await Promise.all([
    supabase
      .from('activities')
      .select('id, name, activity_type, parent_activity_id')
      .eq('organisation_id', orgId)
      .eq('is_current', true)
      .order('name'),
    supabase
      .from('competition_divisions')
      .select('id, activity_id, name, age_group, gender')
      .order('display_order'),
    supabase
      .from('activity_teams')
      .select('id, activity_id, name, division, is_own_team')
      .eq('is_own_team', true)
      .order('name'),
  ]);

  if (activitiesRes.error) return { data: [], error: activitiesRes.error };

  const allActivities = activitiesRes.data ?? [];
  const allDivisions = divisionsRes.data ?? [];
  const allTeams = teamsRes.data ?? [];

  const topLevel = allActivities.filter((a) => !a.parent_activity_id);
  const children = allActivities.filter((a) => a.parent_activity_id);

  const result: PickerActivity[] = topLevel.map((parent) => {
    // Divisions for this activity
    const divisions: PickerDivision[] = allDivisions
      .filter((d) => d.activity_id === parent.id)
      .map((d) => ({
        id: d.id,
        name: d.name,
        teams: allTeams
          .filter((t) => t.activity_id === parent.id && t.division === d.name)
          .map((t) => ({ id: t.id, name: t.name === 'Roster' ? `${d.name} Roster` : t.name })),
      }));

    // Child activities (training, trials, etc.)
    const childActivities = children
      .filter((c) => c.parent_activity_id === parent.id)
      .map((c) => ({ id: c.id, name: c.name, activity_type: c.activity_type }));

    return {
      id: parent.id,
      name: parent.name,
      activity_type: parent.activity_type,
      divisions,
      childActivities,
    };
  });

  // Standalone activities without parents or children
  for (const act of allActivities) {
    if (act.parent_activity_id) continue;
    if (result.some((r) => r.id === act.id)) continue;
    result.push({
      id: act.id,
      name: act.name,
      activity_type: act.activity_type,
      divisions: [],
      childActivities: [],
    });
  }

  return { data: result, error: null };
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
