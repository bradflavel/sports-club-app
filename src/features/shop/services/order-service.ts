import { createClient as _createClient } from '@/lib/supabase/client';
import type {
  ShopOrder,
  ShopOrderWithItems,
  OrderItem,
  ShopOrderStatus,
  CartItemWithDetails,
} from '@/lib/supabase/database.types';
import type { OrderFilters } from '../types/shop-types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const createClient = () => _createClient() as any;

// ── Create Order ─────────────────────────────────────────────────────────────

export async function createOrder(
  profileId: string,
  orgId: string,
  cartItems: CartItemWithDetails[],
  options?: { discountCodeId?: string; discountCents?: number; notes?: string }
) {
  const supabase = createClient();

  // Generate order number
  const { data: orderNumResult } = await supabase.rpc('generate_order_number', {
    org_id: orgId,
  });

  const orderNumber = (orderNumResult as string) || `ORD-${Date.now()}`;

  // Calculate totals
  const subtotalCents = cartItems.reduce(
    (sum, item) => sum + item.product.price_cents * item.quantity,
    0
  );
  const discountCents = options?.discountCents ?? 0;
  const totalCents = Math.max(0, subtotalCents - discountCents);

  // Create order
  const { data: order, error: orderError } = await supabase
    .from('shop_orders')
    .insert({
      organisation_id: orgId,
      profile_id: profileId,
      order_number: orderNumber,
      status: 'pending' as ShopOrderStatus,
      subtotal_cents: subtotalCents,
      discount_cents: discountCents,
      total_cents: totalCents,
      discount_code_id: options?.discountCodeId ?? null,
      notes: options?.notes ?? null,
    })
    .select('*')
    .single();

  if (orderError || !order) {
    return { data: null, error: orderError };
  }

  const typedOrder = order as unknown as ShopOrder;

  // Create order items (snapshot prices)
  const orderItemsData = cartItems.map((item) => ({
    order_id: typedOrder.id,
    product_id: item.product_id,
    variant_id: item.variant_id,
    product_name: item.product.name,
    variant_label: [item.variant.size, item.variant.colour].filter(Boolean).join(' / ') || null,
    product_type: item.product.product_type,
    quantity: item.quantity,
    unit_price_cents: item.product.price_cents,
  }));

  const { data: orderItems, error: itemsError } = await supabase
    .from('order_items')
    .insert(orderItemsData)
    .select('*');

  if (itemsError) {
    return { data: null, error: itemsError };
  }

  // Deduct stock for physical products
  for (const item of cartItems) {
    if (item.product.product_type === 'physical' && !item.product.is_preorder) {
      await supabase.rpc('', {}).catch(() => {
        // Fallback: update stock manually
      });
      // Decrement stock directly
      const { data: variant } = await supabase
        .from('product_variants')
        .select('stock_quantity')
        .eq('id', item.variant_id)
        .single();

      if (variant) {
        await supabase
          .from('product_variants')
          .update({
            stock_quantity: Math.max(0, variant.stock_quantity - item.quantity),
            updated_at: new Date().toISOString(),
          })
          .eq('id', item.variant_id);
      }
    }
  }

  // Create digital download records for digital products
  const digitalItems = (orderItems as unknown as OrderItem[]).filter(
    (item) => item.product_type === 'digital'
  );

  if (digitalItems.length > 0) {
    const downloadRecords = digitalItems.map((item) => ({
      order_item_id: item.id,
      profile_id: profileId,
      product_id: item.product_id,
      max_downloads: 5,
    }));

    await supabase.from('digital_downloads').insert(downloadRecords);
  }

  // Clear cart
  await supabase
    .from('cart_items')
    .delete()
    .eq('profile_id', profileId)
    .eq('organisation_id', orgId);

  return {
    data: {
      ...typedOrder,
      items: (orderItems ?? []) as unknown as OrderItem[],
      discount_code: null,
    } as ShopOrderWithItems,
    error: null,
  };
}

// ── Read Orders ──────────────────────────────────────────────────────────────

export async function getMyOrders(profileId: string, orgId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('shop_orders')
    .select('*')
    .eq('profile_id', profileId)
    .eq('organisation_id', orgId)
    .order('created_at', { ascending: false });

  return { data: (data ?? []) as unknown as ShopOrder[], error };
}

export async function getOrgOrders(orgId: string, filters?: OrderFilters) {
  const supabase = createClient();
  let query = supabase
    .from('shop_orders')
    .select('*')
    .eq('organisation_id', orgId)
    .order('created_at', { ascending: false });

  if (filters?.status && filters.status.length > 0) {
    query = query.in('status', filters.status as ShopOrderStatus[]);
  }
  if (filters?.search) {
    query = query.ilike('order_number', `%${filters.search}%`);
  }

  const { data, error } = await query;
  return { data: (data ?? []) as unknown as ShopOrder[], error };
}

export async function getOrderDetail(orderId: string) {
  const supabase = createClient();

  const { data: order, error: orderError } = await supabase
    .from('shop_orders')
    .select('*, discount_code:discount_codes(*)')
    .eq('id', orderId)
    .single();

  if (orderError || !order) {
    return { data: null, error: orderError };
  }

  const { data: items, error: itemsError } = await supabase
    .from('order_items')
    .select('*')
    .eq('order_id', orderId)
    .order('created_at', { ascending: true });

  if (itemsError) {
    return { data: null, error: itemsError };
  }

  return {
    data: {
      ...(order as unknown as ShopOrder),
      items: (items ?? []) as unknown as OrderItem[],
      discount_code: (order as Record<string, unknown>).discount_code ?? null,
    } as ShopOrderWithItems,
    error: null,
  };
}

// ── Update Order ─────────────────────────────────────────────────────────────

export async function updateOrderStatus(orderId: string, status: ShopOrderStatus) {
  const supabase = createClient();

  const updateData: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (status === 'collected') {
    updateData.collected_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('shop_orders')
    .update(updateData)
    .eq('id', orderId)
    .select('*')
    .single();

  return { data: data as unknown as ShopOrder | null, error };
}

// ── QR Collection Verification ───────────────────────────────────────────────

export async function verifyCollectionQr(orgId: string, qrToken: string) {
  const supabase = createClient();

  const { data: order, error } = await supabase
    .from('shop_orders')
    .select('*')
    .eq('organisation_id', orgId)
    .eq('collection_qr_token', qrToken)
    .single();

  if (error || !order) {
    return { data: null, error: error || { message: 'Order not found' } };
  }

  const typedOrder = order as unknown as ShopOrder;

  if (typedOrder.status !== 'ready_for_pickup' && typedOrder.status !== 'paid') {
    return {
      data: typedOrder,
      error: { message: `Order cannot be collected (status: ${typedOrder.status})` },
    };
  }

  // Mark as collected
  const { data: updated, error: updateError } = await supabase
    .from('shop_orders')
    .update({
      status: 'collected' as ShopOrderStatus,
      collected_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', typedOrder.id)
    .select('*')
    .single();

  return { data: updated as unknown as ShopOrder | null, error: updateError };
}
