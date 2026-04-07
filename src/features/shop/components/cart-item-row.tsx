'use client';

import { Minus, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { CartItemWithDetails } from '@/lib/supabase/database.types';

interface CartItemRowProps {
  item: CartItemWithDetails;
  onUpdateQuantity: (cartItemId: string, quantity: number) => void;
  onRemove: (cartItemId: string) => void;
  disabled?: boolean;
}

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function CartItemRow({ item, onUpdateQuantity, onRemove, disabled }: CartItemRowProps) {
  const variantLabel = [item.variant.size, item.variant.colour].filter(Boolean).join(' / ');
  const lineTotal = item.product.price_cents * item.quantity;

  return (
    <div className="flex items-center gap-4 border-b py-4 last:border-0">
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{item.product.name}</p>
        {variantLabel && (
          <p className="text-sm text-muted-foreground">{variantLabel}</p>
        )}
        <p className="text-sm text-muted-foreground">
          {formatPrice(item.product.price_cents)} each
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
          disabled={disabled || item.quantity <= 1}
        >
          <Minus className="h-3 w-3" />
        </Button>
        <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
          disabled={disabled}
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>

      <div className="w-20 text-right font-medium">{formatPrice(lineTotal)}</div>

      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-muted-foreground hover:text-destructive"
        onClick={() => onRemove(item.id)}
        disabled={disabled}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
