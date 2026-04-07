import { createClient } from '@/lib/supabase/client';
import type {
  Product,
  ProductWithCategory,
  ProductWithVariants,
  ProductCategory,
  ProductVariant,
  ProductAccessRule,
} from '@/lib/supabase/database.types';
import type { ShopFilters } from '../types/shop-types';

const PRODUCT_WITH_CATEGORY_SELECT = '*, category:product_categories(*)';

// ── Categories ───────────────────────────────────────────────────────────────

export async function getCategories(orgId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('product_categories')
    .select('*')
    .eq('organisation_id', orgId)
    .order('sort_order', { ascending: true });

  return { data: (data ?? []) as unknown as ProductCategory[], error };
}

export async function getCategoryBySlug(orgId: string, slug: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('product_categories')
    .select('*')
    .eq('organisation_id', orgId)
    .eq('slug', slug)
    .single();

  return { data: data as unknown as ProductCategory | null, error };
}

export async function createCategory(categoryData: Omit<ProductCategory, 'id' | 'created_at' | 'updated_at'>) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('product_categories')
    .insert(categoryData)
    .select('*')
    .single();

  return { data: data as unknown as ProductCategory | null, error };
}

export async function updateCategory(categoryId: string, categoryData: Partial<ProductCategory>) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('product_categories')
    .update({ ...categoryData, updated_at: new Date().toISOString() })
    .eq('id', categoryId)
    .select('*')
    .single();

  return { data: data as unknown as ProductCategory | null, error };
}

export async function deleteCategory(categoryId: string) {
  const supabase = createClient();
  const { error } = await supabase.from('product_categories').delete().eq('id', categoryId);
  return { error };
}

// ── Products ─────────────────────────────────────────────────────────────────

export async function getProducts(orgId: string, filters?: ShopFilters) {
  const supabase = createClient();
  let query = supabase
    .from('products')
    .select(PRODUCT_WITH_CATEGORY_SELECT)
    .eq('organisation_id', orgId)
    .order('sort_order', { ascending: true });

  if (filters?.categoryId) {
    query = query.eq('category_id', filters.categoryId);
  }
  if (filters?.productType) {
    query = query.eq('product_type', filters.productType);
  }
  if (filters?.search) {
    query = query.ilike('name', `%${filters.search}%`);
  }

  const { data, error } = await query;
  return { data: (data ?? []) as unknown as ProductWithCategory[], error };
}

export async function getProductBySlug(orgId: string, slug: string) {
  const supabase = createClient();

  const { data: product, error: productError } = await supabase
    .from('products')
    .select(PRODUCT_WITH_CATEGORY_SELECT)
    .eq('organisation_id', orgId)
    .eq('slug', slug)
    .single();

  if (productError || !product) {
    return { data: null, error: productError };
  }

  const { data: variants, error: variantsError } = await supabase
    .from('product_variants')
    .select('*')
    .eq('product_id', product.id)
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (variantsError) {
    return { data: null, error: variantsError };
  }

  const result = {
    ...(product as unknown as ProductWithCategory),
    variants: (variants ?? []) as unknown as ProductVariant[],
  } as ProductWithVariants;

  return { data: result, error: null };
}

export async function getProductById(productId: string) {
  const supabase = createClient();

  const { data: product, error: productError } = await supabase
    .from('products')
    .select(PRODUCT_WITH_CATEGORY_SELECT)
    .eq('id', productId)
    .single();

  if (productError || !product) {
    return { data: null, error: productError };
  }

  const { data: variants } = await supabase
    .from('product_variants')
    .select('*')
    .eq('product_id', productId)
    .order('sort_order', { ascending: true });

  const { data: accessRules } = await supabase
    .from('product_access_rules')
    .select('*')
    .eq('product_id', productId);

  return {
    data: {
      ...(product as unknown as ProductWithCategory),
      variants: (variants ?? []) as unknown as ProductVariant[],
      access_rules: (accessRules ?? []) as unknown as ProductAccessRule[],
    },
    error: null,
  };
}

export async function getProductVariants(productId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('product_variants')
    .select('*')
    .eq('product_id', productId)
    .order('sort_order', { ascending: true });

  return { data: (data ?? []) as unknown as ProductVariant[], error };
}

// ── Product Access ───────────────────────────────────────────────────────────

export async function checkProductAccess(productId: string, profileId: string): Promise<boolean> {
  const supabase = createClient();

  // Get the product to check if restricted
  const { data: product } = await supabase
    .from('products')
    .select('is_restricted')
    .eq('id', productId)
    .single();

  if (!product || !product.is_restricted) return true;

  // Get access rules
  const { data: rules } = await supabase
    .from('product_access_rules')
    .select('*')
    .eq('product_id', productId);

  if (!rules || rules.length === 0) return true;

  // Get user profile for role check
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', profileId)
    .single();

  for (const rule of rules) {
    // Check role-based access
    if (rule.allowed_role && profile?.role === rule.allowed_role) {
      return true;
    }

    // Check team-based access
    if (rule.allowed_team_id) {
      const { data: member } = await supabase
        .from('members')
        .select('id')
        .eq('profile_id', profileId)
        .single();

      if (member) {
        const { data: teamMember } = await supabase
          .from('team_members')
          .select('id')
          .eq('team_id', rule.allowed_team_id)
          .eq('member_id', member.id)
          .single();

        if (teamMember) return true;
      }
    }
  }

  return false;
}

// ── Admin CRUD ───────────────────────────────────────────────────────────────

export async function createProduct(productData: Omit<Product, 'id' | 'created_at' | 'updated_at'>) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('products')
    .insert(productData)
    .select(PRODUCT_WITH_CATEGORY_SELECT)
    .single();

  return { data: data as unknown as ProductWithCategory | null, error };
}

export async function updateProduct(productId: string, productData: Partial<Product>) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('products')
    .update({ ...productData, updated_at: new Date().toISOString() })
    .eq('id', productId)
    .select(PRODUCT_WITH_CATEGORY_SELECT)
    .single();

  return { data: data as unknown as ProductWithCategory | null, error };
}

export async function deleteProduct(productId: string) {
  const supabase = createClient();
  const { error } = await supabase.from('products').delete().eq('id', productId);
  return { error };
}

// ── Variants Admin ───────────────────────────────────────────────────────────

export async function createVariant(variantData: Omit<ProductVariant, 'id' | 'created_at' | 'updated_at'>) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('product_variants')
    .insert(variantData)
    .select('*')
    .single();

  return { data: data as unknown as ProductVariant | null, error };
}

export async function updateVariant(variantId: string, variantData: Partial<ProductVariant>) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('product_variants')
    .update({ ...variantData, updated_at: new Date().toISOString() })
    .eq('id', variantId)
    .select('*')
    .single();

  return { data: data as unknown as ProductVariant | null, error };
}

export async function deleteVariant(variantId: string) {
  const supabase = createClient();
  const { error } = await supabase.from('product_variants').delete().eq('id', variantId);
  return { error };
}

// ── Access Rules Admin ───────────────────────────────────────────────────────

export async function getAccessRules(productId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('product_access_rules')
    .select('*')
    .eq('product_id', productId);

  return { data: (data ?? []) as unknown as ProductAccessRule[], error };
}

export async function createAccessRule(ruleData: Omit<ProductAccessRule, 'id' | 'created_at'>) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('product_access_rules')
    .insert(ruleData)
    .select('*')
    .single();

  return { data: data as unknown as ProductAccessRule | null, error };
}

export async function deleteAccessRule(ruleId: string) {
  const supabase = createClient();
  const { error } = await supabase.from('product_access_rules').delete().eq('id', ruleId);
  return { error };
}
