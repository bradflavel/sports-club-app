import { createClient } from '@/lib/supabase/client';
import type { StaffAccreditationTemplate } from '@/lib/supabase/database.types';

export async function getTemplatesForStaffType(staffTypeId: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('staff_accreditation_templates')
    .select('*')
    .eq('staff_type_id', staffTypeId)
    .order('display_order');

  return { data: data as StaffAccreditationTemplate[] | null, error };
}

export async function createTemplate(data: {
  staff_type_id: string;
  organisation_id: string;
  name: string;
  issuing_body?: string | null;
  is_required?: boolean;
}) {
  const supabase = createClient();

  const { data: existing } = await supabase
    .from('staff_accreditation_templates')
    .select('display_order')
    .eq('staff_type_id', data.staff_type_id)
    .order('display_order', { ascending: false })
    .limit(1);

  const nextOrder = existing && existing.length > 0 ? existing[0].display_order + 1 : 0;

  const { data: result, error } = await supabase
    .from('staff_accreditation_templates')
    .insert({
      staff_type_id: data.staff_type_id,
      organisation_id: data.organisation_id,
      name: data.name,
      issuing_body: data.issuing_body ?? null,
      is_required: data.is_required ?? false,
      display_order: nextOrder,
    })
    .select('*')
    .single();

  return { data: result as StaffAccreditationTemplate | null, error };
}

export async function updateTemplate(
  id: string,
  data: Partial<{
    name: string;
    issuing_body: string | null;
    is_required: boolean;
  }>
) {
  const supabase = createClient();

  const { data: result, error } = await supabase
    .from('staff_accreditation_templates')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single();

  return { data: result as StaffAccreditationTemplate | null, error };
}

export async function deleteTemplate(id: string) {
  const supabase = createClient();

  const { error } = await supabase
    .from('staff_accreditation_templates')
    .delete()
    .eq('id', id);

  return { error };
}
