'use client';

import { useCallback, useEffect, useState } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { PageSkeleton } from '@/components/shared/loading-skeleton';
import { OrderHistoryList } from '@/features/shop/components/order-history-list';
import { getMyOrders } from '@/features/shop/services/order-service';
import { useUser } from '@/hooks/use-user';
import { useOrganisation } from '@/hooks/use-organisation';
import { useToast } from '@/components/ui/use-toast';
import type { ShopOrder } from '@/lib/supabase/database.types';

export default function OrdersPage() {
  const { profile, loading: userLoading } = useUser();
  const { organisation, loading: orgLoading } = useOrganisation();
  const { toast } = useToast();

  const [orders, setOrders] = useState<ShopOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    if (!profile?.id || !organisation?.id) return;
    setLoading(true);

    const { data, error } = await getMyOrders(profile.id, organisation.id);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      setOrders(data);
    }
    setLoading(false);
  }, [profile?.id, organisation?.id, toast]);

  useEffect(() => {
    if (!orgLoading && !userLoading && profile?.id && organisation?.id) {
      fetchOrders();
    }
  }, [orgLoading, userLoading, profile?.id, organisation?.id, fetchOrders]);

  if (orgLoading || userLoading) return <PageSkeleton />;

  return (
    <div className="space-y-6">
      <PageHeader title="My Orders" description="Your purchase history" />

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : (
        <OrderHistoryList orders={orders} />
      )}
    </div>
  );
}
