'use client';

import { Suspense } from 'react';
import { useParams } from 'next/navigation';
import { PageSkeleton } from '@/components/shared/loading-skeleton';
import { ActivityDetailBySlug } from '@/features/activities/components/activity-detail-by-slug';

function CampDetailInner() {
  const params = useParams();
  return <ActivityDetailBySlug slug={params.slug as string} />;
}

export default function CampDetailPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <CampDetailInner />
    </Suspense>
  );
}
