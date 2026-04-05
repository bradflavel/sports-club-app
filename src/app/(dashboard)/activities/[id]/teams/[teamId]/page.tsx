'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, UserPlus } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { PageSkeleton } from '@/components/shared/loading-skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ActivityRosterTable } from '@/features/activity-teams/components/roster-table';
import { ActivityAddPlayerDialog } from '@/features/activity-teams/components/add-player-dialog';
import {
  getTeamById,
  getTeamMembers,
  updateTeamMember,
  removeTeamMember,
} from '@/features/activity-teams/services/activity-team-service';
import { useOrganisation } from '@/hooks/use-organisation';
import { useToast } from '@/components/ui/use-toast';
import type { ActivityTeamWithDetails, ActivityTeamMemberWithDetails } from '@/features/activity-teams/types/activity-team-types';
import type { SportType } from '@/lib/constants';

interface EditMemberData {
  jerseyNumber?: number;
  position?: string;
  isCaptain: boolean;
}

export default function ActivityTeamDetailPage() {
  const params = useParams();
  const router = useRouter();
  const activityId = params.id as string;
  const teamId = params.teamId as string;
  const { organisation, loading: orgLoading } = useOrganisation();
  const { toast } = useToast();

  const [team, setTeam] = useState<ActivityTeamWithDetails | null>(null);
  const [members, setMembers] = useState<ActivityTeamMemberWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [addPlayerOpen, setAddPlayerOpen] = useState(false);

  const fetchTeam = useCallback(async () => {
    const { data, error } = await getTeamById(teamId);
    if (error || !data) {
      toast({ title: 'Team not found', variant: 'destructive' });
      router.push(`/activities/${activityId}`);
      return;
    }
    setTeam(data);
  }, [teamId, activityId, toast, router]);

  const fetchMembers = useCallback(async () => {
    const { data } = await getTeamMembers(teamId);
    setMembers(data ?? []);
  }, [teamId]);

  useEffect(() => {
    if (!orgLoading) {
      Promise.all([fetchTeam(), fetchMembers()]).finally(() => setLoading(false));
    }
  }, [orgLoading, fetchTeam, fetchMembers]);

  async function handleRemoveMember(teamMemberId: string) {
    const { error } = await removeTeamMember(teamMemberId);
    if (error) {
      toast({
        title: 'Error removing player',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({ title: 'Player removed from team' });
      await fetchMembers();
    }
  }

  async function handleEditMember(teamMemberId: string, data: EditMemberData) {
    const { error } = await updateTeamMember(teamMemberId, {
      jersey_number: data.jerseyNumber ?? null,
      position: data.position || null,
      is_captain: data.isCaptain,
    });
    if (error) {
      toast({
        title: 'Error updating player',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({ title: 'Player updated' });
      fetchMembers();
    }
  }

  function handlePlayerAdded() {
    toast({ title: 'Player added to team' });
    fetchMembers();
  }

  if (loading || orgLoading) return <PageSkeleton />;
  if (!team) return null;

  const coachName = team.coach
    ? `${team.coach.first_name} ${team.coach.last_name}`
    : null;
  const managerName = team.manager
    ? `${team.manager.first_name} ${team.manager.last_name}`
    : null;

  const sportType = (organisation?.sport_type ?? 'other') as SportType;
  const existingMemberIds = members.map((m) => m.member_id);

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

      <PageHeader
        title={team.name}
        badge={
          <div className="flex flex-wrap gap-1.5">
            {team.division && <Badge variant="secondary">{team.division}</Badge>}
            {team.age_group && <Badge variant="outline">{team.age_group}</Badge>}
            {!team.is_own_team && (
              <Badge variant="destructive">External</Badge>
            )}
            {team.pool_number != null && (
              <Badge variant="outline">Pool {team.pool_number}</Badge>
            )}
            {team.seed_number != null && (
              <Badge variant="outline">Seed {team.seed_number}</Badge>
            )}
          </div>
        }
        description={
          [
            coachName ? `Coach: ${coachName}` : null,
            managerName ? `Manager: ${managerName}` : null,
          ]
            .filter(Boolean)
            .join(' \u00B7 ') || undefined
        }
      />

      <Tabs defaultValue="roster">
        <TabsList>
          <TabsTrigger value="roster">
            Roster ({members.length}/{team.max_players})
          </TabsTrigger>
        </TabsList>

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
          <ActivityRosterTable
            members={members}
            onRemove={handleRemoveMember}
            onEdit={handleEditMember}
            sportType={sportType}
          />
        </TabsContent>
      </Tabs>

      {organisation?.id && (
        <ActivityAddPlayerDialog
          open={addPlayerOpen}
          onOpenChange={setAddPlayerOpen}
          teamId={teamId}
          existingMemberIds={existingMemberIds}
          orgId={organisation.id}
          sportType={sportType}
          onPlayerAdded={handlePlayerAdded}
        />
      )}
    </div>
  );
}
