import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/supabase/client', () => ({ createClient: vi.fn() }));

import { createClient } from '@/lib/supabase/client';
import {
  getActivities,
  getActivityById,
  getActivityBySlug,
  createActivity,
  updateActivity,
  deleteActivity,
} from '@/features/activities/services/activity-service';

const mockFrom = vi.fn();
const mockSupabase = { from: mockFrom };

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(createClient).mockReturnValue(mockSupabase as never);
});

const mockActivity = {
  id: 'act-1',
  organisation_id: 'org-1',
  name: 'Winter Competition 2025',
  slug: 'winter-comp-2025',
  activity_type: 'competition',
  start_date: '2025-04-01',
  end_date: '2025-09-30',
  is_current: true,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
};

describe('getActivities', () => {
  it('returns activities with team counts', async () => {
    const builder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      ilike: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: [{ ...mockActivity, activity_teams: [{ id: 't-1' }, { id: 't-2' }] }],
        error: null,
      }),
    };
    mockFrom.mockReturnValue(builder);

    const result = await getActivities('org-1');

    expect(mockFrom).toHaveBeenCalledWith('activities');
    expect(result.data).toHaveLength(1);
    expect(result.data![0].teams).toHaveLength(2);
    expect(result.error).toBeNull();
  });

  it('filters by activity type', async () => {
    const builder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [{ ...mockActivity, activity_teams: [] }], error: null }),
    };
    mockFrom.mockReturnValue(builder);

    await getActivities('org-1', { activityType: 'competition' as never });

    // eq called for org_id and activity_type
    expect(builder.eq).toHaveBeenCalledTimes(2);
  });

  it('filters by search term', async () => {
    const builder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      ilike: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
    };
    mockFrom.mockReturnValue(builder);

    await getActivities('org-1', { search: 'winter' });

    expect(builder.ilike).toHaveBeenCalledWith('name', '%winter%');
  });

  it('returns error when query fails', async () => {
    const dbError = new Error('Query failed');
    const builder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: null, error: dbError }),
    };
    mockFrom.mockReturnValue(builder);

    const result = await getActivities('org-1');

    expect(result.data).toBeNull();
    expect(result.error).toBe(dbError);
  });
});

describe('getActivityById', () => {
  it('returns a single activity', async () => {
    const builder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockActivity, error: null }),
    };
    mockFrom.mockReturnValue(builder);

    const result = await getActivityById('act-1');

    expect(result.data).toEqual(mockActivity);
    expect(result.error).toBeNull();
  });
});

describe('getActivityBySlug', () => {
  it('returns activity by org and slug', async () => {
    const builder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockActivity, error: null }),
    };
    mockFrom.mockReturnValue(builder);

    const result = await getActivityBySlug('org-1', 'winter-comp-2025');

    expect(result.data).toEqual(mockActivity);
  });
});

describe('createActivity', () => {
  it('creates activity and returns it with empty teams', async () => {
    const builder = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockActivity, error: null }),
    };
    mockFrom.mockReturnValue(builder);

    const result = await createActivity({
      organisation_id: 'org-1',
      name: 'Winter Competition 2025',
      slug: 'winter-comp-2025',
      activity_type: 'competition',
    } as never);

    expect(result.data?.teams).toEqual([]);
    expect(result.data?.event_count).toBe(0);
    expect(result.error).toBeNull();
  });

  it('returns error when insert fails', async () => {
    const dbError = new Error('Insert failed');
    const builder = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: dbError }),
    };
    mockFrom.mockReturnValue(builder);

    const result = await createActivity({ organisation_id: 'org-1', name: 'Test' } as never);

    expect(result.data).toBeNull();
    expect(result.error).toBe(dbError);
  });
});

describe('updateActivity', () => {
  it('updates activity and sets updated_at', async () => {
    let capturedUpdate: Record<string, unknown> = {};
    const builder = {
      update: vi.fn().mockImplementation((arg) => { capturedUpdate = arg; return builder; }),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { ...mockActivity, name: 'Updated' }, error: null }),
    };
    mockFrom.mockReturnValue(builder);

    const result = await updateActivity('act-1', { name: 'Updated' });

    expect(capturedUpdate.name).toBe('Updated');
    expect(capturedUpdate.updated_at).toBeDefined();
    expect(result.data?.name).toBe('Updated');
  });
});

describe('deleteActivity', () => {
  it('deletes the activity', async () => {
    const builder = {
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null }),
    };
    mockFrom.mockReturnValue(builder);

    const result = await deleteActivity('act-1');

    expect(mockFrom).toHaveBeenCalledWith('activities');
    expect(result.error).toBeNull();
  });
});
