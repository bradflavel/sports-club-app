'use client';

import { useEffect, useState } from 'react';
import { CreditCard, Activity, Calendar, Users } from 'lucide-react';
import { StatCard } from '@/components/shared/stat-card';
import { Skeleton } from '@/components/shared/loading-skeleton';
import { createClient } from '@/lib/supabase/client';
import { formatDate } from '@/lib/format';
import type { MemberWithProfile } from '@/features/members/types/member-types';

interface MemberStatsProps {
  memberId: string;
}

export function MemberStats({ memberId }: MemberStatsProps) {
  const [member, setMember] = useState<MemberWithProfile | null>(null);
  const [teamCount, setTeamCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient();

      const [memberResult, teamsResult] = await Promise.all([
        supabase
          .from('members')
          .select('*, profile:profiles(*)')
          .eq('id', memberId)
          .single(),
        supabase
          .from('team_members')
          .select('id', { count: 'exact' })
          .eq('member_id', memberId),
      ]);

      if (memberResult.data) {
        setMember(memberResult.data as unknown as MemberWithProfile);
      }
      setTeamCount(teamsResult.count ?? 0);
      setLoading(false);
    }

    fetchData();
  }, [memberId]);

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-lg" />
        ))}
      </div>
    );
  }

  if (!member) return null;

  const membershipTypeLabel =
    member.membership_type.charAt(0).toUpperCase() + member.membership_type.slice(1);

  const statusLabel =
    member.membership_status.charAt(0).toUpperCase() + member.membership_status.slice(1);

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Membership Type"
        value={membershipTypeLabel}
        icon={CreditCard}
        subtitle="Current plan"
      />
      <StatCard
        title="Status"
        value={statusLabel}
        icon={Activity}
        subtitle={
          member.expiry_date
            ? `Expires ${formatDate(member.expiry_date)}`
            : 'No expiry set'
        }
      />
      <StatCard
        title="Registration Date"
        value={formatDate(member.registration_date)}
        icon={Calendar}
        subtitle="Member since"
      />
      <StatCard
        title="Teams"
        value={teamCount}
        icon={Users}
        subtitle={teamCount === 1 ? 'team enrolled' : 'teams enrolled'}
      />
    </div>
  );
}
