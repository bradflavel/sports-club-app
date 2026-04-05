import { createClient } from '@/lib/supabase/client';
import type { ActivityStandingWithTeam } from '@/lib/supabase/database.types';

export async function getStandings(activityId: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('activity_standings')
    .select('*, team:activity_teams(*)')
    .eq('activity_id', activityId)
    .order('ladder_points', { ascending: false })
    .order('points_for', { ascending: false });

  return { data: data as unknown as ActivityStandingWithTeam[] | null, error };
}

export async function recalculateStandings(activityId: string) {
  const supabase = createClient();

  // Fetch all completed events with both home and away teams
  const { data: events, error: eventsError } = await supabase
    .from('activity_events')
    .select('*')
    .eq('activity_id', activityId)
    .eq('status', 'completed')
    .not('home_team_id', 'is', null)
    .not('away_team_id', 'is', null);

  if (eventsError) return { data: null, error: eventsError };

  // Fetch all teams for this activity
  const { data: teams, error: teamsError } = await supabase
    .from('activity_teams')
    .select('id')
    .eq('activity_id', activityId);

  if (teamsError) return { data: null, error: teamsError };

  // Build standings map
  const standingsMap = new Map<
    string,
    {
      played: number;
      wins: number;
      losses: number;
      draws: number;
      points_for: number;
      points_against: number;
    }
  >();

  // Initialize all teams
  for (const team of teams ?? []) {
    standingsMap.set(team.id, {
      played: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      points_for: 0,
      points_against: 0,
    });
  }

  // Process events
  for (const event of events ?? []) {
    const homeId = event.home_team_id as string;
    const awayId = event.away_team_id as string;
    const homeScore = event.home_score ?? 0;
    const awayScore = event.away_score ?? 0;

    const homeStats = standingsMap.get(homeId) ?? {
      played: 0, wins: 0, losses: 0, draws: 0, points_for: 0, points_against: 0,
    };
    const awayStats = standingsMap.get(awayId) ?? {
      played: 0, wins: 0, losses: 0, draws: 0, points_for: 0, points_against: 0,
    };

    homeStats.played += 1;
    awayStats.played += 1;
    homeStats.points_for += homeScore;
    homeStats.points_against += awayScore;
    awayStats.points_for += awayScore;
    awayStats.points_against += homeScore;

    if (homeScore > awayScore) {
      homeStats.wins += 1;
      awayStats.losses += 1;
    } else if (homeScore < awayScore) {
      homeStats.losses += 1;
      awayStats.wins += 1;
    } else {
      homeStats.draws += 1;
      awayStats.draws += 1;
    }

    standingsMap.set(homeId, homeStats);
    standingsMap.set(awayId, awayStats);
  }

  // Upsert standings rows (win=3, draw=1, loss=0)
  const upsertRows = Array.from(standingsMap.entries()).map(([teamId, stats]) => ({
    activity_id: activityId,
    team_id: teamId,
    played: stats.played,
    wins: stats.wins,
    losses: stats.losses,
    draws: stats.draws,
    points_for: stats.points_for,
    points_against: stats.points_against,
    bonus_points: 0,
    ladder_points: stats.wins * 3 + stats.draws * 1,
    updated_at: new Date().toISOString(),
  }));

  if (upsertRows.length === 0) {
    return { data: [], error: null };
  }

  const { data: result, error: upsertError } = await supabase
    .from('activity_standings')
    .upsert(upsertRows, { onConflict: 'activity_id,team_id' })
    .select('*, team:activity_teams(*)');

  return {
    data: result as unknown as ActivityStandingWithTeam[] | null,
    error: upsertError,
  };
}
