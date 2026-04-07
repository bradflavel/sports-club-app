'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { OrderQrCode } from './order-qr-code';
import type { ShopOrderWithItems, ShopOrderStatus } from '@/lib/supabase/database.types';

interface OrderDetailProps {
  order: ShopOrderWithItems;
  showQr?: boolean;
}

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

const STATUS_CONFIG: Record<ShopOrderStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: 'Pending Payment', variant: 'outline' },
  paid: { label: 'Paid', variant: 'default' },
  ready_for_pickup: { label: 'Ready for Pickup', variant: 'secondary' },
  collected: { label: 'Collected', variant: 'default' },
  cancelled: { label: 'Cancelled', variant: 'destructive' },
  refunded: { label: 'Refunded', variant: 'destructive' },
};

export function OrderDetail({ order, showQr = true }: OrderDetailProps) {
  const config = STATUS_CONFIG[order.status];
  const hasPhysicalItems = order.items.some((item) => item.product_type === 'physical');
  const showQrCode =
    showQr &&
    hasPhysicalItems &&
    (order.status === 'ready_for_pickup' || order.status === 'paid');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold">{order.order_number}</h2>
          <p className="text-sm text-muted-foreground">
            Placed {new Date(order.created_at).toLocaleDateString()} at{' '}
            {new Date(order.created_at).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
        <Badge variant={config.variant} className="w-fit">
          {config.label}
        </Badge>
      </div>

      {/* QR Code for collection */}
      {showQrCode && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Collection QR Code</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <OrderQrCode token={order.collection_qr_token} />
          </CardContent>
          <p className="px-6 pb-4 text-center text-xs text-muted-foreground">
            Show this QR code at the club to collect your order
          </p>
        </Card>
      )}

      {order.collected_at && (
        <p className="text-sm text-muted-foreground">
          Collected on {new Date(order.collected_at).toLocaleDateString()} at{' '}
          {new Date(order.collected_at).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      )}

      {/* Order Items */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{item.product_name}</p>
                  <div className="flex items-center gap-2">
                    {item.variant_label && (
                      <span className="text-sm text-muted-foreground">{item.variant_label}</span>
                    )}
                    {item.product_type === 'digital' && (
                      <Badge variant="secondary" className="text-xs">Digital</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formatPrice(item.unit_price_cents)} x {item.quantity}
                  </p>
                </div>
                <span className="font-medium">
                  {formatPrice(item.unit_price_cents * item.quantity)}
                </span>
              </div>
            ))}
          </div>

          <Separator className="my-4" />

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatPrice(order.subtotal_cents)}</span>
            </div>
            {order.discount_cents > 0 && (
              <div className="flex justify-between text-green-600 dark:text-green-400">
                <span>
                  Discount
                  {order.discount_code && ` (${order.discount_code.code})`}
                </span>
                <span>-{formatPrice(order.discount_cents)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between font-semibold text-base">
              <span>Total</span>
              <span>{formatPrice(order.total_cents)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {order.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{order.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
