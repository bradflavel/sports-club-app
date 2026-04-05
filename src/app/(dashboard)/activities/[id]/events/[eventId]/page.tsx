'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, MapPin, Calendar, Edit, XCircle, Trophy, Trash2, Clock } from 'lucide-react';
import { PageSkeleton } from '@/components/shared/loading-skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScoreEntryForm } from '@/features/activity-events/components/score-entry-form';
import { EventForm } from '@/features/activity-events/components/event-form';
import { AttendanceTracker } from '@/features/activity-events/components/attendance-tracker';
import { createClient } from '@/lib/supabase/client';
import { useOrganisation } from '@/hooks/use-organisation';
import { useToast } from '@/components/ui/use-toast';
import { formatDateTime, daysUntil } from '@/lib/format';
import { SPORT_CONFIGS, type SportType } from '@/lib/constants';
import type { ActivityEventWithTeams, ActivityTeam, Activity } from '@/lib/supabase/database.types';
import type { EventInput } from '@/features/activity-events/schemas/event-schemas';
import type { TournamentStage } from '@/lib/supabase/database.types';

const STATUS_LABELS: Record<string, string> = {
  scheduled: 'Scheduled',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
  postponed: 'Postponed',
  bye: 'Bye',
};

const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  scheduled: 'secondary',
  in_progress: 'default',
  completed: 'outline',
  cancelled: 'destructive',
  postponed: 'destructive',
  bye: 'outline',
};

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const activityId = params.id as string;
  const eventId = params.eventId as string;
  const { organisation, loading: orgLoading } = useOrganisation();
  const { toast } = useToast();

  const [event, setEvent] = useState<ActivityEventWithTeams | null>(null);
  const [activity, setActivity] = useState<Activity | null>(null);
  const [teams, setTeams] = useState<ActivityTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [scoreOpen, setScoreOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const sportType = organisation?.sport_type as SportType | undefined;
  const matchLabel = sportType ? (SPORT_CONFIGS[sportType]?.matchLabel ?? 'Match') : 'Match';

  const fetchEvent = useCallback(async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('activity_events')
      .select('*, home_team:activity_teams!home_team_id(*), away_team:activity_teams!away_team_id(*), activity:activities(*)')
      .eq('id', eventId)
      .single();

    if (error || !data) {
      toast({ title: 'Event not found', variant: 'destructive' });
      router.push(`/activities/${activityId}`);
      return;
    }
    setEvent(data as unknown as ActivityEventWithTeams);
    setActivity((data as unknown as ActivityEventWithTeams).activity ?? null);
  }, [eventId, activityId, toast, router]);

  const fetchTeams = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from('activity_teams')
      .select('*')
      .eq('activity_id', activityId)
      .order('name');
    setTeams((data as unknown as ActivityTeam[]) ?? []);
  }, [activityId]);

  useEffect(() => {
    if (!orgLoading) {
      Promise.all([fetchEvent(), fetchTeams()]).finally(() => setLoading(false));
    }
  }, [orgLoading, fetchEvent, fetchTeams]);

  async function handleScoreSubmit(homeScore: number, awayScore: number) {
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from('activity_events')
      .update({
        home_score: homeScore,
        away_score: awayScore,
        status: 'completed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', eventId);

    setSaving(false);

    if (error) {
      toast({ title: 'Error saving result', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Result saved' });
      setScoreOpen(false);
      fetchEvent();
    }
  }

  async function handleEditSubmit(data: EventInput) {
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from('activity_events')
      .update({
        home_team_id: data.homeTeamId || null,
        away_team_id: data.awayTeamId || null,
        opponent_name: data.opponentName || null,
        is_home: data.isHome ?? null,
        title: data.title || null,
        venue: data.venue || null,
        date_time: data.dateTime,
        end_time: data.endTime || null,
        round_number: data.roundNumber ?? null,
        tournament_stage: (data.tournamentStage as TournamentStage) ?? null,
        pool_number: data.poolNumber ?? null,
        notes: data.notes || null,
        day_number: data.dayNumber ?? null,
        session_number: data.sessionNumber ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', eventId);

    setSaving(false);

    if (error) {
      toast({ title: 'Error updating event', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Event updated' });
      setEditOpen(false);
      fetchEvent();
    }
  }

  async function handleCancel() {
    if (!event) return;
    const supabase = createClient();
    const { error } = await supabase
      .from('activity_events')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', eventId);

    if (error) {
      toast({ title: 'Error cancelling event', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Event cancelled' });
      fetchEvent();
    }
  }

  async function handleDelete() {
    const supabase = createClient();
    const { error } = await supabase
      .from('activity_events')
      .delete()
      .eq('id', eventId);

    if (error) {
      toast({ title: 'Error deleting event', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Event deleted' });
      router.push(`/activities/${activityId}`);
    }
  }

  if (loading || orgLoading) return <PageSkeleton />;
  if (!event) return null;

  const isMatch = !!(event.home_team || event.away_team || event.opponent_name);
  const isTraining = !isMatch;
  const isCompleted = event.status === 'completed';
  const isScheduled = event.status === 'scheduled';
  const daysAway = isScheduled ? daysUntil(event.date_time) : null;

  const homeLabel = event.home_team?.name ?? 'Home';
  const awayLabel = event.away_team?.name ?? event.opponent_name ?? 'Away';

  const activityType = activity?.activity_type ?? 'competition';
  const participationMode = activity?.participation_mode ?? 'participant';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/activities/${activityId}`)}
          className="gap-1"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Activity
        </Button>
      </div>

      {/* Main detail card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold">
                  {isMatch ? `${homeLabel} vs ${awayLabel}` : (event.title ?? 'Session')}
                </h1>
              </div>
              <div className="flex flex-wrap gap-2">
                {isMatch && event.is_home !== null && (
                  <Badge variant={event.is_home ? 'default' : 'outline'}>
                    {event.is_home ? 'Home' : 'Away'}
                  </Badge>
                )}
                <Badge variant={STATUS_VARIANTS[event.status] ?? 'secondary'}>
                  {STATUS_LABELS[event.status] ?? event.status}
                </Badge>
                {event.round_number !== null && (
                  <Badge variant="outline">Round {event.round_number}</Badge>
                )}
                {event.tournament_stage && (
                  <Badge variant="outline" className="capitalize">
                    {event.tournament_stage.replace(/_/g, ' ')}
                  </Badge>
                )}
                {isMatch && (
                  <Badge variant="outline">{matchLabel}</Badge>
                )}
              </div>
            </div>

            <div className="flex shrink-0 flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => setEditOpen(true)}
              >
                <Edit className="h-4 w-4" />
                Edit
              </Button>
              {event.status !== 'cancelled' && event.status !== 'completed' && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 text-destructive hover:text-destructive"
                  onClick={handleCancel}
                >
                  <XCircle className="h-4 w-4" />
                  Cancel
                </Button>
              )}
              {isMatch && (
                <Button size="sm" className="gap-2" onClick={() => setScoreOpen(true)}>
                  <Trophy className="h-4 w-4" />
                  {isCompleted ? 'Edit Result' : 'Enter Result'}
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                className="gap-2 text-destructive hover:text-destructive"
                onClick={handleDelete}
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Score (if match + completed) */}
          {isMatch &&
            isCompleted &&
            event.home_score !== null &&
            event.away_score !== null && (
              <div className="rounded-lg bg-muted p-6 text-center">
                <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Final Score
                </p>
                <div className="flex items-center justify-center gap-4">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">{homeLabel}</p>
                    <p className="text-4xl font-bold">{event.home_score}</p>
                  </div>
                  <span className="text-2xl font-light text-muted-foreground">-</span>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">{awayLabel}</p>
                    <p className="text-4xl font-bold">{event.away_score}</p>
                  </div>
                </div>
              </div>
            )}

          {/* Countdown (if scheduled) */}
          {isScheduled && daysAway !== null && (
            <div className="rounded-lg bg-primary/5 px-4 py-3 text-center text-sm font-medium">
              {daysAway === 0
                ? 'Today!'
                : daysAway === 1
                  ? 'Tomorrow'
                  : daysAway > 0
                    ? `In ${daysAway} days`
                    : `${Math.abs(daysAway)} days ago`}
            </div>
          )}

          {/* Attendance tracker */}
          {isTraining && organisation && (
            <AttendanceTracker
              eventId={eventId}
              activityTeamIds={teams.map((t) => t.id)}
              orgId={organisation.id}
            />
          )}
          {isMatch && organisation && (
            <AttendanceTracker
              eventId={eventId}
              activityTeamIds={[
                ...(event.home_team_id ? [event.home_team_id] : []),
                ...(event.away_team_id ? [event.away_team_id] : []),
              ]}
              orgId={organisation.id}
            />
          )}

          <Separator />

          {/* Details grid */}
          <div className="grid gap-3 text-sm sm:grid-cols-2">
            <div className="flex items-start gap-2">
              <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Date &amp; Time</p>
                <p className="font-medium">{formatDateTime(event.date_time)}</p>
              </div>
            </div>
            {event.end_time && (
              <div className="flex items-start gap-2">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">End Time</p>
                  <p className="font-medium">{formatDateTime(event.end_time)}</p>
                </div>
              </div>
            )}
            {event.venue && (
              <div className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Venue</p>
                  <p className="font-medium">{event.venue}</p>
                </div>
              </div>
            )}
            {event.day_number !== null && (
              <div>
                <p className="text-xs text-muted-foreground">Day</p>
                <p className="font-medium">Day {event.day_number}</p>
              </div>
            )}
            {event.session_number !== null && (
              <div>
                <p className="text-xs text-muted-foreground">Session</p>
                <p className="font-medium">Session {event.session_number}</p>
              </div>
            )}
            {event.pool_number !== null && (
              <div>
                <p className="text-xs text-muted-foreground">Pool</p>
                <p className="font-medium">Pool {event.pool_number}</p>
              </div>
            )}
          </div>

          {event.notes && (
            <>
              <Separator />
              <div>
                <p className="mb-1 text-xs font-medium text-muted-foreground">Notes</p>
                <p className="text-sm">{event.notes}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Score Entry Dialog */}
      {isMatch && (
        <Dialog open={scoreOpen} onOpenChange={setScoreOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{isCompleted ? 'Edit Result' : 'Enter Result'}</DialogTitle>
            </DialogHeader>
            <ScoreEntryForm
              event={event}
              onSubmit={handleScoreSubmit}
              loading={saving}
              sportType={sportType}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Event Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Event</DialogTitle>
          </DialogHeader>
          <EventForm
            activityType={activityType}
            participationMode={participationMode}
            teams={teams}
            defaultValues={{
              homeTeamId: event.home_team_id ?? undefined,
              awayTeamId: event.away_team_id ?? undefined,
              opponentName: event.opponent_name ?? '',
              isHome: event.is_home ?? true,
              title: event.title ?? '',
              venue: event.venue ?? '',
              dateTime: event.date_time.slice(0, 16),
              endTime: event.end_time?.slice(0, 16) ?? '',
              roundNumber: event.round_number ?? undefined,
              tournamentStage: event.tournament_stage ?? undefined,
              poolNumber: event.pool_number ?? undefined,
              notes: event.notes ?? '',
              dayNumber: event.day_number ?? undefined,
              sessionNumber: event.session_number ?? undefined,
            }}
            onSubmit={handleEditSubmit}
            loading={saving}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
