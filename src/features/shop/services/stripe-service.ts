import Stripe from 'stripe';
import { stripe, isStripeConfigured } from '@/lib/stripe';
import type { ShopOrder } from '@/lib/supabase/database.types';

export interface CheckoutSessionResult {
  sessionId: string | null;
  url: string | null;
  error: string | null;
}

/**
 * Create a Stripe Checkout Session for an order, charging on behalf
 * of the connected account (Stripe Connect).
 */
export async function createCheckoutSession(
  order: ShopOrder,
  lineItems: Array<{ name: string; quantity: number; priceCents: number }>,
  stripeAccountId: string
): Promise<CheckoutSessionResult> {
  if (!stripe || !isStripeConfigured()) {
    return {
      sessionId: null,
      url: null,
      error: 'Stripe is not configured. Set STRIPE_SECRET_KEY to enable payments.',
    };
  }

  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const session = await stripe.checkout.sessions.create(
      {
        mode: 'payment',
        line_items: lineItems.map((item) => ({
          price_data: {
            currency: 'aud',
            product_data: { name: item.name },
            unit_amount: item.priceCents,
          },
          quantity: item.quantity,
        })),
        metadata: { order_id: order.id },
        success_url: `${appUrl}/shop/orders/${order.id}?success=true`,
        cancel_url: `${appUrl}/shop/cart?cancelled=true`,
      },
      { stripeAccount: stripeAccountId }
    );

    return {
      sessionId: session.id,
      url: session.url,
      error: null,
    };
  } catch (err) {
    const message = err instanceof Stripe.errors.StripeError ? err.message : 'Payment error';
    return { sessionId: null, url: null, error: message };
  }
}

/**
 * Verify and parse a Stripe webhook event.
 */
export function constructWebhookEvent(
  payload: string | Buffer,
  signature: string
): Stripe.Event | null {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !webhookSecret) return null;

  try {
    return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch {
    return null;
  }
}

/**
 * Check payment status for a Stripe Checkout Session.
 */
export async function getPaymentStatus(
  sessionId: string,
  stripeAccountId: string
): Promise<{ status: string | null; error: string | null }> {
  if (!stripe) {
    return { status: null, error: 'Stripe is not configured.' };
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(
      sessionId,
      undefined,
      { stripeAccount: stripeAccountId }
    );
    return { status: session.payment_status, error: null };
  } catch (err) {
    const message = err instanceof Stripe.errors.StripeError ? err.message : 'Unknown error';
    return { status: null, error: message };
  }
}

/**
 * Create a Stripe Connect Account Link for onboarding.
 */
export async function createConnectAccountLink(
  accountId: string,
  refreshUrl: string,
  returnUrl: string
): Promise<{ url: string | null; error: string | null }> {
  if (!stripe) {
    return { url: null, error: 'Stripe is not configured.' };
  }

  try {
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: 'account_onboarding',
    });
    return { url: accountLink.url, error: null };
  } catch (err) {
    const message = err instanceof Stripe.errors.StripeError ? err.message : 'Unknown error';
    return { url: null, error: message };
  }
}

/**
 * Create a new Stripe Connect Standard account.
 */
export async function createConnectAccount(): Promise<{
  accountId: string | null;
  error: string | null;
}> {
  if (!stripe) {
    return { accountId: null, error: 'Stripe is not configured.' };
  }

  try {
    const account = await stripe.accounts.create({ type: 'standard' });
    return { accountId: account.id, error: null };
  } catch (err) {
    const message = err instanceof Stripe.errors.StripeError ? err.message : 'Unknown error';
    return { accountId: null, error: message };
  }
}

/**
 * Retrieve a connected account to check onboarding status.
 */
export async function getConnectAccount(
  accountId: string
): Promise<{ chargesEnabled: boolean; detailsSubmitted: boolean; error: string | null }> {
  if (!stripe) {
    return { chargesEnabled: false, detailsSubmitted: false, error: 'Stripe is not configured.' };
  }

  try {
    const account = await stripe.accounts.retrieve(accountId);
    return {
      chargesEnabled: account.charges_enabled ?? false,
      detailsSubmitted: account.details_submitted ?? false,
      error: null,
    };
  } catch (err) {
    const message = err instanceof Stripe.errors.StripeError ? err.message : 'Unknown error';
    return { chargesEnabled: false, detailsSubmitted: false, error: message };
  }
}

/**
 * Create a Stripe login link so club admins can manage their connected account.
 */
export async function createConnectLoginLink(
  accountId: string
): Promise<{ url: string | null; error: string | null }> {
  if (!stripe) {
    return { url: null, error: 'Stripe is not configured.' };
  }

  try {
    const loginLink = await stripe.accounts.createLoginLink(accountId);
    return { url: loginLink.url, error: null };
  } catch (err) {
    const message = err instanceof Stripe.errors.StripeError ? err.message : 'Unknown error';
    return { url: null, error: message };
  }
}
