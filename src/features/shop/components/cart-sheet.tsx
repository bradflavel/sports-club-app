'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { CartItemRow } from './cart-item-row';
import { getCartItems, updateCartQuantity, removeFromCart } from '../services/cart-service';
import { useToast } from '@/components/ui/use-toast';
import type { CartItemWithDetails } from '@/lib/supabase/database.types';

interface CartSheetProps {
  profileId: string;
  orgId: string;
  refreshKey?: number;
}

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function CartSheet({ profileId, orgId, refreshKey }: CartSheetProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<CartItemWithDetails[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchItems = useCallback(async () => {
    if (!profileId || !orgId) return;
    setLoading(true);
    const { data, error } = await getCartItems(profileId, orgId);
    if (!error) setItems(data);
    setLoading(false);
  }, [profileId, orgId]);

  useEffect(() => {
    if (open || refreshKey) fetchItems();
  }, [open, refreshKey, fetchItems]);

  const handleUpdateQuantity = async (cartItemId: string, quantity: number) => {
    if (quantity < 1) return;
    const { error } = await updateCartQuantity(cartItemId, quantity);
    if (error) {
      toast({ title: 'Error', description: 'Failed to update quantity', variant: 'destructive' });
    } else {
      fetchItems();
    }
  };

  const handleRemove = async (cartItemId: string) => {
    const { error } = await removeFromCart(cartItemId);
    if (error) {
      toast({ title: 'Error', description: 'Failed to remove item', variant: 'destructive' });
    } else {
      fetchItems();
    }
  };

  const subtotal = items.reduce(
    (sum, item) => sum + item.product.price_cents * item.quantity,
    0
  );
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="relative gap-2">
          <ShoppingCart className="h-4 w-4" />
          Cart
          {itemCount > 0 && (
            <Badge variant="default" className="ml-1 h-5 min-w-5 rounded-full px-1.5 text-xs">
              {itemCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="flex w-full flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Cart ({itemCount} items)</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ShoppingCart className="h-12 w-12 text-muted-foreground/30" />
              <p className="mt-4 text-sm text-muted-foreground">Your cart is empty</p>
            </div>
          ) : (
            items.map((item) => (
              <CartItemRow
                key={item.id}
                item={item}
                onUpdateQuantity={handleUpdateQuantity}
                onRemove={handleRemove}
                disabled={loading}
              />
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t pt-4 space-y-3">
            <div className="flex justify-between font-semibold">
              <span>Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <Button asChild className="w-full" onClick={() => setOpen(false)}>
              <Link href="/shop/cart">View Cart & Checkout</Link>
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
