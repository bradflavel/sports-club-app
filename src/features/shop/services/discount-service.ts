import { createClient } from '@/lib/supabase/client';
import type { DiscountCode, CartItemWithDetails } from '@/lib/supabase/database.types';
import type { DiscountValidationResult } from '../types/shop-types';

// ── Validate Discount Code ───────────────────────────────────────────────────

export async function validateDiscountCode(
  orgId: string,
  code: string,
  cartItems: CartItemWithDetails[],
  profileId: string
): Promise<DiscountValidationResult> {
  const supabase = createClient();

  // Look up code
  const { data: discountCode, error } = await supabase
    .from('discount_codes')
    .select('*')
    .eq('organisation_id', orgId)
    .eq('code', code.toUpperCase())
    .eq('is_active', true)
    .single();

  if (error || !discountCode) {
    return { valid: false, discountCents: 0, message: 'Invalid discount code' };
  }

  const dc = discountCode as unknown as DiscountCode;
  const now = new Date().toISOString();

  // Check date range
  if (dc.starts_at && now < dc.starts_at) {
    return { valid: false, discountCents: 0, message: 'This code is not yet active' };
  }
  if (dc.expires_at && now > dc.expires_at) {
    return { valid: false, discountCents: 0, message: 'This code has expired' };
  }

  // Check max uses
  if (dc.max_uses !== null && dc.times_used >= dc.max_uses) {
    return { valid: false, discountCents: 0, message: 'This code has reached its usage limit' };
  }

  // Check per-user limit
  if (dc.max_uses_per_user !== null) {
    const { count } = await supabase
      .from('shop_orders')
      .select('*', { count: 'exact', head: true })
      .eq('profile_id', profileId)
      .eq('discount_code_id', dc.id)
      .neq('status', 'cancelled');

    if (count !== null && count >= dc.max_uses_per_user) {
      return { valid: false, discountCents: 0, message: 'You have already used this code' };
    }
  }

  // Calculate applicable subtotal
  let applicableSubtotal = 0;

  for (const item of cartItems) {
    const itemTotal = item.product.price_cents * item.quantity;

    if (dc.applies_to_product_id && item.product_id !== dc.applies_to_product_id) {
      continue;
    }
    if (dc.applies_to_category_id && item.product.category_id !== dc.applies_to_category_id) {
      continue;
    }
    applicableSubtotal += itemTotal;
  }

  if (applicableSubtotal === 0) {
    return { valid: false, discountCents: 0, message: 'This code does not apply to items in your cart' };
  }

  // Check minimum order
  const fullSubtotal = cartItems.reduce(
    (sum, item) => sum + item.product.price_cents * item.quantity,
    0
  );

  if (dc.min_order_cents !== null && fullSubtotal < dc.min_order_cents) {
    const minDollars = (dc.min_order_cents / 100).toFixed(2);
    return {
      valid: false,
      discountCents: 0,
      message: `Minimum order of $${minDollars} required`,
    };
  }

  // Calculate discount
  let discountCents: number;

  if (dc.discount_type === 'percentage') {
    // discount_value is in basis points (e.g. 1500 = 15%)
    discountCents = Math.round((applicableSubtotal * dc.discount_value) / 10000);
    // Apply cap
    if (dc.max_discount_cents !== null && discountCents > dc.max_discount_cents) {
      discountCents = dc.max_discount_cents;
    }
  } else {
    // Fixed amount in cents
    discountCents = Math.min(dc.discount_value, applicableSubtotal);
  }

  return {
    valid: true,
    discountCents,
    discountCode: dc,
  };
}

// ── Increment Usage ──────────────────────────────────────────────────────────

export async function incrementDiscountUsage(discountCodeId: string) {
  const supabase = createClient();

  const { data: current } = await supabase
    .from('discount_codes')
    .select('times_used')
    .eq('id', discountCodeId)
    .single();

  if (current) {
    await supabase
      .from('discount_codes')
      .update({
        times_used: (current.times_used as number) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', discountCodeId);
  }
}

// ── Admin CRUD ───────────────────────────────────────────────────────────────

export async function getDiscountCodes(orgId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('discount_codes')
    .select('*')
    .eq('organisation_id', orgId)
    .order('created_at', { ascending: false });

  return { data: (data ?? []) as unknown as DiscountCode[], error };
}

export async function createDiscountCode(
  codeData: Omit<DiscountCode, 'id' | 'created_at' | 'updated_at' | 'times_used'>
) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('discount_codes')
    .insert({ ...codeData, code: codeData.code.toUpperCase() })
    .select('*')
    .single();

  return { data: data as unknown as DiscountCode | null, error };
}

export async function updateDiscountCode(codeId: string, codeData: Partial<DiscountCode>) {
  const supabase = createClient();
  const updateData = { ...codeData, updated_at: new Date().toISOString() };
  if (updateData.code) updateData.code = updateData.code.toUpperCase();

  const { data, error } = await supabase
    .from('discount_codes')
    .update(updateData)
    .eq('id', codeId)
    .select('*')
    .single();

  return { data: data as unknown as DiscountCode | null, error };
}

export async function deactivateDiscountCode(codeId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('discount_codes')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', codeId)
    .select('*')
    .single();

  return { data: data as unknown as DiscountCode | null, error };
}
