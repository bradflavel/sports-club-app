'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth-context';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { StaffCsvImportWizard } from '@/features/staff/components/staff-csv-import-wizard';
import { getStaffTypes } from '@/features/staff/services/staff-type-service';
import type { StaffType } from '@/lib/supabase/database.types';

export default function StaffImportPage() {
  const { profile, organisation } = useAuth();
  const router = useRouter();
  const [staffTypes, setStaffTypes] = useState<StaffType[]>([]);

  useEffect(() => {
    if (!organisation) return;
    getStaffTypes(organisation.id).then(({ data }) => setStaffTypes(data ?? []));
  }, [organisation]);

  if (!organisation || !profile) return null;

  const isAdmin = profile.role === 'admin' || profile.role === 'manager';
  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <PageHeader title="Import Staff" description="You don't have permission to import staff." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Import Staff"
        description="Bulk import staff members from a CSV file"
        actions={
          <Button variant="outline" size="sm" onClick={() => router.push('/staff')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        }
      />
      {staffTypes.length > 0 ? (
        <StaffCsvImportWizard organisationId={organisation.id} staffTypes={staffTypes} />
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <p>Set up staff types before importing.</p>
          <Button variant="link" onClick={() => router.push('/staff/types')}>
            Configure Staff Types
          </Button>
        </div>
      )}
    </div>
  );
}
