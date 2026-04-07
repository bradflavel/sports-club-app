'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, CalendarDays, ArrowRight, Users } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { UpcomingEventsWidget } from './upcoming-fixtures-widget';
import { RecentAnnouncementsWidget } from './recent-announcements-widget';
import { MemberStatsWidget } from './member-stats-widget';
import { getMemberDashboardDataClient } from '@/features/dashboard/services/dashboard-client-service';
import { calculateAge } from '@/lib/format';
import type {
  Profile,
  ActivityEventWithTeams,
  Payment,
  AnnouncementWithAuthor,
} from '@/lib/supabase/database.types';
import type {
  TeamSummary,
  DependentInfo,
} from '@/features/dashboard/services/dashboard-client-service';

interface MemberDashboardProps {
  profile: Profile;
}

export function MemberDashboard({ profile }: MemberDashboardProps) {
  const router = useRouter();

  const [teams, setTeams] = useState<TeamSummary[]>([]);
  const [events, setEvents] = useState<ActivityEventWithTeams[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementWithAuthor[]>([]);
  const [dependents, setDependents] = useState<DependentInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.organisation_id) {
      setLoading(false);
      return;
    }

    async function fetchData() {
      setLoading(true);
      const { data } = await getMemberDashboardDataClient(
        profile.id,
        profile.organisation_id!,
        (dob) => calculateAge(dob)
      );
      if (data) {
        setTeams(data.teams);
        setEvents(data.events);
        setPayments(data.payments);
        setAnnouncements(data.announcements);
        setDependents(data.dependents);
      }
      setLoading(false);
    }

    fetchData();
  }, [profile]);

  return (
    <div className="space-y-6">
      {/* Welcome header */}
      <div>
        <h1 className="text-2xl font-bold">
          Welcome back, {profile.first_name}!
        </h1>
        <p className="mt-1 text-muted-foreground">Here&apos;s what&apos;s happening with your club.</p>
      </div>

      {/* My Dependents (guardians only) */}
      {!loading && dependents.length > 0 && (
        <div className="rounded-lg border bg-card shadow-sm">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Users className="h-4 w-4" />
              My Dependents
            </h3>
          </div>
          <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
            {dependents.map((dep) => (
              <button
                key={dep.id}
                onClick={() => router.push(`/members/${dep.id}`)}
                className="group flex items-start gap-3 rounded-lg border p-3 text-left transition-colors hover:border-primary/50 hover:bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700 text-xs font-medium">
                  {dep.name.split(' ').map((n) => n[0]).join('')}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{dep.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {dep.age !== null ? `${dep.age} yrs` : 'Age unknown'} · {dep.relationship}
                  </p>
                  {dep.outstandingPayments > 0 && (
                    <p className="mt-1 text-xs font-medium text-amber-600">
                      {new Intl.NumberFormat('en-AU', {
                        style: 'currency',
                        currency: 'AUD',
                      }).format(dep.outstandingPayments / 100)}{' '}
                      outstanding
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Payment stats */}
      <MemberStatsWidget payments={payments} loading={loading} />

      {/* My Teams */}
      <div className="rounded-lg border bg-card shadow-sm">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h3 className="font-semibold">My Teams</h3>
          <Link
            href="/competitions"
            className="flex items-center gap-1 text-xs text-primary hover:underline"
          >
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="p-4">
          {loading ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {[0, 1].map((i) => (
                <div key={i} className="space-y-2 rounded-lg border p-3">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              ))}
            </div>
          ) : teams.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-4 text-center">
              <Shield className="h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">You are not assigned to any teams yet.</p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {teams.map((team) => (
                <div
                  key={team.id}
                  className="group flex items-start gap-3 rounded-lg border p-3 text-left transition-colors hover:border-primary/50 hover:bg-muted/30"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Shield className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-medium">{team.name}</p>
                    {team.division && (
                      <p className="text-xs text-muted-foreground">{team.division}</p>
                    )}
                    {team.activityName && (
                      <p className="text-xs text-muted-foreground">{team.activityName}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Upcoming events + announcements */}
      <div className="grid gap-6 lg:grid-cols-2">
        <UpcomingEventsWidget events={events} loading={loading} />

        {/* Latest News */}
        <RecentAnnouncementsWidget announcements={announcements} loading={loading} />
      </div>

      {/* Outstanding payments list */}
      {(loading || payments.length > 0) && (
        <div className="rounded-lg border bg-card shadow-sm">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <h3 className="font-semibold">My Outstanding Payments</h3>
            <Link
              href="/payments"
              className="flex items-center gap-1 text-xs text-primary hover:underline"
            >
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="divide-y">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between p-4">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))
            ) : (
              payments.slice(0, 5).map((payment) => (
                <div key={payment.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-sm font-medium">{payment.description}</p>
                    <p className="text-xs text-muted-foreground">
                      Due{' '}
                      {new Date(payment.due_date ?? '').toLocaleDateString('en-AU', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-sm font-semibold">
                      {new Intl.NumberFormat('en-AU', {
                        style: 'currency',
                        currency: 'AUD',
                      }).format(payment.amount_cents / 100)}
                    </p>
                    <span
                      className={`text-xs font-medium ${
                        payment.payment_status === 'overdue' ? 'text-destructive' : 'text-amber-600'
                      }`}
                    >
                      {payment.payment_status === 'overdue' ? 'Overdue' : 'Pending'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* No payments message */}
      {!loading && payments.length === 0 && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-center">
          <p className="text-sm font-medium text-emerald-700">
            You have no outstanding payments.
          </p>
        </div>
      )}
    </div>
  );
}
