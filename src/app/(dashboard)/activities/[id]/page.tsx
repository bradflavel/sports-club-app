'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Pencil, Trash2, Plus, Users, Calendar } from 'lucide-react';
import { PageSkeleton } from '@/components/shared/loading-skeleton';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { ActivityDetailHeader } from '@/features/activities/components/activity-detail-header';
import { ActivityForm } from '@/features/activities/components/activity-form';
import {
  getActivityById,
  updateActivity,
  deleteActivity,
  getActivities,
} from '@/features/activities/services/activity-service';
import { ACTIVITY_TYPE_CONFIG } from '@/lib/constants';
import { useOrganisation } from '@/hooks/use-organisation';
import { useUser } from '@/hooks/use-user';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/shared/empty-state';
import { ActivityTeamCard } from '@/features/activity-teams/components/team-card';
import { ActivityTeamForm } from '@/features/activity-teams/components/team-form';
import { CloneTeamDialog } from '@/features/activity-teams/components/clone-team-dialog';
import { getTeamsForActivity, createTeam } from '@/features/activity-teams/services/activity-team-service';
import { EventList } from '@/features/activity-events/components/event-list';
import { EventCalendar } from '@/features/activity-events/components/event-calendar';
import { EventForm } from '@/features/activity-events/components/event-form';
import { StandingsTable } from '@/features/activity-events/components/standings-table';
import { getEventsForActivity, createEvent } from '@/features/activity-events/services/event-service';
import { getStandings, recalculateStandings } from '@/features/activity-events/services/standings-service';
import type { Activity, ActivityTeamWithDetails, ActivityEventWithTeams, ActivityStandingWithTeam, Profile } from '@/lib/supabase/database.types';
import type { ActivityInput } from '@/features/activities/schemas/activity-schemas';
import type { ActivityTeamInput } from '@/features/activity-teams/schemas/activity-team-schemas';
import type { EventInput } from '@/features/activity-events/schemas/event-schemas';
import { createClient } from '@/lib/supabase/client';

export default function ActivityDetailPage() {
  const params = useParams();
  const router = useRouter();
  const activityId = params.id as string;
  const { organisation, loading: orgLoading } = useOrganisation();
  const { toast } = useToast();

  const { profile } = useUser();
  const [activity, setActivity] = useState<Activity | null>(null);
  const [allActivities, setAllActivities] = useState<Activity[]>([]);
  const [teams, setTeams] = useState<ActivityTeamWithDetails[]>([]);
  const [events, setEvents] = useState<ActivityEventWithTeams[]>([]);
  const [standings, setStandings] = useState<ActivityStandingWithTeam[]>([]);
  const [standingsLoading, setStandingsLoading] = useState(false);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [createTeamOpen, setCreateTeamOpen] = useState(false);
  const [cloneTeamOpen, setCloneTeamOpen] = useState(false);
  const [createEventOpen, setCreateEventOpen] = useState(false);
  const [scheduleView, setScheduleView] = useState<'list' | 'calendar'>('list');
  const [submitting, setSubmitting] = useState(false);

  const fetchActivity = useCallback(async () => {
    const { data, error } = await getActivityById(activityId);
    if (error || !data) {
      toast({ title: 'Activity not found', variant: 'destructive' });
      router.push('/activities');
      return;
    }
    setActivity(data);
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
    const { data } = await getStandings(activityId);
    setStandings((data ?? []) as ActivityStandingWithTeam[]);
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

  useEffect(() => {
    if (!orgLoading) {
      Promise.all([fetchActivity(), fetchAllActivities(), fetchTeams(), fetchEvents(), fetchStandings(), fetchProfiles()]).finally(() =>
        setLoading(false)
      );
    }
  }, [orgLoading, fetchActivity, fetchAllActivities, fetchTeams, fetchEvents, fetchStandings, fetchProfiles]);

  async function handleUpdate(formData: ActivityInput) {
    setSubmitting(true);
    const { error } = await updateActivity(activityId, {
      activity_type: formData.activityType,
      participation_mode: formData.participationMode,
      name: formData.name,
      description: formData.description || null,
      start_date: formData.startDate,
      end_date: formData.endDate || null,
      total_rounds: formData.totalRounds ?? null,
      has_finals: formData.hasFinals ?? null,
      pool_count: formData.poolCount ?? null,
      recurrence_rule: formData.recurrenceRule || null,
      default_venue: formData.defaultVenue || null,
      default_start_time: formData.defaultStartTime || null,
      default_duration_minutes: formData.defaultDurationMinutes ?? null,
      parent_activity_id: formData.parentActivityId || null,
    });

    if (error) {
      toast({ title: 'Error updating activity', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Activity updated successfully' });
      setEditOpen(false);
      fetchActivity();
    }
    setSubmitting(false);
  }

  async function handleDelete() {
    setSubmitting(true);
    const { error } = await deleteActivity(activityId);
    if (error) {
      toast({ title: 'Error deleting activity', description: error.message, variant: 'destructive' });
      setSubmitting(false);
    } else {
      toast({ title: 'Activity deleted' });
      const backType = activity?.activity_type ?? '';
      router.push(`/activities?type=${backType}`);
    }
  }

  if (loading || orgLoading) return <PageSkeleton />;
  if (!activity) return null;

  const typeConfig = ACTIVITY_TYPE_CONFIG[activity.activity_type];
  const isCompetition = activity.activity_type === 'competition';
  const isTournament = activity.activity_type === 'tournament';
  const isTrainingSession = activity.activity_type === 'training_session';
  const isTrainingCamp = activity.activity_type === 'training_camp';

  const editDefaults: Partial<ActivityInput> = {
    name: activity.name,
    activityType: activity.activity_type,
    participationMode: activity.participation_mode,
    startDate: activity.start_date,
    endDate: activity.end_date ?? '',
    description: activity.description ?? '',
    totalRounds: activity.total_rounds ?? undefined,
    hasFinals: activity.has_finals ?? false,
    poolCount: activity.pool_count ?? undefined,
    recurrenceRule: activity.recurrence_rule ?? '',
    defaultVenue: activity.default_venue ?? '',
    defaultStartTime: activity.default_start_time ?? '',
    defaultDurationMinutes: activity.default_duration_minutes ?? undefined,
    parentActivityId: activity.parent_activity_id ?? '',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/activities?type=${activity.activity_type}`)}
          className="gap-1"
        >
          <ArrowLeft className="h-4 w-4" />
          {typeConfig.label}
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={() => setEditOpen(true)}>
            <Pencil className="h-4 w-4" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 text-destructive hover:bg-destructive hover:text-destructive-foreground"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <ActivityDetailHeader activity={activity} />

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="teams">Teams</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          {isCompetition && <TabsTrigger value="standings">Standings</TabsTrigger>}
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Details</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="font-medium text-muted-foreground">Type</dt>
                  <dd>{typeConfig.singularLabel}</dd>
                </div>
                <div>
                  <dt className="font-medium text-muted-foreground">Mode</dt>
                  <dd>
                    {activity.participation_mode === 'organiser'
                      ? 'Organising'
                      : 'Participating'}
                  </dd>
                </div>

                {isCompetition && activity.total_rounds != null && (
                  <div>
                    <dt className="font-medium text-muted-foreground">Total Rounds</dt>
                    <dd>{activity.total_rounds}</dd>
                  </div>
                )}
                {isCompetition && activity.has_finals != null && (
                  <div>
                    <dt className="font-medium text-muted-foreground">Finals Series</dt>
                    <dd>{activity.has_finals ? 'Yes' : 'No'}</dd>
                  </div>
                )}

                {isTournament && activity.pool_count != null && (
                  <div>
                    <dt className="font-medium text-muted-foreground">Pools</dt>
                    <dd>{activity.pool_count}</dd>
                  </div>
                )}

                {(isTrainingSession || isTrainingCamp) && activity.default_venue && (
                  <div>
                    <dt className="font-medium text-muted-foreground">Venue</dt>
                    <dd>{activity.default_venue}</dd>
                  </div>
                )}

                {isTrainingSession && activity.default_start_time && (
                  <div>
                    <dt className="font-medium text-muted-foreground">Start Time</dt>
                    <dd>{activity.default_start_time}</dd>
                  </div>
                )}
                {isTrainingSession && activity.default_duration_minutes != null && (
                  <div>
                    <dt className="font-medium text-muted-foreground">Duration</dt>
                    <dd>{activity.default_duration_minutes} minutes</dd>
                  </div>
                )}
                {isTrainingSession && activity.recurrence_rule && (
                  <div>
                    <dt className="font-medium text-muted-foreground">Recurrence</dt>
                    <dd>{activity.recurrence_rule}</dd>
                  </div>
                )}

                {activity.parent_activity_id && (
                  <div className="sm:col-span-2">
                    <dt className="font-medium text-muted-foreground">
                      Linked Activity
                    </dt>
                    <dd>
                      {allActivities.find((a) => a.id === activity.parent_activity_id)
                        ?.name ?? 'Unknown'}
                    </dd>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>

          {activity.description && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {activity.description}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Teams Tab */}
        <TabsContent value="teams" className="mt-4 space-y-4">
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setCloneTeamOpen(true)}>
              Clone from Activity
            </Button>
            <Button size="sm" className="gap-2" onClick={() => setCreateTeamOpen(true)}>
              <Plus className="h-4 w-4" />
              Add Team
            </Button>
          </div>
          {teams.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No teams yet"
              description="Add a team to get started."
              actionLabel="Add Team"
              onAction={() => setCreateTeamOpen(true)}
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {teams.map((team) => (
                <ActivityTeamCard key={team.id} team={team} activityId={activityId} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Schedule Tab */}
        <TabsContent value="schedule" className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Button
                variant={scheduleView === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setScheduleView('list')}
              >
                List
              </Button>
              <Button
                variant={scheduleView === 'calendar' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setScheduleView('calendar')}
              >
                Calendar
              </Button>
            </div>
            <Button size="sm" className="gap-2" onClick={() => setCreateEventOpen(true)}>
              <Plus className="h-4 w-4" />
              Add Event
            </Button>
          </div>
          {scheduleView === 'list' ? (
            <EventList
              events={events}
              sportType={organisation?.sport_type}
              emptyMessage="No events scheduled yet."
            />
          ) : (
            <EventCalendar events={events} sportType={organisation?.sport_type} />
          )}
        </TabsContent>

        {/* Standings Tab (competition only) */}
        {isCompetition && (
          <TabsContent value="standings" className="mt-4">
            <StandingsTable
              standings={standings}
              loading={standingsLoading}
              onRecalculate={async () => {
                setStandingsLoading(true);
                await recalculateStandings(activityId);
                await fetchStandings();
                setStandingsLoading(false);
              }}
            />
          </TabsContent>
        )}
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Activity</DialogTitle>
          </DialogHeader>
          <ActivityForm
            defaultValues={editDefaults}
            onSubmit={handleUpdate}
            loading={submitting}
            activities={allActivities.filter((a) => a.id !== activityId)}
          />
        </DialogContent>
      </Dialog>

      {/* Create Team Dialog */}
      <Dialog open={createTeamOpen} onOpenChange={setCreateTeamOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Team</DialogTitle>
          </DialogHeader>
          <ActivityTeamForm
            onSubmit={async (data: ActivityTeamInput) => {
              setSubmitting(true);
              const { error } = await createTeam(activityId, organisation!.id, {
                name: data.name,
                division: data.division || null,
                age_group: data.ageGroup || null,
                coach_id: data.coachId || null,
                manager_id: data.managerId || null,
                max_players: data.maxPlayers,
                is_own_team: data.isOwnTeam,
                pool_number: data.poolNumber ?? null,
                seed_number: data.seedNumber ?? null,
              });
              if (error) {
                toast({ title: 'Error', description: error.message, variant: 'destructive' });
              } else {
                toast({ title: 'Team added' });
                setCreateTeamOpen(false);
                fetchTeams();
              }
              setSubmitting(false);
            }}
            loading={submitting}
            profiles={profiles}
            showOwnTeamToggle={activity?.participation_mode === 'organiser'}
          />
        </DialogContent>
      </Dialog>

      {/* Clone Team Dialog */}
      {organisation && (
        <CloneTeamDialog
          open={cloneTeamOpen}
          onOpenChange={setCloneTeamOpen}
          targetActivityId={activityId}
          orgId={organisation.id}
          onTeamCloned={() => fetchTeams()}
        />
      )}

      {/* Create Event Dialog */}
      <Dialog open={createEventOpen} onOpenChange={setCreateEventOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Event</DialogTitle>
          </DialogHeader>
          {activity && (
            <EventForm
              activityType={activity.activity_type}
              participationMode={activity.participation_mode}
              teams={teams}
              onSubmit={async (data: EventInput) => {
                setSubmitting(true);
                const { error } = await createEvent(activityId, organisation!.id, {
                  home_team_id: data.homeTeamId || null,
                  away_team_id: data.awayTeamId || null,
                  opponent_name: data.opponentName || null,
                  is_home: data.isHome ?? null,
                  title: data.title || null,
                  venue: data.venue || null,
                  date_time: data.dateTime,
                  end_time: data.endTime || null,
                  round_number: data.roundNumber ?? null,
                  tournament_stage: (data.tournamentStage as import('@/lib/supabase/database.types').TournamentStage) || null,
                  pool_number: data.poolNumber ?? null,
                  notes: data.notes || null,
                  day_number: data.dayNumber ?? null,
                  session_number: data.sessionNumber ?? null,
                });
                if (error) {
                  toast({ title: 'Error', description: error.message, variant: 'destructive' });
                } else {
                  toast({ title: 'Event created' });
                  setCreateEventOpen(false);
                  fetchEvents();
                }
                setSubmitting(false);
              }}
              loading={submitting}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Activity"
        description={`Are you sure you want to delete "${activity.name}"? This action cannot be undone and will remove all associated teams, events, and standings.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDelete}
        loading={submitting}
      />
    </div>
  );
}
