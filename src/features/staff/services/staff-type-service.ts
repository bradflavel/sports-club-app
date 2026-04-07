import { createClient } from '@/lib/supabase/client';
import { DEFAULT_STAFF_TYPES } from '@/lib/constants';
import type { StaffType, StaffTypeField, StaffAccreditationTemplate } from '@/lib/supabase/database.types';

export async function getStaffTypes(orgId: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('staff_types')
    .select('*')
    .eq('organisation_id', orgId)
    .eq('is_active', true)
    .order('display_order');

  return { data: data as StaffType[] | null, error };
}

export async function getAllStaffTypes(orgId: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('staff_types')
    .select('*')
    .eq('organisation_id', orgId)
    .order('display_order');

  return { data: data as StaffType[] | null, error };
}

export async function getStaffTypeWithFields(typeId: string) {
  const supabase = createClient();

  const [typeResult, fieldsResult, templatesResult] = await Promise.all([
    supabase.from('staff_types').select('*').eq('id', typeId).single(),
    supabase.from('staff_type_fields').select('*').eq('staff_type_id', typeId).order('display_order'),
    supabase.from('staff_accreditation_templates').select('*').eq('staff_type_id', typeId).order('display_order'),
  ]);

  if (typeResult.error) return { data: null, error: typeResult.error };

  return {
    data: {
      ...(typeResult.data as StaffType),
      staff_type_fields: (fieldsResult.data as StaffTypeField[]) ?? [],
      staff_accreditation_templates: (templatesResult.data as StaffAccreditationTemplate[]) ?? [],
    },
    error: null,
  };
}

export async function createStaffType(
  orgId: string,
  data: {
    name: string;
    description?: string | null;
    icon?: string | null;
    requires_wwc?: boolean;
    is_publicly_visible?: boolean;
  }
) {
  const supabase = createClient();

  const { data: existing } = await supabase
    .from('staff_types')
    .select('display_order')
    .eq('organisation_id', orgId)
    .order('display_order', { ascending: false })
    .limit(1);

  const nextOrder = existing && existing.length > 0 ? existing[0].display_order + 1 : 0;

  const { data: result, error } = await supabase
    .from('staff_types')
    .insert({
      organisation_id: orgId,
      name: data.name,
      description: data.description ?? null,
      icon: data.icon ?? null,
      requires_wwc: data.requires_wwc ?? false,
      is_publicly_visible: data.is_publicly_visible ?? false,
      is_active: true,
      display_order: nextOrder,
    })
    .select('*')
    .single();

  return { data: result as StaffType | null, error };
}

export async function updateStaffType(
  id: string,
  data: Partial<{
    name: string;
    description: string | null;
    icon: string | null;
    requires_wwc: boolean;
    is_publicly_visible: boolean;
    is_active: boolean;
  }>
) {
  const supabase = createClient();

  const { data: result, error } = await supabase
    .from('staff_types')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single();

  return { data: result as StaffType | null, error };
}

export async function deleteStaffType(id: string) {
  const supabase = createClient();

  const { count } = await supabase
    .from('staff')
    .select('*', { count: 'exact', head: true })
    .eq('staff_type_id', id);

  if (count && count > 0) {
    return { error: new Error(`Cannot delete: ${count} staff member${count !== 1 ? 's' : ''} are using this type. Deactivate it instead.`), staffCount: count };
  }

  const { error } = await supabase
    .from('staff_types')
    .delete()
    .eq('id', id);

  return { error, staffCount: 0 };
}

export async function reorderStaffTypes(orgId: string, orderedIds: string[]) {
  const supabase = createClient();

  const updates = orderedIds.map((id, index) =>
    supabase
      .from('staff_types')
      .update({ display_order: index, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('organisation_id', orgId)
  );

  const results = await Promise.all(updates);
  const firstError = results.find((r) => r.error);

  return { error: firstError?.error ?? null };
}

export async function createDefaultStaffTypes(orgId: string) {
  const supabase = createClient();

  const rows = DEFAULT_STAFF_TYPES.map((type, index) => ({
    organisation_id: orgId,
    name: type.name,
    description: null,
    icon: null,
    requires_wwc: type.requires_wwc,
    is_publicly_visible: type.is_publicly_visible,
    is_active: true,
    display_order: index,
  }));

  const { data, error } = await supabase
    .from('staff_types')
    .insert(rows)
    .select('*');

  return { data: data as StaffType[] | null, error };
}
