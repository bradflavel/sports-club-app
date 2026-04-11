import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createCheckoutSession } from '@/features/shop/services/stripe-service';
import { isStripeConfigured } from '@/lib/stripe';
import type { ShopOrder, OrderItem } from '@/lib/supabase/database.types';

/**
 * POST /api/stripe/checkout
 *
 * Creates a Stripe Checkout Session for an order using Stripe Connect.
 * Expected body: { orderId: string }
 */
export async function POST(request: NextRequest) {
  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: 'Stripe is not configured. Set STRIPE_SECRET_KEY to enable payments.' },
      { status: 503 }
    );
  }

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const orderId = body.orderId;

  if (!orderId) {
    return NextResponse.json({ error: 'orderId is required' }, { status: 400 });
  }

  // Fetch the order and verify ownership
  const { data: order } = await db
    .from('shop_orders')
    .select('*')
    .eq('id', orderId)
    .eq('profile_id', user.id)
    .single();

  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  if (order.status !== 'pending') {
    return NextResponse.json({ error: 'Order is not pending' }, { status: 400 });
  }

  // Get the organisation's Stripe Connect account
  const { data: org } = await db
    .from('organisations')
    .select('stripe_account_id, stripe_onboarding_complete')
    .eq('id', order.organisation_id)
    .single();

  if (!org?.stripe_account_id || !org.stripe_onboarding_complete) {
    return NextResponse.json(
      { error: 'This club has not set up payment processing yet.' },
      { status: 400 }
    );
  }

  // Fetch order items
  const { data: items } = await db
    .from('order_items')
    .select('*')
    .eq('order_id', orderId);

  const lineItems = ((items as OrderItem[]) || []).map((item) => ({
    name: item.variant_label ? `${item.product_name} (${item.variant_label})` : item.product_name,
    quantity: item.quantity,
    priceCents: item.unit_price_cents,
  }));

  // Create checkout session on the connected account
  const { sessionId, url, error } = await createCheckoutSession(
    order as ShopOrder,
    lineItems,
    org.stripe_account_id
  );

  if (error || !url) {
    return NextResponse.json({ error: error || 'Failed to create checkout session' }, { status: 500 });
  }

  // Save the session ID to the order
  await db
    .from('shop_orders')
    .update({
      stripe_checkout_session_id: sessionId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId);

  return NextResponse.json({ url });
}
