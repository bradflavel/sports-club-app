import { createClient } from '@/lib/supabase/client';
import type { StaffRecord, StaffStatus } from '@/lib/supabase/database.types';
import type { StaffFilters, StaffWithDetails } from '../types';

export async function getStaff(orgId: string, filters?: StaffFilters) {
  const supabase = createClient();

  let query = supabase
    .from('staff')
    .select('*, profile:profiles(*), staff_type:staff_types(*), member:members(*)', { count: 'exact' })
    .eq('organisation_id', orgId)
    .order('created_at', { ascending: false });

  if (filters?.staffTypeId) {
    query = query.eq('staff_type_id', filters.staffTypeId);
  }

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  const { data, count, error } = await query;

  let results = (data as unknown as StaffWithDetails[]) ?? [];

  if (filters?.search) {
    const search = filters.search.toLowerCase();
    results = results.filter((s) => {
      const fullName = `${s.profile.first_name} ${s.profile.last_name}`.toLowerCase();
      const email = s.profile.email?.toLowerCase() ?? '';
      const position = s.position?.toLowerCase() ?? '';
      return fullName.includes(search) || email.includes(search) || position.includes(search);
    });
  }

  return { data: results, count, error };
}

export async function getStaffById(id: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('staff')
    .select('*, profile:profiles(*), staff_type:staff_types(*), member:members(*)')
    .eq('id', id)
    .single();

  return { data: data as unknown as StaffWithDetails | null, error };
}

export async function getStaffByProfileId(profileId: string, orgId: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('staff')
    .select('*, profile:profiles(*), staff_type:staff_types(*), member:members(*)')
    .eq('profile_id', profileId)
    .eq('organisation_id', orgId);

  return { data: (data as unknown as StaffWithDetails[]) ?? [], error };
}

export async function createStaff(data: {
  profile_id: string;
  organisation_id: string;
  staff_type_id: string;
  member_id?: string | null;
  status?: StaffStatus;
  position?: string | null;
  start_date?: string | null;
  notes?: string | null;
}) {
  const supabase = createClient();

  const { data: result, error } = await supabase
    .from('staff')
    .insert({
      profile_id: data.profile_id,
      organisation_id: data.organisation_id,
      staff_type_id: data.staff_type_id,
      member_id: data.member_id ?? null,
      status: data.status ?? 'pending',
      position: data.position ?? null,
      start_date: data.start_date ?? new Date().toISOString().split('T')[0],
      notes: data.notes ?? null,
    })
    .select('*, profile:profiles(*), staff_type:staff_types(*), member:members(*)')
    .single();

  return { data: result as unknown as StaffWithDetails | null, error };
}

export async function updateStaff(
  id: string,
  data: Partial<{
    staff_type_id: string;
    member_id: string | null;
    status: StaffStatus;
    position: string | null;
    start_date: string | null;
    end_date: string | null;
    notes: string | null;
  }>
) {
  const supabase = createClient();

  const { data: result, error } = await supabase
    .from('staff')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*, profile:profiles(*), staff_type:staff_types(*), member:members(*)')
    .single();

  return { data: result as unknown as StaffWithDetails | null, error };
}

export async function deleteStaff(id: string) {
  const supabase = createClient();

  const { error } = await supabase
    .from('staff')
    .delete()
    .eq('id', id);

  return { error };
}

export async function getExpiringAccreditations(orgId: string, withinDays: number = 30) {
  const supabase = createClient();

  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + withinDays);

  const { data, count, error } = await supabase
    .from('staff_accreditations')
    .select('*, staff:staff(*, profile:profiles(*), staff_type:staff_types(*))', { count: 'exact' })
    .eq('organisation_id', orgId)
    .eq('status', 'current')
    .not('expiry_date', 'is', null)
    .lte('expiry_date', futureDate.toISOString().split('T')[0])
    .order('expiry_date');

  return { data: data ?? [], count: count ?? 0, error };
}

export async function getStaffStats(orgId: string) {
  const supabase = createClient();

  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 30);

  const [totalResult, activeResult, expiringResult] = await Promise.all([
    supabase.from('staff').select('*', { count: 'exact', head: true }).eq('organisation_id', orgId),
    supabase.from('staff').select('*', { count: 'exact', head: true }).eq('organisation_id', orgId).eq('status', 'active'),
    supabase
      .from('staff_accreditations')
      .select('*', { count: 'exact', head: true })
      .eq('organisation_id', orgId)
      .eq('status', 'current')
      .not('expiry_date', 'is', null)
      .lte('expiry_date', futureDate.toISOString().split('T')[0]),
  ]);

  return {
    total: totalResult.count ?? 0,
    active: activeResult.count ?? 0,
    expiringAccreditations: expiringResult.count ?? 0,
  };
}
