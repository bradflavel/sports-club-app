import Stripe from 'stripe';

/**
 * Shared Stripe client for server-side use.
 *
 * Returns null when STRIPE_SECRET_KEY is not set, allowing the app
 * to boot without Stripe configured (shop runs in catalogue-only mode).
 */
function createStripeClient(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key);
}

export const stripe = createStripeClient();

/** Returns true when all Stripe env vars are configured. */
export function isStripeConfigured(): boolean {
  return !!process.env.STRIPE_SECRET_KEY;
}
