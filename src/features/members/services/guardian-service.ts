import { createClient } from '@/lib/supabase/client';
import { isMinor } from '@/lib/format';
import type {
  MemberGuardian,
  MemberGuardianWithDetails,
  MemberWithProfile,
  GuardianRelationship,
} from '@/lib/supabase/database.types';

export async function getGuardiansForMember(minorMemberId: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('member_guardians')
    .select('*, guardian:members!guardian_member_id(*, profile:profiles(*))')
    .eq('minor_member_id', minorMemberId);

  return {
    data: data as unknown as (MemberGuardian & { guardian: MemberWithProfile })[] | null,
    error,
  };
}

export async function getDependentsForMember(guardianMemberId: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('member_guardians')
    .select('*, minor:members!minor_member_id(*, profile:profiles(*))')
    .eq('guardian_member_id', guardianMemberId);

  return {
    data: data as unknown as (MemberGuardian & { minor: MemberWithProfile })[] | null,
    error,
  };
}

export async function getDependentsForCurrentUser(orgId: string) {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: new Error('Not authenticated') };

  const { data: memberRecord } = await supabase
    .from('members')
    .select('id')
    .eq('profile_id', user.id)
    .eq('organisation_id', orgId)
    .single();

  if (!memberRecord) return { data: [], error: null };

  return getDependentsForMember(memberRecord.id);
}

export async function linkGuardianToMinor(data: {
  guardian_member_id: string;
  minor_member_id: string;
  relationship: GuardianRelationship;
  is_primary?: boolean;
  parental_consent_given?: boolean;
}) {
  const supabase = createClient();

  const { data: result, error } = await supabase
    .from('member_guardians')
    .insert({
      guardian_member_id: data.guardian_member_id,
      minor_member_id: data.minor_member_id,
      relationship: data.relationship,
      is_primary: data.is_primary ?? false,
      parental_consent_given: data.parental_consent_given ?? false,
      consent_date: data.parental_consent_given ? new Date().toISOString() : null,
    })
    .select('*, guardian:members!guardian_member_id(*, profile:profiles(*)), minor:members!minor_member_id(*, profile:profiles(*))')
    .single();

  return { data: result as unknown as MemberGuardianWithDetails | null, error };
}

export async function unlinkGuardianFromMinor(guardianMemberId: string, minorMemberId: string) {
  const supabase = createClient();

  const { error } = await supabase
    .from('member_guardians')
    .delete()
    .eq('guardian_member_id', guardianMemberId)
    .eq('minor_member_id', minorMemberId);

  return { error };
}

export async function searchAdultMembers(orgId: string, query: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('members')
    .select('*, profile:profiles(*)')
    .eq('organisation_id', orgId)
    .limit(100);

  if (error || !data) return { data: data as unknown as MemberWithProfile[] | null, error };

  const members = data as unknown as MemberWithProfile[];

  // Filter by search query on profile fields, then by adult status
  const q = query.toLowerCase();
  const matched = members.filter((m) => {
    if (!m.profile) return false;
    return (
      m.profile.first_name?.toLowerCase().includes(q) ||
      m.profile.last_name?.toLowerCase().includes(q) ||
      m.profile.email?.toLowerCase().includes(q)
    );
  });

  const adults = matched.filter(
    (m) => !m.profile.date_of_birth || !isMinor(m.profile.date_of_birth)
  );

  return { data: adults.slice(0, 10), error: null };
}
