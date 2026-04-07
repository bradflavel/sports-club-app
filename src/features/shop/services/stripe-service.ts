/**
 * Stripe integration scaffold.
 *
 * TODO: Install stripe package: pnpm add stripe
 * TODO: Set environment variables:
 *   - STRIPE_SECRET_KEY
 *   - STRIPE_WEBHOOK_SECRET
 *   - NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
 */

import type { ShopOrder } from '@/lib/supabase/database.types';

// TODO: Uncomment when Stripe is configured
// import Stripe from 'stripe';
// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-12-18.acacia' });

export interface CheckoutSessionResult {
  sessionId: string | null;
  url: string | null;
  error: string | null;
}

/**
 * Create a Stripe Checkout Session for an order.
 *
 * TODO: Implement when Stripe keys are available.
 * Should create a Checkout Session with:
 * - line_items from order items
 * - metadata.order_id = order.id
 * - success_url = /shop/orders/{id}?success=true
 * - cancel_url = /shop/cart?cancelled=true
 */
export async function createCheckoutSession(
  order: ShopOrder,
  _lineItems: Array<{ name: string; quantity: number; priceCents: number }>
): Promise<CheckoutSessionResult> {
  // TODO: Replace with actual Stripe implementation
  console.warn('[Stripe] createCheckoutSession called - Stripe not configured yet');
  console.warn('[Stripe] Order:', order.order_number, 'Total:', order.total_cents);

  return {
    sessionId: null,
    url: null,
    error: 'Stripe is not configured. Set STRIPE_SECRET_KEY to enable payments.',
  };
}

/**
 * Handle Stripe webhook events.
 *
 * TODO: Implement when Stripe keys are available.
 * Should handle:
 * - checkout.session.completed -> update order status to 'paid'
 * - charge.refunded -> update order status to 'refunded'
 */
export async function handleWebhook(
  _payload: string | Buffer,
  _signature: string
): Promise<{ received: boolean; error: string | null }> {
  // TODO: Replace with actual Stripe webhook verification
  console.warn('[Stripe] handleWebhook called - Stripe not configured yet');

  return {
    received: false,
    error: 'Stripe webhook handling is not configured.',
  };
}

/**
 * Check payment status for a Stripe Checkout Session.
 *
 * TODO: Implement when Stripe keys are available.
 */
export async function getPaymentStatus(
  _sessionId: string
): Promise<{ status: string | null; error: string | null }> {
  // TODO: Replace with actual Stripe session retrieval
  console.warn('[Stripe] getPaymentStatus called - Stripe not configured yet');

  return {
    status: null,
    error: 'Stripe is not configured.',
  };
}
