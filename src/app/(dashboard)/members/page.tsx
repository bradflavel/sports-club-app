'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Users, UserPlus, Download, Upload } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { SearchInput } from '@/components/shared/search-input';
import { EmptyState } from '@/components/shared/empty-state';
import { PageSkeleton } from '@/components/shared/loading-skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MemberTable, exportMembersCsv } from '@/features/members/components/member-table';
import { AvatarWithName } from '@/components/shared/avatar-with-name';
import { MemberFilters } from '@/features/members/components/member-filters';
import { getMembershipTypes } from '@/features/members/services/membership-type-service';
import { createClient } from '@/lib/supabase/client';
import { useOrganisation } from '@/hooks/use-organisation';
import { useUser } from '@/hooks/use-user';
import { useToast } from '@/components/ui/use-toast';
import { calculateAge } from '@/lib/format';
import type { MemberWithProfile, MemberFilters as MemberFiltersType, MembershipStatus } from '@/features/members/types/member-types';
import type { MembershipTypeRecord } from '@/lib/supabase/database.types';

export default function MembersPage() {
  const { organisation, loading: orgLoading } = useOrganisation();
  const { profile, loading: userLoading } = useUser();
  const { toast } = useToast();
  const isAdmin = profile?.role === 'admin' || profile?.role === 'manager';

  const [allMembers, setAllMembers] = useState<MemberWithProfile[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortOrder, setSortOrder] = useState<'az' | 'za'>('az');
  const [filters, setFilters] = useState<MemberFiltersType>({});
  const [membershipTypes, setMembershipTypes] = useState<MembershipTypeRecord[]>([]);

  useEffect(() => {
    if (organisation?.id) {
      getMembershipTypes(organisation.id).then(({ data }) => {
        setMembershipTypes(data ?? []);
      });
    }
  }, [organisation?.id]);

  // Fetch from DB only when org or filters change — NOT on search
  const fetchMembers = useCallback(async () => {
    if (!organisation?.id) return;
    setLoading(true);

    const supabase = createClient();
    let query = supabase
      .from('members')
      .select('*, profile:profiles(*)', { count: 'exact' })
      .eq('organisation_id', organisation.id);

    // Non-admins only see active members
    if (!isAdmin) {
      query = query.eq('membership_status', 'active');
    }

    if (filters.membershipType && filters.membershipType.length > 0) {
      query = query.in('membership_type', filters.membershipType as import('@/lib/supabase/database.types').MembershipType[]);
    }

    if (filters.membershipStatus && filters.membershipStatus.length > 0) {
      query = query.in('membership_status', filters.membershipStatus as import('@/lib/supabase/database.types').MembershipStatus[]);
    }

    if (filters.teamId) {
      const { data: teamMemberIds } = await supabase
        .from('team_members')
        .select('member_id')
        .eq('team_id', filters.teamId);

      if (teamMemberIds && teamMemberIds.length > 0) {
        query = query.in(
          'id',
          teamMemberIds.map((tm) => tm.member_id)
        );
      } else {
        setAllMembers([]);
        setTotalCount(0);
        setLoading(false);
        return;
      }
    }

    query = query.order('created_at', { ascending: false });

    const { data, count, error } = await query;

    if (error) {
      toast({ title: 'Error loading members', description: error.message, variant: 'destructive' });
    } else {
      setAllMembers((data as unknown as MemberWithProfile[]) ?? []);
      setTotalCount(count ?? 0);
    }
    setLoading(false);
  }, [organisation?.id, filters, toast]);

  useEffect(() => {
    if (!orgLoading && organisation?.id) {
      fetchMembers();
    }
  }, [orgLoading, organisation?.id, fetchMembers]);

  // Client-side filtering — instant, no loading state
  const members = allMembers.filter((m) => {
    const p = m.profile;
    if (!p) return false;

    // Text search
    if (search) {
      const q = search.toLowerCase();
      const matches =
        p.first_name?.toLowerCase().includes(q) ||
        p.last_name?.toLowerCase().includes(q) ||
        p.email?.toLowerCase().includes(q);
      if (!matches) return false;
    }

    // Age group (adult = 18+, child = under 18)
    if (filters.ageGroup && p.date_of_birth) {
      const age = calculateAge(p.date_of_birth);
      if (filters.ageGroup === 'adult' && age < 18) return false;
      if (filters.ageGroup === 'child' && age >= 18) return false;
    }

    // Gender
    if (filters.gender && p.gender) {
      if (p.gender !== filters.gender) return false;
    }

    return true;
  });

  async function handleDelete(id: string) {
    const supabase = createClient();
    const { error } = await supabase.from('members').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error deleting member', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Member deleted successfully' });
      fetchMembers();
    }
  }

  async function handleStatusChange(id: string, status: MembershipStatus) {
    const supabase = createClient();
    const { error } = await supabase
      .from('members')
      .update({ membership_status: status, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) {
      toast({ title: 'Error updating status', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Member status updated' });
      fetchMembers();
    }
  }

  function handleExportCsv() {
    exportMembersCsv(members);
  }

  if (orgLoading || userLoading) {
    return <PageSkeleton />;
  }

  // ── Non-admin: simple member directory ──
  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Members"
          badge={
            <Badge variant="secondary" className="text-sm">
              {search ? members.length : totalCount}
            </Badge>
          }
        />

        <div className="flex items-center gap-2">
          <SearchInput
            placeholder="Search members..."
            onSearch={setSearch}
            className="w-full sm:max-w-xs"
          />
          <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as 'az' | 'za')}>
            <SelectTrigger className="h-9 w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="az">A – Z</SelectItem>
              <SelectItem value="za">Z – A</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-10 animate-pulse rounded-md bg-muted" />
            ))}
          </div>
        ) : members.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No members found"
            description={search ? 'Try a different search.' : 'No active members yet.'}
          />
        ) : (
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {[...members].sort((a, b) => {
              const nameA = `${a.profile.first_name} ${a.profile.last_name}`.toLowerCase();
              const nameB = `${b.profile.first_name} ${b.profile.last_name}`.toLowerCase();
              return sortOrder === 'az' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
            }).map((m) => (
              <div key={m.id} className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-accent/50">
                <AvatarWithName
                  firstName={m.profile.first_name}
                  lastName={m.profile.last_name}
                  avatarUrl={m.profile.avatar_url}
                  size="sm"
                  subtitle={m.membership_type.charAt(0).toUpperCase() + m.membership_type.slice(1)}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── Admin: full member management ──
  return (
    <div className="space-y-6">
      <PageHeader
        title="Members"
        badge={
          <Badge variant="secondary" className="text-sm">
            {search || filters.ageGroup || filters.gender ? members.length : totalCount}
          </Badge>
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExportCsv} className="gap-2">
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
            <Button variant="outline" size="sm" asChild className="gap-2">
              <Link href="/members/import">
                <Upload className="h-4 w-4" />
                Import
              </Link>
            </Button>
            <Button asChild size="sm" className="gap-2">
              <Link href="/members/new">
                <UserPlus className="h-4 w-4" />
                Add Member
              </Link>
            </Button>
          </div>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput
          placeholder="Search members..."
          onSearch={setSearch}
          className="w-full sm:max-w-xs"
        />
        <MemberFilters filters={filters} onFiltersChange={setFilters} membershipTypes={membershipTypes} />
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded-md bg-muted" />
          ))}
        </div>
      ) : members.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No members found"
          description={
            search || Object.values(filters).some(Boolean)
              ? 'Try adjusting your search or filters.'
              : 'Get started by adding your first member.'
          }
          actionLabel={
            search || Object.values(filters).some(Boolean) ? undefined : 'Add Member'
          }
          actionHref="/members/new"
        />
      ) : (
        <MemberTable
          members={members}
          onDelete={handleDelete}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  );
}
