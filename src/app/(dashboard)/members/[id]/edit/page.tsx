'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { PageHeader } from '@/components/shared/page-header';
import { PageSkeleton } from '@/components/shared/loading-skeleton';
import { Button } from '@/components/ui/button';
import { MemberForm } from '@/features/members/components/member-form';
import { createClient } from '@/lib/supabase/client';
import { useOrganisation } from '@/hooks/use-organisation';
import { useToast } from '@/components/ui/use-toast';
import type { MemberInput } from '@/features/members/schemas/member-schemas';
import type { MemberWithProfile } from '@/features/members/types/member-types';

export default function EditMemberPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { organisation } = useOrganisation();
  const { toast } = useToast();
  const [member, setMember] = useState<MemberWithProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchMember = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from('members')
      .select('*, profile:profiles(*)')
      .eq('id', id)
      .single();

    if (data) {
      setMember(data as unknown as MemberWithProfile);
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchMember();
  }, [fetchMember]);

  async function handleSubmit(data: MemberInput) {
    if (!member) return;

    setSaving(true);

    try {
      const supabase = createClient();

      // Update the profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          first_name: data.firstName,
          last_name: data.lastName,
          phone: data.phone || null,
          date_of_birth: data.dateOfBirth || null,
          emergency_contact_name: data.emergencyContactName || null,
          emergency_contact_phone: data.emergencyContactPhone || null,
        })
        .eq('id', member.profile.id);

      if (profileError) {
        throw new Error(profileError.message);
      }

      // Update the member
      const { error: memberError } = await supabase
        .from('members')
        .update({
          membership_type_id: data.membershipTypeId || null,
          registration_date: data.registrationDate,
          expiry_date: data.expiryDate || null,
          medical_conditions: data.medicalConditions || null,
          dietary_requirements: data.dietaryRequirements || null,
          notes: data.notes || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (memberError) {
        throw new Error(memberError.message);
      }

      toast({ title: 'Member updated successfully' });
      router.push(`/members/${id}`);
    } catch (err) {
      toast({
        title: 'Error updating member',
        description: err instanceof Error ? err.message : 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <PageSkeleton />;

  if (!member) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-lg font-semibold">Member not found</p>
        <Button asChild className="mt-4" variant="outline">
          <Link href="/members">Back to Members</Link>
        </Button>
      </div>
    );
  }

  const { profile } = member;

  const defaultValues: Partial<MemberInput> = {
    firstName: profile.first_name,
    lastName: profile.last_name,
    email: profile.email,
    phone: profile.phone ?? '',
    dateOfBirth: profile.date_of_birth ?? '',
    membershipTypeId: member.membership_type_id ?? undefined,
    registrationDate: member.registration_date,
    expiryDate: member.expiry_date ?? '',
    medicalConditions: member.medical_conditions ?? '',
    dietaryRequirements: member.dietary_requirements ?? '',
    emergencyContactName: profile.emergency_contact_name ?? '',
    emergencyContactPhone: profile.emergency_contact_phone ?? '',
    notes: member.notes ?? '',
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Edit Member"
        actions={
          <Button variant="outline" size="sm" asChild className="gap-2">
            <Link href={`/members/${id}`}>
              <ArrowLeft className="h-4 w-4" />
              Back to Member
            </Link>
          </Button>
        }
      />

      <div className="mx-auto max-w-3xl">
        <MemberForm
          defaultValues={defaultValues}
          onSubmit={handleSubmit}
          loading={saving}
          orgId={organisation?.id}
        />
      </div>
    </div>
  );
}
