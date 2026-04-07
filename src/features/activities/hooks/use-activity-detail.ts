'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useOrganisation } from '@/hooks/use-organisation';
import { useUser } from '@/hooks/use-user';
import { useToast } from '@/components/ui/use-toast';
import { getActivityById, getActivities } from '@/features/activities/services/activity-service';
import { getTeamsForActivity } from '@/features/activity-teams/services/activity-team-service';
import { getEventsForActivity } from '@/features/activity-events/services/event-service';
import { getStandings } from '@/features/activity-events/services/standings-service';
import { getTrialEvents, getTrialDivision } from '@/features/trials/services/trial-service';
import { getVenues } from '@/features/club-profile/services/club-profile-service';
import { createClient } from '@/lib/supabase/client';
import type {
  Activity,
  ActivityTeamWithDetails,
  ActivityEventWithTeams,
  ActivityStandingWithTeam,
  CompetitionDivision,
  Profile,
  ClubVenue,
  ActivityEvent,
} from '@/lib/supabase/database.types';

export function useActivityDetail(activityId: string) {
  const router = useRouter();
  const { organisation, loading: orgLoading } = useOrganisation();
  const { profile } = useUser();
  const { toast } = useToast();

  const isAdmin = profile?.role === 'admin' || profile?.role === 'manager';

  const [activity, setActivity] = useState<Activity | null>(null);
  const [allActivities, setAllActivities] = useState<Activity[]>([]);
  const [teams, setTeams] = useState<ActivityTeamWithDetails[]>([]);
  const [events, setEvents] = useState<ActivityEventWithTeams[]>([]);
  const [standings, setStandings] = useState<ActivityStandingWithTeam[]>([]);
  const [standingsLoading, setStandingsLoading] = useState(false);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [divisions, setDivisions] = useState<CompetitionDivision[]>([]);
  const [venues, setVenues] = useState<ClubVenue[]>([]);
  const [trialEvents, setTrialEvents] = useState<ActivityEvent[]>([]);
  const [trialDivision, setTrialDivision] = useState<CompetitionDivision | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchActivity = useCallback(async () => {
    const { data, error } = await getActivityById(activityId);
    if (error || !data) {
      toast({ title: 'Activity not found', variant: 'destructive' });
      router.push('/dashboard');
      return null;
    }
    setActivity(data);
    return data;
  }, [activityId, toast, router]);

  const fetchAllActivities = useCallback(async () => {
    if (!organisation?.id) return;
    const { data } = await getActivities(organisation.id);
    setAllActivities(data ?? []);
  }, [organisation?.id]);

  const fetchTeams = useCallback(async () => {
    const { data } = await getTeamsForActivity(activityId);
    setTeams((data ?? []) as unknown as ActivityTeamWithDetails[]);
  }, [activityId]);

  const fetchEvents = useCallback(async () => {
    const { data } = await getEventsForActivity(activityId);
    setEvents((data ?? []) as unknown as ActivityEventWithTeams[]);
  }, [activityId]);

  const fetchStandings = useCallback(async () => {
    setStandingsLoading(true);
    const { data } = await getStandings(activityId);
    setStandings((data ?? []) as ActivityStandingWithTeam[]);
    setStandingsLoading(false);
  }, [activityId]);

  const fetchProfiles = useCallback(async () => {
    if (!organisation?.id) return;
    const supabase = createClient();
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('organisation_id', organisation.id)
      .order('first_name');
    setProfiles((data ?? []) as Profile[]);
  }, [organisation?.id]);

  const fetchDivisions = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from('competition_divisions')
      .select('*')
      .eq('activity_id', activityId)
      .order('display_order');
    setDivisions((data ?? []) as CompetitionDivision[]);
  }, [activityId]);

  const fetchVenues = useCallback(async () => {
    if (!organisation?.id) return;
    const { data } = await getVenues(organisation.id);
    setVenues((data ?? []) as ClubVenue[]);
  }, [organisation?.id]);

  const syncActivityDates = useCallback(async (id: string, evts: ActivityEvent[]) => {
    if (evts.length === 0) return;
    const sorted = [...evts].sort((a, b) => a.date_time.localeCompare(b.date_time));
    const earliest = sorted[0].date_time.split('T')[0];
    const latest = sorted[sorted.length - 1].date_time.split('T')[0];
    const supabase = createClient();
    await supabase
      .from('activities')
      .update({ start_date: earliest, end_date: latest, updated_at: new Date().toISOString() })
      .eq('id', id);
  }, []);

  const fetchTrialData = useCallback(async (act: Activity) => {
    if (act.activity_type !== 'trials' && act.activity_type !== 'training_session') return;

    const eventsResult = await getTrialEvents(act.id);
    const evts = eventsResult.data ?? [];
    setTrialEvents(evts);

    await syncActivityDates(act.id, evts);

    if (act.competition_division_id) {
      const divResult = await getTrialDivision(act.competition_division_id);
      setTrialDivision(divResult.data ?? null);
    } else {
      setTrialDivision(null);
    }
  }, [syncActivityDates]);

  // Initial data load
  useEffect(() => {
    if (!orgLoading) {
      Promise.all([
        fetchActivity(),
        fetchAllActivities(),
        fetchTeams(),
        fetchEvents(),
        fetchStandings(),
        fetchProfiles(),
        fetchDivisions(),
        fetchVenues(),
      ]).finally(() => setLoading(false));
    }
  }, [orgLoading, fetchActivity, fetchAllActivities, fetchTeams, fetchEvents, fetchStandings, fetchProfiles, fetchDivisions, fetchVenues]);

  // Load trial-specific data when activity is available
  useEffect(() => {
    if (activity) {
      fetchTrialData(activity);
    }
  }, [activity, fetchTrialData]);

  return {
    // Data
    activity, setActivity,
    allActivities,
    teams,
    events,
    standings, standingsLoading,
    profiles,
    divisions,
    venues,
    trialEvents, setTrialEvents,
    trialDivision, setTrialDivision,
    loading,
    organisation,
    profile,
    isAdmin,
    toast,
    router,
    // Refetch functions
    fetchActivity,
    fetchAllActivities,
    fetchTeams,
    fetchEvents,
    fetchStandings,
    fetchProfiles,
    fetchDivisions,
    fetchVenues,
    fetchTrialData,
    syncActivityDates,
  };
}
