import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/supabase/client', () => ({ createClient: vi.fn() }));

import { createClient } from '@/lib/supabase/client';
import {
  getCartItems,
  addToCart,
  updateCartQuantity,
  removeFromCart,
  clearCart,
  getCartCount,
} from '@/features/shop/services/cart-service';

const mockFrom = vi.fn();
const mockSupabase = { from: mockFrom };

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(createClient).mockReturnValue(mockSupabase as never);
});

const mockCartItem = {
  id: 'cart-1',
  profile_id: 'profile-1',
  organisation_id: 'org-1',
  product_id: 'prod-1',
  variant_id: 'var-1',
  quantity: 2,
  product: { id: 'prod-1', name: 'Club Jersey', price_cents: 5000 },
  variant: { id: 'var-1', name: 'Large', sku: 'JERSEY-L' },
};

describe('getCartItems', () => {
  it('returns cart items for a profile', async () => {
    const builder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [mockCartItem], error: null }),
    };
    mockFrom.mockReturnValue(builder);

    const result = await getCartItems('profile-1', 'org-1');

    expect(mockFrom).toHaveBeenCalledWith('cart_items');
    expect(result.data).toHaveLength(1);
    expect(result.error).toBeNull();
  });

  it('returns empty array when cart is empty', async () => {
    const builder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: null, error: null }),
    };
    mockFrom.mockReturnValue(builder);

    const result = await getCartItems('profile-1', 'org-1');

    expect(result.data).toEqual([]);
  });
});

describe('addToCart', () => {
  it('updates quantity when item already exists in cart', async () => {
    // First call: check existing
    const existingBuilder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: 'cart-1', quantity: 2 }, error: null }),
    };

    // Second call: update quantity
    let capturedUpdate: Record<string, unknown> = {};
    const updateBuilder = {
      update: vi.fn().mockImplementation((arg) => { capturedUpdate = arg; return updateBuilder; }),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { ...mockCartItem, quantity: 3 }, error: null }),
    };

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return existingBuilder;
      return updateBuilder;
    });

    const result = await addToCart('profile-1', 'org-1', 'prod-1', 'var-1', 1);

    expect(capturedUpdate.quantity).toBe(3); // existing 2 + new 1
    expect(result.data?.quantity).toBe(3);
  });

  it('inserts new item when not in cart', async () => {
    // First call: check existing (not found)
    const existingBuilder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    };

    // Second call: insert
    let capturedInsert: Record<string, unknown> = {};
    const insertBuilder = {
      insert: vi.fn().mockImplementation((arg) => { capturedInsert = arg; return insertBuilder; }),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockCartItem, error: null }),
    };

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return existingBuilder;
      return insertBuilder;
    });

    const result = await addToCart('profile-1', 'org-1', 'prod-1', 'var-1', 2);

    expect(capturedInsert).toMatchObject({
      profile_id: 'profile-1',
      organisation_id: 'org-1',
      product_id: 'prod-1',
      variant_id: 'var-1',
      quantity: 2,
    });
    expect(result.data).toEqual(mockCartItem);
  });
});

describe('updateCartQuantity', () => {
  it('updates quantity for a cart item', async () => {
    let capturedUpdate: Record<string, unknown> = {};
    const builder = {
      update: vi.fn().mockImplementation((arg) => { capturedUpdate = arg; return builder; }),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { ...mockCartItem, quantity: 5 }, error: null }),
    };
    mockFrom.mockReturnValue(builder);

    const result = await updateCartQuantity('cart-1', 5);

    expect(capturedUpdate.quantity).toBe(5);
    expect(result.data?.quantity).toBe(5);
  });
});

describe('removeFromCart', () => {
  it('removes item from cart', async () => {
    const builder = {
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null }),
    };
    mockFrom.mockReturnValue(builder);

    const result = await removeFromCart('cart-1');

    expect(mockFrom).toHaveBeenCalledWith('cart_items');
    expect(result.error).toBeNull();
  });
});

describe('clearCart', () => {
  it('removes all cart items for a profile in an org', async () => {
    const builder = {
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
    };
    // Second eq resolves
    let eqCount = 0;
    builder.eq.mockImplementation(() => {
      eqCount++;
      if (eqCount >= 2) return Promise.resolve({ error: null });
      return builder;
    });
    mockFrom.mockReturnValue(builder);

    const result = await clearCart('profile-1', 'org-1');

    expect(result.error).toBeNull();
  });
});

describe('getCartCount', () => {
  it('returns count of items in cart', async () => {
    const builder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
    };
    let eqCount = 0;
    builder.eq.mockImplementation(() => {
      eqCount++;
      if (eqCount >= 2) return Promise.resolve({ count: 3, error: null });
      return builder;
    });
    mockFrom.mockReturnValue(builder);

    const result = await getCartCount('profile-1', 'org-1');

    expect(result.count).toBe(3);
    expect(result.error).toBeNull();
  });

  it('defaults count to 0 when null', async () => {
    const builder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
    };
    let eqCount = 0;
    builder.eq.mockImplementation(() => {
      eqCount++;
      if (eqCount >= 2) return Promise.resolve({ count: null, error: null });
      return builder;
    });
    mockFrom.mockReturnValue(builder);

    const result = await getCartCount('profile-1', 'org-1');

    expect(result.count).toBe(0);
  });
});
