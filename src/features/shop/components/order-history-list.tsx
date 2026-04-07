'use client';

import Link from 'next/link';
import { Package } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/shared/empty-state';
import type { ShopOrder, ShopOrderStatus } from '@/lib/supabase/database.types';

interface OrderHistoryListProps {
  orders: ShopOrder[];
}

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

const STATUS_CONFIG: Record<ShopOrderStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: 'Pending', variant: 'outline' },
  paid: { label: 'Paid', variant: 'default' },
  ready_for_pickup: { label: 'Ready for Pickup', variant: 'secondary' },
  collected: { label: 'Collected', variant: 'default' },
  cancelled: { label: 'Cancelled', variant: 'destructive' },
  refunded: { label: 'Refunded', variant: 'destructive' },
};

export function OrderHistoryList({ orders }: OrderHistoryListProps) {
  if (orders.length === 0) {
    return (
      <EmptyState
        icon={Package}
        title="No orders yet"
        description="Your order history will appear here after you make a purchase."
        actionLabel="Browse Shop"
        actionHref="/shop"
      />
    );
  }

  return (
    <div className="space-y-3">
      {orders.map((order) => {
        const config = STATUS_CONFIG[order.status];
        return (
          <Link key={order.id} href={`/shop/orders/${order.id}`}>
            <Card className="transition-shadow hover:shadow-md">
              <CardContent className="flex items-center justify-between p-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold">{order.order_number}</span>
                    <Badge variant={config.variant}>{config.label}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {new Date(order.created_at).toLocaleDateString()} at{' '}
                    {new Date(order.created_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-semibold">{formatPrice(order.total_cents)}</span>
                  {order.discount_cents > 0 && (
                    <p className="text-xs text-green-600 dark:text-green-400">
                      Saved {formatPrice(order.discount_cents)}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
