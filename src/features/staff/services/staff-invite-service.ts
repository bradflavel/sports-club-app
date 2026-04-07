import { createClient } from '@/lib/supabase/client';
import type { StaffInvite } from '@/lib/supabase/database.types';
import type { StaffInviteWithDetails } from '../types';

function generateToken(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => chars[byte % chars.length]).join('');
}

export async function getInvites(orgId: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('staff_invites')
    .select('*, staff_type:staff_types(*), creator:profiles!staff_invites_created_by_fkey(*)')
    .eq('organisation_id', orgId)
    .order('created_at', { ascending: false });

  return { data: (data as unknown as StaffInviteWithDetails[]) ?? [], error };
}

export async function createInvite(data: {
  organisation_id: string;
  staff_type_id: string;
  email?: string | null;
  created_by: string;
  is_single_use?: boolean;
  expires_days?: number;
}) {
  const supabase = createClient();

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + (data.expires_days ?? 30));

  const { data: result, error } = await supabase
    .from('staff_invites')
    .insert({
      organisation_id: data.organisation_id,
      staff_type_id: data.staff_type_id,
      token: generateToken(),
      email: data.email ?? null,
      created_by: data.created_by,
      expires_at: expiresAt.toISOString(),
      is_single_use: data.is_single_use ?? true,
    })
    .select('*, staff_type:staff_types(*), creator:profiles!staff_invites_created_by_fkey(*)')
    .single();

  return { data: result as unknown as StaffInviteWithDetails | null, error };
}

export async function getInviteByToken(token: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('staff_invites')
    .select('*, staff_type:staff_types(*)')
    .eq('token', token)
    .single();

  return { data: data as unknown as (StaffInvite & { staff_type: { name: string; id: string; organisation_id: string } }) | null, error };
}

export async function acceptInvite(token: string, userId: string) {
  const supabase = createClient();

  const { data: result, error } = await supabase
    .from('staff_invites')
    .update({
      accepted_at: new Date().toISOString(),
      accepted_by: userId,
    })
    .eq('token', token)
    .is('accepted_at', null)
    .select('*')
    .single();

  return { data: result as StaffInvite | null, error };
}

export async function revokeInvite(id: string) {
  const supabase = createClient();

  const { error } = await supabase
    .from('staff_invites')
    .delete()
    .eq('id', id);

  return { error };
}
