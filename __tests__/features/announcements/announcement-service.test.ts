import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }));

import { createClient } from '@/lib/supabase/server';
import {
  getAnnouncements,
  getAnnouncementById,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  getRecentAnnouncements,
} from '@/features/announcements/services/announcement-service';

const mockFrom = vi.fn();
const mockSupabase = { from: mockFrom };

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(createClient).mockResolvedValue(mockSupabase as never);
});

const mockAnnouncement = {
  id: 'ann-1',
  organisation_id: 'org-1',
  title: 'Welcome to the Season',
  content: 'The new season kicks off next week.',
  author_id: 'user-1',
  is_pinned: false,
  published_at: '2025-03-01T00:00:00Z',
  expires_at: null,
  created_at: '2025-03-01T00:00:00Z',
  updated_at: '2025-03-01T00:00:00Z',
  author: { id: 'user-1', first_name: 'Admin', last_name: 'User' },
};

describe('getAnnouncements', () => {
  it('returns announcements for an organisation', async () => {
    const builder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockImplementation(function (this: typeof builder) { return this; }),
    };
    // final order() call resolves data
    let orderCallCount = 0;
    builder.order.mockImplementation(function () {
      orderCallCount++;
      if (orderCallCount >= 2) return Promise.resolve({ data: [mockAnnouncement], error: null });
      return builder;
    });
    mockFrom.mockReturnValue(builder);

    const result = await getAnnouncements('org-1');

    expect(mockFrom).toHaveBeenCalledWith('announcements');
    expect(result.data).toHaveLength(1);
    expect(result.error).toBeNull();
  });

  it('returns error when query fails', async () => {
    const dbError = new Error('Connection lost');
    const builder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn(),
    };
    let orderCallCount = 0;
    builder.order.mockImplementation(() => {
      orderCallCount++;
      if (orderCallCount >= 2) return Promise.resolve({ data: null, error: dbError });
      return builder;
    });
    mockFrom.mockReturnValue(builder);

    const result = await getAnnouncements('org-1');

    expect(result.data).toBeNull();
    expect(result.error).toBe(dbError);
  });
});

describe('getAnnouncementById', () => {
  it('returns a single announcement', async () => {
    const builder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockAnnouncement, error: null }),
    };
    mockFrom.mockReturnValue(builder);

    const result = await getAnnouncementById('ann-1');

    expect(result.data).toEqual(mockAnnouncement);
    expect(result.error).toBeNull();
  });

  it('returns error when announcement not found', async () => {
    const dbError = new Error('Not found');
    const builder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: dbError }),
    };
    mockFrom.mockReturnValue(builder);

    const result = await getAnnouncementById('non-existent');

    expect(result.data).toBeNull();
    expect(result.error).toBe(dbError);
  });
});

describe('createAnnouncement', () => {
  it('inserts announcement with provided data', async () => {
    let capturedInsert: unknown;
    const builder = {
      insert: vi.fn().mockImplementation((arg) => { capturedInsert = arg; return builder; }),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockAnnouncement, error: null }),
    };
    mockFrom.mockReturnValue(builder);

    const result = await createAnnouncement({
      organisation_id: 'org-1',
      title: 'Welcome to the Season',
      content: 'The new season kicks off next week.',
      author_id: 'user-1',
    });

    expect(mockFrom).toHaveBeenCalledWith('announcements');
    expect(capturedInsert).toMatchObject({
      title: 'Welcome to the Season',
      content: 'The new season kicks off next week.',
      author_id: 'user-1',
    });
    expect(result.data).toEqual(mockAnnouncement);
    expect(result.error).toBeNull();
  });

  it('defaults is_pinned to false when not provided', async () => {
    let capturedInsert: unknown;
    const builder = {
      insert: vi.fn().mockImplementation((arg) => { capturedInsert = arg; return builder; }),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockAnnouncement, error: null }),
    };
    mockFrom.mockReturnValue(builder);

    await createAnnouncement({
      organisation_id: 'org-1',
      title: 'Test',
      content: 'Test content',
      author_id: 'user-1',
    });

    expect((capturedInsert as Record<string, unknown>).is_pinned).toBe(false);
  });

  it('returns error when insert fails', async () => {
    const dbError = new Error('Insert failed');
    const builder = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: dbError }),
    };
    mockFrom.mockReturnValue(builder);

    const result = await createAnnouncement({
      organisation_id: 'org-1',
      title: 'Test',
      content: 'Content',
      author_id: 'user-1',
    });

    expect(result.data).toBeNull();
    expect(result.error).toBe(dbError);
  });
});

describe('updateAnnouncement', () => {
  it('updates announcement fields', async () => {
    let capturedUpdate: unknown;
    const builder = {
      update: vi.fn().mockImplementation((arg) => { capturedUpdate = arg; return builder; }),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { ...mockAnnouncement, title: 'Updated' }, error: null }),
    };
    mockFrom.mockReturnValue(builder);

    const result = await updateAnnouncement('ann-1', { title: 'Updated' });

    expect(capturedUpdate).toMatchObject({ title: 'Updated' });
    expect(result.data?.title).toBe('Updated');
    expect(result.error).toBeNull();
  });

  it('sets updated_at timestamp', async () => {
    let capturedUpdate: Record<string, unknown> = {};
    const builder = {
      update: vi.fn().mockImplementation((arg) => { capturedUpdate = arg; return builder; }),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockAnnouncement, error: null }),
    };
    mockFrom.mockReturnValue(builder);

    await updateAnnouncement('ann-1', { is_pinned: true });

    expect(capturedUpdate.updated_at).toBeDefined();
  });
});

describe('deleteAnnouncement', () => {
  it('deletes the announcement', async () => {
    const builder = {
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null }),
    };
    mockFrom.mockReturnValue(builder);

    const result = await deleteAnnouncement('ann-1');

    expect(mockFrom).toHaveBeenCalledWith('announcements');
    expect(result.error).toBeNull();
  });

  it('returns error when delete fails', async () => {
    const dbError = new Error('FK constraint');
    const builder = {
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: dbError }),
    };
    mockFrom.mockReturnValue(builder);

    const result = await deleteAnnouncement('ann-1');

    expect(result.error).toBe(dbError);
  });
});

describe('getRecentAnnouncements', () => {
  it('returns limited announcements ordered by published_at', async () => {
    const builder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: [mockAnnouncement], error: null }),
    };
    mockFrom.mockReturnValue(builder);

    const result = await getRecentAnnouncements('org-1', 3);

    expect(builder.limit).toHaveBeenCalledWith(3);
    expect(result.data).toHaveLength(1);
    expect(result.error).toBeNull();
  });

  it('defaults limit to 5', async () => {
    const builder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: [], error: null }),
    };
    mockFrom.mockReturnValue(builder);

    await getRecentAnnouncements('org-1');

    expect(builder.limit).toHaveBeenCalledWith(5);
  });
});
