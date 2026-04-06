import { createClient } from '@/lib/supabase/client';
import type { OrganisationModule, ActivityType } from '@/lib/supabase/database.types';

export async function getModules(orgId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('organisation_modules')
    .select('*')
    .eq('organisation_id', orgId)
    .order('display_order');
  return { data: data as OrganisationModule[] | null, error };
}

export async function enableModule(orgId: string, activityType: ActivityType) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('organisation_modules')
    .upsert(
      {
        organisation_id: orgId,
        activity_type: activityType,
        is_enabled: true,
        display_order: getDefaultDisplayOrder(activityType),
      },
      { onConflict: 'organisation_id,activity_type' }
    )
    .select()
    .single();
  return { data: data as OrganisationModule | null, error };
}

export async function disableModule(orgId: string, activityType: ActivityType) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('organisation_modules')
    .update({ is_enabled: false })
    .eq('organisation_id', orgId)
    .eq('activity_type', activityType)
    .select()
    .single();
  return { data: data as OrganisationModule | null, error };
}

export async function initDefaultModules(orgId: string) {
  const supabase = createClient();

  const defaults: {
    organisation_id: string;
    activity_type: ActivityType;
    is_enabled: boolean;
    display_order: number;
  }[] = [
    { organisation_id: orgId, activity_type: 'competition', is_enabled: true, display_order: 0 },
    { organisation_id: orgId, activity_type: 'tournament', is_enabled: false, display_order: 1 },
    { organisation_id: orgId, activity_type: 'training_session', is_enabled: true, display_order: 2 },
    { organisation_id: orgId, activity_type: 'training_camp', is_enabled: false, display_order: 3 },
  ];

  const { data, error } = await supabase
    .from('organisation_modules')
    .upsert(defaults, { onConflict: 'organisation_id,activity_type' })
    .select();

  return { data: data as OrganisationModule[] | null, error };
}

function getDefaultDisplayOrder(activityType: ActivityType): number {
  const orderMap: Record<ActivityType, number> = {
    competition: 0,
    tournament: 1,
    training_session: 2,
    training_camp: 3,
    trials: 4,
  };
  return orderMap[activityType];
}
