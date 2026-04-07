'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { PageSkeleton } from '@/components/shared/loading-skeleton';
import { Button } from '@/components/ui/button';
import { DigitalDownloads } from '@/features/shop/components/digital-downloads';
import { getDownloadsForOrder } from '@/features/shop/services/download-service';
import { useUser } from '@/hooks/use-user';
import { useOrganisation } from '@/hooks/use-organisation';
import type { DigitalDownloadWithProduct } from '@/lib/supabase/database.types';

export default function OrderDownloadsPage() {
  const params = useParams();
  const { profile, loading: userLoading } = useUser();
  const { organisation, loading: orgLoading } = useOrganisation();

  const [downloads, setDownloads] = useState<DigitalDownloadWithProduct[]>([]);
  const [loading, setLoading] = useState(true);

  const orderId = params.id as string;

  const fetchDownloads = useCallback(async () => {
    if (!profile?.id) return;
    setLoading(true);
    const { data } = await getDownloadsForOrder(orderId, profile.id);
    setDownloads(data);
    setLoading(false);
  }, [orderId, profile?.id]);

  useEffect(() => {
    if (!orgLoading && !userLoading && profile?.id) {
      fetchDownloads();
    }
  }, [orgLoading, userLoading, profile?.id, fetchDownloads]);

  if (orgLoading || userLoading || loading) return <PageSkeleton />;

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild className="gap-2">
        <Link href={`/shop/orders/${orderId}`}>
          <ArrowLeft className="h-4 w-4" />
          Back to Order
        </Link>
      </Button>

      <PageHeader title="Downloads" description="Your digital purchases" />

      {profile?.id && (
        <DigitalDownloads downloads={downloads} profileId={profile.id} />
      )}
    </div>
  );
}
