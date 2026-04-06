'use client';

import { useUser } from '@/hooks/use-user';
import { PageSkeleton } from '@/components/shared/loading-skeleton';
import { CompetitionShowcase } from '@/features/competitions/components/competition-showcase';
import ActivitiesPage from '@/app/(dashboard)/activities/page';

export default function CompetitionsPage() {
  const { profile, loading } = useUser();

  if (loading) return <PageSkeleton />;

  const isAdmin = profile?.role === 'admin' || profile?.role === 'manager';

  if (isAdmin) {
    return <ActivitiesPage typeOverride="competition" />;
  }

  return <CompetitionShowcase />;
}
