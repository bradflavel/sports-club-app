import { createClient } from '@/lib/supabase/client';
import type {
  Organisation,
  ClubVenue,
  MembershipFeeSchedule,
  MembershipType,
} from '@/lib/supabase/database.types';

// ---------------------------------------------------------------------------
// Organisation
// ---------------------------------------------------------------------------

export async function getOrganisation(orgId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('organisations')
    .select('*')
    .eq('id', orgId)
    .single();

  return { data: data as Organisation | null, error };
}

export async function updateOrganisationDetails(
  orgId: string,
  data: Partial<Organisation>,
) {
  const supabase = await createClient();

  const { data: updated, error } = await supabase
    .from('organisations')
    .update({
      ...data,
      details_reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', orgId)
    .select()
    .single();

  return { data: updated as Organisation | null, error };
}

export async function markDetailsReviewed(orgId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('organisations')
    .update({
      details_reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', orgId)
    .select()
    .single();

  return { data: data as Organisation | null, error };
}

// ---------------------------------------------------------------------------
// Venues
// ---------------------------------------------------------------------------

export async function getVenues(orgId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('club_venues')
    .select('*')
    .eq('organisation_id', orgId)
    .order('is_primary', { ascending: false })
    .order('name', { ascending: true });

  return { data: (data ?? []) as ClubVenue[], error };
}

export async function createVenue(
  orgId: string,
  venueData: {
    name: string;
    address?: string | null;
    is_primary?: boolean;
    notes?: string | null;
  },
) {
  const supabase = await createClient();

  // If the new venue should be primary, unset any existing primaries first.
  if (venueData.is_primary) {
    await supabase
      .from('club_venues')
      .update({ is_primary: false, updated_at: new Date().toISOString() })
      .eq('organisation_id', orgId)
      .eq('is_primary', true);
  }

  const { data, error } = await supabase
    .from('club_venues')
    .insert({
      organisation_id: orgId,
      name: venueData.name,
      address: venueData.address ?? null,
      is_primary: venueData.is_primary ?? false,
      notes: venueData.notes ?? null,
    })
    .select()
    .single();

  return { data: data as ClubVenue | null, error };
}

export async function updateVenue(
  venueId: string,
  venueData: Partial<Pick<ClubVenue, 'name' | 'address' | 'is_primary' | 'notes'>>,
) {
  const supabase = await createClient();

  // If promoting to primary, unset existing primaries for the same org.
  if (venueData.is_primary) {
    // Look up the venue to find its org.
    const { data: existing } = await supabase
      .from('club_venues')
      .select('organisation_id')
      .eq('id', venueId)
      .single();

    if (existing) {
      await supabase
        .from('club_venues')
        .update({ is_primary: false, updated_at: new Date().toISOString() })
        .eq('organisation_id', (existing as ClubVenue).organisation_id)
        .eq('is_primary', true);
    }
  }

  const { data, error } = await supabase
    .from('club_venues')
    .update({ ...venueData, updated_at: new Date().toISOString() })
    .eq('id', venueId)
    .select()
    .single();

  return { data: data as ClubVenue | null, error };
}

export async function deleteVenue(venueId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('club_venues')
    .delete()
    .eq('id', venueId);

  return { data: null, error };
}

// ---------------------------------------------------------------------------
// Fee Schedule
// ---------------------------------------------------------------------------

export async function getFeeSchedule(orgId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('membership_fee_schedule')
    .select('*')
    .eq('organisation_id', orgId);

  return { data: (data ?? []) as MembershipFeeSchedule[], error };
}

export async function upsertFeeSchedule(
  orgId: string,
  entries: Array<{
    membership_type: MembershipType;
    amount_cents: number;
    label?: string | null;
  }>,
) {
  const supabase = await createClient();

  const rows = entries.map((entry) => ({
    organisation_id: orgId,
    membership_type: entry.membership_type,
    amount_cents: entry.amount_cents,
    label: entry.label ?? null,
  }));

  const { data, error } = await supabase
    .from('membership_fee_schedule')
    .upsert(rows, { onConflict: 'organisation_id,membership_type' })
    .select();

  return { data: (data ?? []) as MembershipFeeSchedule[], error };
}

export async function deleteFeeEntry(id: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('membership_fee_schedule')
    .delete()
    .eq('id', id);

  return { data: null, error };
}
