'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageSkeleton } from '@/components/shared/loading-skeleton';
import { getActivityBySlug } from '@/features/activities/services/activity-service';
import { useOrganisation } from '@/hooks/use-organisation';
import { useUser } from '@/hooks/use-user';
import { useToast } from '@/components/ui/use-toast';
import { getActivityListPath } from '@/lib/utils';
import type { Activity } from '@/lib/supabase/database.types';

interface ActivityDetailBySlugProps {
  slug: string;
}

/**
 * Resolves a slug to an activity and renders either admin or member view.
 * For non-admin users viewing a competition, renders the member experience.
 */
export function ActivityDetailBySlug({ slug }: ActivityDetailBySlugProps) {
  const { organisation, loading: orgLoading } = useOrganisation();
  const { profile, loading: userLoading } = useUser();
  const { toast } = useToast();
  const router = useRouter();
  const [activity, setActivity] = useState<Activity | null>(null);
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
      setActivity(data);
      setLoading(false);
    }

    resolve();
  }, [slug, organisation?.id, orgLoading, toast, router]);

  if (loading || !activity || userLoading) return <PageSkeleton />;

  const isAdmin = profile?.role === 'admin' || profile?.role === 'manager';

  // Non-admin viewing a competition gets the member experience
  if (activity.activity_type === 'competition' && !isAdmin) {
    return <CompetitionDetailMemberWrapper activity={activity} />;
  }

  // All other cases: admin view or non-competition activity types
  return <ActivityDetailContent activityId={activity.id} />;
}

// Lazy-loaded member detail view
import { CompetitionDetailMember } from '@/features/competitions/components/competition-detail-member';

function CompetitionDetailMemberWrapper({ activity }: { activity: Activity }) {
  return <CompetitionDetailMember activity={activity} />;
}

// Existing admin detail view
import { ActivityDetailPageContent } from '@/app/(dashboard)/activities/[id]/page';

function ActivityDetailContent({ activityId }: { activityId: string }) {
  return <ActivityDetailPageContent activityId={activityId} />;
}
