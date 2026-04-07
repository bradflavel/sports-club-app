import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/shop/verify-collection
 *
 * Verifies a QR code token and marks the order as collected.
 * Used by the admin QR scanner.
 *
 * Body: { qrToken: string, orgId: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { qrToken, orgId } = body;

    if (!qrToken || !orgId) {
      return NextResponse.json({ error: 'Missing qrToken or orgId' }, { status: 400 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = await createClient() as any;

    // Verify the user is an admin
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Look up order by QR token
    const { data: order, error: orderError } = await supabase
      .from('shop_orders')
      .select('*')
      .eq('organisation_id', orgId)
      .eq('collection_qr_token', qrToken)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const status = order.status as string;

    if (status !== 'ready_for_pickup' && status !== 'paid') {
      return NextResponse.json(
        { error: `Order cannot be collected (status: ${status})`, order },
        { status: 400 }
      );
    }

    // Mark as collected
    const { data: updated, error: updateError } = await supabase
      .from('shop_orders')
      .update({
        status: 'collected',
        collected_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', order.id as string)
      .select('*')
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, order: updated });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
