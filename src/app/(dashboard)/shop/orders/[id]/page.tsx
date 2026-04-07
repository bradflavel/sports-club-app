'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { PageSkeleton } from '@/components/shared/loading-skeleton';
import { Button } from '@/components/ui/button';
import { OrderDetail } from '@/features/shop/components/order-detail';
import { DigitalDownloads } from '@/features/shop/components/digital-downloads';
import { getOrderDetail } from '@/features/shop/services/order-service';
import { getDownloadsForOrder } from '@/features/shop/services/download-service';
import { useUser } from '@/hooks/use-user';
import { useOrganisation } from '@/hooks/use-organisation';
import { useToast } from '@/components/ui/use-toast';
import type { ShopOrderWithItems, DigitalDownloadWithProduct } from '@/lib/supabase/database.types';

export default function OrderDetailPage() {
  const params = useParams();
  const { profile, loading: userLoading } = useUser();
  const { organisation, loading: orgLoading } = useOrganisation();
  const { toast } = useToast();

  const [order, setOrder] = useState<ShopOrderWithItems | null>(null);
  const [downloads, setDownloads] = useState<DigitalDownloadWithProduct[]>([]);
  const [loading, setLoading] = useState(true);

  const orderId = params.id as string;

  const fetchOrder = useCallback(async () => {
    if (!profile?.id) return;
    setLoading(true);

    const { data, error } = await getOrderDetail(orderId);

    if (error || !data) {
      toast({ title: 'Error', description: 'Order not found', variant: 'destructive' });
      setLoading(false);
      return;
    }

    setOrder(data);

    // Fetch digital downloads if order has digital items
    const hasDigital = data.items.some((item) => item.product_type === 'digital');
    if (hasDigital && data.status !== 'pending' && data.status !== 'cancelled') {
      const { data: dlData } = await getDownloadsForOrder(orderId, profile.id);
      setDownloads(dlData);
    }

    setLoading(false);
  }, [orderId, profile?.id, toast]);

  useEffect(() => {
    if (!orgLoading && !userLoading && profile?.id) {
      fetchOrder();
    }
  }, [orgLoading, userLoading, profile?.id, fetchOrder]);

  if (orgLoading || userLoading || loading) return <PageSkeleton />;
  if (!order) return null;

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild className="gap-2">
        <Link href="/shop/orders">
          <ArrowLeft className="h-4 w-4" />
          Back to Orders
        </Link>
      </Button>

      <OrderDetail order={order} />

      {downloads.length > 0 && profile?.id && (
        <DigitalDownloads downloads={downloads} profileId={profile.id} />
      )}
    </div>
  );
}
