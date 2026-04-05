'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
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
import { ActivityForm } from '@/features/activities/components/activity-form';
import { getActivities, createActivity } from '@/features/activities/services/activity-service';
import { ACTIVITY_TYPE_CONFIG } from '@/lib/constants';
import { useOrganisation } from '@/hooks/use-organisation';
import { useToast } from '@/components/ui/use-toast';
import type { Activity, ActivityType } from '@/lib/supabase/database.types';
import type { ActivityInput } from '@/features/activities/schemas/activity-schemas';

export default function ActivitiesPage() {
  const searchParams = useSearchParams();
  const typeParam = searchParams.get('type') as ActivityType | null;
  const { organisation, loading: orgLoading } = useOrganisation();
  const { toast } = useToast();

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
      setActivities(data ?? []);
    }
    setLoading(false);
  }, [organisation?.id, typeParam, toast]);

  useEffect(() => {
    if (!orgLoading && organisation?.id) {
      fetchActivities();
    }
  }, [orgLoading, organisation?.id, fetchActivities]);

  async function handleCreate(formData: ActivityInput) {
    if (!organisation?.id) return;
    setSubmitting(true);

    const { error } = await createActivity({
      organisation_id: organisation.id,
      activity_type: formData.activityType,
      participation_mode: formData.participationMode,
      name: formData.name,
      description: formData.description || null,
      start_date: formData.startDate,
      end_date: formData.endDate || null,
      is_current: true,
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
      toast({ title: 'Error creating activity', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: `${singularLabel} created successfully` });
      setCreateOpen(false);
      fetchActivities();
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
          <Button size="sm" className="gap-2" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            Create {singularLabel}
          </Button>
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
          <ActivityForm
            defaultValues={typeParam ? { activityType: typeParam } : undefined}
            onSubmit={handleCreate}
            loading={submitting}
            activities={activities}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
