'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users,
  Shield,
  CalendarDays,
  CreditCard,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/shared/stat-card';
import { UpcomingEventsWidget } from './upcoming-fixtures-widget';
import { OutstandingPaymentsWidget } from './outstanding-payments-widget';
import { RecentAnnouncementsWidget } from './recent-announcements-widget';
import { createClient } from '@/lib/supabase/client';
import { AgeTransitionAlert } from '@/features/members/components/age-transition-alert';
import { ClubReviewReminder } from '@/features/club-profile/components/club-review-reminder';
import { useOrganisation } from '@/hooks/use-organisation';
import type { ActivityEventWithTeams, PaymentWithMember, AnnouncementWithAuthor } from '@/lib/supabase/database.types';

interface AdminDashboardStats {
  memberCount: number;
  teamCount: number;
  upcomingEventCount: number;
  outstandingPaymentsTotal: number;
}

interface AdminDashboardProps {
  orgId: string;
}

export function AdminDashboard({ orgId }: AdminDashboardProps) {
  const router = useRouter();
  const { organisation } = useOrganisation();

  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [events, setEvents] = useState<ActivityEventWithTeams[]>([]);
  const [payments, setPayments] = useState<PaymentWithMember[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orgId) return;

    async function fetchData() {
      setLoading(true);
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
          .in('status', ['pending', 'overdue'])
          .order('due_date', { ascending: true })
          .limit(5),

        supabase
          .from('activity_events')
          .select('*, home_team:activity_teams!activity_events_home_team_id_fkey(*), away_team:activity_teams!activity_events_away_team_id_fkey(*), activity:activities(*)')
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

      setStats({
        memberCount: memberCount ?? 0,
        teamCount: teamCount ?? 0,
        upcomingEventCount: eventCount ?? 0,
        outstandingPaymentsTotal,
      });
      setEvents((eventRows ?? []) as unknown as ActivityEventWithTeams[]);
      setPayments((paymentRows ?? []) as unknown as PaymentWithMember[]);
      setAnnouncements((announcementRows ?? []) as unknown as AnnouncementWithAuthor[]);
      setLoading(false);
    }

    fetchData();
  }, [orgId]);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => router.push('/members?action=add')}>
            <Plus className="mr-1.5 h-4 w-4" />
            Add Member
          </Button>
          <Button size="sm" variant="outline" onClick={() => router.push('/competitions')}>
            <Plus className="mr-1.5 h-4 w-4" />
            Create Event
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => router.push('/announcements?action=post')}
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Post Announcement
          </Button>
        </div>
      </div>

      {/* Stat cards */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-lg border bg-muted" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Members"
            value={stats?.memberCount ?? 0}
            subtitle="active members"
            icon={Users}
          />
          <StatCard
            title="Active Teams"
            value={stats?.teamCount ?? 0}
            subtitle="teams registered"
            icon={Shield}
          />
          <StatCard
            title="Upcoming Events"
            value={stats?.upcomingEventCount ?? 0}
            subtitle="scheduled ahead"
            icon={CalendarDays}
          />
          <StatCard
            title="Outstanding Payments"
            value={formatCurrency(stats?.outstandingPaymentsTotal ?? 0)}
            subtitle="pending / overdue"
            icon={CreditCard}
          />
        </div>
      )}

      {/* Age transition alert */}
      <AgeTransitionAlert orgId={orgId} />

      {/* Club review reminder */}
      {organisation && <ClubReviewReminder organisation={organisation} />}

      {/* Widgets */}
      <div className="grid gap-6 lg:grid-cols-2">
        <UpcomingEventsWidget events={events} loading={loading} />
        <OutstandingPaymentsWidget payments={payments} loading={loading} />
      </div>

      <RecentAnnouncementsWidget announcements={announcements} loading={loading} />
    </div>
  );
}
