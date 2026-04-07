'use client';

import { Suspense } from 'react';
import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Pencil, Trash2, Plus, Users, Calendar, Loader2, DollarSign } from 'lucide-react';
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
import { useAuth } from '@/hooks/use-auth-context';
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
import { updateEvent } from '@/features/activity-events/services/event-service';
import { getStandings, recalculateStandings } from '@/features/activity-events/services/standings-service';
import { TrialDateForm } from '@/features/trials/components/trial-date-form';
import { TrialDateCard } from '@/features/trials/components/trial-date-card';
import { TrialFeeConfig } from '@/features/trials/components/trial-fee-config';
import { TrialAttendanceTracker } from '@/features/trials/components/trial-attendance-tracker';
import { TrialPaymentTable } from '@/features/trials/components/trial-payment-table';
import { TrialMemberPicker } from '@/features/trials/components/trial-member-picker';
import {
  getTrialEvents,
  getTrialDivision,
  updateTrialFeeConfig,
  generateTrialInvoices,
} from '@/features/trials/services/trial-service';
import { getVenues } from '@/features/club-profile/services/club-profile-service';
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
import type { ActivityInput } from '@/features/activities/schemas/activity-schemas';
import type { ActivityTeamInput } from '@/features/activity-teams/schemas/activity-team-schemas';
import type { EventInput } from '@/features/activity-events/schemas/event-schemas';
import { createClient } from '@/lib/supabase/client';
import { getActivityPath, getActivityListPath } from '@/lib/utils';

/** Convert a stored date_time string to datetime-local input format */
const toDateTimeLocal = (s: string) =>
  s ? s.replace(/Z$/, '').replace(/[+-]\d{2}:\d{2}$/, '').slice(0, 16) : '';

export function ActivityDetailPageContent({ activityId }: { activityId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const justCreated = searchParams.get('created') === '1';
  const { organisation, loading: orgLoading } = useOrganisation();
  const { toast } = useToast();

  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin' || profile?.role === 'manager';
  const [activity, setActivity] = useState<Activity | null>(null);
  const [allActivities, setAllActivities] = useState<Activity[]>([]);
  const [teams, setTeams] = useState<ActivityTeamWithDetails[]>([]);
  const [events, setEvents] = useState<ActivityEventWithTeams[]>([]);
  const [standings, setStandings] = useState<ActivityStandingWithTeam[]>([]);
  const [standingsLoading, setStandingsLoading] = useState(false);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [divisions, setDivisions] = useState<CompetitionDivision[]>([]);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [createTeamOpen, setCreateTeamOpen] = useState(false);
  const [cloneTeamOpen, setCloneTeamOpen] = useState(false);
  const [createEventOpen, setCreateEventOpen] = useState(false);
  const [scheduleView, setScheduleView] = useState<'list' | 'calendar'>('list');
  const [submitting, setSubmitting] = useState(false);
  const [setupDismissed, setSetupDismissed] = useState(false);

  // Trials-specific state
  const [trialEvents, setTrialEvents] = useState<ActivityEvent[]>([]);
  const [trialDivision, setTrialDivision] = useState<CompetitionDivision | null>(null);
  const [venues, setVenues] = useState<ClubVenue[]>([]);
  const [addTrialDateOpen, setAddTrialDateOpen] = useState(false);
  const [editTrialDateId, setEditTrialDateId] = useState<string | null>(null);
  const [trialsTab, setTrialsTab] = useState('overview');
  const [attendanceEventFilter, setAttendanceEventFilter] = useState<string | null>(null);
  const [feeEditOpen, setFeeEditOpen] = useState(false);

  const fetchActivity = useCallback(async () => {
    const { data, error } = await getActivityById(activityId);
    if (error || !data) {
      toast({ title: 'Activity not found', variant: 'destructive' });
      router.push('/dashboard');
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

  /** Sync activity start_date/end_date from its events */
  const syncActivityDates = useCallback(async (id: string, events: ActivityEvent[]) => {
    if (events.length === 0) return;
    const sorted = [...events].sort((a, b) => a.date_time.localeCompare(b.date_time));
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

    // Sync dates so the list page shows them
    await syncActivityDates(act.id, evts);

    if (act.competition_division_id) {
      const divResult = await getTrialDivision(act.competition_division_id);
      setTrialDivision(divResult.data ?? null);
    } else {
      setTrialDivision(null);
    }
  }, [syncActivityDates]);

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

  // Fetch trials data after activity loads
  useEffect(() => {
    if (activity) {
      fetchTrialData(activity);
    }
  }, [activity, fetchTrialData]);

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
      router.push(getActivityListPath(activity?.activity_type ?? 'competition'));
    }
  }

  if (loading || orgLoading) return <PageSkeleton />;
  if (!activity) return null;

  const typeConfig = ACTIVITY_TYPE_CONFIG[activity.activity_type];
  const isCompetition = activity.activity_type === 'competition';
  const isTournament = activity.activity_type === 'tournament';
  const isTrainingSession = activity.activity_type === 'training_session';
  const isTrainingCamp = activity.activity_type === 'training_camp';
  const isTrials = activity.activity_type === 'trials';

  const childActivities = allActivities.filter((a) => a.parent_activity_id === activityId);
  const showSetupChecklist =
    justCreated &&
    !setupDismissed &&
    (activity.trials_required || activity.training_required || activity.has_finals);

  const editDefaults: Partial<ActivityInput> = {
    name: activity.name,
    activityType: activity.activity_type,
    participationMode: activity.participation_mode,
    startDate: activity.start_date ?? '',
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

  // Back button: for trials, go to parent competition; otherwise go to activity type list
  const parentActivity = activity.parent_activity_id
    ? allActivities.find((a) => a.id === activity.parent_activity_id)
    : null;
  const backHref = isTrials && parentActivity
    ? getActivityPath(parentActivity.activity_type, parentActivity.slug)
    : getActivityListPath(activity.activity_type);
  const backLabel = isTrials && activity.parent_activity_id
    ? allActivities.find((a) => a.id === activity.parent_activity_id)?.name ?? 'Competition'
    : typeConfig?.label ?? 'Activities';

  // Find the event being edited (for trial date edit dialog)
  const editingTrialEvent = editTrialDateId
    ? trialEvents.find((e) => e.id === editTrialDateId) ?? null
    : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(backHref)}
          className="gap-1"
        >
          <ArrowLeft className="h-4 w-4" />
          {backLabel}
        </Button>
        {isAdmin && (
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
        )}
      </div>

      <ActivityDetailHeader activity={activity} />

      {/* Setup Checklist (after competition creation) */}
      {showSetupChecklist && (
        <div className="flex flex-wrap items-center gap-2 rounded-md border border-primary/30 bg-primary/5 px-3 py-2">
          <span className="text-sm font-medium mr-1">Set up:</span>
          {activity.trials_required && childActivities.some((a) => a.activity_type === 'trials') && (
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => router.push(getActivityListPath('trials', activityId))}>
              Trials
            </Button>
          )}
          {activity.training_required && childActivities.some((a) => a.activity_type === 'training_session') && (
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => router.push(getActivityListPath('training_session', activityId))}>
              Training
            </Button>
          )}
          {activity.has_finals && (
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setEditOpen(true)}>
              Finals
            </Button>
          )}
          <Button variant="ghost" size="sm" className="h-7 text-xs ml-auto" onClick={() => setSetupDismissed(true)}>
            Dismiss
          </Button>
        </div>
      )}

      {/* ==================== TRIALS LAYOUT ==================== */}
      {isTrials ? (
        <Tabs value={trialsTab} onValueChange={setTrialsTab}>
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="members">Members</TabsTrigger>
            <TabsTrigger value="trial-dates">Trial Dates</TabsTrigger>
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
          </TabsList>

          {/* Trials Overview */}
          <TabsContent value="overview" className="mt-3">
            <div className="grid gap-3 sm:grid-cols-3">
              {/* Col 1: Competition & Division */}
              <Card>
                <CardContent className="py-3 space-y-3">
                  {activity.parent_activity_id && (
                    <div>
                      <p className="text-muted-foreground text-xs">Competition</p>
                      <Button
                        variant="link"
                        className="h-auto p-0 text-sm"
                        onClick={() => {
                          if (parentActivity) router.push(getActivityPath(parentActivity.activity_type, parentActivity.slug));
                        }}
                      >
                        {allActivities.find((a) => a.id === activity.parent_activity_id)?.name ?? 'Unknown'}
                      </Button>
                    </div>
                  )}
                  {trialDivision && (
                    <div>
                      <p className="text-muted-foreground text-xs">Division</p>
                      <p className="text-sm font-medium">{trialDivision.name}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Col 2: Fee */}
              <Card>
                <CardContent className="py-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-muted-foreground text-xs">Fee</p>
                    {isAdmin && (
                      <Button size="sm" variant="ghost" className="h-6 text-xs px-2" onClick={() => setFeeEditOpen(true)}>
                        Edit
                      </Button>
                    )}
                  </div>
                  <div className="text-sm">
                    <p className="font-medium">
                      {activity.trial_fee_amount_cents && activity.trial_fee_amount_cents > 0
                        ? `$${(activity.trial_fee_amount_cents / 100).toFixed(2)}`
                        : 'Not set'}
                    </p>
                    {activity.trial_fee_type && (
                      <p className="text-xs text-muted-foreground">
                        {activity.trial_fee_type === 'per_trial' ? 'Per session' : 'One-time'}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Col 3: Sessions */}
              <Card>
                <CardHeader className="pb-1 pt-3 px-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">Sessions ({trialEvents.length})</CardTitle>
                    <Button size="sm" variant="ghost" className="h-6 text-xs px-2" onClick={() => setTrialsTab('trial-dates')}>
                      Manage
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-3">
                  {trialEvents.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No sessions yet</p>
                  ) : (
                    <div className="space-y-0.5">
                      {trialEvents.map((event) => {
                        const clean = event.date_time.replace(/Z$/, '').replace(/[+-]\d{2}:\d{2}$/, '');
                        const [datePart, timePart] = clean.split('T');
                        const [y, mo, d] = datePart.split('-').map(Number);
                        const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
                        const dows = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
                        const dow = dows[new Date(y, mo - 1, d, 12).getDay()];
                        let timeStr = '';
                        if (timePart) {
                          const [h, m] = timePart.split(':').map(Number);
                          timeStr = `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
                        }
                        let endStr = '';
                        if (event.end_time) {
                          const et = event.end_time.replace(/Z$/, '').replace(/[+-]\d{2}:\d{2}$/, '').split('T')[1];
                          if (et) {
                            const [eh, em] = et.split(':').map(Number);
                            endStr = ` — ${eh % 12 || 12}:${String(em).padStart(2, '0')} ${eh >= 12 ? 'PM' : 'AM'}`;
                          }
                        }
                        return (
                          <p key={event.id} className="text-sm py-0.5">
                            {dow} {d} {months[mo - 1]}, {timeStr}{endStr}
                          </p>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Fee edit dialog */}
            <Dialog open={feeEditOpen} onOpenChange={setFeeEditOpen}>
              <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                  <DialogTitle>Edit Fee</DialogTitle>
                </DialogHeader>
                <TrialFeeConfig
                  initialFeeType={activity.trial_fee_type}
                  initialFeeAmountCents={activity.trial_fee_amount_cents}
                  loading={submitting}
                  onSave={async (config) => {
                    setSubmitting(true);
                    const { error } = await updateTrialFeeConfig(activityId, config);
                    if (error) {
                      toast({ title: 'Error saving fee', variant: 'destructive' });
                    } else {
                      toast({ title: 'Fee updated' });
                      setFeeEditOpen(false);
                      fetchActivity();
                    }
                    setSubmitting(false);
                  }}
                />
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* Members Tab */}
          <TabsContent value="members" className="mt-3">
            {organisation && (
              <TrialMemberPicker
                activityId={activityId}
                orgId={organisation.id}
                division={trialDivision}
              />
            )}
          </TabsContent>

          {/* Trial Dates */}
          <TabsContent value="trial-dates" className="mt-3 space-y-2">
            {isAdmin && (
              <div className="flex items-center justify-end">
                <Button size="sm" className="h-7 text-xs gap-1" onClick={() => setAddTrialDateOpen(true)}>
                  <Plus className="h-3.5 w-3.5" />
                  Add Trial Date
                </Button>
              </div>
            )}

            {trialEvents.length === 0 ? (
              <EmptyState
                icon={Calendar}
                title="No trial dates yet"
                description={isAdmin ? 'Add trial dates for this division.' : 'No trial dates have been set yet.'}
                actionLabel={isAdmin ? 'Add Trial Date' : undefined}
                onAction={isAdmin ? () => setAddTrialDateOpen(true) : undefined}
              />
            ) : (
              <div className="space-y-1.5">
                {trialEvents.map((event) => (
                  <TrialDateCard
                    key={event.id}
                    event={event}
                    onEdit={isAdmin ? (eventId) => setEditTrialDateId(eventId) : undefined}
                    onDelete={isAdmin ? async (eventId) => {
                      const supabase = createClient();
                      await supabase.from('activity_events').delete().eq('id', eventId);
                      if (activity) fetchTrialData(activity);
                    } : undefined}
                    onViewAttendance={(eventId) => {
                      setAttendanceEventFilter(eventId);
                      setTrialsTab('attendance');
                    }}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Attendance */}
          <TabsContent value="attendance" className="mt-3 space-y-2">
            {trialEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground">Add trial dates first to track attendance.</p>
            ) : (
              <>
                {/* Filter buttons */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <Button
                    size="sm"
                    variant={attendanceEventFilter === null ? 'default' : 'outline'}
                    className="h-7 text-xs"
                    onClick={() => setAttendanceEventFilter(null)}
                  >
                    All Sessions
                  </Button>
                  {trialEvents.map((event, i) => (
                    <Button
                      key={event.id}
                      size="sm"
                      variant={attendanceEventFilter === event.id ? 'default' : 'outline'}
                      className="h-7 text-xs"
                      onClick={() => setAttendanceEventFilter(event.id)}
                    >
                      Session {i + 1}
                    </Button>
                  ))}
                </div>
                {trialEvents
                  .filter((e) => !attendanceEventFilter || e.id === attendanceEventFilter)
                  .map((event, i) => (
                  <div key={event.id} className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">
                      {event.date_time.replace(/Z$/, '').replace(/[+-]\d{2}:\d{2}$/, '').split('T')[0]}
                      {event.venue ? ` — ${event.venue}` : ''}
                    </p>
                    <TrialAttendanceTracker
                      eventId={event.id}
                      activityId={activityId}
                    />
                  </div>
                ))}
              </>
            )}
          </TabsContent>

          {/* Payments */}
          <TabsContent value="payments" className="mt-4 space-y-4">
            {activity.trial_fee_amount_cents && activity.trial_fee_amount_cents > 0 ? (
              <>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Fee: ${((activity.trial_fee_amount_cents ?? 0) / 100).toFixed(2)}{' '}
                    ({activity.trial_fee_type === 'per_trial' ? 'per session' : 'one-time'})
                  </div>
                  {isAdmin && <Button
                    size="sm"
                    variant="outline"
                    className="gap-2"
                    disabled={submitting}
                    onClick={async () => {
                      if (!organisation?.id || !profile?.id) return;
                      setSubmitting(true);
                      // Get members from this trial's own teams
                      const supabase = createClient();
                      const { data: teamData } = await supabase
                        .from('activity_teams')
                        .select('id')
                        .eq('activity_id', activityId);
                      const teamIds = (teamData ?? []).map((t: { id: string }) => t.id);
                      let memberIds: string[] = [];
                      if (teamIds.length > 0) {
                        const { data: tmData } = await supabase
                          .from('activity_team_members')
                          .select('member_id')
                          .in('activity_team_id', teamIds);
                        memberIds = [...new Set((tmData ?? []).map((t: { member_id: string }) => t.member_id))];
                      }
                      if (memberIds.length > 0) {
                        const { error } = await generateTrialInvoices(
                          organisation.id,
                          memberIds,
                          activity.trial_fee_type || 'one_time',
                          activity.trial_fee_amount_cents || 0,
                          profile.id,
                          trialEvents.length
                        );
                        if (error) {
                          toast({ title: 'Error generating invoices', variant: 'destructive' });
                        } else {
                          toast({ title: `${memberIds.length} invoice(s) generated` });
                        }
                      } else {
                        toast({ title: 'No members found to invoice', variant: 'destructive' });
                      }
                      setSubmitting(false);
                    }}
                  >
                    {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                    <DollarSign className="h-4 w-4" />
                    Generate Invoices
                  </Button>}
                </div>
                <TrialPaymentTable activityId={activityId} orgId={organisation?.id ?? ''} />
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Configure a fee amount in the Overview tab to generate invoices.
              </p>
            )}
          </TabsContent>
        </Tabs>
      ) : (
        /* ==================== STANDARD LAYOUT ==================== */
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="teams">Teams</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
            {isCompetition && <TabsTrigger value="standings">Standings</TabsTrigger>}
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-4 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Left: Details */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="grid gap-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Mode</dt>
                      <dd className="font-medium">
                        {activity.participation_mode === 'organiser' ? 'Organising' : 'Participating'}
                      </dd>
                    </div>
                    {isCompetition && activity.total_rounds != null && (
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Total Rounds</dt>
                        <dd className="font-medium">{activity.total_rounds}</dd>
                      </div>
                    )}
                    {isCompetition && activity.has_finals != null && (
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Finals Series</dt>
                        <dd className="font-medium">{activity.has_finals ? 'Yes' : 'No'}</dd>
                      </div>
                    )}
                    {isTournament && activity.pool_count != null && (
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Pools</dt>
                        <dd className="font-medium">{activity.pool_count}</dd>
                      </div>
                    )}
                    {(isTrainingSession || isTrainingCamp) && activity.default_venue && (
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Venue</dt>
                        <dd className="font-medium">{activity.default_venue}</dd>
                      </div>
                    )}
                    {isTrainingSession && activity.default_start_time && (
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Start Time</dt>
                        <dd className="font-medium">{activity.default_start_time}</dd>
                      </div>
                    )}
                    {isTrainingSession && activity.default_duration_minutes != null && (
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Duration</dt>
                        <dd className="font-medium">{activity.default_duration_minutes} min</dd>
                      </div>
                    )}
                    {isTrainingSession && activity.recurrence_rule && (
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Recurrence</dt>
                        <dd className="font-medium">{activity.recurrence_rule}</dd>
                      </div>
                    )}
                    {activity.parent_activity_id && (
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Linked Activity</dt>
                        <dd className="font-medium">
                          {allActivities.find((a) => a.id === activity.parent_activity_id)?.name ?? 'Unknown'}
                        </dd>
                      </div>
                    )}
                  </dl>
                </CardContent>
              </Card>

              {/* Right: Trials & Training links */}
              {childActivities.length > 0 && (
                <div className="flex flex-col gap-3">
                  {childActivities.some((a) => a.activity_type === 'trials') && (
                    <button
                      type="button"
                      onClick={() => router.push(getActivityListPath('trials', activityId))}
                      className="flex items-center justify-between rounded-lg border-2 border-muted p-4 text-left transition-all hover:border-primary/50 hover:shadow-sm"
                    >
                      <div>
                        <p className="font-semibold">Trials</p>
                        <p className="text-sm text-muted-foreground">
                          {childActivities.filter((a) => a.activity_type === 'trials').length} division{childActivities.filter((a) => a.activity_type === 'trials').length !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <Badge variant="secondary" className="text-sm px-3 py-1">
                        View
                      </Badge>
                    </button>
                  )}
                  {childActivities.some((a) => a.activity_type === 'training_session') && (
                    <button
                      type="button"
                      onClick={() => router.push(getActivityListPath('training_session', activityId))}
                      className="flex items-center justify-between rounded-lg border-2 border-muted p-4 text-left transition-all hover:border-primary/50 hover:shadow-sm"
                    >
                      <div>
                        <p className="font-semibold">Training</p>
                        <p className="text-sm text-muted-foreground">
                          {childActivities.filter((a) => a.activity_type === 'training_session').length} division{childActivities.filter((a) => a.activity_type === 'training_session').length !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <Badge variant="secondary" className="text-sm px-3 py-1">
                        View
                      </Badge>
                    </button>
                  )}
                </div>
              )}
            </div>

            {activity.description && (
              <Card>
                <CardHeader className="pb-2">
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
            {isAdmin && (
              <div className="flex items-center justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setCloneTeamOpen(true)}>
                  Clone from Activity
                </Button>
                <Button size="sm" className="gap-2" onClick={() => setCreateTeamOpen(true)}>
                  <Plus className="h-4 w-4" />
                  Add Team
                </Button>
              </div>
            )}
            {teams.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No teams yet"
                description={isAdmin ? 'Add a team to get started.' : 'No teams have been added yet.'}
                actionLabel={isAdmin ? 'Add Team' : undefined}
                onAction={isAdmin ? () => setCreateTeamOpen(true) : undefined}
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
              {isAdmin && (
                <Button size="sm" className="gap-2" onClick={() => setCreateEventOpen(true)}>
                  <Plus className="h-4 w-4" />
                  Add Event
                </Button>
              )}
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
      )}

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
            divisions={divisions}
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

      {/* Add Trial Date Dialog */}
      <Dialog open={addTrialDateOpen} onOpenChange={setAddTrialDateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Trial Date</DialogTitle>
          </DialogHeader>
          <TrialDateForm
            venues={venues}
            loading={submitting}
            onSubmit={async (data) => {
              setSubmitting(true);
              const { error } = await createEvent(
                activityId,
                organisation!.id,
                {
                  date_time: data.dateTime,
                  end_time: data.endTime || null,
                  venue: data.venue || null,
                  title: 'Trial Session',
                }
              );

              if (error) {
                toast({ title: 'Error creating trial date', variant: 'destructive' });
              } else {
                toast({ title: 'Trial date added' });
                setAddTrialDateOpen(false);
                if (activity) fetchTrialData(activity);
              }
              setSubmitting(false);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Trial Date Dialog */}
      <Dialog
        open={editTrialDateId !== null}
        onOpenChange={(open) => { if (!open) setEditTrialDateId(null); }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Trial Date</DialogTitle>
          </DialogHeader>
          {editingTrialEvent && (
            <TrialDateForm
              venues={venues}
              loading={submitting}
              defaultValues={{
                dateTime: toDateTimeLocal(editingTrialEvent.date_time),
                endTime: editingTrialEvent.end_time
                  ? toDateTimeLocal(editingTrialEvent.end_time)
                  : '',
                venue: editingTrialEvent.venue ?? '',
              }}
              onSubmit={async (data) => {
                setSubmitting(true);
                const { error } = await updateEvent(editingTrialEvent.id, {
                  date_time: data.dateTime,
                  end_time: data.endTime || null,
                  venue: data.venue || null,
                });

                if (error) {
                  toast({ title: 'Error updating trial date', variant: 'destructive' });
                } else {
                  toast({ title: 'Trial date updated' });
                  setEditTrialDateId(null);
                  if (activity) fetchTrialData(activity);
                }
                setSubmitting(false);
              }}
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

function ActivityDetailPageInner() {
  const params = useParams();
  return <ActivityDetailPageContent activityId={params.id as string} />;
}

export default function ActivityDetailPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <ActivityDetailPageInner />
    </Suspense>
  );
}
