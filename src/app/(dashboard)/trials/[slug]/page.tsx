'use client';

import { Suspense } from 'react';
import { useParams } from 'next/navigation';
import { PageSkeleton } from '@/components/shared/loading-skeleton';
import { ActivityDetailBySlug } from '@/features/activities/components/activity-detail-by-slug';

function TrialDetailInner() {
  const params = useParams();
  return <ActivityDetailBySlug slug={params.slug as string} />;
}

export default function TrialDetailPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <TrialDetailInner />
    </Suspense>
  );
}
