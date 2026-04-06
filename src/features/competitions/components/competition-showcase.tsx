'use client';

import { useEffect, useState } from 'react';
import { Trophy, Loader2 } from 'lucide-react';
import { getActivities } from '@/features/activities/services/activity-service';
import { CompetitionShowcaseCard } from './competition-showcase-card';
import { EmptyState } from '@/components/shared/empty-state';
import { useOrganisation } from '@/hooks/use-organisation';
import type { ActivityWithDetails } from '@/lib/supabase/database.types';

export function CompetitionShowcase() {
  const { organisation, loading: orgLoading } = useOrganisation();
  const [competitions, setCompetitions] = useState<ActivityWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (orgLoading || !organisation?.id) return;

    async function load() {
      const { data } = await getActivities(organisation!.id, {
        activityType: 'competition',
      });
      // Filter out drafts for non-admin view
      setCompetitions((data ?? []).filter((c) => !c.is_draft));
      setLoading(false);
    }

    load();
  }, [organisation?.id, orgLoading]);

  if (loading || orgLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (competitions.length === 0) {
    return (
      <div className="p-6">
        <EmptyState
          icon={Trophy}
          title="No competitions yet"
          description="Check back soon — your club hasn't listed any competitions yet."
        />
      </div>
    );
  }

  const primaryColour = organisation?.primary_colour ?? '#6366f1';
  const secondaryColour = organisation?.secondary_colour ?? '#8b5cf6';

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Competitions</h1>
        <p className="text-muted-foreground mt-1">
          Browse upcoming and current competitions
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {competitions.map((comp) => (
          <CompetitionShowcaseCard
            key={comp.id}
            activity={comp}
            primaryColour={primaryColour}
            secondaryColour={secondaryColour}
          />
        ))}
      </div>
    </div>
  );
}
