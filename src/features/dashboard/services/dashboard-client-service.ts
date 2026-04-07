import { createClient } from '@/lib/supabase/client';
import type {
  ActivityEventWithTeams,
  PaymentWithMember,
  AnnouncementWithAuthor,
  MemberWithProfile,
  MemberGuardian,
  Payment,
} from '@/lib/supabase/database.types';

export interface AdminDashboardStats {
  memberCount: number;
  teamCount: number;
  upcomingEventCount: number;
  outstandingPaymentsTotal: number;
}

export interface AdminDashboardClientData {
  stats: AdminDashboardStats;
  events: ActivityEventWithTeams[];
  payments: PaymentWithMember[];
  announcements: AnnouncementWithAuthor[];
}

export async function getAdminDashboardDataClient(
  orgId: string
): Promise<{ data: AdminDashboardClientData | null; error: unknown }> {
  const supabase = createClient();

  const [
    { count: memberCount },
    { count: teamCount },
    { count: eventCount },
    { data: paymentRows },
    { data: eventRows },
    { data: announcementRows },
  ] = await Promise.all([
    supabase
      .from('members')
      .select('*', { count: 'exact', head: true })
      .eq('organisation_id', orgId)
      .eq('membership_status', 'active'),

    supabase
      .from('activity_teams')
      .select('*', { count: 'exact', head: true })
      .eq('organisation_id', orgId),

    supabase
      .from('activity_events')
      .select('*', { count: 'exact', head: true })
      .eq('organisation_id', orgId)
      .eq('status', 'scheduled')
      .gte('date_time', new Date().toISOString()),

    supabase
      .from('payments')
      .select('*, member:members(*, profile:profiles(*))')
      .eq('organisation_id', orgId)
      .in('payment_status', ['pending', 'overdue'])
      .order('due_date', { ascending: true })
      .limit(5),

    supabase
      .from('activity_events')
      .select(
        '*, home_team:activity_teams!activity_events_home_team_id_fkey(*), away_team:activity_teams!activity_events_away_team_id_fkey(*), activity:activities(*)'
      )
      .eq('organisation_id', orgId)
      .eq('status', 'scheduled')
      .gte('date_time', new Date().toISOString())
      .order('date_time', { ascending: true })
      .limit(5),

    supabase
      .from('announcements')
      .select('*, author:profiles(*)')
      .eq('organisation_id', orgId)
      .order('published_at', { ascending: false })
      .limit(3),
  ]);

  const outstandingPaymentsTotal = paymentRows
    ? (paymentRows as { amount_cents: number }[]).reduce(
        (sum, p) => sum + p.amount_cents,
        0
      ) / 100
    : 0;

  return {
    data: {
      stats: {
        memberCount: memberCount ?? 0,
        teamCount: teamCount ?? 0,
        upcomingEventCount: eventCount ?? 0,
        outstandingPaymentsTotal,
      },
      events: (eventRows ?? []) as unknown as ActivityEventWithTeams[],
      payments: (paymentRows ?? []) as unknown as PaymentWithMember[],
      announcements: (announcementRows ?? []) as unknown as AnnouncementWithAuthor[],
    },
    error: null,
  };
}

export interface TeamSummary {
  id: string;
  name: string;
  division: string | null;
  activityName?: string;
}

export interface DependentInfo {
  id: string;
  name: string;
  age: number | null;
  relationship: string;
  outstandingPayments: number;
}

export interface MemberDashboardClientData {
  teams: TeamSummary[];
  events: ActivityEventWithTeams[];
  payments: Payment[];
  announcements: AnnouncementWithAuthor[];
  dependents: DependentInfo[];
}

export async function getMemberDashboardDataClient(
  profileId: string,
  orgId: string,
  calculateAge: (dob: string) => number | null
): Promise<{ data: MemberDashboardClientData | null; error: unknown }> {
  const supabase = createClient();

  const { data: memberRecord } = await supabase
    .from('members')
    .select('id')
    .eq('profile_id', profileId)
    .eq('organisation_id', orgId)
    .single();

  if (!memberRecord) {
    return { data: null, error: new Error('Member record not found') };
  }

  const memberId = memberRecord.id;

  const { data: activityTeamMemberships } = await supabase
    .from('activity_team_members')
    .select('activity_team_id')
    .eq('member_id', memberId);

  const activityTeamIds = (activityTeamMemberships ?? []).map(
    (tm: { activity_team_id: string }) => tm.activity_team_id
  );

  const [
    { data: teamRows },
    { data: eventRows },
    { data: paymentRows },
    { data: announcementRows },
  ] = await Promise.all([
    activityTeamIds.length > 0
      ? supabase
          .from('activity_teams')
          .select('id, name, division, activity:activities(name)')
          .in('id', activityTeamIds)
      : Promise.resolve({ data: [] }),

    activityTeamIds.length > 0
      ? supabase
          .from('activity_events')
          .select(
            '*, home_team:activity_teams!activity_events_home_team_id_fkey(*), away_team:activity_teams!activity_events_away_team_id_fkey(*), activity:activities(*)'
          )
          .eq('organisation_id', orgId)
          .or(
            activityTeamIds.map((id: string) => `home_team_id.eq.${id}`).join(',') +
              ',' +
              activityTeamIds.map((id: string) => `away_team_id.eq.${id}`).join(',')
          )
          .eq('status', 'scheduled')
          .gte('date_time', new Date().toISOString())
          .order('date_time', { ascending: true })
          .limit(5)
      : Promise.resolve({ data: [] }),

    supabase
      .from('payments')
      .select('*')
      .eq('member_id', memberId)
      .in('payment_status', ['pending', 'overdue'])
      .order('due_date', { ascending: true }),

    supabase
      .from('announcements')
      .select('*, author:profiles(*)')
      .eq('organisation_id', orgId)
      .order('published_at', { ascending: false })
      .limit(3),
  ]);

  const mappedTeams: TeamSummary[] = (teamRows ?? []).map(
    (row: Record<string, unknown>) => ({
      id: row.id as string,
      name: row.name as string,
      division: row.division as string | null,
      activityName: (row.activity as { name: string } | null)?.name ?? undefined,
    })
  );

  // Fetch guardian dependents
  const dependents: DependentInfo[] = [];
  const { data: guardianLinks } = await supabase
    .from('member_guardians')
    .select('*, minor:members!minor_member_id(*, profile:profiles(*))')
    .eq('guardian_member_id', memberId);

  if (guardianLinks && guardianLinks.length > 0) {
    for (const link of guardianLinks) {
      const minor = (link as unknown as { minor: MemberWithProfile }).minor;
      const { data: depPayments } = await supabase
        .from('payments')
        .select('amount_cents')
        .eq('member_id', minor.id)
        .in('payment_status', ['pending', 'overdue']);

      const outstanding = (depPayments ?? []).reduce(
        (sum: number, p: { amount_cents: number }) => sum + p.amount_cents,
        0
      );

      const age = minor.profile.date_of_birth ? calculateAge(minor.profile.date_of_birth) : null;

      dependents.push({
        id: minor.id,
        name: `${minor.profile.first_name} ${minor.profile.last_name}`,
        age,
        relationship: (link as unknown as MemberGuardian).relationship.replace(/_/g, ' '),
        outstandingPayments: outstanding,
      });
    }
  }

  return {
    data: {
      teams: mappedTeams,
      events: (eventRows ?? []) as unknown as ActivityEventWithTeams[],
      payments: (paymentRows ?? []) as Payment[],
      announcements: (announcementRows ?? []) as unknown as AnnouncementWithAuthor[],
      dependents,
    },
    error: null,
  };
}
