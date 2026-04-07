import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/stripe/webhook
 *
 * Handles Stripe webhook events.
 *
 * TODO: Implement when Stripe keys are configured.
 * Expected events:
 * - checkout.session.completed -> update order status to 'paid'
 * - charge.refunded -> update order status to 'refunded'
 */
export async function POST(request: NextRequest) {
  // TODO: Implement Stripe webhook handling
  // 1. Read raw body
  // 2. Verify webhook signature using STRIPE_WEBHOOK_SECRET
  // 3. Parse the event
  // 4. Handle checkout.session.completed:
  //    - Extract order_id from metadata
  //    - Update shop_orders.status to 'paid'
  //    - Update shop_orders.stripe_payment_intent_id
  //    - For digital-only orders, auto-transition to 'collected'
  // 5. Handle charge.refunded:
  //    - Update shop_orders.status to 'refunded'

  return NextResponse.json(
    {
      error: 'Stripe webhooks are not configured. Set STRIPE_WEBHOOK_SECRET to enable.',
    },
    { status: 501 }
  );
}
