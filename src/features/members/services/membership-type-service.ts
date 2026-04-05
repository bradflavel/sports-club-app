import { createClient } from '@/lib/supabase/client';
import { DEFAULT_MEMBERSHIP_TYPES } from '@/lib/constants';
import type { MembershipTypeRecord } from '@/lib/supabase/database.types';

export async function getMembershipTypes(orgId: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('membership_types')
    .select('*')
    .eq('organisation_id', orgId)
    .eq('is_active', true)
    .order('display_order');

  return { data: data as MembershipTypeRecord[] | null, error };
}

export async function getAllMembershipTypes(orgId: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('membership_types')
    .select('*')
    .eq('organisation_id', orgId)
    .order('display_order');

  return { data: data as MembershipTypeRecord[] | null, error };
}

export async function createMembershipType(
  orgId: string,
  data: {
    name: string;
    description?: string | null;
    fee_cents?: number;
    has_expiry?: boolean;
    default_duration_months?: number | null;
    auto_renewal?: boolean;
    grace_period_days?: number;
  }
) {
  const supabase = createClient();

  // Get the next display_order
  const { data: existing } = await supabase
    .from('membership_types')
    .select('display_order')
    .eq('organisation_id', orgId)
    .order('display_order', { ascending: false })
    .limit(1);

  const nextOrder = existing && existing.length > 0 ? existing[0].display_order + 1 : 0;

  const { data: result, error } = await supabase
    .from('membership_types')
    .insert({
      organisation_id: orgId,
      name: data.name,
      description: data.description ?? null,
      fee_cents: data.fee_cents ?? 0,
      has_expiry: data.has_expiry ?? true,
      default_duration_months: data.default_duration_months ?? 12,
      auto_renewal: data.auto_renewal ?? false,
      grace_period_days: data.grace_period_days ?? 0,
      is_active: true,
      display_order: nextOrder,
    })
    .select('*')
    .single();

  return { data: result as MembershipTypeRecord | null, error };
}

export async function updateMembershipType(
  id: string,
  data: Partial<{
    name: string;
    description: string | null;
    fee_cents: number;
    has_expiry: boolean;
    default_duration_months: number | null;
    auto_renewal: boolean;
    grace_period_days: number;
    is_active: boolean;
  }>
) {
  const supabase = createClient();

  const { data: result, error } = await supabase
    .from('membership_types')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single();

  return { data: result as MembershipTypeRecord | null, error };
}

export async function deleteMembershipType(id: string) {
  const supabase = createClient();

  const { error } = await supabase
    .from('membership_types')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', id);

  return { error };
}

export async function reorderMembershipTypes(orgId: string, orderedIds: string[]) {
  const supabase = createClient();

  const updates = orderedIds.map((id, index) =>
    supabase
      .from('membership_types')
      .update({ display_order: index, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('organisation_id', orgId)
  );

  const results = await Promise.all(updates);
  const firstError = results.find((r) => r.error);

  return { error: firstError?.error ?? null };
}

export async function createDefaultTypes(orgId: string) {
  const supabase = createClient();

  const rows = DEFAULT_MEMBERSHIP_TYPES.map((type, index) => ({
    organisation_id: orgId,
    name: type.name,
    description: null,
    fee_cents: type.fee_cents,
    has_expiry: type.has_expiry,
    default_duration_months: type.default_duration_months,
    auto_renewal: false,
    grace_period_days: 0,
    is_active: true,
    display_order: index,
  }));

  const { data, error } = await supabase
    .from('membership_types')
    .insert(rows)
    .select('*');

  return { data: data as MembershipTypeRecord[] | null, error };
}
