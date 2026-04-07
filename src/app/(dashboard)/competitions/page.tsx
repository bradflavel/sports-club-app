'use client';

import { useAuth } from '@/hooks/use-auth-context';
import { PageSkeleton } from '@/components/shared/loading-skeleton';
import { CompetitionShowcase } from '@/features/competitions/components/competition-showcase';
import ActivitiesPage from '@/app/(dashboard)/activities/page';

export default function CompetitionsPage() {
  const { profile, loading } = useAuth();

  if (loading) return <PageSkeleton />;

  const isAdmin = profile?.role === 'admin' || profile?.role === 'manager';

  if (isAdmin) {
    return <ActivitiesPage typeOverride="competition" />;
  }

  return <CompetitionShowcase />;
}
