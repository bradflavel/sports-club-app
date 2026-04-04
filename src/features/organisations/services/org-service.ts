import { createClient } from '@/lib/supabase/server';
import type { Organisation } from '@/lib/supabase/database.types';

const LOGOS_BUCKET = 'logos';

export async function getOrganisation(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('organisations')
    .select('*')
    .eq('id', id)
    .single();

  return { data: data as Organisation | null, error };
}

export async function getOrganisationBySlug(slug: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('organisations')
    .select('*')
    .eq('slug', slug)
    .single();

  return { data: data as Organisation | null, error };
}

export async function createOrganisation(
  orgData: {
    name: string;
    slug: string;
    sport_type: Organisation['sport_type'];
    logo_url?: string | null;
    primary_colour: string;
    secondary_colour: string;
    contact_email?: string | null;
    contact_phone?: string | null;
    address?: string | null;
    website?: string | null;
  },
  userId: string
) {
  const supabase = await createClient();

  const { data: org, error: orgError } = await supabase
    .from('organisations')
    .insert({
      name: orgData.name,
      slug: orgData.slug,
      sport_type: orgData.sport_type,
      logo_url: orgData.logo_url ?? null,
      primary_colour: orgData.primary_colour,
      secondary_colour: orgData.secondary_colour,
      contact_email: orgData.contact_email ?? null,
      contact_phone: orgData.contact_phone ?? null,
      address: orgData.address ?? null,
      website: orgData.website ?? null,
    })
    .select()
    .single();

  if (orgError) return { data: null, error: orgError };

  // Set the creating user as admin in their profile
  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      organisation_id: (org as Organisation).id,
      role: 'admin',
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (profileError) return { data: null, error: profileError };

  return { data: org as Organisation, error: null };
}

export async function updateOrganisation(
  id: string,
  orgData: Partial<
    Pick<
      Organisation,
      | 'name'
      | 'slug'
      | 'sport_type'
      | 'logo_url'
      | 'primary_colour'
      | 'secondary_colour'
      | 'contact_email'
      | 'contact_phone'
      | 'address'
      | 'website'
    >
  >
) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('organisations')
    .update({ ...orgData, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  return { data: data as Organisation | null, error };
}

export async function deleteOrganisation(id: string) {
  const supabase = await createClient();

  // Cascade is handled at the DB level; deleting the org row is sufficient.
  const { error } = await supabase.from('organisations').delete().eq('id', id);

  return { data: null, error };
}

export async function uploadLogo(orgId: string, file: File) {
  const supabase = await createClient();

  const fileExt = file.name.split('.').pop();
  const fileName = `${orgId}/logo-${Date.now()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from(LOGOS_BUCKET)
    .upload(fileName, file, {
      contentType: file.type,
      upsert: true,
    });

  if (uploadError) return { data: null, error: uploadError };

  const {
    data: { publicUrl },
  } = supabase.storage.from(LOGOS_BUCKET).getPublicUrl(fileName);

  // Persist the new logo URL on the organisation record
  const { data, error } = await supabase
    .from('organisations')
    .update({ logo_url: publicUrl, updated_at: new Date().toISOString() })
    .eq('id', orgId)
    .select()
    .single();

  return { data: data as Organisation | null, error };
}
