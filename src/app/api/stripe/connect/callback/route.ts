import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getConnectAccount } from '@/features/shop/services/stripe-service';

/**
 * GET /api/stripe/connect/callback
 *
 * Called when a user returns from Stripe Connect onboarding.
 * Checks the connected account status and updates the organisation.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const isRefresh = searchParams.get('refresh') === 'true';
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(`${appUrl}/login`);
  }

  // If this is a refresh (user abandoned onboarding), redirect back to connect
  if (isRefresh) {
    return NextResponse.redirect(`${appUrl}/club?edit=true&tab=payments&stripe=refresh`);
  }

  // Get user's org
  const { data: profile } = await supabase
    .from('profiles')
    .select('organisation_id')
    .eq('id', user.id)
    .single();

  if (!profile?.organisation_id) {
    return NextResponse.redirect(`${appUrl}/club?edit=true&tab=payments&stripe=error`);
  }

  const { data: org } = await db
    .from('organisations')
    .select('stripe_account_id')
    .eq('id', profile.organisation_id)
    .single();

  if (!org?.stripe_account_id) {
    return NextResponse.redirect(`${appUrl}/club?edit=true&tab=payments&stripe=error`);
  }

  // Check the account status with Stripe
  const { chargesEnabled, detailsSubmitted } = await getConnectAccount(org.stripe_account_id);

  // Update the organisation's onboarding status
  await db
    .from('organisations')
    .update({
      stripe_onboarding_complete: chargesEnabled && detailsSubmitted,
      updated_at: new Date().toISOString(),
    })
    .eq('id', profile.organisation_id);

  const status = chargesEnabled && detailsSubmitted ? 'success' : 'pending';
  return NextResponse.redirect(`${appUrl}/club?edit=true&tab=payments&stripe=${status}`);
}
