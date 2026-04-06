'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageSkeleton } from '@/components/shared/loading-skeleton';
import { getActivityBySlug } from '@/features/activities/services/activity-service';
import { useOrganisation } from '@/hooks/use-organisation';
import { useToast } from '@/components/ui/use-toast';
import { getActivityListPath } from '@/lib/utils';

interface ActivityDetailBySlugProps {
  slug: string;
}

/**
 * Resolves a slug to an activity ID and dynamically imports the detail page.
 * This is a thin wrapper used by all type-based routes (e.g. /competitions/[slug]).
 * It sets the activityId in the URL so the existing detail page can read it.
 */
export function ActivityDetailBySlug({ slug }: ActivityDetailBySlugProps) {
  const { organisation, loading: orgLoading } = useOrganisation();
  const { toast } = useToast();
  const router = useRouter();
  const [activityId, setActivityId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (orgLoading || !organisation?.id) return;

    async function resolve() {
      const { data, error } = await getActivityBySlug(organisation!.id, slug);
      if (error || !data) {
        toast({ title: 'Activity not found', variant: 'destructive' });
        router.push('/dashboard');
        return;
      }
      setActivityId(data.id);
      setLoading(false);
    }

    resolve();
  }, [slug, organisation?.id, orgLoading, toast, router]);

  if (loading || !activityId) return <PageSkeleton />;

  // Dynamically render the activity detail page with the resolved ID
  // We use a lazy import pattern to avoid circular dependencies
  return <ActivityDetailContent activityId={activityId} />;
}

// Inline the actual detail page import to avoid issues
import { ActivityDetailPageContent } from '@/app/(dashboard)/activities/[id]/page';

function ActivityDetailContent({ activityId }: { activityId: string }) {
  return <ActivityDetailPageContent activityId={activityId} />;
}
