'use client';

import { useCallback, useEffect, useState } from 'react';
import { Calendar, List, Plus, Loader2 } from 'lucide-react';
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FixtureList } from '@/features/fixtures/components/fixture-list';
import { FixtureCalendar } from '@/features/fixtures/components/fixture-calendar';
import { FixtureForm } from '@/features/fixtures/components/fixture-form';
import { FixtureFiltersBar } from '@/features/fixtures/components/fixture-filters';
import { createClient } from '@/lib/supabase/client';
import { useOrganisation } from '@/hooks/use-organisation';
import { useToast } from '@/components/ui/use-toast';
import type { FixtureWithTeam, FixtureFilters } from '@/features/fixtures/types/fixture-types';
import type { Team, Season } from '@/lib/supabase/database.types';
import type { FixtureInput } from '@/features/fixtures/schemas/fixture-schemas';

export default function FixturesPage() {
  const { organisation, loading: orgLoading } = useOrganisation();
  const { toast } = useToast();

  const [fixtures, setFixtures] = useState<FixtureWithTeam[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [filters, setFilters] = useState<FixtureFilters>({});
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  const fetchFixtures = useCallback(async () => {
    if (!organisation?.id) return;
    setLoading(true);

    const supabase = createClient();
    let query = supabase
      .from('fixtures')
      .select('*, team:teams(*)')
      .eq('organisation_id', organisation.id)
      .order('date_time');

    if (filters.teamId) query = query.eq('team_id', filters.teamId);
    if (filters.seasonId) query = query.eq('season_id', filters.seasonId);
    if (filters.status && filters.status.length > 0) query = query.in('status', filters.status as import('@/lib/supabase/database.types').FixtureStatus[]);
    if (filters.search) query = query.ilike('opponent_name', `%${filters.search}%`);

    const { data, error } = await query;
    if (error) {
      toast({ title: 'Error loading fixtures', description: error.message, variant: 'destructive' });
    } else {
      setFixtures((data as unknown as FixtureWithTeam[]) ?? []);
    }
    setLoading(false);
  }, [organisation?.id, filters, toast]);

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
    if (!orgLoading && organisation?.id) {
      fetchMeta();
    }
  }, [orgLoading, organisation?.id, fetchMeta]);

  useEffect(() => {
    if (!orgLoading && organisation?.id) {
      fetchFixtures();
    }
  }, [orgLoading, organisation?.id, fetchFixtures]);

  async function handleCreate(data: FixtureInput) {
    if (!organisation?.id) return;
    setCreating(true);

    const supabase = createClient();
    const { error } = await supabase.from('fixtures').insert({
      organisation_id: organisation.id,
      team_id: data.teamId,
      opponent_name: data.opponentName,
      venue: data.venue || null,
      date_time: data.dateTime,
      is_home: data.isHome,
      round_number: data.roundNumber ?? null,
      notes: data.notes || null,
      season_id: data.seasonId || null,
      status: 'scheduled' as const,
      home_score: null,
      away_score: null,
    });

    setCreating(false);

    if (error) {
      toast({ title: 'Error creating fixture', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Fixture created' });
      setCreateOpen(false);
      fetchFixtures();
    }
  }

  if (orgLoading) return <PageSkeleton />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fixtures"
        actions={
          <Button size="sm" className="gap-2" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            Add Fixture
          </Button>
        }
      />

      {/* Filters bar */}
      <FixtureFiltersBar
        filters={filters}
        onFiltersChange={setFilters}
        teams={teams}
        seasons={seasons}
      />

      {/* View toggle */}
      <div className="flex items-center justify-between">
        <Tabs value={view} onValueChange={(v) => setView(v as 'list' | 'calendar')}>
          <TabsList>
            <TabsTrigger value="list" className="gap-2">
              <List className="h-4 w-4" />
              List
            </TabsTrigger>
            <TabsTrigger value="calendar" className="gap-2">
              <Calendar className="h-4 w-4" />
              Calendar
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : fixtures.length === 0 && view === 'list' ? (
        <EmptyState
          icon={Calendar}
          title="No fixtures found"
          description={
            Object.values(filters).some(Boolean)
              ? 'Try adjusting your filters.'
              : 'Get started by adding your first fixture.'
          }
          actionLabel={Object.values(filters).some(Boolean) ? undefined : 'Add Fixture'}
          onAction={Object.values(filters).some(Boolean) ? undefined : () => setCreateOpen(true)}
        />
      ) : view === 'list' ? (
        <FixtureList fixtures={fixtures} />
      ) : (
        <FixtureCalendar
          fixtures={fixtures}
          month={calendarMonth}
          onMonthChange={setCalendarMonth}
        />
      )}

      {/* Create Fixture Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Fixture</DialogTitle>
          </DialogHeader>
          <FixtureForm
            onSubmit={handleCreate}
            loading={creating}
            teams={teams}
            seasons={seasons}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
