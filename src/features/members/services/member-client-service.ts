import { createClient } from '@/lib/supabase/client';
import type { Team, MemberWithProfile, MembershipType } from '@/lib/supabase/database.types';

export async function getTeamsClient() {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('teams')
    .select('id, name')
    .order('name');

  return { data: (data as Team[] | null) ?? null, error };
}

export async function getMemberWithTeamCountClient(memberId: string) {
  const supabase = createClient();

  const [memberResult, teamsResult] = await Promise.all([
    supabase
      .from('members')
      .select('*, profile:profiles(*)')
      .eq('id', memberId)
      .single(),
    supabase
      .from('team_members')
      .select('id', { count: 'exact' })
      .eq('member_id', memberId),
  ]);

  return {
    member: (memberResult.data as unknown as MemberWithProfile | null) ?? null,
    teamCount: teamsResult.count ?? 0,
    error: memberResult.error ?? teamsResult.error,
  };
}

export interface CsvImportRow {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string | null;
  date_of_birth?: string | null;
  membership_type: string;
}

export async function importMembersFromCsvClient(
  orgId: string,
  rows: CsvImportRow[],
  onProgress?: (done: number) => void
): Promise<{ importedCount: number; errors: string[] }> {
  const supabase = createClient();

  let imported = 0;
  const errors: string[] = [];
  let done = 0;

  for (const row of rows) {
    try {
      const { data: existingProfile, error: lookupError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', row.email)
        .single();

      let profileId: string;

      if (existingProfile) {
        profileId = existingProfile.id;
      } else if (lookupError && lookupError.code === 'PGRST116') {
        const newId = crypto.randomUUID();
        const { error: profileInsertError } = await supabase
          .from('profiles')
          .insert({
            id: newId,
            first_name: row.first_name,
            last_name: row.last_name,
            email: row.email,
            phone: row.phone || null,
            date_of_birth: row.date_of_birth || null,
            avatar_url: null,
            emergency_contact_name: null,
            emergency_contact_phone: null,
            organisation_id: orgId,
            role: 'member' as const,
          });

        if (profileInsertError) {
          errors.push(
            `Row ${done + 1} (${row.email}): failed to create profile — ${profileInsertError.message}`
          );
          done += 1;
          onProgress?.(done);
          continue;
        }
        profileId = newId;
      } else if (lookupError) {
        errors.push(
          `Row ${done + 1} (${row.email}): profile lookup failed — ${lookupError.message}`
        );
        done += 1;
        onProgress?.(done);
        continue;
      } else {
        errors.push(`Row ${done + 1} (${row.email}): unexpected lookup result`);
        done += 1;
        onProgress?.(done);
        continue;
      }

      const { error: memberInsertError } = await supabase.from('members').insert({
        profile_id: profileId,
        organisation_id: orgId,
        membership_type: row.membership_type as MembershipType,
        membership_status: 'active' as const,
        registration_date: new Date().toISOString().split('T')[0],
        expiry_date: null,
        medical_conditions: null,
        dietary_requirements: null,
        notes: null,
      });

      if (memberInsertError) {
        if (memberInsertError.code === '23505') {
          errors.push(
            `Row ${done + 1} (${row.email}): member already exists in this organisation — skipped`
          );
        } else {
          errors.push(
            `Row ${done + 1} (${row.email}): failed to create member — ${memberInsertError.message}`
          );
        }
      } else {
        imported += 1;
      }
    } catch (err) {
      errors.push(
        `Row ${done + 1} (${row.email}): unexpected error — ${
          err instanceof Error ? err.message : String(err)
        }`
      );
    }

    done += 1;
    onProgress?.(done);
  }

  return { importedCount: imported, errors };
}
