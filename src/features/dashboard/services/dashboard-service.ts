import { createClient } from '@/lib/supabase/server';
import type {
  MemberWithProfile,
  FixtureWithTeam,
  Payment,
} from '@/lib/supabase/database.types';

export interface AdminDashboardData {
  memberCount: number;
  teamCount: number;
  upcomingFixtureCount: number;
  outstandingPaymentsTotal: number;
}

export async function getAdminDashboardData(
  orgId: string
): Promise<{ data: AdminDashboardData | null; error: unknown }> {
  const supabase = await createClient();

  const [
    { count: memberCount, error: memberError },
    { count: teamCount, error: teamError },
    { count: fixtureCount, error: fixtureError },
    { data: payments, error: paymentError },
  ] = await Promise.all([
    supabase
      .from('members')
      .select('*', { count: 'exact', head: true })
      .eq('organisation_id', orgId)
      .eq('membership_status', 'active'),

    supabase
      .from('teams')
      .select('*', { count: 'exact', head: true })
      .eq('organisation_id', orgId),

    supabase
      .from('fixtures')
      .select('*', { count: 'exact', head: true })
      .eq('organisation_id', orgId)
      .eq('status', 'scheduled')
      .gte('date_time', new Date().toISOString()),

    supabase
      .from('payments')
      .select('amount_cents, payment_status')
      .eq('organisation_id', orgId)
      .in('payment_status', ['pending', 'overdue']),
  ]);

  const firstError = memberError ?? teamError ?? fixtureError ?? paymentError;
  if (firstError) return { data: null, error: firstError };

  const outstandingPaymentsTotal = payments
    ? (payments as Pick<Payment, 'amount_cents' | 'payment_status'>[]).reduce(
        (sum, p) => sum + p.amount_cents,
        0
      ) / 100
    : 0;

  return {
    data: {
      memberCount: memberCount ?? 0,
      teamCount: teamCount ?? 0,
      upcomingFixtureCount: fixtureCount ?? 0,
      outstandingPaymentsTotal,
    },
    error: null,
  };
}

export interface MemberDashboardData {
  teams: Array<{ id: string; name: string; division: string | null }>;
  upcomingFixtures: FixtureWithTeam[];
  outstandingPayments: Payment[];
}

export async function getMemberDashboardData(
  userId: string,
  orgId: string
): Promise<{ data: MemberDashboardData | null; error: unknown }> {
  const supabase = await createClient();

  // Find the member record for this user in this org
  const { data: memberRecord, error: memberError } = await supabase
    .from('members')
    .select('id')
    .eq('profile_id', userId)
    .eq('organisation_id', orgId)
    .single();

  if (memberError) return { data: null, error: memberError };
  if (!memberRecord) return { data: null, error: new Error('Member record not found') };

  const memberId = memberRecord.id;

  // Fetch team memberships, upcoming fixtures for those teams, and outstanding payments in parallel
  const { data: teamMemberships, error: teamsError } = await supabase
    .from('team_members')
    .select('team_id')
    .eq('member_id', memberId);

  if (teamsError) return { data: null, error: teamsError };

  const teamIds = (teamMemberships ?? []).map((tm) => tm.team_id);

  const [
    { data: teams, error: teamsDetailError },
    { data: fixtures, error: fixturesError },
    { data: payments, error: paymentsError },
  ] = await Promise.all([
    teamIds.length > 0
      ? supabase
          .from('teams')
          .select('id, name, division')
          .in('id', teamIds)
      : Promise.resolve({ data: [], error: null }),

    teamIds.length > 0
      ? supabase
          .from('fixtures')
          .select('*, team:teams(*)')
          .eq('organisation_id', orgId)
          .in('team_id', teamIds)
          .eq('status', 'scheduled')
          .gte('date_time', new Date().toISOString())
          .order('date_time', { ascending: true })
          .limit(5)
      : Promise.resolve({ data: [], error: null }),

    supabase
      .from('payments')
      .select('*')
      .eq('member_id', memberId)
      .in('payment_status', ['pending', 'overdue'])
      .order('due_date', { ascending: true }),
  ]);

  const firstError = teamsDetailError ?? fixturesError ?? paymentsError;
  if (firstError) return { data: null, error: firstError };

  return {
    data: {
      teams: (teams ?? []) as Array<{
        id: string;
        name: string;
        division: string | null;
      }>,
      upcomingFixtures: (fixtures ?? []) as unknown as FixtureWithTeam[],
      outstandingPayments: (payments ?? []) as Payment[],
    },
    error: null,
  };
}
