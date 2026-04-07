'use client';

import { useAuth } from '@/hooks/use-auth-context';
import { PageHeader } from '@/components/shared/page-header';
import { StaffTypeManager } from '@/features/staff/components/staff-type-manager';

export default function StaffTypesPage() {
  const { profile, organisation } = useAuth();

  if (!organisation || !profile) return null;

  const isAdmin = profile.role === 'admin' || profile.role === 'manager';

  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <PageHeader title="Staff Types" description="You don't have permission to manage staff types." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Staff Types"
        description="Configure staff types, custom fields, and accreditation requirements"
      />
      <StaffTypeManager organisationId={organisation.id} />
    </div>
  );
}
