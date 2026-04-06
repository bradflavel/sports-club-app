'use client';

import { Suspense } from 'react';
import { useParams } from 'next/navigation';
import { PageSkeleton } from '@/components/shared/loading-skeleton';
import { ActivityDetailBySlug } from '@/features/activities/components/activity-detail-by-slug';

function TournamentDetailInner() {
  const params = useParams();
  return <ActivityDetailBySlug slug={params.slug as string} />;
}

export default function TournamentDetailPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <TournamentDetailInner />
    </Suspense>
  );
}
