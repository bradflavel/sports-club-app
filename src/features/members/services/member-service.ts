import { createClient } from '@/lib/supabase/server';
import { z } from 'zod/v4';
import { csvImportRowSchema } from '@/features/members/schemas/member-schemas';
import type {
  Member,
  MemberWithProfile,
  MembershipStatus,
  MembershipType,
} from '@/lib/supabase/database.types';
import type {
  MemberFilters,
  MemberFormData,
  CsvImportResult,
  CsvImportRow,
} from '@/features/members/types/member-types';

export async function getMembers(
  orgId: string,
  filters?: MemberFilters & { page?: number; pageSize?: number }
) {
  const supabase = await createClient();

  let query = supabase
    .from('members')
    .select('*, profile:profiles(*)', { count: 'exact' })
    .eq('organisation_id', orgId);

  // Search is applied after fetch — PostgREST .or() on joined tables nulls the join
  const searchTerm = filters?.search;

  if (filters?.membershipType && filters.membershipType.length > 0) {
    query = query.in('membership_type', filters.membershipType as MembershipType[]);
  }

  if (filters?.membershipStatus && filters.membershipStatus.length > 0) {
    query = query.in('membership_status', filters.membershipStatus as MembershipStatus[]);
  }

  if (filters?.teamId) {
    const supabaseInner = await createClient();
    const { data: teamMemberIds } = await supabaseInner
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

  const page = filters?.page ?? 1;
  const pageSize = filters?.pageSize ?? 20;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  query = query.range(from, to).order('created_at', { ascending: false });

  const { data, error, count } = await query;

  let results = data as unknown as MemberWithProfile[] | null;
  if (results && searchTerm) {
    const q = searchTerm.toLowerCase();
    results = results.filter((m) => {
      const p = m.profile;
      if (!p) return false;
      return (
        p.first_name?.toLowerCase().includes(q) ||
        p.last_name?.toLowerCase().includes(q) ||
        p.email?.toLowerCase().includes(q)
      );
    });
  }

  return { data: results, count: searchTerm ? results?.length ?? 0 : count, error };
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

export function parseCsvData(csvText: string): CsvImportResult {
  const lines = csvText.trim().split('\n');

  if (lines.length < 2) {
    return {
      success: [],
      errors: [],
      totalRows: 0,
      successCount: 0,
      errorCount: 0,
    };
  }

  const headers = lines[0]
    .split(',')
    .map((h) => h.trim().toLowerCase().replace(/\s+/g, '_').replace(/"/g, ''));

  const success: CsvImportRow[] = [];
  const errors: CsvImportResult['errors'] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = line.split(',').map((v) => v.trim().replace(/"/g, ''));
    const rawRow: Record<string, string> = {};

    headers.forEach((header, index) => {
      rawRow[header] = values[index] ?? '';
    });

    const result = csvImportRowSchema.safeParse({
      first_name: rawRow['first_name'] || rawRow['firstname'] || rawRow['first name'],
      last_name: rawRow['last_name'] || rawRow['lastname'] || rawRow['last name'],
      email: rawRow['email'],
      phone: rawRow['phone'] || undefined,
      date_of_birth: rawRow['date_of_birth'] || rawRow['dob'] || undefined,
      membership_type: rawRow['membership_type'] || rawRow['type'],
    });

    if (result.success) {
      success.push(result.data);
    } else {
      errors.push({
        row: i,
        data: rawRow,
        errors: result.error.issues.map((issue) => issue.message),
      });
    }
  }

  return {
    success,
    errors,
    totalRows: lines.length - 1,
    successCount: success.length,
    errorCount: errors.length,
  };
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
    'first_name',
    'last_name',
    'email',
    'phone',
    'date_of_birth',
    'membership_type',
    'membership_status',
    'registration_date',
    'expiry_date',
  ];

  const rows = (members as unknown as MemberWithProfile[]).map((m) => [
    m.profile.first_name,
    m.profile.last_name,
    m.profile.email,
    m.profile.phone ?? '',
    m.profile.date_of_birth ?? '',
    m.membership_type,
    m.membership_status,
    m.registration_date,
    m.expiry_date ?? '',
  ]);

  const csvLines = [
    headers.join(','),
    ...rows.map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ),
  ];

  return { data: csvLines.join('\n'), error: null };
}
