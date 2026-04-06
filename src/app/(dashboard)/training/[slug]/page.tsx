'use client';

import { Suspense } from 'react';
import { useParams } from 'next/navigation';
import { PageSkeleton } from '@/components/shared/loading-skeleton';
import { ActivityDetailBySlug } from '@/features/activities/components/activity-detail-by-slug';

function TrainingDetailInner() {
  const params = useParams();
  return <ActivityDetailBySlug slug={params.slug as string} />;
}

export default function TrainingDetailPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <TrainingDetailInner />
    </Suspense>
  );
}
