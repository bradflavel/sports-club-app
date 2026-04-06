import { createClient } from '@/lib/supabase/client';
import type { Organisation, SportType } from '@/lib/supabase/database.types';

const LOGOS_BUCKET = 'logos';

export async function updateOrganisationClient(
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
  const supabase = createClient();

  const { data, error } = await supabase
    .from('organisations')
    .update({ ...orgData, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  return { data: data as Organisation | null, error };
}

export async function uploadOrgLogoClient(
  orgId: string,
  file: File
): Promise<{ publicUrl: string | null; error: Error | null }> {
  const supabase = createClient();

  const fileExt = file.name.split('.').pop();
  const fileName = `${orgId}/logo-${Date.now()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from(LOGOS_BUCKET)
    .upload(fileName, file, { contentType: file.type, upsert: true });

  if (uploadError) return { publicUrl: null, error: uploadError };

  const {
    data: { publicUrl },
  } = supabase.storage.from(LOGOS_BUCKET).getPublicUrl(fileName);

  return { publicUrl, error: null };
}

export async function createOrganisationClient(
  orgData: {
    name: string;
    slug: string;
    sport_type: SportType;
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
  const supabase = createClient();

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

  const createdOrg = org as Organisation;

  // Set the creating user as admin in their profile
  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      organisation_id: createdOrg.id,
      role: 'admin',
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (profileError) return { data: null, error: profileError };

  // Create member record for the admin
  const { error: memberError } = await supabase.from('members').insert({
    profile_id: userId,
    organisation_id: createdOrg.id,
    membership_type: 'senior',
    membership_status: 'active',
    registration_date: new Date().toISOString().split('T')[0],
    expiry_date: null,
    medical_conditions: null,
    dietary_requirements: null,
    notes: null,
  });

  if (memberError) {
    // Non-fatal: org and profile are already set up
    console.warn('Could not create member record:', memberError.message);
  }

  return { data: createdOrg, error: null };
}
