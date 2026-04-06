import { createClient } from '@/lib/supabase/client';
import type {
  Activity,
  ActivityWithDetails,
  ActivityType,
} from '@/lib/supabase/database.types';

interface ActivityFilters {
  activityType?: ActivityType;
  search?: string;
}

export async function getActivities(orgId: string, filters?: ActivityFilters) {
  const supabase = createClient();

  let query = supabase
    .from('activities')
    .select('*, activity_teams(id)')
    .eq('organisation_id', orgId);

  if (filters?.activityType) {
    query = query.eq('activity_type', filters.activityType);
  }

  if (filters?.search) {
    query = query.ilike('name', `%${filters.search}%`);
  }

  query = query.order('start_date', { ascending: false });

  const { data, error } = await query;

  if (error) {
    return { data: null, error };
  }

  const activities: ActivityWithDetails[] = ((data ?? []) as unknown as (Activity & {
    activity_teams: { id: string }[];
  })[]).map((row) => {
    const { activity_teams, ...activity } = row;
    return {
      ...activity,
      teams: activity_teams ?? [],
      event_count: 0,
    } as ActivityWithDetails;
  });

  return { data: activities, error: null };
}

export async function getActivityById(id: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('activities')
    .select('*')
    .eq('id', id)
    .single();

  return { data: data as Activity | null, error };
}

export async function getActivityBySlug(orgId: string, slug: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('activities')
    .select('*')
    .eq('organisation_id', orgId)
    .eq('slug', slug)
    .single();

  return { data: data as Activity | null, error };
}

export async function createActivity(
  data: Omit<Activity, 'id' | 'created_at' | 'updated_at'>
) {
  const supabase = createClient();
  const { data: created, error } = await supabase
    .from('activities')
    .insert(data)
    .select('*')
    .single();

  if (error) return { data: null, error };

  return {
    data: {
      ...(created as unknown as Activity),
      teams: [],
      event_count: 0,
    } as ActivityWithDetails,
    error: null,
  };
}

export async function updateActivity(
  id: string,
  data: Partial<Omit<Activity, 'id' | 'created_at'>>
) {
  const supabase = createClient();
  const { data: updated, error } = await supabase
    .from('activities')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single();

  return { data: updated as Activity | null, error };
}

export async function deleteActivity(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from('activities').delete().eq('id', id);
  return { error };
}

export async function getActivitiesByType(orgId: string, type: ActivityType) {
  return getActivities(orgId, { activityType: type });
}
