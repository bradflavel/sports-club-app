'use client';

import { Suspense } from 'react';
import { useParams } from 'next/navigation';
import { PageSkeleton } from '@/components/shared/loading-skeleton';
import { ActivityDetailBySlug } from '@/features/activities/components/activity-detail-by-slug';

function CompetitionDetailInner() {
  const params = useParams();
  return <ActivityDetailBySlug slug={params.slug as string} />;
}

export default function CompetitionDetailPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <CompetitionDetailInner />
    </Suspense>
  );
}
