import { createClient } from '@/lib/supabase/client';
import type {
  Activity,
  ActivityEvent,
  CompetitionDivision,
  MemberWithProfile,
  Profile,
} from '@/lib/supabase/database.types';
import { getTrialInstancesForCompetition, getTrialDivision, getTrialEvents } from '@/features/trials/services/trial-service';

// ── Age / gender helpers (shared logic extracted from trial-member-picker) ──

/** Parse an age group string like "U18" or "Under 16" into a max age number */
export function parseAgeLimit(ageGroup: string): number | null {
  const match = ageGroup.match(/(?:u|under\s*)(\d+)/i);
  return match ? parseInt(match[1]) : null;
}

export function calcAge(dob: string): number {
  const birth = new Date(dob + 'T00:00:00');
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const monthDiff = now.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) age--;
  return age;
}

// ── Trial open/closed logic ──

const TRIAL_CLOSE_BUFFER_MS = 15 * 60 * 1000; // 15 minutes

/** Returns true if the trial is still open for registration */
export async function isTrialOpen(trialActivityId: string): Promise<boolean> {
  const { data: events } = await getTrialEvents(trialActivityId);
  if (!events || events.length === 0) return true; // no sessions scheduled yet

  // Find the last (latest) session
  const lastSession = events[events.length - 1]; // already sorted ascending by date_time
  const cutoff = new Date(lastSession.date_time).getTime() + TRIAL_CLOSE_BUFFER_MS;
  return Date.now() < cutoff;
}

// ── Member record lookup ──

export async function getMemberRecord(profileId: string, orgId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('members')
    .select('*, profile:profiles(*)')
    .eq('profile_id', profileId)
    .eq('organisation_id', orgId)
    .single();

  return { data: data as MemberWithProfile | null, error };
}

// ── Eligible trials for a competition ──

export interface TrialWithDetails {
  trial: Activity;
  division: CompetitionDivision | null;
  events: ActivityEvent[];
  isOpen: boolean;
  isRegistered: boolean;
}

export async function getEligibleTrials(
  competitionId: string,
  memberId: string | null,
  profile: Profile | null
): Promise<TrialWithDetails[]> {
  const { data: trials } = await getTrialInstancesForCompetition(competitionId);
  if (!trials || trials.length === 0) return [];

  const results: TrialWithDetails[] = [];

  for (const trial of trials) {
    // Fetch division and events in parallel
    const [divResult, eventsResult, openResult] = await Promise.all([
      trial.competition_division_id
        ? getTrialDivision(trial.competition_division_id)
        : Promise.resolve({ data: null }),
      getTrialEvents(trial.id),
      isTrialOpen(trial.id),
    ]);

    const division = divResult.data;

    // Check eligibility based on age/gender constraints
    if (division && profile) {
      // Gender filter
      if (
        division.gender &&
        division.gender !== 'open' &&
        division.gender !== 'mixed'
      ) {
        if (profile.gender && profile.gender !== division.gender) continue;
      }
      // Age filter
      if (division.age_group) {
        const ageLimit = parseAgeLimit(division.age_group);
        if (ageLimit && profile.date_of_birth) {
          const age = calcAge(profile.date_of_birth);
          if (age >= ageLimit) continue;
        }
      }
    }

    // Check if already registered
    let isRegistered = false;
    if (memberId) {
      isRegistered = await checkTrialRegistration(trial.id, memberId);
    }

    results.push({
      trial,
      division,
      events: eventsResult.data ?? [],
      isOpen: openResult,
      isRegistered,
    });
  }

  return results;
}

// ── Registration check ──

async function checkTrialRegistration(
  trialActivityId: string,
  memberId: string
): Promise<boolean> {
  const supabase = createClient();

  // Find the roster team for this trial
  const { data: teams } = await supabase
    .from('activity_teams')
    .select('id')
    .eq('activity_id', trialActivityId)
    .limit(1);

  if (!teams || teams.length === 0) return false;

  const { data: member } = await supabase
    .from('activity_team_members')
    .select('id')
    .eq('activity_team_id', teams[0].id)
    .eq('member_id', memberId)
    .limit(1);

  return !!(member && member.length > 0);
}

// ── Register for trial ──

interface RegisterForTrialParams {
  trialActivityId: string;
  orgId: string;
  memberId: string;
  profileId: string;
  divisionName: string | null;
  ageGroup: string | null;
  selectedEventIds: string[];
  feeType: string | null;
  feeAmountCents: number;
  trialEventCount: number;
}

export async function registerForTrial(params: RegisterForTrialParams) {
  const supabase = createClient();

  // Step 1: Find or create the Roster team
  const { data: existingTeams } = await supabase
    .from('activity_teams')
    .select('id')
    .eq('activity_id', params.trialActivityId)
    .limit(1);

  let teamId: string;
  if (!existingTeams || existingTeams.length === 0) {
    const { data: newTeam, error: teamError } = await supabase
      .from('activity_teams')
      .insert({
        activity_id: params.trialActivityId,
        organisation_id: params.orgId,
        name: 'Roster',
        division: params.divisionName,
        age_group: params.ageGroup,
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

    if (teamError || !newTeam) return { error: teamError };
    teamId = (newTeam as { id: string }).id;
  } else {
    teamId = existingTeams[0].id;
  }

  // Step 2: Check not already registered (prevent duplicates)
  const { data: existing } = await supabase
    .from('activity_team_members')
    .select('id')
    .eq('activity_team_id', teamId)
    .eq('member_id', params.memberId)
    .limit(1);

  if (existing && existing.length > 0) {
    return { error: null, alreadyRegistered: true };
  }

  // Step 3: Insert into roster
  const { error: memberError } = await supabase
    .from('activity_team_members')
    .insert({
      activity_team_id: teamId,
      member_id: params.memberId,
      jersey_number: null,
      position: null,
      is_captain: false,
    });

  if (memberError) return { error: memberError };

  // Step 4: Create attendance records for selected sessions
  if (params.selectedEventIds.length > 0) {
    const attendanceRecords = params.selectedEventIds.map((eventId) => ({
      event_id: eventId,
      member_id: params.memberId,
      status: 'attending' as const,
      checked_in_at: null,
      notes: null,
    }));

    const { error: attendanceError } = await supabase
      .from('activity_event_attendance')
      .insert(attendanceRecords);

    if (attendanceError) return { error: attendanceError };
  }

  // Step 5: Create pending payment if fee configured
  if (params.feeAmountCents > 0) {
    // Check for existing payment to prevent duplicates
    const { data: existingPayment } = await supabase
      .from('payments')
      .select('id')
      .eq('member_id', params.memberId)
      .eq('payment_type', 'trial_fee')
      .eq('created_by', params.profileId)
      .limit(1);

    if (!existingPayment || existingPayment.length === 0) {
      const amount =
        params.feeType === 'per_trial'
          ? params.feeAmountCents * params.trialEventCount
          : params.feeAmountCents;

      const { error: paymentError } = await supabase.from('payments').insert({
        organisation_id: params.orgId,
        member_id: params.memberId,
        amount_cents: amount,
        description:
          params.feeType === 'per_trial'
            ? `Trial fees (${params.trialEventCount} sessions)`
            : 'Trial fee (one-time)',
        payment_type: 'trial_fee' as const,
        payment_status: 'pending' as const,
        due_date: new Date().toISOString().split('T')[0],
        created_by: params.profileId,
        paid_at: null,
        stripe_payment_intent_id: null,
      });

      if (paymentError) return { error: paymentError };
    }
  }

  return { error: null, alreadyRegistered: false };
}

// ── Competition status helper ──

export type CompetitionStatus =
  | 'upcoming'
  | 'trials_open'
  | 'in_progress'
  | 'completed';

export async function getCompetitionStatus(
  activity: Activity
): Promise<CompetitionStatus> {
  const now = new Date();

  // Check if completed
  if (activity.end_date && new Date(activity.end_date) < now) return 'completed';

  // Check if trials are open
  if (activity.trials_required) {
    const { data: trials } = await getTrialInstancesForCompetition(activity.id);
    if (trials && trials.length > 0) {
      // Check if any trial is still open
      for (const trial of trials) {
        const open = await isTrialOpen(trial.id);
        if (open) return 'trials_open';
      }
    }
  }

  // Check if competition has started
  if (activity.first_round_date && new Date(activity.first_round_date) <= now) {
    return 'in_progress';
  }
  if (activity.start_date && new Date(activity.start_date) <= now) {
    return 'in_progress';
  }

  return 'upcoming';
}

// ── Division count for a competition ──

export async function getDivisionCount(competitionId: string): Promise<number> {
  const supabase = createClient();
  const { data } = await supabase
    .from('competition_divisions')
    .select('id')
    .eq('activity_id', competitionId);

  return data?.length ?? 0;
}
