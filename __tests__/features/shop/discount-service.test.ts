import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/supabase/client', () => ({ createClient: vi.fn() }));

import { createClient } from '@/lib/supabase/client';
import {
  getDiscountCodes,
  createDiscountCode,
  updateDiscountCode,
  deactivateDiscountCode,
} from '@/features/shop/services/discount-service';

const mockFrom = vi.fn();
const mockSupabase = { from: mockFrom };

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(createClient).mockReturnValue(mockSupabase as never);
});

const mockDiscount = {
  id: 'dc-1',
  organisation_id: 'org-1',
  code: 'WELCOME20',
  discount_type: 'percentage',
  discount_value: 2000, // 20% in basis points
  is_active: true,
  times_used: 5,
  max_uses: 100,
  max_uses_per_user: 1,
  min_order_cents: null,
  max_discount_cents: null,
  starts_at: null,
  expires_at: null,
  applies_to_product_id: null,
  applies_to_category_id: null,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
};

describe('getDiscountCodes', () => {
  it('returns discount codes for an organisation', async () => {
    const builder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [mockDiscount], error: null }),
    };
    mockFrom.mockReturnValue(builder);

    const result = await getDiscountCodes('org-1');

    expect(mockFrom).toHaveBeenCalledWith('discount_codes');
    expect(result.data).toHaveLength(1);
    expect(result.data[0].code).toBe('WELCOME20');
    expect(result.error).toBeNull();
  });

  it('returns empty array when none exist', async () => {
    const builder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: null, error: null }),
    };
    mockFrom.mockReturnValue(builder);

    const result = await getDiscountCodes('org-1');

    expect(result.data).toEqual([]);
  });
});

describe('createDiscountCode', () => {
  it('creates a discount code with uppercased code', async () => {
    let capturedInsert: Record<string, unknown> = {};
    const builder = {
      insert: vi.fn().mockImplementation((arg) => { capturedInsert = arg; return builder; }),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockDiscount, error: null }),
    };
    mockFrom.mockReturnValue(builder);

    const result = await createDiscountCode({
      organisation_id: 'org-1',
      code: 'welcome20',
      discount_type: 'percentage',
      discount_value: 2000,
      is_active: true,
    } as never);

    expect(capturedInsert.code).toBe('WELCOME20');
    expect(result.data).toEqual(mockDiscount);
    expect(result.error).toBeNull();
  });

  it('returns error when insert fails', async () => {
    const dbError = new Error('Duplicate code');
    const builder = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: dbError }),
    };
    mockFrom.mockReturnValue(builder);

    const result = await createDiscountCode({
      organisation_id: 'org-1',
      code: 'TEST',
      discount_type: 'fixed',
      discount_value: 500,
      is_active: true,
    } as never);

    expect(result.data).toBeNull();
    expect(result.error).toBe(dbError);
  });
});

describe('updateDiscountCode', () => {
  it('updates discount code and uppercases code if changed', async () => {
    let capturedUpdate: Record<string, unknown> = {};
    const builder = {
      update: vi.fn().mockImplementation((arg) => { capturedUpdate = arg; return builder; }),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { ...mockDiscount, code: 'SUMMER30' }, error: null }),
    };
    mockFrom.mockReturnValue(builder);

    const result = await updateDiscountCode('dc-1', { code: 'summer30' } as never);

    expect(capturedUpdate.code).toBe('SUMMER30');
    expect(capturedUpdate.updated_at).toBeDefined();
    expect(result.data?.code).toBe('SUMMER30');
  });
});

describe('deactivateDiscountCode', () => {
  it('sets is_active to false', async () => {
    let capturedUpdate: Record<string, unknown> = {};
    const builder = {
      update: vi.fn().mockImplementation((arg) => { capturedUpdate = arg; return builder; }),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { ...mockDiscount, is_active: false }, error: null }),
    };
    mockFrom.mockReturnValue(builder);

    const result = await deactivateDiscountCode('dc-1');

    expect(capturedUpdate.is_active).toBe(false);
    expect(result.data?.is_active).toBe(false);
  });
});
