import { createClient as _createClient } from '@/lib/supabase/client';
import type { CartItem, CartItemWithDetails } from '@/lib/supabase/database.types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const createClient = () => _createClient() as any;

const CART_WITH_DETAILS_SELECT = '*, product:products(*), variant:product_variants(*)';

export async function getCartItems(profileId: string, orgId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('cart_items')
    .select(CART_WITH_DETAILS_SELECT)
    .eq('profile_id', profileId)
    .eq('organisation_id', orgId)
    .order('created_at', { ascending: true });

  return { data: (data ?? []) as unknown as CartItemWithDetails[], error };
}

export async function addToCart(
  profileId: string,
  orgId: string,
  productId: string,
  variantId: string,
  quantity: number
) {
  const supabase = createClient();

  // Check if item already in cart (upsert)
  const { data: existing } = await supabase
    .from('cart_items')
    .select('id, quantity')
    .eq('profile_id', profileId)
    .eq('variant_id', variantId)
    .single();

  if (existing) {
    const { data, error } = await supabase
      .from('cart_items')
      .update({
        quantity: existing.quantity + quantity,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select(CART_WITH_DETAILS_SELECT)
      .single();

    return { data: data as unknown as CartItemWithDetails | null, error };
  }

  const { data, error } = await supabase
    .from('cart_items')
    .insert({
      profile_id: profileId,
      organisation_id: orgId,
      product_id: productId,
      variant_id: variantId,
      quantity,
    })
    .select(CART_WITH_DETAILS_SELECT)
    .single();

  return { data: data as unknown as CartItemWithDetails | null, error };
}

export async function updateCartQuantity(cartItemId: string, quantity: number) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('cart_items')
    .update({ quantity, updated_at: new Date().toISOString() })
    .eq('id', cartItemId)
    .select(CART_WITH_DETAILS_SELECT)
    .single();

  return { data: data as unknown as CartItemWithDetails | null, error };
}

export async function removeFromCart(cartItemId: string) {
  const supabase = createClient();
  const { error } = await supabase.from('cart_items').delete().eq('id', cartItemId);
  return { error };
}

export async function clearCart(profileId: string, orgId: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from('cart_items')
    .delete()
    .eq('profile_id', profileId)
    .eq('organisation_id', orgId);

  return { error };
}

export async function getCartCount(profileId: string, orgId: string) {
  const supabase = createClient();
  const { count, error } = await supabase
    .from('cart_items')
    .select('*', { count: 'exact', head: true })
    .eq('profile_id', profileId)
    .eq('organisation_id', orgId);

  return { count: count ?? 0, error };
}
