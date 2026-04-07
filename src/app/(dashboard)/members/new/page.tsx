'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { MemberForm } from '@/features/members/components/member-form';
import { createClient } from '@/lib/supabase/client';
import { useOrganisation } from '@/hooks/use-organisation';
import { useAuth } from '@/hooks/use-auth-context';
import { useToast } from '@/components/ui/use-toast';
import { linkGuardianToMinor } from '@/features/members/services/guardian-service';
import type { MemberInput } from '@/features/members/schemas/member-schemas';
import type { GuardianRelationship } from '@/lib/supabase/database.types';

export default function NewMemberPage() {
  const router = useRouter();
  const { organisation } = useOrganisation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(data: MemberInput) {
    if (!organisation?.id || !user?.id) {
      toast({
        title: 'Error',
        description: 'Organisation or user not found.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();

      // First, create or find profile by email
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', data.email)
        .single();

      let profileId: string;

      if (existingProfile) {
        profileId = existingProfile.id;
      } else {
        // Create a new profile
        const { data: newProfile, error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: crypto.randomUUID(),
            first_name: data.firstName,
            last_name: data.lastName,
            email: data.email,
            phone: data.phone || null,
            date_of_birth: data.dateOfBirth || null,
            avatar_url: null,
            organisation_id: organisation.id,
            role: 'member' as const,
            preferred_name: null,
            emergency_contact_name: data.emergencyContactName || null,
            emergency_contact_phone: data.emergencyContactPhone || null,
          })
          .select('id')
          .single();

        if (profileError || !newProfile) {
          throw new Error(profileError?.message ?? 'Failed to create profile');
        }
        profileId = newProfile.id;
      }

      // Create member record
      const { data: memberRecord, error: memberError } = await supabase
        .from('members')
        .insert({
          profile_id: profileId,
          organisation_id: organisation.id,
          membership_type: 'senior',
          membership_type_id: data.membershipTypeId || null,
          membership_status: 'active',
          registration_date: data.registrationDate,
          expiry_date: data.expiryDate || null,
          medical_conditions: data.medicalConditions || null,
          dietary_requirements: data.dietaryRequirements || null,
          notes: data.notes || null,
        })
        .select('id')
        .single();

      if (memberError || !memberRecord) {
        throw new Error(memberError?.message ?? 'Failed to create member');
      }

      // Link guardians for minor members
      if (data.isMinor && data.guardians && data.guardians.length > 0) {
        for (const guardian of data.guardians) {
          const { error: linkError } = await linkGuardianToMinor({
            guardian_member_id: guardian.memberId,
            minor_member_id: memberRecord.id,
            relationship: guardian.relationship as GuardianRelationship,
            is_primary: data.guardians.indexOf(guardian) === 0,
            parental_consent_given: guardian.consentGiven,
          });

          if (linkError) {
            toast({
              title: 'Warning',
              description: `Member created but failed to link guardian: ${linkError.message}`,
              variant: 'destructive',
            });
          }
        }
      }

      toast({ title: 'Member added successfully' });
      router.push('/members');
    } catch (err) {
      toast({
        title: 'Error adding member',
        description: err instanceof Error ? err.message : 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Add Member"
        actions={
          <Button variant="outline" size="sm" asChild className="gap-2">
            <Link href="/members">
              <ArrowLeft className="h-4 w-4" />
              Back to Members
            </Link>
          </Button>
        }
      />

      <div className="mx-auto max-w-3xl">
        <MemberForm onSubmit={handleSubmit} loading={loading} orgId={organisation?.id} />
      </div>
    </div>
  );
}
