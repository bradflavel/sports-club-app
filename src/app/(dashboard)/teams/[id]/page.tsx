'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, UserPlus, Loader2 } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { PageSkeleton } from '@/components/shared/loading-skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RosterTable } from '@/features/teams/components/roster-table';
import { AddPlayerDialog } from '@/features/teams/components/add-player-dialog';
import { FixtureList } from '@/features/fixtures/components/fixture-list';
import { createClient } from '@/lib/supabase/client';
import { useOrganisation } from '@/hooks/use-organisation';
import { useToast } from '@/components/ui/use-toast';
import type { TeamWithDetails, TeamMemberWithDetails } from '@/features/teams/types/team-types';
import type { FixtureWithTeam } from '@/features/fixtures/types/fixture-types';
import type { MemberWithProfile } from '@/lib/supabase/database.types';
import type { SportType } from '@/lib/constants';

interface EditMemberData {
  jerseyNumber?: number;
  position?: string;
  isCaptain: boolean;
}

interface AddPlayerData {
  memberId: string;
  jerseyNumber?: number;
  position?: string;
  isCaptain: boolean;
}

export default function TeamDetailPage() {
  const params = useParams();
  const router = useRouter();
  const teamId = params.id as string;
  const { organisation, loading: orgLoading } = useOrganisation();
  const { toast } = useToast();

  const [team, setTeam] = useState<TeamWithDetails | null>(null);
  const [members, setMembers] = useState<TeamMemberWithDetails[]>([]);
  const [fixtures, setFixtures] = useState<FixtureWithTeam[]>([]);
  const [availableMembers, setAvailableMembers] = useState<MemberWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [addPlayerOpen, setAddPlayerOpen] = useState(false);

  const fetchTeam = useCallback(async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('teams')
      .select(
        '*, coach:profiles!teams_coach_id_fkey(*), manager:profiles!teams_manager_id_fkey(*), season:seasons(*)'
      )
      .eq('id', teamId)
      .single();

    if (error || !data) {
      toast({ title: 'Team not found', variant: 'destructive' });
      router.push('/teams');
      return;
    }
    setTeam(data as unknown as TeamWithDetails);
  }, [teamId, toast, router]);

  const fetchMembers = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from('team_members')
      .select('*, member:members(*, profile:profiles(*))')
      .eq('team_id', teamId)
      .order('joined_at');
    setMembers((data as unknown as TeamMemberWithDetails[]) ?? []);
  }, [teamId]);

  const fetchFixtures = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from('fixtures')
      .select('*, team:teams(*)')
      .eq('team_id', teamId)
      .order('date_time');
    setFixtures((data as unknown as FixtureWithTeam[]) ?? []);
  }, [teamId]);

  const fetchAvailableMembers = useCallback(async () => {
    if (!organisation?.id) return;
    const supabase = createClient();

    // Get current team member IDs
    const { data: teamMemberRows } = await supabase
      .from('team_members')
      .select('member_id')
      .eq('team_id', teamId);

    const currentIds = (teamMemberRows ?? []).map((r: { member_id: string }) => r.member_id);

    let query = supabase
      .from('members')
      .select('*, profile:profiles(*)')
      .eq('organisation_id', organisation.id)
      .eq('membership_status', 'active');

    if (currentIds.length > 0) {
      query = query.not('id', 'in', `(${currentIds.join(',')})`);
    }

    const { data } = await query.order('profile(first_name)');
    setAvailableMembers((data as unknown as MemberWithProfile[]) ?? []);
  }, [organisation?.id, teamId]);

  useEffect(() => {
    if (!orgLoading) {
      Promise.all([fetchTeam(), fetchMembers(), fetchFixtures()]).finally(() =>
        setLoading(false)
      );
    }
  }, [orgLoading, fetchTeam, fetchMembers, fetchFixtures]);

  useEffect(() => {
    if (!orgLoading && organisation?.id) {
      fetchAvailableMembers();
    }
  }, [orgLoading, organisation?.id, fetchAvailableMembers]);

  async function handleRemoveMember(teamMemberId: string) {
    const supabase = createClient();
    const { error } = await supabase.from('team_members').delete().eq('id', teamMemberId);
    if (error) {
      toast({ title: 'Error removing player', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Player removed from team' });
      await Promise.all([fetchMembers(), fetchAvailableMembers()]);
    }
  }

  async function handleEditMember(teamMemberId: string, data: EditMemberData) {
    const supabase = createClient();
    const { error } = await supabase
      .from('team_members')
      .update({
        jersey_number: data.jerseyNumber ?? null,
        position: data.position || null,
        is_captain: data.isCaptain,
      })
      .eq('id', teamMemberId);
    if (error) {
      toast({ title: 'Error updating player', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Player updated' });
      fetchMembers();
    }
  }

  async function handleAddPlayer(data: AddPlayerData) {
    if (!team) return;

    if (members.length >= team.max_players) {
      throw new Error(`Team has reached its maximum of ${team.max_players} players`);
    }

    const supabase = createClient();
    const { error } = await supabase.from('team_members').insert({
      team_id: teamId,
      member_id: data.memberId,
      jersey_number: data.jerseyNumber ?? null,
      position: data.position ?? null,
      is_captain: data.isCaptain,
    });

    if (error) throw new Error(error.message);

    toast({ title: 'Player added to team' });
    await Promise.all([fetchMembers(), fetchAvailableMembers()]);
  }

  // Stats calculation
  const completedFixtures = fixtures.filter((f) => f.status === 'completed');
  let wins = 0;
  let losses = 0;
  let draws = 0;
  let pointsFor = 0;
  let pointsAgainst = 0;

  for (const f of completedFixtures) {
    const homeScore = f.home_score ?? 0;
    const awayScore = f.away_score ?? 0;
    if (f.is_home) {
      pointsFor += homeScore;
      pointsAgainst += awayScore;
      if (homeScore > awayScore) wins++;
      else if (homeScore < awayScore) losses++;
      else draws++;
    } else {
      pointsFor += awayScore;
      pointsAgainst += homeScore;
      if (awayScore > homeScore) wins++;
      else if (awayScore < homeScore) losses++;
      else draws++;
    }
  }

  const played = completedFixtures.length;
  const winPct = played > 0 ? Math.round((wins / played) * 100) : 0;

  if (loading || orgLoading) return <PageSkeleton />;
  if (!team) return null;

  const coachName = team.coach
    ? `${team.coach.first_name} ${team.coach.last_name}`
    : null;
  const managerName = team.manager
    ? `${team.manager.first_name} ${team.manager.last_name}`
    : null;

  const sportType = (organisation?.sport_type ?? 'other') as SportType;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.push('/teams')} className="gap-1">
          <ArrowLeft className="h-4 w-4" />
          Teams
        </Button>
      </div>

      <PageHeader
        title={team.name}
        badge={
          <div className="flex flex-wrap gap-1.5">
            {team.division && <Badge variant="secondary">{team.division}</Badge>}
            {team.age_group && <Badge variant="outline">{team.age_group}</Badge>}
            {team.season && <Badge variant="outline">{team.season.name}</Badge>}
          </div>
        }
        description={
          [coachName ? `Coach: ${coachName}` : null, managerName ? `Manager: ${managerName}` : null]
            .filter(Boolean)
            .join(' · ') || undefined
        }
      />

      <Tabs defaultValue="roster">
        <TabsList>
          <TabsTrigger value="roster">
            Roster ({members.length}/{team.max_players})
          </TabsTrigger>
          <TabsTrigger value="fixtures">Fixtures ({fixtures.length})</TabsTrigger>
          <TabsTrigger value="stats">Stats</TabsTrigger>
        </TabsList>

        {/* Roster */}
        <TabsContent value="roster" className="mt-4 space-y-4">
          <div className="flex justify-end">
            <Button
              size="sm"
              className="gap-2"
              onClick={() => setAddPlayerOpen(true)}
              disabled={members.length >= team.max_players}
            >
              <UserPlus className="h-4 w-4" />
              Add Player
            </Button>
          </div>
          <RosterTable
            members={members}
            onRemove={handleRemoveMember}
            onEdit={handleEditMember}
          />
        </TabsContent>

        {/* Fixtures */}
        <TabsContent value="fixtures" className="mt-4">
          <FixtureList fixtures={fixtures} />
        </TabsContent>

        {/* Stats */}
        <TabsContent value="stats" className="mt-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Played</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{played}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">W / L / D</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">
                  <span className="text-green-600">{wins}</span>
                  {' / '}
                  <span className="text-red-600">{losses}</span>
                  {' / '}
                  <span className="text-muted-foreground">{draws}</span>
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Points For / Against
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">
                  {pointsFor}
                  <span className="text-base font-normal text-muted-foreground"> / </span>
                  {pointsAgainst}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Win %</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{winPct}%</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <AddPlayerDialog
        open={addPlayerOpen}
        onOpenChange={setAddPlayerOpen}
        onAdd={handleAddPlayer}
        availableMembers={availableMembers}
        sportType={sportType}
      />
    </div>
  );
}
