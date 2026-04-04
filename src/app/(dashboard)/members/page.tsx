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
import { MemberTable, exportMembersCsv } from '@/features/members/components/member-table';
import { MemberFilters } from '@/features/members/components/member-filters';
import { createClient } from '@/lib/supabase/client';
import { useOrganisation } from '@/hooks/use-organisation';
import { useToast } from '@/components/ui/use-toast';
import type { MemberWithProfile, MemberFilters as MemberFiltersType, MembershipStatus } from '@/features/members/types/member-types';

export default function MembersPage() {
  const { organisation, loading: orgLoading } = useOrganisation();
  const { toast } = useToast();

  const [members, setMembers] = useState<MemberWithProfile[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<MemberFiltersType>({});

  const fetchMembers = useCallback(async () => {
    if (!organisation?.id) return;
    setLoading(true);

    const supabase = createClient();
    let query = supabase
      .from('members')
      .select('*, profile:profiles(*)', { count: 'exact' })
      .eq('organisation_id', organisation.id);

    if (search) {
      query = query.or(
        `profile.first_name.ilike.%${search}%,profile.last_name.ilike.%${search}%,profile.email.ilike.%${search}%`
      );
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
        setMembers([]);
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
      setMembers((data as unknown as MemberWithProfile[]) ?? []);
      setTotalCount(count ?? 0);
    }
    setLoading(false);
  }, [organisation?.id, search, filters, toast]);

  useEffect(() => {
    if (!orgLoading && organisation?.id) {
      fetchMembers();
    }
  }, [orgLoading, organisation?.id, fetchMembers]);

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

  if (orgLoading) {
    return <PageSkeleton />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Members"
        badge={
          <Badge variant="secondary" className="text-sm">
            {totalCount}
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
        <MemberFilters filters={filters} onFiltersChange={setFilters} />
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
