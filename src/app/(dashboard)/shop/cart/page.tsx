'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { PageSkeleton } from '@/components/shared/loading-skeleton';
import { Button } from '@/components/ui/button';
import { CartItemRow } from '@/features/shop/components/cart-item-row';
import { CartSummary } from '@/features/shop/components/cart-summary';
import { DiscountCodeInput } from '@/features/shop/components/discount-code-input';
import { getCartItems, updateCartQuantity, removeFromCart } from '@/features/shop/services/cart-service';
import { createOrder } from '@/features/shop/services/order-service';
import { validateDiscountCode, incrementDiscountUsage } from '@/features/shop/services/discount-service';
import { createCheckoutSession } from '@/features/shop/services/stripe-service';
import { useUser } from '@/hooks/use-user';
import { useOrganisation } from '@/hooks/use-organisation';
import { useToast } from '@/components/ui/use-toast';
import { useRouter } from 'next/navigation';
import type { CartItemWithDetails, DiscountCode } from '@/lib/supabase/database.types';

export default function CartPage() {
  const router = useRouter();
  const { profile, loading: userLoading } = useUser();
  const { organisation, loading: orgLoading } = useOrganisation();
  const { toast } = useToast();

  const [items, setItems] = useState<CartItemWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);

  // Discount state
  const [appliedDiscount, setAppliedDiscount] = useState<DiscountCode | null>(null);
  const [discountCents, setDiscountCents] = useState(0);

  const subtotalCents = items.reduce(
    (sum, item) => sum + item.product.price_cents * item.quantity,
    0
  );
  const totalCents = Math.max(0, subtotalCents - discountCents);

  const fetchItems = useCallback(async () => {
    if (!profile?.id || !organisation?.id) return;
    setLoading(true);
    const { data, error } = await getCartItems(profile.id, organisation.id);
    if (!error) setItems(data);
    setLoading(false);
  }, [profile?.id, organisation?.id]);

  useEffect(() => {
    if (!orgLoading && !userLoading && profile?.id && organisation?.id) {
      fetchItems();
    }
  }, [orgLoading, userLoading, profile?.id, organisation?.id, fetchItems]);

  const handleUpdateQuantity = async (cartItemId: string, quantity: number) => {
    if (quantity < 1) return;
    await updateCartQuantity(cartItemId, quantity);
    fetchItems();
  };

  const handleRemove = async (cartItemId: string) => {
    await removeFromCart(cartItemId);
    fetchItems();
    // Re-validate discount if items change
    if (appliedDiscount) {
      setAppliedDiscount(null);
      setDiscountCents(0);
    }
  };

  const handleApplyDiscount = async (code: string) => {
    if (!organisation?.id || !profile?.id) return { valid: false, message: 'Not authenticated' };

    const result = await validateDiscountCode(organisation.id, code, items, profile.id);

    if (result.valid && result.discountCode) {
      setAppliedDiscount(result.discountCode);
      setDiscountCents(result.discountCents);
    }

    return { valid: result.valid, message: result.message };
  };

  const handleRemoveDiscount = () => {
    setAppliedDiscount(null);
    setDiscountCents(0);
  };

  const handleCheckout = async () => {
    if (!profile?.id || !organisation?.id || items.length === 0) return;
    setCheckingOut(true);

    // Create order
    const { data: order, error } = await createOrder(profile.id, organisation.id, items, {
      discountCodeId: appliedDiscount?.id,
      discountCents,
    });

    if (error || !order) {
      toast({ title: 'Error', description: 'Failed to create order', variant: 'destructive' });
      setCheckingOut(false);
      return;
    }

    // Increment discount usage if applicable
    if (appliedDiscount?.id) {
      await incrementDiscountUsage(appliedDiscount.id);
    }

    // Attempt Stripe checkout
    const lineItems = order.items.map((item) => ({
      name: item.product_name,
      quantity: item.quantity,
      priceCents: item.unit_price_cents,
    }));

    const { url, error: stripeError } = await createCheckoutSession(order, lineItems);

    if (url) {
      // Redirect to Stripe
      window.location.href = url;
    } else {
      // Stripe not configured - go to order page
      toast({
        title: 'Order created!',
        description: `${order.order_number} - ${stripeError || 'Payment integration pending.'}`,
      });
      router.push(`/shop/orders/${order.id}`);
    }

    setCheckingOut(false);
  };

  if (orgLoading || userLoading) return <PageSkeleton />;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild className="gap-2">
          <Link href="/shop">
            <ArrowLeft className="h-4 w-4" />
            Continue Shopping
          </Link>
        </Button>
      </div>

      <PageHeader title="Your Cart" />

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Your cart is empty</p>
          <Button asChild className="mt-4">
            <Link href="/shop">Browse Products</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-1">
            {items.map((item) => (
              <CartItemRow
                key={item.id}
                item={item}
                onUpdateQuantity={handleUpdateQuantity}
                onRemove={handleRemove}
                disabled={checkingOut}
              />
            ))}

            <div className="pt-4">
              <DiscountCodeInput
                onApply={handleApplyDiscount}
                appliedCode={appliedDiscount?.code}
                discountAmount={discountCents}
                onRemove={handleRemoveDiscount}
                disabled={checkingOut}
              />
            </div>
          </div>

          <div>
            <CartSummary
              subtotalCents={subtotalCents}
              discountCents={discountCents}
              totalCents={totalCents}
              onCheckout={handleCheckout}
              loading={checkingOut}
              disabled={items.length === 0}
            />
          </div>
        </div>
      )}
    </div>
  );
}
