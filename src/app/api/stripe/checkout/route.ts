import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/stripe/checkout
 *
 * Creates a Stripe Checkout Session for an order.
 *
 * TODO: Implement when Stripe keys are configured.
 * Expected body: { orderId: string }
 */
export async function POST(request: NextRequest) {
  // TODO: Implement Stripe Checkout Session creation
  // 1. Authenticate the user
  // 2. Fetch the order and verify ownership
  // 3. Create Stripe Checkout Session with line items
  // 4. Update order with stripe_checkout_session_id
  // 5. Return { url: session.url }

  return NextResponse.json(
    {
      error: 'Stripe checkout is not configured. Set STRIPE_SECRET_KEY to enable payments.',
    },
    { status: 501 }
  );
}
