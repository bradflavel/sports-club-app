import { createClient } from '@/lib/supabase/client';
import type {
  ActivityTeamWithDetails,
  ActivityTeamMemberWithDetails,
  ActivityTeam,
} from '@/features/activity-teams/types/activity-team-types';

export async function getTeamsForActivity(activityId: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('activity_teams')
    .select(
      '*, coach:profiles!activity_teams_coach_id_fkey(*), manager:profiles!activity_teams_manager_id_fkey(*)'
    )
    .eq('activity_id', activityId)
    .order('name', { ascending: true });

  if (error || !data) {
    return { data: null, error };
  }

  // Count members per team
  const teamIds = data.map((t: { id: string }) => t.id);
  const memberCounts: Record<string, number> = {};

  if (teamIds.length > 0) {
    const { data: countData } = await supabase
      .from('activity_team_members')
      .select('activity_team_id')
      .in('activity_team_id', teamIds);

    if (countData) {
      for (const row of countData) {
        const tid = (row as { activity_team_id: string }).activity_team_id;
        memberCounts[tid] = (memberCounts[tid] ?? 0) + 1;
      }
    }
  }

  const teams = (data as unknown as ActivityTeamWithDetails[]).map((team) => ({
    ...team,
    member_count: memberCounts[team.id] ?? 0,
  }));

  return { data: teams, error: null };
}

export async function getTeamById(teamId: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('activity_teams')
    .select(
      '*, coach:profiles!activity_teams_coach_id_fkey(*), manager:profiles!activity_teams_manager_id_fkey(*)'
    )
    .eq('id', teamId)
    .single();

  return { data: data as unknown as ActivityTeamWithDetails | null, error };
}

export async function createTeam(
  activityId: string,
  orgId: string,
  data: {
    name: string;
    division?: string | null;
    age_group?: string | null;
    coach_id?: string | null;
    manager_id?: string | null;
    max_players: number;
    is_own_team: boolean;
  }
) {
  const supabase = createClient();

  const { data: team, error } = await supabase
    .from('activity_teams')
    .insert({
      activity_id: activityId,
      organisation_id: orgId,
      name: data.name,
      division: data.division ?? null,
      age_group: data.age_group ?? null,
      coach_id: data.coach_id ?? null,
      manager_id: data.manager_id ?? null,
      max_players: data.max_players,
      is_own_team: data.is_own_team,
      source_team_id: null,
      pool_number: null,
      seed_number: null,
    })
    .select(
      '*, coach:profiles!activity_teams_coach_id_fkey(*), manager:profiles!activity_teams_manager_id_fkey(*)'
    )
    .single();

  return { data: team as unknown as ActivityTeamWithDetails | null, error };
}

export async function updateTeam(
  teamId: string,
  data: Partial<
    Pick<
      ActivityTeam,
      | 'name'
      | 'division'
      | 'age_group'
      | 'coach_id'
      | 'manager_id'
      | 'max_players'
      | 'is_own_team'
    >
  >
) {
  const supabase = createClient();

  const { data: team, error } = await supabase
    .from('activity_teams')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', teamId)
    .select(
      '*, coach:profiles!activity_teams_coach_id_fkey(*), manager:profiles!activity_teams_manager_id_fkey(*)'
    )
    .single();

  return { data: team as unknown as ActivityTeamWithDetails | null, error };
}

export async function deleteTeam(teamId: string) {
  const supabase = createClient();

  const { error } = await supabase.from('activity_teams').delete().eq('id', teamId);

  return { data: null, error };
}

export async function cloneTeam(
  sourceTeamId: string,
  targetActivityId: string,
  orgId: string
) {
  const supabase = createClient();

  // Fetch the source team
  const { data: source, error: sourceError } = await supabase
    .from('activity_teams')
    .select('*')
    .eq('id', sourceTeamId)
    .single();

  if (sourceError || !source) {
    return { data: null, error: sourceError ?? new Error('Source team not found') };
  }

  const sourceTeam = source as unknown as ActivityTeam;

  // Create the new team
  const { data: newTeam, error: createError } = await supabase
    .from('activity_teams')
    .insert({
      activity_id: targetActivityId,
      organisation_id: orgId,
      name: sourceTeam.name,
      division: sourceTeam.division,
      age_group: sourceTeam.age_group,
      coach_id: sourceTeam.coach_id,
      manager_id: sourceTeam.manager_id,
      max_players: sourceTeam.max_players,
      is_own_team: sourceTeam.is_own_team,
      source_team_id: sourceTeamId,
      pool_number: null,
      seed_number: null,
    })
    .select()
    .single();

  if (createError || !newTeam) {
    return { data: null, error: createError };
  }

  const createdTeam = newTeam as unknown as ActivityTeam;

  // Copy members from source team
  const { data: sourceMembers } = await supabase
    .from('activity_team_members')
    .select('*')
    .eq('activity_team_id', sourceTeamId);

  if (sourceMembers && sourceMembers.length > 0) {
    const memberInserts = sourceMembers.map(
      (m: { member_id: string; jersey_number: number | null; position: string | null; is_captain: boolean }) => ({
        activity_team_id: createdTeam.id,
        member_id: m.member_id,
        jersey_number: m.jersey_number,
        position: m.position,
        is_captain: m.is_captain,
      })
    );

    await supabase.from('activity_team_members').insert(memberInserts);
  }

  return { data: createdTeam, error: null };
}

export async function getTeamMembers(teamId: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('activity_team_members')
    .select('*, member:members(*, profile:profiles(*))')
    .eq('activity_team_id', teamId)
    .order('joined_at', { ascending: true });

  return { data: data as unknown as ActivityTeamMemberWithDetails[] | null, error };
}

export async function addTeamMember(
  teamId: string,
  data: {
    member_id: string;
    jersey_number?: number | null;
    position?: string | null;
    is_captain?: boolean;
  }
) {
  const supabase = createClient();

  const { data: member, error } = await supabase
    .from('activity_team_members')
    .insert({
      activity_team_id: teamId,
      member_id: data.member_id,
      jersey_number: data.jersey_number ?? null,
      position: data.position ?? null,
      is_captain: data.is_captain ?? false,
    })
    .select('*, member:members(*, profile:profiles(*))')
    .single();

  return { data: member as unknown as ActivityTeamMemberWithDetails | null, error };
}

export async function updateTeamMember(
  memberId: string,
  data: Partial<{
    jersey_number: number | null;
    position: string | null;
    is_captain: boolean;
  }>
) {
  const supabase = createClient();

  const { data: member, error } = await supabase
    .from('activity_team_members')
    .update(data)
    .eq('id', memberId)
    .select('*, member:members(*, profile:profiles(*))')
    .single();

  return { data: member as unknown as ActivityTeamMemberWithDetails | null, error };
}

export async function removeTeamMember(memberId: string) {
  const supabase = createClient();

  const { error } = await supabase
    .from('activity_team_members')
    .delete()
    .eq('id', memberId);

  return { data: null, error };
}
