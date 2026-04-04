'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users,
  Shield,
  CalendarDays,
  CreditCard,
  Plus,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/shared/stat-card';
import { UpcomingFixturesWidget } from './upcoming-fixtures-widget';
import { OutstandingPaymentsWidget } from './outstanding-payments-widget';
import { RecentAnnouncementsWidget } from './recent-announcements-widget';
import { createClient } from '@/lib/supabase/client';
import type { FixtureWithTeam, PaymentWithMember, AnnouncementWithAuthor } from '@/lib/supabase/database.types';

interface AdminDashboardStats {
  memberCount: number;
  teamCount: number;
  upcomingFixtureCount: number;
  outstandingPaymentsTotal: number;
}

interface AdminDashboardProps {
  orgId: string;
}

export function AdminDashboard({ orgId }: AdminDashboardProps) {
  const router = useRouter();

  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [fixtures, setFixtures] = useState<FixtureWithTeam[]>([]);
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
        { count: fixtureCount },
        { data: paymentRows },
        { data: fixtureRows },
        { data: announcementRows },
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
          .select('*, member:members(*, profile:profiles(*))')
          .eq('organisation_id', orgId)
          .in('status', ['pending', 'overdue'])
          .order('due_date', { ascending: true })
          .limit(5),

        supabase
          .from('fixtures')
          .select('*, team:teams(*)')
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
        upcomingFixtureCount: fixtureCount ?? 0,
        outstandingPaymentsTotal,
      });
      setFixtures((fixtureRows ?? []) as unknown as FixtureWithTeam[]);
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
          <Button size="sm" variant="outline" onClick={() => router.push('/fixtures?action=create')}>
            <Plus className="mr-1.5 h-4 w-4" />
            Create Fixture
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
            title="Upcoming Fixtures"
            value={stats?.upcomingFixtureCount ?? 0}
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

      {/* Widgets */}
      <div className="grid gap-6 lg:grid-cols-2">
        <UpcomingFixturesWidget fixtures={fixtures} loading={loading} />
        <OutstandingPaymentsWidget payments={payments} loading={loading} />
      </div>

      <RecentAnnouncementsWidget announcements={announcements} loading={loading} />
    </div>
  );
}
