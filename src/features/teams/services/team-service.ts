import { createClient } from '@/lib/supabase/server';
import type {
  Team,
  TeamWithDetails,
  TeamMember,
  TeamMemberWithDetails,
  Season,
} from '@/lib/supabase/database.types';
import type { TeamFilters } from '@/features/teams/types/team-types';

export async function getTeams(orgId: string, filters?: TeamFilters) {
  const supabase = await createClient();

  let query = supabase
    .from('teams')
    .select(
      '*, coach:profiles!teams_coach_id_fkey(*), manager:profiles!teams_manager_id_fkey(*), season:seasons(*)'
    )
    .eq('organisation_id', orgId);

  if (filters?.search) {
    query = query.ilike('name', `%${filters.search}%`);
  }

  if (filters?.seasonId) {
    query = query.eq('season_id', filters.seasonId);
  }

  if (filters?.coachId) {
    query = query.eq('coach_id', filters.coachId);
  }

  query = query.order('name', { ascending: true });

  const { data, error } = await query;

  return { data: data as unknown as TeamWithDetails[] | null, error };
}

export async function getTeamById(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('teams')
    .select(
      '*, coach:profiles!teams_coach_id_fkey(*), manager:profiles!teams_manager_id_fkey(*), season:seasons(*)'
    )
    .eq('id', id)
    .single();

  return { data: data as unknown as TeamWithDetails | null, error };
}

export async function createTeam(teamData: {
  organisation_id: string;
  name: string;
  division?: string | null;
  age_group?: string | null;
  season_id?: string | null;
  coach_id?: string | null;
  manager_id?: string | null;
  max_players: number;
}) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('teams')
    .insert({
      ...teamData,
      division: teamData.division ?? null,
      age_group: teamData.age_group ?? null,
      season_id: teamData.season_id ?? null,
      coach_id: teamData.coach_id ?? null,
      manager_id: teamData.manager_id ?? null,
    })
    .select(
      '*, coach:profiles!teams_coach_id_fkey(*), manager:profiles!teams_manager_id_fkey(*), season:seasons(*)'
    )
    .single();

  return { data: data as unknown as TeamWithDetails | null, error };
}

export async function updateTeam(
  id: string,
  teamData: Partial<
    Pick<
      Team,
      | 'name'
      | 'division'
      | 'age_group'
      | 'season_id'
      | 'coach_id'
      | 'manager_id'
      | 'max_players'
    >
  >
) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('teams')
    .update({ ...teamData, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select(
      '*, coach:profiles!teams_coach_id_fkey(*), manager:profiles!teams_manager_id_fkey(*), season:seasons(*)'
    )
    .single();

  return { data: data as unknown as TeamWithDetails | null, error };
}

export async function deleteTeam(id: string) {
  const supabase = await createClient();

  const { error } = await supabase.from('teams').delete().eq('id', id);

  return { data: null, error };
}

export async function getTeamMembers(teamId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('team_members')
    .select('*, member:members(*, profile:profiles(*))')
    .eq('team_id', teamId)
    .order('joined_at', { ascending: true });

  return { data: data as unknown as TeamMemberWithDetails[] | null, error };
}

export async function addTeamMember(
  teamId: string,
  memberId: string,
  memberData: {
    jersey_number?: number | null;
    position?: string | null;
    is_captain?: boolean;
  }
) {
  const supabase = await createClient();

  // Fetch team to check max_players
  const { data: team, error: teamError } = await supabase
    .from('teams')
    .select('max_players')
    .eq('id', teamId)
    .single();

  if (teamError) return { data: null, error: teamError };

  // Count current members
  const { count, error: countError } = await supabase
    .from('team_members')
    .select('*', { count: 'exact', head: true })
    .eq('team_id', teamId);

  if (countError) return { data: null, error: countError };

  if (count !== null && count >= team.max_players) {
    return {
      data: null,
      error: new Error(
        `Team has reached its maximum of ${team.max_players} players`
      ),
    };
  }

  const { data, error } = await supabase
    .from('team_members')
    .insert({
      team_id: teamId,
      member_id: memberId,
      jersey_number: memberData.jersey_number ?? null,
      position: memberData.position ?? null,
      is_captain: memberData.is_captain ?? false,
    })
    .select('*, member:members(*, profile:profiles(*))')
    .single();

  return { data: data as unknown as TeamMemberWithDetails | null, error };
}

export async function removeTeamMember(teamMemberId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('team_members')
    .delete()
    .eq('id', teamMemberId);

  return { data: null, error };
}

export async function updateTeamMember(
  teamMemberId: string,
  memberData: Partial<Pick<TeamMember, 'jersey_number' | 'position' | 'is_captain'>>
) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('team_members')
    .update(memberData)
    .eq('id', teamMemberId)
    .select('*, member:members(*, profile:profiles(*))')
    .single();

  return { data: data as unknown as TeamMemberWithDetails | null, error };
}

export async function getSeasons(orgId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('seasons')
    .select('*')
    .eq('organisation_id', orgId)
    .order('start_date', { ascending: false });

  return { data: data as Season[] | null, error };
}

export async function createSeason(seasonData: {
  organisation_id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_current?: boolean;
}) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('seasons')
    .insert({
      ...seasonData,
      is_current: seasonData.is_current ?? false,
    })
    .select()
    .single();

  return { data: data as Season | null, error };
}

export async function setCurrentSeason(orgId: string, seasonId: string) {
  const supabase = await createClient();

  // Unset all seasons for this org
  const { error: unsetError } = await supabase
    .from('seasons')
    .update({ is_current: false })
    .eq('organisation_id', orgId);

  if (unsetError) return { data: null, error: unsetError };

  // Set the target season as current
  const { data, error } = await supabase
    .from('seasons')
    .update({ is_current: true })
    .eq('id', seasonId)
    .eq('organisation_id', orgId)
    .select()
    .single();

  return { data: data as Season | null, error };
}
