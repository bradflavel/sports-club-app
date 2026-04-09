import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/supabase/client', () => ({ createClient: vi.fn() }));

import { createClient } from '@/lib/supabase/client';
import {
  getCategories,
  createCategory,
  deleteCategory,
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductVariants,
  createVariant,
  deleteVariant,
  checkProductAccess,
} from '@/features/shop/services/shop-service';

const mockFrom = vi.fn();
const mockSupabase = { from: mockFrom };

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(createClient).mockReturnValue(mockSupabase as never);
});

const mockCategory = {
  id: 'cat-1',
  organisation_id: 'org-1',
  name: 'Apparel',
  slug: 'apparel',
  sort_order: 0,
};

const mockProduct = {
  id: 'prod-1',
  organisation_id: 'org-1',
  name: 'Club Jersey',
  slug: 'club-jersey',
  price_cents: 5000,
  category: mockCategory,
};

describe('getCategories', () => {
  it('returns categories sorted by sort_order', async () => {
    const builder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [mockCategory], error: null }),
    };
    mockFrom.mockReturnValue(builder);

    const result = await getCategories('org-1');

    expect(mockFrom).toHaveBeenCalledWith('product_categories');
    expect(result.data).toHaveLength(1);
    expect(result.error).toBeNull();
  });
});

describe('createCategory', () => {
  it('creates a product category', async () => {
    const builder = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockCategory, error: null }),
    };
    mockFrom.mockReturnValue(builder);

    const result = await createCategory({
      organisation_id: 'org-1',
      name: 'Apparel',
      slug: 'apparel',
      sort_order: 0,
    } as never);

    expect(result.data).toEqual(mockCategory);
    expect(result.error).toBeNull();
  });
});

describe('deleteCategory', () => {
  it('deletes the category', async () => {
    const builder = {
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null }),
    };
    mockFrom.mockReturnValue(builder);

    const result = await deleteCategory('cat-1');

    expect(mockFrom).toHaveBeenCalledWith('product_categories');
    expect(result.error).toBeNull();
  });
});

describe('getProducts', () => {
  it('returns products with categories', async () => {
    const builder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      ilike: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [mockProduct], error: null }),
    };
    mockFrom.mockReturnValue(builder);

    const result = await getProducts('org-1');

    expect(mockFrom).toHaveBeenCalledWith('products');
    expect(result.data).toHaveLength(1);
    expect(result.error).toBeNull();
  });

  it('filters by category', async () => {
    const result = { data: [], error: null };
    const builder: Record<string, ReturnType<typeof vi.fn>> = {
      select: vi.fn(),
      eq: vi.fn(),
      ilike: vi.fn(),
      order: vi.fn(),
      then: vi.fn().mockImplementation((resolve: (v: unknown) => void) => resolve(result)),
    };
    // Every chain method returns the builder
    builder.select.mockReturnValue(builder);
    builder.eq.mockReturnValue(builder);
    builder.ilike.mockReturnValue(builder);
    builder.order.mockReturnValue(builder);
    mockFrom.mockReturnValue(builder);

    await getProducts('org-1', { categoryId: 'cat-1' });

    expect(builder.eq).toHaveBeenCalledTimes(2);
  });

  it('filters by search term', async () => {
    const result = { data: [], error: null };
    const builder: Record<string, ReturnType<typeof vi.fn>> = {
      select: vi.fn(),
      eq: vi.fn(),
      ilike: vi.fn(),
      order: vi.fn(),
      then: vi.fn().mockImplementation((resolve: (v: unknown) => void) => resolve(result)),
    };
    builder.select.mockReturnValue(builder);
    builder.eq.mockReturnValue(builder);
    builder.ilike.mockReturnValue(builder);
    builder.order.mockReturnValue(builder);
    mockFrom.mockReturnValue(builder);

    await getProducts('org-1', { search: 'jersey' });

    expect(builder.ilike).toHaveBeenCalledWith('name', '%jersey%');
  });
});

describe('createProduct', () => {
  it('creates a product', async () => {
    const builder = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockProduct, error: null }),
    };
    mockFrom.mockReturnValue(builder);

    const result = await createProduct({
      organisation_id: 'org-1',
      name: 'Club Jersey',
      price_cents: 5000,
    } as never);

    expect(result.data).toEqual(mockProduct);
    expect(result.error).toBeNull();
  });
});

describe('updateProduct', () => {
  it('updates product fields and sets updated_at', async () => {
    let capturedUpdate: Record<string, unknown> = {};
    const builder = {
      update: vi.fn().mockImplementation((arg) => { capturedUpdate = arg; return builder; }),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { ...mockProduct, name: 'Updated Jersey' }, error: null }),
    };
    mockFrom.mockReturnValue(builder);

    const result = await updateProduct('prod-1', { name: 'Updated Jersey' } as never);

    expect(capturedUpdate.name).toBe('Updated Jersey');
    expect(capturedUpdate.updated_at).toBeDefined();
    expect(result.data?.name).toBe('Updated Jersey');
  });
});

describe('deleteProduct', () => {
  it('deletes the product', async () => {
    const builder = {
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null }),
    };
    mockFrom.mockReturnValue(builder);

    const result = await deleteProduct('prod-1');

    expect(result.error).toBeNull();
  });
});

describe('getProductVariants', () => {
  it('returns variants for a product', async () => {
    const mockVariant = { id: 'var-1', name: 'Large', sku: 'JERSEY-L' };
    const builder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [mockVariant], error: null }),
    };
    mockFrom.mockReturnValue(builder);

    const result = await getProductVariants('prod-1');

    expect(mockFrom).toHaveBeenCalledWith('product_variants');
    expect(result.data).toHaveLength(1);
  });
});

describe('createVariant', () => {
  it('creates a product variant', async () => {
    const mockVariant = { id: 'var-1', name: 'Large' };
    const builder = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockVariant, error: null }),
    };
    mockFrom.mockReturnValue(builder);

    const result = await createVariant({ product_id: 'prod-1', name: 'Large' } as never);

    expect(result.data).toEqual(mockVariant);
  });
});

describe('deleteVariant', () => {
  it('deletes a variant', async () => {
    const builder = {
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null }),
    };
    mockFrom.mockReturnValue(builder);

    const result = await deleteVariant('var-1');

    expect(result.error).toBeNull();
  });
});

describe('checkProductAccess', () => {
  it('returns true for unrestricted product', async () => {
    const builder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { is_restricted: false }, error: null }),
    };
    mockFrom.mockReturnValue(builder);

    const result = await checkProductAccess('prod-1', 'profile-1');

    expect(result).toBe(true);
  });

  it('returns true when restricted product has no access rules', async () => {
    const productBuilder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { is_restricted: true }, error: null }),
    };
    const rulesBuilder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ data: [], error: null }),
    };

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return productBuilder;
      return rulesBuilder;
    });

    const result = await checkProductAccess('prod-1', 'profile-1');

    expect(result).toBe(true);
  });

  it('returns true when user role matches access rule', async () => {
    const productBuilder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { is_restricted: true }, error: null }),
    };
    const rulesBuilder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({
        data: [{ allowed_role: 'admin', allowed_team_id: null }],
        error: null,
      }),
    };
    const profileBuilder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { role: 'admin' }, error: null }),
    };

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return productBuilder;
      if (callCount === 2) return rulesBuilder;
      return profileBuilder;
    });

    const result = await checkProductAccess('prod-1', 'profile-1');

    expect(result).toBe(true);
  });

  it('returns false when restricted and user has no matching access', async () => {
    const productBuilder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { is_restricted: true }, error: null }),
    };
    const rulesBuilder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({
        data: [{ allowed_role: 'admin', allowed_team_id: null }],
        error: null,
      }),
    };
    const profileBuilder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { role: 'member' }, error: null }),
    };

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return productBuilder;
      if (callCount === 2) return rulesBuilder;
      return profileBuilder;
    });

    const result = await checkProductAccess('prod-1', 'profile-1');

    expect(result).toBe(false);
  });
});
