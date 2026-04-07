'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth-context';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { StaffForm } from '@/features/staff/components/staff-form';
import { getStaffById, updateStaff } from '@/features/staff/services/staff-service';
import { getStaffTypes } from '@/features/staff/services/staff-type-service';
import { getFieldValues, upsertFieldValues } from '@/features/staff/services/staff-field-service';
import type { StaffWithDetails } from '@/features/staff/types';
import type { StaffType, StaffFieldValue } from '@/lib/supabase/database.types';
import type { StaffInput } from '@/features/staff/schemas/staff-schemas';

export default function EditStaffPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { profile, organisation } = useAuth();
  const { toast } = useToast();

  const [staffRecord, setStaffRecord] = useState<StaffWithDetails | null>(null);
  const [staffTypes, setStaffTypes] = useState<StaffType[]>([]);
  const [fieldValues, setFieldValues] = useState<StaffFieldValue[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!organisation) return;

    const [staffResult, typesResult, valuesResult] = await Promise.all([
      getStaffById(id),
      getStaffTypes(organisation.id),
      getFieldValues(id),
    ]);

    if (staffResult.error || !staffResult.data) {
      toast({ title: 'Error', description: 'Staff member not found', variant: 'destructive' });
      router.push('/staff');
      return;
    }

    setStaffRecord(staffResult.data);
    setStaffTypes(typesResult.data ?? []);
    setFieldValues(valuesResult.data ?? []);
    setLoading(false);
  }, [id, organisation, router, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSubmit = async (data: StaffInput, customFieldValues: { field_id: string; value: string }[]) => {
    if (!staffRecord || !organisation) return;

    const { error } = await updateStaff(staffRecord.id, {
      staff_type_id: data.staff_type_id,
      status: data.status,
      position: data.position || null,
      start_date: data.start_date || null,
      notes: data.notes || null,
    });

    if (error) {
      toast({ title: 'Error updating staff', description: error.message, variant: 'destructive' });
      return;
    }

    if (customFieldValues.length > 0) {
      await upsertFieldValues(
        staffRecord.id,
        organisation.id,
        customFieldValues.map((fv) => ({ staff_type_field_id: fv.field_id, value: fv.value || null }))
      );
    }

    toast({ title: 'Staff member updated' });
    router.push(`/staff/${staffRecord.id}`);
  };

  if (!organisation || !profile) return null;

  const isAdmin = profile.role === 'admin' || profile.role === 'manager';
  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <PageHeader title="Edit Staff" description="You don't have permission to edit staff." />
      </div>
    );
  }

  if (loading || !staffRecord) {
    return <div className="text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Edit: ${staffRecord.profile.first_name} ${staffRecord.profile.last_name}`}
        actions={
          <Button variant="outline" size="sm" onClick={() => router.push(`/staff/${id}`)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        }
      />
      <Card>
        <CardContent className="pt-6">
          <StaffForm
            staffTypes={staffTypes}
            defaultValues={{
              email: staffRecord.profile.email,
              first_name: staffRecord.profile.first_name,
              last_name: staffRecord.profile.last_name,
              phone: staffRecord.profile.phone,
              staff_type_id: staffRecord.staff_type_id,
              position: staffRecord.position ?? '',
              start_date: staffRecord.start_date ?? '',
              status: staffRecord.status,
              notes: staffRecord.notes ?? '',
            }}
            existingFieldValues={fieldValues.map((fv) => ({
              staff_type_field_id: fv.staff_type_field_id,
              value: fv.value,
            }))}
            onSubmit={handleSubmit}
            submitLabel="Save Changes"
            isEditing
          />
        </CardContent>
      </Card>
    </div>
  );
}
