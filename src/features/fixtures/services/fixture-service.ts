import { createClient } from '@/lib/supabase/server';
import type { Fixture, FixtureWithTeam, FixtureStatus } from '@/lib/supabase/database.types';
import type { FixtureFilters } from '@/features/fixtures/types/fixture-types';

export async function getFixtures(orgId: string, filters?: FixtureFilters) {
  const supabase = await createClient();

  let query = supabase
    .from('fixtures')
    .select('*, team:teams(*)')
    .eq('organisation_id', orgId);

  if (filters?.search) {
    query = query.ilike('opponent_name', `%${filters.search}%`);
  }

  if (filters?.teamId) {
    query = query.eq('team_id', filters.teamId);
  }

  if (filters?.status && filters.status.length > 0) {
    query = query.in('status', filters.status as FixtureStatus[]);
  }

  if (filters?.seasonId) {
    query = query.eq('season_id', filters.seasonId);
  }

  if (filters?.isHome !== undefined) {
    query = query.eq('is_home', filters.isHome);
  }

  query = query.order('date_time', { ascending: true });

  const { data, error } = await query;

  return { data: data as unknown as FixtureWithTeam[] | null, error };
}

export async function getFixtureById(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('fixtures')
    .select('*, team:teams(*)')
    .eq('id', id)
    .single();

  return { data: data as unknown as FixtureWithTeam | null, error };
}

export async function createFixture(fixtureData: {
  organisation_id: string;
  team_id: string;
  opponent_name: string;
  venue?: string | null;
  date_time: string;
  is_home: boolean;
  status?: Fixture['status'];
  round_number?: number | null;
  notes?: string | null;
  season_id?: string | null;
}) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('fixtures')
    .insert({
      organisation_id: fixtureData.organisation_id,
      team_id: fixtureData.team_id,
      opponent_name: fixtureData.opponent_name,
      venue: fixtureData.venue ?? null,
      date_time: fixtureData.date_time,
      is_home: fixtureData.is_home,
      status: fixtureData.status ?? 'scheduled',
      round_number: fixtureData.round_number ?? null,
      notes: fixtureData.notes ?? null,
      season_id: fixtureData.season_id ?? null,
      home_score: null,
      away_score: null,
    })
    .select('*, team:teams(*)')
    .single();

  return { data: data as unknown as FixtureWithTeam | null, error };
}

export async function updateFixture(
  id: string,
  fixtureData: Partial<
    Pick<
      Fixture,
      | 'opponent_name'
      | 'venue'
      | 'date_time'
      | 'is_home'
      | 'status'
      | 'home_score'
      | 'away_score'
      | 'round_number'
      | 'notes'
      | 'season_id'
      | 'team_id'
    >
  >
) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('fixtures')
    .update({ ...fixtureData, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*, team:teams(*)')
    .single();

  return { data: data as unknown as FixtureWithTeam | null, error };
}

export async function deleteFixture(id: string) {
  const supabase = await createClient();

  const { error } = await supabase.from('fixtures').delete().eq('id', id);

  return { data: null, error };
}

export async function recordResult(
  id: string,
  homeScore: number,
  awayScore: number
) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('fixtures')
    .update({
      home_score: homeScore,
      away_score: awayScore,
      status: 'completed',
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('*, team:teams(*)')
    .single();

  return { data: data as unknown as FixtureWithTeam | null, error };
}

export async function getUpcomingFixtures(orgId: string, limit = 5) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('fixtures')
    .select('*, team:teams(*)')
    .eq('organisation_id', orgId)
    .eq('status', 'scheduled')
    .gte('date_time', new Date().toISOString())
    .order('date_time', { ascending: true })
    .limit(limit);

  return { data: data as unknown as FixtureWithTeam[] | null, error };
}

export interface TeamStats {
  teamId: string;
  played: number;
  wins: number;
  losses: number;
  draws: number;
  pointsFor: number;
  pointsAgainst: number;
  pointsDifference: number;
}

export async function getTeamStats(teamId: string): Promise<{ data: TeamStats | null; error: unknown }> {
  const supabase = await createClient();

  const { data: fixtures, error } = await supabase
    .from('fixtures')
    .select('*')
    .eq('team_id', teamId)
    .eq('status', 'completed');

  if (error) return { data: null, error };
  if (!fixtures || fixtures.length === 0) {
    return {
      data: {
        teamId,
        played: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        pointsFor: 0,
        pointsAgainst: 0,
        pointsDifference: 0,
      },
      error: null,
    };
  }

  let wins = 0;
  let losses = 0;
  let draws = 0;
  let pointsFor = 0;
  let pointsAgainst = 0;

  for (const fixture of fixtures) {
    const homeScore = fixture.home_score ?? 0;
    const awayScore = fixture.away_score ?? 0;

    if (fixture.is_home) {
      pointsFor += homeScore;
      pointsAgainst += awayScore;
      if (homeScore > awayScore) wins++;
      else if (homeScore < awayScore) losses++;
      else draws++;
    } else {
      pointsFor += awayScore;
      pointsAgainst += homeScore;
      if (awayScore > homeScore) wins++;
      else if (awayScore < homeScore) losses++;
      else draws++;
    }
  }

  return {
    data: {
      teamId,
      played: fixtures.length,
      wins,
      losses,
      draws,
      pointsFor,
      pointsAgainst,
      pointsDifference: pointsFor - pointsAgainst,
    },
    error: null,
  };
}
