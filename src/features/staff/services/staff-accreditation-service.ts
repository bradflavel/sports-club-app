import { createClient } from '@/lib/supabase/client';
import type { StaffAccreditation, AccreditationStatus } from '@/lib/supabase/database.types';

export async function getAccreditationsForStaff(staffId: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('staff_accreditations')
    .select('*')
    .eq('staff_id', staffId)
    .order('created_at', { ascending: false });

  return { data: data as StaffAccreditation[] | null, error };
}

export async function createAccreditation(data: {
  staff_id: string;
  organisation_id: string;
  name: string;
  issuing_body?: string | null;
  credential_number?: string | null;
  issue_date?: string | null;
  expiry_date?: string | null;
  status?: AccreditationStatus;
  document_url?: string | null;
  notes?: string | null;
}) {
  const supabase = createClient();

  const { data: result, error } = await supabase
    .from('staff_accreditations')
    .insert({
      staff_id: data.staff_id,
      organisation_id: data.organisation_id,
      name: data.name,
      issuing_body: data.issuing_body ?? null,
      credential_number: data.credential_number ?? null,
      issue_date: data.issue_date ?? null,
      expiry_date: data.expiry_date ?? null,
      status: data.status ?? 'current',
      document_url: data.document_url ?? null,
      notes: data.notes ?? null,
    })
    .select('*')
    .single();

  return { data: result as StaffAccreditation | null, error };
}

export async function updateAccreditation(
  id: string,
  data: Partial<{
    name: string;
    issuing_body: string | null;
    credential_number: string | null;
    issue_date: string | null;
    expiry_date: string | null;
    status: AccreditationStatus;
    document_url: string | null;
    notes: string | null;
  }>
) {
  const supabase = createClient();

  const { data: result, error } = await supabase
    .from('staff_accreditations')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single();

  return { data: result as StaffAccreditation | null, error };
}

export async function deleteAccreditation(id: string) {
  const supabase = createClient();

  const { error } = await supabase
    .from('staff_accreditations')
    .delete()
    .eq('id', id);

  return { error };
}
