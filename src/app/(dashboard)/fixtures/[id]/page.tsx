'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, MapPin, Calendar, Edit, XCircle, Trophy } from 'lucide-react';
import { PageSkeleton } from '@/components/shared/loading-skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScoreEntryForm } from '@/features/fixtures/components/score-entry-form';
import { FixtureForm } from '@/features/fixtures/components/fixture-form';
import { AvatarWithName } from '@/components/shared/avatar-with-name';
import { createClient } from '@/lib/supabase/client';
import { useOrganisation } from '@/hooks/use-organisation';
import { useToast } from '@/components/ui/use-toast';
import { formatDateTime, daysUntil } from '@/lib/format';
import type { FixtureWithTeam } from '@/features/fixtures/types/fixture-types';
import type { TeamMemberWithDetails, Season } from '@/features/teams/types/team-types';
import type { Team } from '@/lib/supabase/database.types';
import type { ScoreEntryInput, FixtureInput } from '@/features/fixtures/schemas/fixture-schemas';

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

export default function FixtureDetailPage() {
  const params = useParams();
  const router = useRouter();
  const fixtureId = params.id as string;
  const { organisation, loading: orgLoading } = useOrganisation();
  const { toast } = useToast();

  const [fixture, setFixture] = useState<FixtureWithTeam | null>(null);
  const [roster, setRoster] = useState<TeamMemberWithDetails[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [loading, setLoading] = useState(true);
  const [scoreOpen, setScoreOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchFixture = useCallback(async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('fixtures')
      .select('*, team:teams(*)')
      .eq('id', fixtureId)
      .single();

    if (error || !data) {
      toast({ title: 'Fixture not found', variant: 'destructive' });
      router.push('/fixtures');
      return;
    }
    setFixture(data as unknown as FixtureWithTeam);
  }, [fixtureId, toast, router]);

  const fetchRoster = useCallback(async (teamId: string) => {
    const supabase = createClient();
    const { data } = await supabase
      .from('team_members')
      .select('*, member:members(*, profile:profiles(*))')
      .eq('team_id', teamId)
      .order('jersey_number');
    setRoster((data as unknown as TeamMemberWithDetails[]) ?? []);
  }, []);

  const fetchMeta = useCallback(async () => {
    if (!organisation?.id) return;
    const supabase = createClient();
    const [{ data: teamsData }, { data: seasonsData }] = await Promise.all([
      supabase.from('teams').select('*').eq('organisation_id', organisation.id).order('name'),
      supabase
        .from('seasons')
        .select('*')
        .eq('organisation_id', organisation.id)
        .order('start_date', { ascending: false }),
    ]);
    setTeams((teamsData as Team[]) ?? []);
    setSeasons((seasonsData as Season[]) ?? []);
  }, [organisation?.id]);

  useEffect(() => {
    if (!orgLoading) {
      fetchFixture().finally(() => setLoading(false));
    }
  }, [orgLoading, fetchFixture]);

  useEffect(() => {
    if (fixture?.team_id) {
      fetchRoster(fixture.team_id);
    }
  }, [fixture?.team_id, fetchRoster]);

  useEffect(() => {
    if (!orgLoading && organisation?.id) {
      fetchMeta();
    }
  }, [orgLoading, organisation?.id, fetchMeta]);

  async function handleScoreSubmit(data: ScoreEntryInput) {
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from('fixtures')
      .update({
        home_score: data.homeScore,
        away_score: data.awayScore,
        status: 'completed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', fixtureId);

    setSaving(false);

    if (error) {
      toast({ title: 'Error saving result', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Result saved' });
      setScoreOpen(false);
      fetchFixture();
    }
  }

  async function handleEditSubmit(data: FixtureInput) {
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from('fixtures')
      .update({
        team_id: data.teamId,
        opponent_name: data.opponentName,
        venue: data.venue || null,
        date_time: data.dateTime,
        is_home: data.isHome,
        round_number: data.roundNumber ?? null,
        notes: data.notes || null,
        season_id: data.seasonId || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', fixtureId);

    setSaving(false);

    if (error) {
      toast({ title: 'Error updating fixture', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Fixture updated' });
      setEditOpen(false);
      fetchFixture();
    }
  }

  async function handleCancel() {
    if (!fixture) return;
    const supabase = createClient();
    const { error } = await supabase
      .from('fixtures')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', fixtureId);

    if (error) {
      toast({ title: 'Error cancelling fixture', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Fixture cancelled' });
      fetchFixture();
    }
  }

  if (loading || orgLoading) return <PageSkeleton />;
  if (!fixture) return null;

  const isCompleted = fixture.status === 'completed';
  const isScheduled = fixture.status === 'scheduled';
  const daysAway = isScheduled ? daysUntil(fixture.date_time) : null;

  const homeLabel = fixture.is_home ? fixture.team.name : fixture.opponent_name;
  const awayLabel = fixture.is_home ? fixture.opponent_name : fixture.team.name;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/fixtures')}
          className="gap-1"
        >
          <ArrowLeft className="h-4 w-4" />
          Fixtures
        </Button>
      </div>

      {/* Main detail card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold">
                  {fixture.team.name} vs {fixture.opponent_name}
                </h1>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant={fixture.is_home ? 'default' : 'outline'}>
                  {fixture.is_home ? 'Home' : 'Away'}
                </Badge>
                <Badge variant={STATUS_VARIANTS[fixture.status] ?? 'secondary'}>
                  {STATUS_LABELS[fixture.status] ?? fixture.status}
                </Badge>
                {fixture.round_number !== null && (
                  <Badge variant="outline">Round {fixture.round_number}</Badge>
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
              {fixture.status !== 'cancelled' && fixture.status !== 'completed' && (
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
              <Button size="sm" className="gap-2" onClick={() => setScoreOpen(true)}>
                <Trophy className="h-4 w-4" />
                {isCompleted ? 'Edit Result' : 'Enter Result'}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Score (if completed) */}
          {isCompleted &&
            fixture.home_score !== null &&
            fixture.away_score !== null && (
              <div className="rounded-lg bg-muted p-6 text-center">
                <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Final Score
                </p>
                <div className="flex items-center justify-center gap-4">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">{homeLabel}</p>
                    <p className="text-4xl font-bold">{fixture.home_score}</p>
                  </div>
                  <span className="text-2xl font-light text-muted-foreground">–</span>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">{awayLabel}</p>
                    <p className="text-4xl font-bold">{fixture.away_score}</p>
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

          <Separator />

          {/* Details grid */}
          <div className="grid gap-3 text-sm sm:grid-cols-2">
            <div className="flex items-start gap-2">
              <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Date &amp; Time</p>
                <p className="font-medium">{formatDateTime(fixture.date_time)}</p>
              </div>
            </div>
            {fixture.venue && (
              <div className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Venue</p>
                  <p className="font-medium">{fixture.venue}</p>
                </div>
              </div>
            )}
          </div>

          {fixture.notes && (
            <>
              <Separator />
              <div>
                <p className="mb-1 text-xs font-medium text-muted-foreground">Notes</p>
                <p className="text-sm">{fixture.notes}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Team Sheet */}
      {roster.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Team Sheet</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
              {roster.map((tm) => (
                <div key={tm.id} className="flex items-center gap-3 rounded-md border px-3 py-2">
                  {tm.jersey_number !== null && (
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {tm.jersey_number}
                    </span>
                  )}
                  <AvatarWithName
                    firstName={tm.member.profile.first_name}
                    lastName={tm.member.profile.last_name}
                    avatarUrl={tm.member.profile.avatar_url}
                    subtitle={tm.position ?? undefined}
                    size="sm"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Score Entry Dialog */}
      <Dialog open={scoreOpen} onOpenChange={setScoreOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{isCompleted ? 'Edit Result' : 'Enter Result'}</DialogTitle>
          </DialogHeader>
          <ScoreEntryForm
            fixture={fixture}
            onSubmit={handleScoreSubmit}
            loading={saving}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Fixture Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Fixture</DialogTitle>
          </DialogHeader>
          <FixtureForm
            defaultValues={{
              teamId: fixture.team_id,
              opponentName: fixture.opponent_name,
              venue: fixture.venue ?? '',
              dateTime: fixture.date_time.slice(0, 16),
              isHome: fixture.is_home,
              roundNumber: fixture.round_number ?? undefined,
              notes: fixture.notes ?? '',
              seasonId: fixture.season_id ?? undefined,
            }}
            onSubmit={handleEditSubmit}
            loading={saving}
            teams={teams}
            seasons={seasons}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
