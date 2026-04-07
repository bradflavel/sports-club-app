'use client';

import { useState } from 'react';
import { Loader2, Package, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EmptyState } from '@/components/shared/empty-state';
import { updateOrderStatus } from '../../services/order-service';
import { useToast } from '@/components/ui/use-toast';
import type { ShopOrder, ShopOrderStatus } from '@/lib/supabase/database.types';

interface OrderManagementTableProps {
  orders: ShopOrder[];
  onRefresh: () => void;
  onOpenScanner: () => void;
}

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

const STATUS_OPTIONS: { value: ShopOrderStatus; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'paid', label: 'Paid' },
  { value: 'ready_for_pickup', label: 'Ready for Pickup' },
  { value: 'collected', label: 'Collected' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'refunded', label: 'Refunded' },
];

const STATUS_CONFIG: Record<ShopOrderStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: 'Pending', variant: 'outline' },
  paid: { label: 'Paid', variant: 'default' },
  ready_for_pickup: { label: 'Ready', variant: 'secondary' },
  collected: { label: 'Collected', variant: 'default' },
  cancelled: { label: 'Cancelled', variant: 'destructive' },
  refunded: { label: 'Refunded', variant: 'destructive' },
};

export function OrderManagementTable({ orders, onRefresh, onOpenScanner }: OrderManagementTableProps) {
  const { toast } = useToast();
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  async function handleStatusChange(orderId: string, newStatus: ShopOrderStatus) {
    setUpdatingId(orderId);
    const { error } = await updateOrderStatus(orderId, newStatus);
    if (error) {
      toast({ title: 'Error', description: 'Failed to update status', variant: 'destructive' });
    } else {
      toast({ title: 'Status updated' });
      onRefresh();
    }
    setUpdatingId(null);
  }

  if (orders.length === 0) {
    return (
      <EmptyState
        icon={Package}
        title="No orders"
        description="Orders will appear here when members make purchases."
      />
    );
  }

  return (
    <div className="space-y-2">
      {orders.map((order) => {
        const config = STATUS_CONFIG[order.status];
        return (
          <Card key={order.id}>
            <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{order.order_number}</span>
                  <Badge variant={config.variant}>{config.label}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {new Date(order.created_at).toLocaleDateString()} &middot;{' '}
                  {formatPrice(order.total_cents)}
                  {order.discount_cents > 0 && (
                    <span className="text-green-600 dark:text-green-400">
                      {' '}(-{formatPrice(order.discount_cents)})
                    </span>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Select
                  value={order.status}
                  onValueChange={(v) => handleStatusChange(order.id, v as ShopOrderStatus)}
                  disabled={updatingId === order.id}
                >
                  <SelectTrigger className="w-[160px]">
                    {updatingId === order.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <SelectValue />
                    )}
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
