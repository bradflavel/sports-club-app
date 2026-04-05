import { createClient } from '@/lib/supabase/client';
import { calculateAge } from '@/lib/format';
import { getGuardiansForMember } from './guardian-service';
import type { MemberWithProfile } from '@/lib/supabase/database.types';

export async function getAgedOutJuniors(orgId: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('members')
    .select('*, profile:profiles(*)')
    .eq('organisation_id', orgId)
    .eq('membership_type', 'junior');

  if (error || !data) return { data: null, error };

  const agedOut = (data as unknown as MemberWithProfile[]).filter(
    (m) => m.profile.date_of_birth && calculateAge(m.profile.date_of_birth) >= 18
  );

  return { data: agedOut, error: null };
}

export async function transitionToSenior(memberId: string) {
  const supabase = createClient();

  // 1. Fetch member + profile
  const { data: member, error: memberError } = await supabase
    .from('members')
    .select('*, profile:profiles(*)')
    .eq('id', memberId)
    .single();

  if (memberError || !member) {
    return { error: memberError ?? new Error('Member not found') };
  }

  const m = member as unknown as MemberWithProfile;

  // 2. Fetch guardians
  const { data: guardians } = await getGuardiansForMember(memberId);

  // 3. Auto-fill emergency contacts from primary guardian if empty
  if (guardians && guardians.length > 0) {
    const primary = guardians.find((g) => g.is_primary) ?? guardians[0];
    const needsEmergencyName = !m.profile.emergency_contact_name;
    const needsEmergencyPhone = !m.profile.emergency_contact_phone;

    if (needsEmergencyName || needsEmergencyPhone) {
      const profileUpdate: Record<string, string> = {};
      if (needsEmergencyName) {
        profileUpdate.emergency_contact_name =
          `${primary.guardian.profile.first_name} ${primary.guardian.profile.last_name}`;
      }
      if (needsEmergencyPhone && primary.guardian.profile.phone) {
        profileUpdate.emergency_contact_phone = primary.guardian.profile.phone;
      }

      if (Object.keys(profileUpdate).length > 0) {
        await supabase
          .from('profiles')
          .update(profileUpdate)
          .eq('id', m.profile.id);
      }
    }

    // 4. Unlink all guardians
    await supabase
      .from('member_guardians')
      .delete()
      .eq('minor_member_id', memberId);
  }

  // 5. Change membership type to senior
  const { error: updateError } = await supabase
    .from('members')
    .update({
      membership_type: 'senior',
      updated_at: new Date().toISOString(),
    })
    .eq('id', memberId);

  return { error: updateError ?? null };
}

export async function bulkTransitionToSenior(memberIds: string[]) {
  let successes = 0;
  let failures = 0;
  const errors: string[] = [];

  for (const id of memberIds) {
    const { error } = await transitionToSenior(id);
    if (error) {
      failures++;
      errors.push(error instanceof Error ? error.message : String(error));
    } else {
      successes++;
    }
  }

  return { successes, failures, errors };
}
