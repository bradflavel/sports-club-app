'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth-context';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { StaffForm } from '@/features/staff/components/staff-form';
import { getStaffTypes } from '@/features/staff/services/staff-type-service';
import { createStaff } from '@/features/staff/services/staff-service';
import { upsertFieldValues } from '@/features/staff/services/staff-field-service';
import { createClient } from '@/lib/supabase/client';
import type { StaffType } from '@/lib/supabase/database.types';
import type { StaffInput } from '@/features/staff/schemas/staff-schemas';

export default function NewStaffPage() {
  const { profile, organisation } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [staffTypes, setStaffTypes] = useState<StaffType[]>([]);

  useEffect(() => {
    if (!organisation) return;
    getStaffTypes(organisation.id).then(({ data }) => setStaffTypes(data ?? []));
  }, [organisation]);

  const handleSubmit = async (data: StaffInput, fieldValues: { field_id: string; value: string }[]) => {
    if (!organisation) return;

    const supabase = createClient();

    // Check if profile exists for this email
    let profileId: string;
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', data.email)
      .eq('organisation_id', organisation.id)
      .maybeSingle();

    if (existingProfile) {
      profileId = existingProfile.id;
    } else {
      // Create a placeholder profile
      const { data: newProfile, error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: crypto.randomUUID(),
          first_name: data.first_name,
          last_name: data.last_name,
          email: data.email,
          phone: data.phone || null,
          organisation_id: organisation.id,
          role: 'member',
        })
        .select('id')
        .single();

      if (profileError || !newProfile) {
        toast({ title: 'Error creating profile', description: profileError?.message, variant: 'destructive' });
        return;
      }
      profileId = newProfile.id;
    }

    // Check if they have a member record to link
    const { data: memberRecord } = await supabase
      .from('members')
      .select('id')
      .eq('profile_id', profileId)
      .eq('organisation_id', organisation.id)
      .maybeSingle();

    const { data: staffRecord, error: staffError } = await createStaff({
      profile_id: profileId,
      organisation_id: organisation.id,
      staff_type_id: data.staff_type_id,
      member_id: memberRecord?.id ?? null,
      status: data.status,
      position: data.position || null,
      start_date: data.start_date || null,
      notes: data.notes || null,
    });

    if (staffError || !staffRecord) {
      toast({ title: 'Error adding staff', description: staffError?.message, variant: 'destructive' });
      return;
    }

    // Save custom field values
    if (fieldValues.length > 0) {
      await upsertFieldValues(
        staffRecord.id,
        organisation.id,
        fieldValues.map((fv) => ({ staff_type_field_id: fv.field_id, value: fv.value || null }))
      );
    }

    toast({ title: 'Staff member added successfully' });
    router.push(`/staff/${staffRecord.id}`);
  };

  if (!organisation || !profile) return null;

  const isAdmin = profile.role === 'admin' || profile.role === 'manager';
  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <PageHeader title="Add Staff" description="You don't have permission to add staff." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Add Staff Member"
        description="Manually add a new staff member to your club"
        actions={
          <Button variant="outline" size="sm" onClick={() => router.push('/staff')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        }
      />
      <Card>
        <CardContent className="pt-6">
          {staffTypes.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No staff types configured yet.</p>
              <Button variant="link" onClick={() => router.push('/staff/types')}>
                Set up staff types first
              </Button>
            </div>
          ) : (
            <StaffForm
              staffTypes={staffTypes}
              onSubmit={handleSubmit}
              submitLabel="Add Staff Member"
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
