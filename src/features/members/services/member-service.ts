import { createClient } from '@/lib/supabase/server';
import type {
  Member,
  MemberWithProfile,
  MembershipStatus,
  MembershipType,
} from '@/lib/supabase/database.types';
import type { MemberFilters } from '@/features/members/types/member-types';

export async function getMembers(
  orgId: string,
  filters?: MemberFilters & { page?: number; pageSize?: number }
) {
  const supabase = await createClient();
  const searchTerm = filters?.search?.trim().toLowerCase();

  // If searching, find matching profile IDs first so we can filter in SQL
  let matchingProfileIds: string[] | null = null;
  if (searchTerm) {
    const { data: matchingProfiles } = await supabase
      .from('profiles')
      .select('id')
      .eq('organisation_id', orgId)
      .or(
        `first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`
      );

    matchingProfileIds = matchingProfiles?.map((p) => p.id) ?? [];
    if (matchingProfileIds.length === 0) {
      return { data: [], count: 0, error: null };
    }
  }

  let query = supabase
    .from('members')
    .select('*, profile:profiles(*)', { count: 'exact' })
    .eq('organisation_id', orgId);

  // Apply search filter (profile IDs from above)
  if (matchingProfileIds) {
    query = query.in('profile_id', matchingProfileIds);
  }

  if (filters?.membershipType && filters.membershipType.length > 0) {
    query = query.in('membership_type', filters.membershipType as MembershipType[]);
  }

  if (filters?.membershipStatus && filters.membershipStatus.length > 0) {
    query = query.in('membership_status', filters.membershipStatus as MembershipStatus[]);
  }

  if (filters?.teamId) {
    const { data: teamMemberIds } = await supabase
      .from('team_members')
      .select('member_id')
      .eq('team_id', filters.teamId);

    if (teamMemberIds && teamMemberIds.length > 0) {
      query = query.in(
        'id',
        (teamMemberIds as Array<{ member_id: string }>).map((tm) => tm.member_id)
      );
    } else {
      return { data: [], count: 0, error: null };
    }
  }

  // Paginate AFTER all filters are applied
  const page = filters?.page ?? 1;
  const pageSize = filters?.pageSize ?? 20;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  query = query.range(from, to).order('created_at', { ascending: false });

  const { data, error, count } = await query;

  return { data: data as unknown as MemberWithProfile[] | null, count, error };
}

export async function getMemberById(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('members')
    .select('*, profile:profiles(*)')
    .eq('id', id)
    .single();

  return { data: data as unknown as MemberWithProfile | null, error };
}

export async function createMember(memberData: {
  profile_id: string;
  organisation_id: string;
  membership_type: Member['membership_type'];
  membership_status?: MembershipStatus;
  registration_date: string;
  expiry_date?: string | null;
  medical_conditions?: string | null;
  dietary_requirements?: string | null;
  notes?: string | null;
}) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('members')
    .insert({
      ...memberData,
      membership_status: memberData.membership_status ?? 'active',
      expiry_date: memberData.expiry_date ?? null,
      medical_conditions: memberData.medical_conditions ?? null,
      dietary_requirements: memberData.dietary_requirements ?? null,
      notes: memberData.notes ?? null,
    })
    .select('*, profile:profiles(*)')
    .single();

  return { data: data as unknown as MemberWithProfile | null, error };
}

export async function updateMember(
  id: string,
  memberData: Partial<
    Pick<
      Member,
      | 'membership_type'
      | 'membership_status'
      | 'expiry_date'
      | 'medical_conditions'
      | 'dietary_requirements'
      | 'notes'
    >
  >
) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('members')
    .update({ ...memberData, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*, profile:profiles(*)')
    .single();

  return { data: data as unknown as MemberWithProfile | null, error };
}

export async function updateMemberStatus(id: string, status: MembershipStatus) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('members')
    .update({ membership_status: status, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*, profile:profiles(*)')
    .single();

  return { data: data as unknown as MemberWithProfile | null, error };
}

export async function deleteMember(id: string) {
  const supabase = await createClient();

  const { error } = await supabase.from('members').delete().eq('id', id);

  return { data: null, error };
}

export async function getMembersByTeam(teamId: string) {
  const supabase = await createClient();

  const { data: teamMembers, error: tmError } = await supabase
    .from('team_members')
    .select('member_id')
    .eq('team_id', teamId);

  if (tmError) return { data: null, error: tmError };
  if (!teamMembers || teamMembers.length === 0) return { data: [], error: null };

  const memberIds = teamMembers.map((tm) => tm.member_id);

  const { data, error } = await supabase
    .from('members')
    .select('*, profile:profiles(*)')
    .in('id', memberIds);

  return { data: data as unknown as MemberWithProfile[] | null, error };
}

export async function exportMembersCsv(orgId: string): Promise<{ data: string | null; error: unknown }> {
  const supabase = await createClient();

  const { data: members, error } = await supabase
    .from('members')
    .select('*, profile:profiles(*)')
    .eq('organisation_id', orgId)
    .order('created_at', { ascending: false });

  if (error) return { data: null, error };
  if (!members || members.length === 0) {
    return {
      data: 'first_name,last_name,email,phone,date_of_birth,membership_type,membership_status,registration_date,expiry_date\n',
      error: null,
    };
  }

  const headers = [
    'first_name', 'last_name', 'email', 'phone', 'date_of_birth',
    'membership_type', 'membership_status', 'registration_date', 'expiry_date',
  ];

  const rows = (members as unknown as MemberWithProfile[]).map((m) => [
    m.profile.first_name, m.profile.last_name, m.profile.email,
    m.profile.phone ?? '', m.profile.date_of_birth ?? '',
    m.membership_type, m.membership_status, m.registration_date, m.expiry_date ?? '',
  ]);

  const csvLines = [
    headers.join(','),
    ...rows.map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ),
  ];

  return { data: csvLines.join('\n'), error: null };
}
