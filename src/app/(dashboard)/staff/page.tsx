'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Link2, Upload, Settings2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth-context';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { StaffStats } from '@/features/staff/components/staff-stats';
import { StaffFilters } from '@/features/staff/components/staff-filters';
import { StaffTable } from '@/features/staff/components/staff-table';
import { StaffInviteDialog } from '@/features/staff/components/staff-invite-dialog';
import { getStaff, deleteStaff } from '@/features/staff/services/staff-service';
import { getStaffTypes } from '@/features/staff/services/staff-type-service';
import type { StaffWithDetails } from '@/features/staff/types';
import type { StaffType, StaffStatus } from '@/lib/supabase/database.types';

export default function StaffPage() {
  const { profile, organisation } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [staff, setStaff] = useState<StaffWithDetails[]>([]);
  const [staffTypes, setStaffTypes] = useState<StaffType[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [staffTypeFilter, setStaffTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const isAdmin = profile?.role === 'admin' || profile?.role === 'manager';

  const fetchData = useCallback(async () => {
    if (!organisation) return;

    const [staffResult, typesResult] = await Promise.all([
      getStaff(organisation.id, {
        search: search || undefined,
        staffTypeId: staffTypeFilter !== 'all' ? staffTypeFilter : undefined,
        status: statusFilter !== 'all' ? (statusFilter as StaffStatus) : undefined,
      }),
      getStaffTypes(organisation.id),
    ]);

    if (staffResult.error) {
      toast({ title: 'Error loading staff', description: staffResult.error.message, variant: 'destructive' });
    } else {
      setStaff(staffResult.data);
    }

    if (!typesResult.error) {
      setStaffTypes(typesResult.data ?? []);
    }

    setLoading(false);
  }, [organisation, search, staffTypeFilter, statusFilter, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await deleteStaff(deleteId);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Staff member removed' });
      fetchData();
    }
    setDeleteId(null);
  };

  if (!organisation || !profile) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Staff"
        description="Manage your club's staff, coaches, volunteers, and committee members"
        actions={
          isAdmin ? (
            <>
              <Button variant="outline" size="sm" onClick={() => router.push('/staff/types')}>
                <Settings2 className="mr-2 h-4 w-4" />
                Types
              </Button>
              <Button variant="outline" size="sm" onClick={() => router.push('/staff/import')}>
                <Upload className="mr-2 h-4 w-4" />
                Import
              </Button>
              <Button variant="outline" size="sm" onClick={() => setInviteOpen(true)}>
                <Link2 className="mr-2 h-4 w-4" />
                Invite
              </Button>
              <Button size="sm" onClick={() => router.push('/staff/new')}>
                <Plus className="mr-2 h-4 w-4" />
                Add Staff
              </Button>
            </>
          ) : null
        }
      />

      <StaffStats organisationId={organisation.id} />

      <StaffFilters
        search={search}
        onSearchChange={setSearch}
        staffTypeId={staffTypeFilter}
        onStaffTypeChange={setStaffTypeFilter}
        status={statusFilter}
        onStatusChange={setStatusFilter}
        staffTypes={staffTypes}
      />

      {loading ? (
        <div className="text-muted-foreground text-sm">Loading staff...</div>
      ) : (
        <StaffTable staff={staff} isAdmin={isAdmin} onDelete={setDeleteId} />
      )}

      <StaffInviteDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        organisationId={organisation.id}
        organisationSlug={organisation.slug}
        userId={profile.id}
        staffTypes={staffTypes}
      />

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Remove Staff Member"
        description="Are you sure you want to remove this staff member? This action cannot be undone."
        onConfirm={handleDelete}
        confirmLabel="Remove"
        variant="destructive"
      />
    </div>
  );
}
