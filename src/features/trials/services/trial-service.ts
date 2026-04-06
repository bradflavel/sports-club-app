import { createClient } from '@/lib/supabase/client';
import type {
  CompetitionDivision,
  Activity,
  ActivityEvent,
  MemberWithProfile,
  AttendanceStatus,
  ActivityEventAttendance,
  PaymentWithMember,
} from '@/lib/supabase/database.types';

/**
 * Get all trial instances for a parent competition.
 * Each trial instance is scoped to one division.
 */
export async function getTrialInstancesForCompetition(parentActivityId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('activities')
    .select('*')
    .eq('parent_activity_id', parentActivityId)
    .eq('activity_type', 'trials')
    .order('name');

  return { data: (data ?? []) as Activity[], error };
}

/**
 * Get the division linked to a trials activity.
 */
export async function getTrialDivision(divisionId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('competition_divisions')
    .select('*')
    .eq('id', divisionId)
    .single();

  return { data: data as CompetitionDivision | null, error };
}

/**
 * Get trial events (dates/sessions) for a specific trials activity.
 */
export async function getTrialEvents(activityId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('activity_events')
    .select('*')
    .eq('activity_id', activityId)
    .order('date_time', { ascending: true });

  return { data: (data ?? []) as ActivityEvent[], error };
}

/**
 * Get members from the parent competition's teams, filtered by division name.
 */
export async function getTrialMembers(
  parentActivityId: string,
  divisionName?: string
) {
  const supabase = createClient();

  let teamsQuery = supabase
    .from('activity_teams')
    .select('id')
    .eq('activity_id', parentActivityId);

  if (divisionName) {
    teamsQuery = teamsQuery.eq('division', divisionName);
  }

  const { data: teams } = await teamsQuery;
  if (!teams || teams.length === 0) return { data: [], error: null };

  const teamIds = teams.map((t: { id: string }) => t.id);

  const { data: teamMembers, error } = await supabase
    .from('activity_team_members')
    .select('member_id, member:members(*, profile:profiles(*))')
    .in('activity_team_id', teamIds);

  if (error || !teamMembers) return { data: null, error };

  // Deduplicate members
  const seen = new Set<string>();
  const uniqueMembers: MemberWithProfile[] = [];

  for (const tm of teamMembers as unknown as { member_id: string; member: MemberWithProfile }[]) {
    if (!seen.has(tm.member_id)) {
      seen.add(tm.member_id);
      uniqueMembers.push(tm.member);
    }
  }

  return { data: uniqueMembers, error: null };
}

export async function updateTrialFeeConfig(
  activityId: string,
  config: { feeType: string; feeAmountCents: number }
) {
  const supabase = createClient();
  const { error } = await supabase
    .from('activities')
    .update({
      trial_fee_type: config.feeType,
      trial_fee_amount_cents: config.feeAmountCents,
      updated_at: new Date().toISOString(),
    })
    .eq('id', activityId);

  return { error };
}

// ---------------------------------------------------------------------------
// Roster management (used by TrialMemberPicker)
// ---------------------------------------------------------------------------

/**
 * Get or create the roster team for a trial activity.
 * Returns the team id.
 */
export async function getOrCreateRosterTeam(
  activityId: string,
  orgId: string,
  division?: CompetitionDivision | null
): Promise<{ teamId: string | null; error: unknown }> {
  const supabase = createClient();

  const { data: teams } = await supabase
    .from('activity_teams')
    .select('id')
    .eq('activity_id', activityId)
    .limit(1);

  if (teams && teams.length > 0) {
    return { teamId: (teams[0] as { id: string }).id, error: null };
  }

  const { data: newTeam, error } = await supabase
    .from('activity_teams')
    .insert({
      activity_id: activityId,
      organisation_id: orgId,
      name: 'Roster',
      division: division?.name ?? null,
      age_group: division?.age_group ?? null,
      coach_id: null,
      manager_id: null,
      max_players: 999,
      is_own_team: true,
      source_team_id: null,
      pool_number: null,
      seed_number: null,
    })
    .select('id')
    .single();

  return { teamId: (newTeam as { id: string } | null)?.id ?? null, error };
}

export async function getRosterMembers(teamId: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('activity_team_members')
    .select('id, member_id, member:members(*, profile:profiles(*))')
    .eq('activity_team_id', teamId);

  return { data, error };
}

export async function removeRosterMember(teamMemberId: string) {
  const supabase = createClient();

  const { error } = await supabase
    .from('activity_team_members')
    .delete()
    .eq('id', teamMemberId);

  return { error };
}

export async function addRosterMembers(
  teamId: string,
  memberIds: string[]
) {
  const supabase = createClient();

  const inserts = memberIds.map((memberId) => ({
    activity_team_id: teamId,
    member_id: memberId,
    jersey_number: null as number | null,
    position: null as string | null,
    is_captain: false,
  }));

  const { error } = await supabase.from('activity_team_members').insert(inserts);
  return { error };
}

export async function getActiveMembersForOrg(orgId: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('members')
    .select('*, profile:profiles(*)')
    .eq('organisation_id', orgId)
    .eq('membership_status', 'active')
    .order('profile(first_name)');

  return { data: data as unknown as MemberWithProfile[] | null, error };
}

// ---------------------------------------------------------------------------
// Trial attendance (used by TrialAttendanceTracker)
// ---------------------------------------------------------------------------

export async function getTrialTeamIds(activityId: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('activity_teams')
    .select('id')
    .eq('activity_id', activityId);

  return { data: (data ?? []).map((t: { id: string }) => t.id), error };
}

export async function getTrialRosterMembersForTeams(teamIds: string[]) {
  const supabase = createClient();

  if (teamIds.length === 0) return { data: [] as MemberWithProfile[], error: null };

  const { data, error } = await supabase
    .from('activity_team_members')
    .select('member_id, member:members(*, profile:profiles(*))')
    .in('activity_team_id', teamIds);

  if (error || !data) return { data: null, error };

  const seen = new Set<string>();
  const unique: MemberWithProfile[] = [];
  for (const tm of data as unknown as { member_id: string; member: MemberWithProfile }[]) {
    if (!seen.has(tm.member_id)) {
      seen.add(tm.member_id);
      unique.push(tm.member);
    }
  }

  return { data: unique, error: null };
}

export async function getAttendanceForEventClient(eventId: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('activity_event_attendance')
    .select('*')
    .eq('event_id', eventId);

  return { data: data as unknown as ActivityEventAttendance[] | null, error };
}

export async function upsertTrialAttendance(
  eventId: string,
  memberId: string,
  status: AttendanceStatus,
  existingId?: string
): Promise<{ id: string | null; error: unknown }> {
  const supabase = createClient();

  if (existingId) {
    const { error } = await supabase
      .from('activity_event_attendance')
      .update({
        status,
        checked_in_at: status === 'attended' ? new Date().toISOString() : null,
      })
      .eq('id', existingId);
    return { id: existingId, error };
  }

  const { data, error } = await supabase
    .from('activity_event_attendance')
    .insert({
      event_id: eventId,
      member_id: memberId,
      status,
      checked_in_at: status === 'attended' ? new Date().toISOString() : null,
      notes: null,
    })
    .select('id')
    .single();

  return { id: (data as { id: string } | null)?.id ?? null, error };
}

// ---------------------------------------------------------------------------
// Trial payments (used by TrialPaymentTable)
// ---------------------------------------------------------------------------

export async function getTrialFeePayments(orgId: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('payments')
    .select('*, member:members(*, profile:profiles(*))')
    .eq('organisation_id', orgId)
    .eq('payment_type', 'trial_fee')
    .order('created_at', { ascending: false });

  return { data: data as unknown as PaymentWithMember[] | null, error };
}

export async function markTrialPaymentAsPaid(paymentId: string) {
  const supabase = createClient();

  const { error } = await supabase
    .from('payments')
    .update({
      status: 'paid',
      paid_date: new Date().toISOString().split('T')[0],
      updated_at: new Date().toISOString(),
    })
    .eq('id', paymentId);

  return { error };
}

export async function generateTrialInvoices(
  orgId: string,
  memberIds: string[],
  feeType: string,
  feeAmountCents: number,
  createdBy: string,
  trialEventCount: number
) {
  const supabase = createClient();

  const payments = memberIds.map((memberId) => ({
    organisation_id: orgId,
    member_id: memberId,
    amount_cents: feeType === 'per_trial' ? feeAmountCents * trialEventCount : feeAmountCents,
    description: feeType === 'per_trial'
      ? `Trial fees (${trialEventCount} sessions)`
      : 'Trial fee (one-time)',
    payment_type: 'trial_fee' as const,
    status: 'pending' as const,
    due_date: new Date().toISOString().split('T')[0],
    created_by: createdBy,
    paid_date: null,
    stripe_payment_id: null,
  }));

  const { error } = await supabase.from('payments').insert(payments);
  return { error };
}
