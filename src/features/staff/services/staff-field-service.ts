import { createClient } from '@/lib/supabase/client';
import type { StaffTypeField, StaffFieldValue, StaffFieldType } from '@/lib/supabase/database.types';

export async function getFieldsForStaffType(staffTypeId: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('staff_type_fields')
    .select('*')
    .eq('staff_type_id', staffTypeId)
    .order('display_order');

  return { data: data as StaffTypeField[] | null, error };
}

export async function createStaffTypeField(data: {
  staff_type_id: string;
  organisation_id: string;
  name: string;
  field_type: StaffFieldType;
  is_required?: boolean;
  options?: string[] | null;
  placeholder?: string | null;
}) {
  const supabase = createClient();

  const { data: existing } = await supabase
    .from('staff_type_fields')
    .select('display_order')
    .eq('staff_type_id', data.staff_type_id)
    .order('display_order', { ascending: false })
    .limit(1);

  const nextOrder = existing && existing.length > 0 ? existing[0].display_order + 1 : 0;

  const { data: result, error } = await supabase
    .from('staff_type_fields')
    .insert({
      staff_type_id: data.staff_type_id,
      organisation_id: data.organisation_id,
      name: data.name,
      field_type: data.field_type,
      is_required: data.is_required ?? false,
      options: data.options ?? null,
      placeholder: data.placeholder ?? null,
      display_order: nextOrder,
    })
    .select('*')
    .single();

  return { data: result as StaffTypeField | null, error };
}

export async function updateStaffTypeField(
  id: string,
  data: Partial<{
    name: string;
    field_type: StaffFieldType;
    is_required: boolean;
    options: string[] | null;
    placeholder: string | null;
  }>
) {
  const supabase = createClient();

  const { data: result, error } = await supabase
    .from('staff_type_fields')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single();

  return { data: result as StaffTypeField | null, error };
}

export async function deleteStaffTypeField(id: string) {
  const supabase = createClient();

  const { error } = await supabase
    .from('staff_type_fields')
    .delete()
    .eq('id', id);

  return { error };
}

export async function reorderStaffTypeFields(staffTypeId: string, orderedIds: string[]) {
  const supabase = createClient();

  const updates = orderedIds.map((id, index) =>
    supabase
      .from('staff_type_fields')
      .update({ display_order: index, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('staff_type_id', staffTypeId)
  );

  const results = await Promise.all(updates);
  const firstError = results.find((r) => r.error);
  return { error: firstError?.error ?? null };
}

// Field values

export async function getFieldValues(staffId: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('staff_field_values')
    .select('*')
    .eq('staff_id', staffId);

  return { data: data as StaffFieldValue[] | null, error };
}

export async function upsertFieldValues(
  staffId: string,
  organisationId: string,
  values: { staff_type_field_id: string; value: string | null }[]
) {
  const supabase = createClient();

  const rows = values.map((v) => ({
    staff_id: staffId,
    staff_type_field_id: v.staff_type_field_id,
    organisation_id: organisationId,
    value: v.value,
  }));

  const { data, error } = await supabase
    .from('staff_field_values')
    .upsert(rows, { onConflict: 'staff_id,staff_type_field_id' })
    .select('*');

  return { data: data as StaffFieldValue[] | null, error };
}
