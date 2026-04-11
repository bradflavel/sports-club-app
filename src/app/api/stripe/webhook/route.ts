import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { constructWebhookEvent } from '@/features/shop/services/stripe-service';

/**
 * POST /api/stripe/webhook
 *
 * Handles Stripe webhook events. This route does NOT use the standard
 * auth middleware — requests come from Stripe, not authenticated users.
 */
export async function POST(request: NextRequest) {
  const signature = request.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  // Read raw body for signature verification
  const rawBody = await request.text();

  const event = constructWebhookEvent(rawBody, signature);
  if (!event) {
    return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 });
  }

  // Create a Supabase client for webhook operations (no user cookies)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => [],
        setAll: () => {},
      },
    }
  );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const orderId = session.metadata?.order_id;

      if (!orderId) break;

      // Update order to paid
      await db
        .from('shop_orders')
        .update({
          status: 'paid',
          stripe_payment_intent_id:
            typeof session.payment_intent === 'string' ? session.payment_intent : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId);

      // For digital-only orders, auto-transition to collected
      const { data: items } = await db
        .from('order_items')
        .select('product_type')
        .eq('order_id', orderId);

      const allDigital = items?.every(
        (item: { product_type: string }) => item.product_type === 'digital'
      );
      if (allDigital) {
        await db
          .from('shop_orders')
          .update({
            status: 'collected',
            collected_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', orderId);
      }
      break;
    }

    case 'charge.refunded': {
      const charge = event.data.object;
      const paymentIntentId =
        typeof charge.payment_intent === 'string' ? charge.payment_intent : null;

      if (!paymentIntentId) break;

      await db
        .from('shop_orders')
        .update({
          status: 'refunded',
          updated_at: new Date().toISOString(),
        })
        .eq('stripe_payment_intent_id', paymentIntentId);
      break;
    }

    case 'account.updated': {
      const account = event.data.object;
      const chargesEnabled = 'charges_enabled' in account ? account.charges_enabled : false;
      const detailsSubmitted = 'details_submitted' in account ? account.details_submitted : false;

      // Update all organisations that have this connected account
      await db
        .from('organisations')
        .update({
          stripe_onboarding_complete: chargesEnabled && detailsSubmitted,
          updated_at: new Date().toISOString(),
        })
        .eq('stripe_account_id', account.id);
      break;
    }
  }

  return NextResponse.json({ received: true });
}
