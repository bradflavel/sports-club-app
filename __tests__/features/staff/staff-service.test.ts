import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/supabase/client', () => ({ createClient: vi.fn() }));

import { createClient } from '@/lib/supabase/client';
import {
  getStaff,
  getStaffById,
  createStaff,
  updateStaff,
  deleteStaff,
  getStaffStats,
} from '@/features/staff/services/staff-service';

const mockFrom = vi.fn();
const mockSupabase = { from: mockFrom };

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(createClient).mockReturnValue(mockSupabase as never);
});

const mockStaffMember = {
  id: 'staff-1',
  profile_id: 'profile-1',
  organisation_id: 'org-1',
  staff_type_id: 'type-1',
  member_id: null,
  status: 'active',
  position: 'Head Coach',
  start_date: '2025-01-01',
  end_date: null,
  notes: null,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
  profile: { id: 'profile-1', first_name: 'John', last_name: 'Smith', email: 'john@example.com' },
  staff_type: { id: 'type-1', name: 'Coach' },
  member: null,
};

describe('getStaff', () => {
  it('returns staff list with details', async () => {
    const builder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [mockStaffMember], count: 1, error: null }),
    };
    mockFrom.mockReturnValue(builder);

    const result = await getStaff('org-1');

    expect(mockFrom).toHaveBeenCalledWith('staff');
    expect(result.data).toHaveLength(1);
    expect(result.count).toBe(1);
    expect(result.error).toBeNull();
  });

  it('filters by staff type', async () => {
    const result = { data: [mockStaffMember], count: 1, error: null };
    const builder: Record<string, ReturnType<typeof vi.fn>> = {
      select: vi.fn(),
      eq: vi.fn(),
      order: vi.fn(),
      then: vi.fn().mockImplementation((resolve: (v: unknown) => void) => resolve(result)),
    };
    builder.select.mockReturnValue(builder);
    builder.eq.mockReturnValue(builder);
    builder.order.mockReturnValue(builder);
    mockFrom.mockReturnValue(builder);

    await getStaff('org-1', { staffTypeId: 'type-1' });

    // eq is called for org_id, staff_type_id
    expect(builder.eq).toHaveBeenCalledTimes(2);
  });

  it('filters by search term across name and email', async () => {
    const builder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [mockStaffMember], count: 1, error: null }),
    };
    mockFrom.mockReturnValue(builder);

    const result = await getStaff('org-1', { search: 'john' });

    expect(result.data).toHaveLength(1);
  });

  it('filters out non-matching search results', async () => {
    const builder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [mockStaffMember], count: 1, error: null }),
    };
    mockFrom.mockReturnValue(builder);

    const result = await getStaff('org-1', { search: 'nonexistent' });

    expect(result.data).toHaveLength(0);
  });
});

describe('getStaffById', () => {
  it('returns a single staff record', async () => {
    const builder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockStaffMember, error: null }),
    };
    mockFrom.mockReturnValue(builder);

    const result = await getStaffById('staff-1');

    expect(result.data).toEqual(mockStaffMember);
    expect(result.error).toBeNull();
  });
});

describe('createStaff', () => {
  it('creates staff with provided data', async () => {
    let capturedInsert: Record<string, unknown> = {};
    const builder = {
      insert: vi.fn().mockImplementation((arg) => { capturedInsert = arg; return builder; }),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockStaffMember, error: null }),
    };
    mockFrom.mockReturnValue(builder);

    const result = await createStaff({
      profile_id: 'profile-1',
      organisation_id: 'org-1',
      staff_type_id: 'type-1',
      position: 'Head Coach',
    });

    expect(capturedInsert).toMatchObject({
      profile_id: 'profile-1',
      organisation_id: 'org-1',
      staff_type_id: 'type-1',
      position: 'Head Coach',
    });
    expect(result.data).toEqual(mockStaffMember);
    expect(result.error).toBeNull();
  });

  it('defaults status to pending', async () => {
    let capturedInsert: Record<string, unknown> = {};
    const builder = {
      insert: vi.fn().mockImplementation((arg) => { capturedInsert = arg; return builder; }),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockStaffMember, error: null }),
    };
    mockFrom.mockReturnValue(builder);

    await createStaff({
      profile_id: 'profile-1',
      organisation_id: 'org-1',
      staff_type_id: 'type-1',
    });

    expect(capturedInsert.status).toBe('pending');
  });

  it('defaults optional fields to null', async () => {
    let capturedInsert: Record<string, unknown> = {};
    const builder = {
      insert: vi.fn().mockImplementation((arg) => { capturedInsert = arg; return builder; }),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockStaffMember, error: null }),
    };
    mockFrom.mockReturnValue(builder);

    await createStaff({
      profile_id: 'profile-1',
      organisation_id: 'org-1',
      staff_type_id: 'type-1',
    });

    expect(capturedInsert.member_id).toBeNull();
    expect(capturedInsert.position).toBeNull();
    expect(capturedInsert.notes).toBeNull();
  });

  it('returns error when insert fails', async () => {
    const dbError = new Error('Insert failed');
    const builder = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: dbError }),
    };
    mockFrom.mockReturnValue(builder);

    const result = await createStaff({
      profile_id: 'p-1',
      organisation_id: 'org-1',
      staff_type_id: 'type-1',
    });

    expect(result.data).toBeNull();
    expect(result.error).toBe(dbError);
  });
});

describe('updateStaff', () => {
  it('updates staff fields and sets updated_at', async () => {
    let capturedUpdate: Record<string, unknown> = {};
    const builder = {
      update: vi.fn().mockImplementation((arg) => { capturedUpdate = arg; return builder; }),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { ...mockStaffMember, status: 'inactive' }, error: null }),
    };
    mockFrom.mockReturnValue(builder);

    const result = await updateStaff('staff-1', { status: 'inactive' as never });

    expect(capturedUpdate.status).toBe('inactive');
    expect(capturedUpdate.updated_at).toBeDefined();
    expect(result.data?.status).toBe('inactive');
  });
});

describe('deleteStaff', () => {
  it('deletes the staff record', async () => {
    const builder = {
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null }),
    };
    mockFrom.mockReturnValue(builder);

    const result = await deleteStaff('staff-1');

    expect(mockFrom).toHaveBeenCalledWith('staff');
    expect(result.error).toBeNull();
  });
});

describe('getStaffStats', () => {
  it('returns correct stats', async () => {
    const totalBuilder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ count: 25, error: null }),
    };
    const activeBuilder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
    };
    let activeEqCount = 0;
    activeBuilder.eq.mockImplementation(() => {
      activeEqCount++;
      if (activeEqCount >= 2) return Promise.resolve({ count: 20, error: null });
      return activeBuilder;
    });
    const expiringBuilder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      not: vi.fn().mockReturnThis(),
      lte: vi.fn().mockResolvedValue({ count: 3, error: null }),
    };

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return totalBuilder;
      if (callCount === 2) return activeBuilder;
      return expiringBuilder;
    });

    const result = await getStaffStats('org-1');

    expect(result.total).toBe(25);
    expect(result.active).toBe(20);
    expect(result.expiringAccreditations).toBe(3);
  });

  it('defaults counts to 0 when null', async () => {
    // total: from('staff').select().eq() => resolves
    const totalBuilder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ count: null, error: null }),
    };
    // active: from('staff').select().eq().eq() => two chained eq calls
    const activeBuilder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
    };
    let activeEqCount = 0;
    activeBuilder.eq.mockImplementation(() => {
      activeEqCount++;
      if (activeEqCount >= 2) return Promise.resolve({ count: null, error: null });
      return activeBuilder;
    });
    // expiring: from('staff_accreditations').select().eq().eq().not().lte()
    const expiringBuilder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      not: vi.fn().mockReturnThis(),
      lte: vi.fn().mockResolvedValue({ count: null, error: null }),
    };

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return totalBuilder;
      if (callCount === 2) return activeBuilder;
      return expiringBuilder;
    });

    const result = await getStaffStats('org-1');

    expect(result.total).toBe(0);
    expect(result.active).toBe(0);
    expect(result.expiringAccreditations).toBe(0);
  });
});
