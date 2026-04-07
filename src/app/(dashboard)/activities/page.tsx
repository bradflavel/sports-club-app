'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { PageSkeleton } from '@/components/shared/loading-skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ActivityList } from '@/features/activities/components/activity-list';
import { CreateActivityWizard, type WizardOutput } from '@/features/activities/components/create-activity-wizard';
import { getActivities, createActivity } from '@/features/activities/services/activity-service';
import { ACTIVITY_TYPE_CONFIG } from '@/lib/constants';
import { createClient } from '@/lib/supabase/client';
import { useOrganisation } from '@/hooks/use-organisation';
import { useAuth } from '@/hooks/use-auth-context';
import { useToast } from '@/components/ui/use-toast';
import { generateSlug, getActivityPath } from '@/lib/utils';
import type { Activity, ActivityType } from '@/lib/supabase/database.types';

export interface ActivitiesPageProps {
  typeOverride?: ActivityType;
}

export default function ActivitiesPage({ typeOverride }: ActivitiesPageProps = {}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const typeParam = typeOverride ?? (searchParams.get('type') as ActivityType | null);
  const parentParam = searchParams.get('parent');
  const { organisation, loading: orgLoading } = useOrganisation();
  const { profile } = useAuth();
  const { toast } = useToast();
  const isAdmin = profile?.role === 'admin' || profile?.role === 'manager';

  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const typeConfig = typeParam ? ACTIVITY_TYPE_CONFIG[typeParam] : null;
  const pageTitle = typeConfig?.label ?? 'Activities';
  const singularLabel = typeConfig?.singularLabel ?? 'Activity';

  const fetchActivities = useCallback(async () => {
    if (!organisation?.id) return;
    setLoading(true);

    const { data, error } = await getActivities(organisation.id, {
      activityType: typeParam ?? undefined,
    });

    if (error) {
      toast({ title: 'Error loading activities', description: error.message, variant: 'destructive' });
    } else {
      let filtered = data ?? [];
      // Filter by parent activity if specified
      if (parentParam) {
        filtered = filtered.filter((a) => a.parent_activity_id === parentParam);
      }
      setActivities(filtered);
    }
    setLoading(false);
  }, [organisation?.id, typeParam, parentParam, toast]);

  useEffect(() => {
    if (!orgLoading && organisation?.id) {
      fetchActivities();
    }
  }, [orgLoading, organisation?.id, fetchActivities]);

  async function handleCreate(data: WizardOutput) {
    if (!organisation?.id) return;
    setSubmitting(true);

    const supabase = createClient();
    const activitySlug = generateSlug(data.name);

    const { data: newActivity, error } = await supabase
      .from('activities')
      .insert({
        organisation_id: organisation.id,
        slug: activitySlug,
        activity_type: data.activityType,
        participation_mode: data.participationMode,
        name: data.name,
        description: data.description || null,
        start_date: data.startDate || data.firstRoundDate || null,
        end_date: data.endDate || null,
        is_current: data.isDraft ? false : true,
        total_rounds: data.totalRounds ?? null,
        has_finals: data.hasFinals ?? null,
        pool_count: data.poolCount ?? null,
        recurrence_rule: data.recurrenceRule || null,
        default_venue: data.defaultVenue || null,
        default_start_time: data.defaultStartTime || null,
        default_duration_minutes: data.defaultDurationMinutes ?? null,
        parent_activity_id: data.parentActivityId || null,
        // Competition-specific fields
        host_name: data.hostName || null,
        host_type: data.hostType || null,
        registration_opens: data.registrationOpens || null,
        registration_closes: data.registrationCloses || null,
        first_round_date: data.firstRoundDate || null,
        finals_start_date: data.finalsStartDate || null,
        schedule_frequency: data.scheduleFrequency || null,
        has_byes: data.hasByes ?? false,
        trials_required: data.trialsRequired ?? false,
        training_required: data.trainingRequired ?? false,
        round_dates: data.roundDates?.length ? data.roundDates : null,
        // Season cost
        season_fee_type: data.seasonFeeType || 'tbd',
        season_fee_amount_cents: data.seasonFeeAmountCents || 0,
        season_fee_min_cents: data.seasonFeeMinCents || 0,
        season_fee_max_cents: data.seasonFeeMaxCents || 0,
        // Draft, skill, commitment
        is_draft: data.isDraft ?? false,
        skill_level: (data.skillLevel || null) as Activity['skill_level'],
        commitment_level: (data.commitmentLevel || null) as Activity['commitment_level'],
      })
      .select('id')
      .single();

    // Create divisions if provided and get their IDs back
    let createdDivisions: { id: string; name: string }[] = [];
    if (!error && newActivity && data.divisions?.length) {
      const { data: divRows } = await supabase
        .from('competition_divisions')
        .insert(
          data.divisions.map((div, i) => ({
            activity_id: newActivity.id,
            name: div.name,
            max_teams: div.maxTeams ?? null,
            age_group: div.ageGroup || null,
            gender: div.gender || null,
            display_order: i,
          }))
        )
        .select('id, name');
      createdDivisions = (divRows ?? []) as { id: string; name: string }[];
    }

    // Create child activities for trials and training
    if (!error && newActivity) {
      // Training — one per division, always organiser mode
      if (data.trainingRequired && createdDivisions.length > 0) {
        for (const div of createdDivisions) {
          const trainingName = `${data.name} - Training (${div.name})`;
          const { data: trainingActivity } = await createActivity({
            organisation_id: organisation.id,
            activity_type: 'training_session',
            participation_mode: 'organiser',
            name: trainingName,
            slug: generateSlug(trainingName),
            description: null,
            start_date: null,
            end_date: null,
            is_current: true,
            total_rounds: null,
            has_finals: null,
            pool_count: null,
            recurrence_rule: null,
            default_venue: null,
            default_start_time: null,
            default_duration_minutes: null,
            parent_activity_id: newActivity.id,
          });
          if (trainingActivity) {
            await supabase
              .from('activities')
              .update({ competition_division_id: div.id } as Record<string, unknown>)
              .eq('id', trainingActivity.id);
          }
        }
      }

      // Trials — one per division, always organiser mode
      if (data.trialsRequired && createdDivisions.length > 0) {
        for (const div of createdDivisions) {
          const trialName = `${data.name} - Trials (${div.name})`;
          const { data: trialActivity } = await createActivity({
            organisation_id: organisation.id,
            activity_type: 'trials',
            participation_mode: 'organiser',
            name: trialName,
            slug: generateSlug(trialName),
            description: null,
            start_date: null,
            end_date: null,
            is_current: true,
            total_rounds: null,
            has_finals: null,
            pool_count: null,
            recurrence_rule: null,
            default_venue: null,
            default_start_time: null,
            default_duration_minutes: null,
            parent_activity_id: newActivity.id,
          });
          // Link to the specific division
          if (trialActivity) {
            await supabase
              .from('activities')
              .update({ competition_division_id: div.id } as Record<string, unknown>)
              .eq('id', trialActivity.id);
          }
        }
      }
    }

    if (error) {
      toast({ title: 'Error creating activity', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: `${singularLabel} created successfully` });
      setCreateOpen(false);
      router.push(`${getActivityPath(data.activityType, activitySlug)}?created=1`);
    }
    setSubmitting(false);
  }

  if (orgLoading) {
    return <PageSkeleton />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={pageTitle}
        badge={
          <Badge variant="secondary" className="text-sm">
            {activities.length}
          </Badge>
        }
        actions={
          isAdmin ? (
            <Button size="sm" className="gap-2" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" />
              Create {singularLabel}
            </Button>
          ) : undefined
        }
      />

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-48 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : (
        <ActivityList
          activities={activities}
          emptyMessage={`No ${pageTitle.toLowerCase()} found. Create your first ${singularLabel.toLowerCase()} to get started.`}
        />
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create {singularLabel}</DialogTitle>
          </DialogHeader>
          {typeParam && (
            <CreateActivityWizard
              activityType={typeParam}
              existingActivities={activities}
              onSubmit={handleCreate}
              loading={submitting}
              onCancel={() => setCreateOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
