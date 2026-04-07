'use client';

import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface CartSummaryProps {
  subtotalCents: number;
  discountCents: number;
  totalCents: number;
  onCheckout: () => void;
  loading?: boolean;
  disabled?: boolean;
}

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function CartSummary({
  subtotalCents,
  discountCents,
  totalCents,
  onCheckout,
  loading,
  disabled,
}: CartSummaryProps) {
  return (
    <div className="space-y-3 rounded-lg border p-4">
      <h3 className="font-semibold">Order Summary</h3>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Subtotal</span>
          <span>{formatPrice(subtotalCents)}</span>
        </div>

        {discountCents > 0 && (
          <div className="flex justify-between text-green-600 dark:text-green-400">
            <span>Discount</span>
            <span>-{formatPrice(discountCents)}</span>
          </div>
        )}

        <Separator />

        <div className="flex justify-between font-semibold text-base">
          <span>Total</span>
          <span>{formatPrice(totalCents)}</span>
        </div>
      </div>

      <Button
        className="w-full"
        size="lg"
        onClick={onCheckout}
        disabled={disabled || loading || totalCents <= 0}
      >
        {loading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : null}
        Proceed to Checkout
      </Button>

      <p className="text-xs text-center text-muted-foreground">
        Pickup at the club. No shipping required.
      </p>
    </div>
  );
}
