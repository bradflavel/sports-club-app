'use client';

import { useCallback, useEffect, useState } from 'react';
import { Users, Plus } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import { PageSkeleton } from '@/components/shared/loading-skeleton';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TeamCard } from '@/features/teams/components/team-card';
import { TeamForm } from '@/features/teams/components/team-form';
import { createClient } from '@/lib/supabase/client';
import { useOrganisation } from '@/hooks/use-organisation';
import { useAuth } from '@/hooks/use-auth-context';
import { useToast } from '@/components/ui/use-toast';
import type { TeamWithDetails, Season, Profile } from '@/features/teams/types/team-types';
import type { TeamInput } from '@/features/teams/schemas/team-schemas';

const NONE_VALUE = '__none__';

export default function TeamsPage() {
  const { organisation, loading: orgLoading } = useOrganisation();
  const { profile } = useAuth();
  const { toast } = useToast();

  const [teams, setTeams] = useState<TeamWithDetails[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [seasonFilter, setSeasonFilter] = useState<string | undefined>();
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  const fetchTeams = useCallback(async () => {
    if (!organisation?.id) return;
    setLoading(true);

    const supabase = createClient();
    let query = supabase
      .from('teams')
      .select(
        '*, coach:profiles!teams_coach_id_fkey(*), manager:profiles!teams_manager_id_fkey(*), season:seasons(*)'
      )
      .eq('organisation_id', organisation.id)
      .order('name');

    if (seasonFilter) {
      query = query.eq('season_id', seasonFilter);
    }

    const { data, error } = await query;
    if (error) {
      toast({ title: 'Error loading teams', description: error.message, variant: 'destructive' });
    } else {
      // Fetch member counts
      const teamsWithCount: TeamWithDetails[] = await Promise.all(
        (data ?? []).map(async (team) => {
          const { count } = await supabase
            .from('team_members')
            .select('*', { count: 'exact', head: true })
            .eq('team_id', team.id);
          return { ...team, member_count: count ?? 0 } as unknown as TeamWithDetails;
        })
      );
      setTeams(teamsWithCount);
    }
    setLoading(false);
  }, [organisation?.id, seasonFilter, toast]);

  const fetchMeta = useCallback(async () => {
    if (!organisation?.id) return;
    const supabase = createClient();

    const [{ data: seasonsData }, { data: profilesData }] = await Promise.all([
      supabase
        .from('seasons')
        .select('*')
        .eq('organisation_id', organisation.id)
        .order('start_date', { ascending: false }),
      supabase
        .from('profiles')
        .select('*')
        .eq('organisation_id', organisation.id)
        .order('first_name'),
    ]);

    setSeasons((seasonsData as Season[]) ?? []);
    setProfiles((profilesData as Profile[]) ?? []);
  }, [organisation?.id]);

  useEffect(() => {
    if (!orgLoading && organisation?.id) {
      fetchMeta();
    }
  }, [orgLoading, organisation?.id, fetchMeta]);

  useEffect(() => {
    if (!orgLoading && organisation?.id) {
      fetchTeams();
    }
  }, [orgLoading, organisation?.id, fetchTeams]);

  async function handleCreate(data: TeamInput) {
    if (!organisation?.id) return;
    setCreating(true);

    const supabase = createClient();
    const { error } = await supabase.from('teams').insert({
      organisation_id: organisation.id,
      name: data.name,
      division: data.division || null,
      age_group: data.ageGroup || null,
      season_id: data.seasonId || null,
      coach_id: data.coachId || null,
      manager_id: data.managerId || null,
      max_players: data.maxPlayers,
    });

    setCreating(false);

    if (error) {
      toast({ title: 'Error creating team', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Team created successfully' });
      setCreateOpen(false);
      fetchTeams();
    }
  }

  if (orgLoading) return <PageSkeleton />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Teams"
        actions={
          <Button size="sm" className="gap-2" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            Create Team
          </Button>
        }
      />

      {/* Season filter */}
      <div className="flex items-center gap-3">
        <Select
          value={seasonFilter ?? NONE_VALUE}
          onValueChange={(val) => setSeasonFilter(val === NONE_VALUE ? undefined : val)}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All seasons" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE_VALUE}>All seasons</SelectItem>
            {seasons.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
                {s.is_current ? ' (Current)' : ''}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-44 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : teams.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No teams found"
          description={
            seasonFilter
              ? 'No teams in the selected season. Try a different filter.'
              : 'Get started by creating your first team.'
          }
          actionLabel={seasonFilter ? undefined : 'Create Team'}
          onAction={seasonFilter ? undefined : () => setCreateOpen(true)}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {teams.map((team) => (
            <TeamCard key={team.id} team={team} />
          ))}
        </div>
      )}

      {/* Create Team Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Team</DialogTitle>
          </DialogHeader>
          <TeamForm
            onSubmit={handleCreate}
            loading={creating}
            seasons={seasons}
            profiles={profiles}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
