import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/supabase/client', () => ({ createClient: vi.fn() }));

import { createClient } from '@/lib/supabase/client';
import {
  getClubEventById,
  createClubEvent,
  deleteClubEvent,
  registerForEvent,
  cancelRegistration,
  approveRegistration,
  markAttended,
  getRegistrationCount,
} from '@/features/club-events/services/club-event-service';

const mockFrom = vi.fn();
const mockSupabase = { from: mockFrom };

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(createClient).mockReturnValue(mockSupabase as never);
});

const mockEvent = {
  id: 'event-1',
  organisation_id: 'org-1',
  name: 'Annual Awards Night',
  status: 'published',
  start_time: '2025-06-15T18:00:00Z',
  venue: { id: 'venue-1', name: 'Club House' },
};

describe('getClubEventById', () => {
  it('returns event with venue', async () => {
    const builder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockEvent, error: null }),
    };
    mockFrom.mockReturnValue(builder);

    const result = await getClubEventById('event-1');

    expect(mockFrom).toHaveBeenCalledWith('club_events');
    expect(result.data).toEqual(mockEvent);
    expect(result.error).toBeNull();
  });

  it('returns error when event not found', async () => {
    const dbError = new Error('Not found');
    const builder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: dbError }),
    };
    mockFrom.mockReturnValue(builder);

    const result = await getClubEventById('non-existent');

    expect(result.data).toBeNull();
    expect(result.error).toBe(dbError);
  });
});

describe('createClubEvent', () => {
  it('inserts event and returns it with venue', async () => {
    const builder = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockEvent, error: null }),
    };
    mockFrom.mockReturnValue(builder);

    const result = await createClubEvent({
      organisation_id: 'org-1',
      name: 'Annual Awards Night',
      event_type: 'social',
      status: 'published',
      start_time: '2025-06-15T18:00:00Z',
    } as never);

    expect(result.data).toEqual(mockEvent);
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

    const result = await createClubEvent({ organisation_id: 'org-1', name: 'Test' } as never);

    expect(result.data).toBeNull();
    expect(result.error).toBe(dbError);
  });
});

describe('deleteClubEvent', () => {
  it('deletes the event', async () => {
    const builder = {
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null }),
    };
    mockFrom.mockReturnValue(builder);

    const result = await deleteClubEvent('event-1');

    expect(mockFrom).toHaveBeenCalledWith('club_events');
    expect(result.error).toBeNull();
  });
});

describe('registerForEvent', () => {
  it('registers member when event has no capacity limit', async () => {
    // First call: club_events select for capacity check
    const eventBuilder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { max_attendees: null, enable_waitlist: false, registration_requires_approval: false },
        error: null,
      }),
    };

    // Second call: club_event_registrations insert
    const insertBuilder = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { id: 'reg-1', event_id: 'event-1', member_id: 'member-1', status: 'registered' },
        error: null,
      }),
    };

    mockFrom.mockImplementation((table: string) => {
      if (table === 'club_events') return eventBuilder;
      return insertBuilder;
    });

    const result = await registerForEvent('event-1', 'member-1');

    expect(result.data?.status).toBe('registered');
    expect(result.error).toBeNull();
  });

  it('returns error when event is full and waitlist disabled', async () => {
    const eventBuilder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { max_attendees: 10, enable_waitlist: false, registration_requires_approval: false },
        error: null,
      }),
    };

    const countBuilder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockResolvedValue({ count: 10, error: null }),
    };

    let regCallCount = 0;
    mockFrom.mockImplementation((table: string) => {
      if (table === 'club_events') return eventBuilder;
      regCallCount++;
      return countBuilder;
    });

    const result = await registerForEvent('event-1', 'member-1');

    expect(result.data).toBeNull();
    expect(result.error).toMatchObject({ message: expect.stringContaining('full') });
  });

  it('waitlists member when event is full and waitlist enabled', async () => {
    const eventBuilder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { max_attendees: 5, enable_waitlist: true, registration_requires_approval: false },
        error: null,
      }),
    };

    const countBuilder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockResolvedValue({ count: 5, error: null }),
    };

    const insertBuilder = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { id: 'reg-2', event_id: 'event-1', member_id: 'member-1', status: 'waitlisted' },
        error: null,
      }),
    };

    let regCallCount = 0;
    mockFrom.mockImplementation((table: string) => {
      if (table === 'club_events') return eventBuilder;
      regCallCount++;
      if (regCallCount === 1) return countBuilder;
      return insertBuilder;
    });

    const result = await registerForEvent('event-1', 'member-1');

    expect(result.data?.status).toBe('waitlisted');
  });

  it('defaults guest_count to 0', async () => {
    let capturedInsert: Record<string, unknown> = {};
    const eventBuilder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { max_attendees: null, enable_waitlist: false, registration_requires_approval: false },
        error: null,
      }),
    };
    const insertBuilder = {
      insert: vi.fn().mockImplementation((arg) => { capturedInsert = arg; return insertBuilder; }),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: 'reg-3', status: 'registered' }, error: null }),
    };

    mockFrom.mockImplementation((table: string) => {
      if (table === 'club_events') return eventBuilder;
      return insertBuilder;
    });

    await registerForEvent('event-1', 'member-1');

    expect(capturedInsert.guest_count).toBe(0);
  });
});

describe('cancelRegistration', () => {
  it('sets status to cancelled and records cancelled_at', async () => {
    let capturedUpdate: Record<string, unknown> = {};
    const builder = {
      update: vi.fn().mockImplementation((arg) => { capturedUpdate = arg; return builder; }),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { id: 'reg-1', status: 'cancelled' },
        error: null,
      }),
    };
    mockFrom.mockReturnValue(builder);

    const result = await cancelRegistration('reg-1');

    expect(capturedUpdate.status).toBe('cancelled');
    expect(capturedUpdate.cancelled_at).toBeDefined();
    expect(result.data?.status).toBe('cancelled');
  });
});

describe('approveRegistration', () => {
  it('sets status to approved and records approved_at', async () => {
    let capturedUpdate: Record<string, unknown> = {};
    const builder = {
      update: vi.fn().mockImplementation((arg) => { capturedUpdate = arg; return builder; }),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { id: 'reg-1', status: 'approved' },
        error: null,
      }),
    };
    mockFrom.mockReturnValue(builder);

    const result = await approveRegistration('reg-1');

    expect(capturedUpdate.status).toBe('approved');
    expect(capturedUpdate.approved_at).toBeDefined();
    expect(result.data?.status).toBe('approved');
  });
});

describe('markAttended', () => {
  it('sets status to attended', async () => {
    let capturedUpdate: Record<string, unknown> = {};
    const builder = {
      update: vi.fn().mockImplementation((arg) => { capturedUpdate = arg; return builder; }),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { id: 'reg-1', status: 'attended' },
        error: null,
      }),
    };
    mockFrom.mockReturnValue(builder);

    const result = await markAttended('reg-1');

    expect(capturedUpdate.status).toBe('attended');
    expect(result.data?.status).toBe('attended');
  });
});

describe('getRegistrationCount', () => {
  it('returns count of active registrations', async () => {
    const builder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockResolvedValue({ count: 42, error: null }),
    };
    mockFrom.mockReturnValue(builder);

    const result = await getRegistrationCount('event-1');

    expect(result.count).toBe(42);
    expect(result.error).toBeNull();
  });

  it('defaults count to 0 when null', async () => {
    const builder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockResolvedValue({ count: null, error: null }),
    };
    mockFrom.mockReturnValue(builder);

    const result = await getRegistrationCount('event-1');

    expect(result.count).toBe(0);
  });
});
