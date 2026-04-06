import { createClient } from '@/lib/supabase/client';
import type {
  CompetitionDivision,
  Activity,
  ActivityEvent,
  MemberWithProfile,
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
