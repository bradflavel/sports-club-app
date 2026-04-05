import { createClient } from '@/lib/supabase/client';
import type {
  ActivityEventWithTeams,
  EventStatus,
  TournamentStage,
} from '@/lib/supabase/database.types';
import type { EventFilters } from '@/features/activity-events/types/event-types';

const EVENT_SELECT = '*, home_team:activity_teams!home_team_id(*), away_team:activity_teams!away_team_id(*), activity:activities(*)';

export async function getEventsForActivity(
  activityId: string,
  filters?: EventFilters
) {
  const supabase = createClient();

  let query = supabase
    .from('activity_events')
    .select(EVENT_SELECT)
    .eq('activity_id', activityId);

  if (filters?.status && filters.status.length > 0) {
    query = query.in('status', filters.status as EventStatus[]);
  }

  if (filters?.teamId) {
    query = query.or(`home_team_id.eq.${filters.teamId},away_team_id.eq.${filters.teamId}`);
  }

  if (filters?.roundNumber !== undefined) {
    query = query.eq('round_number', filters.roundNumber);
  }

  query = query.order('date_time', { ascending: true });

  const { data, error } = await query;

  return { data: data as unknown as ActivityEventWithTeams[] | null, error };
}

export async function getEventById(eventId: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('activity_events')
    .select(EVENT_SELECT)
    .eq('id', eventId)
    .single();

  return { data: data as unknown as ActivityEventWithTeams | null, error };
}

export async function createEvent(
  activityId: string,
  orgId: string,
  data: {
    home_team_id?: string | null;
    away_team_id?: string | null;
    opponent_name?: string | null;
    is_home?: boolean | null;
    title?: string | null;
    venue?: string | null;
    date_time: string;
    end_time?: string | null;
    round_number?: number | null;
    tournament_stage?: TournamentStage | null;
    pool_number?: number | null;
    notes?: string | null;
    day_number?: number | null;
    session_number?: number | null;
  }
) {
  const supabase = createClient();

  const { data: result, error } = await supabase
    .from('activity_events')
    .insert({
      activity_id: activityId,
      organisation_id: orgId,
      home_team_id: data.home_team_id ?? null,
      away_team_id: data.away_team_id ?? null,
      opponent_name: data.opponent_name ?? null,
      is_home: data.is_home ?? null,
      title: data.title ?? null,
      venue: data.venue ?? null,
      date_time: data.date_time,
      end_time: data.end_time ?? null,
      round_number: data.round_number ?? null,
      tournament_stage: data.tournament_stage ?? null,
      pool_number: data.pool_number ?? null,
      notes: data.notes ?? null,
      day_number: data.day_number ?? null,
      session_number: data.session_number ?? null,
      status: 'scheduled' as EventStatus,
      home_score: null,
      away_score: null,
      bracket_position: null,
    })
    .select(EVENT_SELECT)
    .single();

  return { data: result as unknown as ActivityEventWithTeams | null, error };
}

export async function updateEvent(
  eventId: string,
  data: {
    home_team_id?: string | null;
    away_team_id?: string | null;
    opponent_name?: string | null;
    is_home?: boolean | null;
    title?: string | null;
    venue?: string | null;
    date_time?: string;
    end_time?: string | null;
    round_number?: number | null;
    tournament_stage?: TournamentStage | null;
    pool_number?: number | null;
    notes?: string | null;
    day_number?: number | null;
    session_number?: number | null;
    status?: EventStatus;
  }
) {
  const supabase = createClient();

  const { data: result, error } = await supabase
    .from('activity_events')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', eventId)
    .select(EVENT_SELECT)
    .single();

  return { data: result as unknown as ActivityEventWithTeams | null, error };
}

export async function deleteEvent(eventId: string) {
  const supabase = createClient();

  const { error } = await supabase
    .from('activity_events')
    .delete()
    .eq('id', eventId);

  return { data: null, error };
}

export async function recordResult(
  eventId: string,
  homeScore: number,
  awayScore: number
) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('activity_events')
    .update({
      home_score: homeScore,
      away_score: awayScore,
      status: 'completed' as EventStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', eventId)
    .select(EVENT_SELECT)
    .single();

  return { data: data as unknown as ActivityEventWithTeams | null, error };
}

export async function getUpcomingEvents(orgId: string, limit = 5) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('activity_events')
    .select(EVENT_SELECT)
    .eq('organisation_id', orgId)
    .eq('status', 'scheduled')
    .gte('date_time', new Date().toISOString())
    .order('date_time', { ascending: true })
    .limit(limit);

  return { data: data as unknown as ActivityEventWithTeams[] | null, error };
}
