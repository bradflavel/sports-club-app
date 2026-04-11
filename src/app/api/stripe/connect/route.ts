import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  createConnectAccount,
  createConnectAccountLink,
} from '@/features/shop/services/stripe-service';
import { isStripeConfigured } from '@/lib/stripe';

/**
 * POST /api/stripe/connect
 *
 * Initiates Stripe Connect onboarding for the authenticated user's organisation.
 * Creates a connected account if one doesn't exist, then returns an account link URL.
 */
export async function POST() {
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: 'Stripe is not configured.' }, { status: 503 });
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

  // Get user's profile and org
  const { data: profile } = await supabase
    .from('profiles')
    .select('organisation_id, role')
    .eq('id', user.id)
    .single();

  if (!profile?.organisation_id) {
    return NextResponse.json({ error: 'No organisation found' }, { status: 400 });
  }

  if (profile.role !== 'admin' && profile.role !== 'manager') {
    return NextResponse.json({ error: 'Only admins can connect Stripe' }, { status: 403 });
  }

  // Get org's current Stripe state
  const { data: org } = await db
    .from('organisations')
    .select('stripe_account_id')
    .eq('id', profile.organisation_id)
    .single();

  let accountId = org?.stripe_account_id;

  // Create a new connected account if none exists
  if (!accountId) {
    const { accountId: newId, error } = await createConnectAccount();
    if (error || !newId) {
      return NextResponse.json({ error: error || 'Failed to create Stripe account' }, { status: 500 });
    }

    // Save the account ID to the organisation
    const { error: updateError } = await db
      .from('organisations')
      .update({
        stripe_account_id: newId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', profile.organisation_id);

    if (updateError) {
      return NextResponse.json({ error: 'Failed to save Stripe account' }, { status: 500 });
    }

    accountId = newId;
  }

  // Create an account link for onboarding
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const { url, error: linkError } = await createConnectAccountLink(
    accountId,
    `${appUrl}/api/stripe/connect/callback?refresh=true`,
    `${appUrl}/api/stripe/connect/callback`
  );

  if (linkError || !url) {
    return NextResponse.json({ error: linkError || 'Failed to create onboarding link' }, { status: 500 });
  }

  return NextResponse.json({ url });
}
