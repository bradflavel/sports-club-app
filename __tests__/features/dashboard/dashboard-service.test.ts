import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }));

import { createClient } from '@/lib/supabase/server';
import {
  getAdminDashboardData,
  getMemberDashboardData,
} from '@/features/dashboard/services/dashboard-service';

const mockFrom = vi.fn();
const mockSupabase = { from: mockFrom };

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(createClient).mockResolvedValue(mockSupabase as never);
});

describe('getAdminDashboardData', () => {
  function setupAdminMocks(opts: {
    memberCount?: number | null;
    teamCount?: number | null;
    fixtureCount?: number | null;
    payments?: Array<{ amount_cents: number; payment_status: string }> | null;
    error?: Error | null;
  }) {
    const memberBuilder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockImplementation(function (this: typeof memberBuilder) { return this; }),
    };
    // Resolve on last eq() call
    let memberEqCount = 0;
    memberBuilder.eq.mockImplementation(function () {
      memberEqCount++;
      if (memberEqCount >= 2) return Promise.resolve({ count: opts.memberCount ?? 0, error: opts.error ?? null });
      return memberBuilder;
    });

    const teamBuilder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ count: opts.teamCount ?? 0, error: null }),
    };

    const fixtureBuilder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockResolvedValue({ count: opts.fixtureCount ?? 0, error: null }),
    };
    // Handle multiple eq calls for fixture
    let fixtureEqCount = 0;
    fixtureBuilder.eq.mockImplementation(function () {
      fixtureEqCount++;
      if (fixtureEqCount >= 2) return fixtureBuilder; // return self until gte
      return fixtureBuilder;
    });

    const paymentBuilder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockResolvedValue({ data: opts.payments ?? [], error: null }),
    };

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return memberBuilder;
      if (callCount === 2) return teamBuilder;
      if (callCount === 3) return fixtureBuilder;
      return paymentBuilder;
    });
  }

  it('calculates correct dashboard totals', async () => {
    setupAdminMocks({
      memberCount: 50,
      teamCount: 8,
      fixtureCount: 12,
      payments: [
        { amount_cents: 5000, payment_status: 'pending' },
        { amount_cents: 3000, payment_status: 'overdue' },
      ],
    });

    const result = await getAdminDashboardData('org-1');

    expect(result.data).toBeTruthy();
    expect(result.data!.memberCount).toBe(50);
    expect(result.data!.teamCount).toBe(8);
    expect(result.data!.upcomingFixtureCount).toBe(12);
    expect(result.data!.outstandingPaymentsTotal).toBe(80); // (5000 + 3000) / 100
    expect(result.error).toBeNull();
  });

  it('returns zero outstanding when no payments exist', async () => {
    setupAdminMocks({
      memberCount: 10,
      teamCount: 2,
      fixtureCount: 0,
      payments: [],
    });

    const result = await getAdminDashboardData('org-1');

    expect(result.data!.outstandingPaymentsTotal).toBe(0);
  });

  it('defaults counts to 0 when null', async () => {
    setupAdminMocks({
      memberCount: null,
      teamCount: null,
      fixtureCount: null,
      payments: null,
    });

    const result = await getAdminDashboardData('org-1');

    expect(result.data!.memberCount).toBe(0);
    expect(result.data!.teamCount).toBe(0);
    expect(result.data!.upcomingFixtureCount).toBe(0);
  });

  it('returns error when any query fails', async () => {
    const dbError = new Error('DB down');
    setupAdminMocks({ error: dbError });

    const result = await getAdminDashboardData('org-1');

    expect(result.data).toBeNull();
    expect(result.error).toBe(dbError);
  });
});

describe('getMemberDashboardData', () => {
  it('returns error when member record not found', async () => {
    const memberBuilder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: new Error('Not found') }),
    };
    // Handle multiple eq calls
    let eqCount = 0;
    memberBuilder.eq.mockImplementation(function () {
      eqCount++;
      if (eqCount >= 2) return memberBuilder;
      return memberBuilder;
    });
    mockFrom.mockReturnValue(memberBuilder);

    const result = await getMemberDashboardData('user-1', 'org-1');

    expect(result.data).toBeNull();
    expect(result.error).toBeTruthy();
  });

  it('returns teams, fixtures, and payments for a member', async () => {
    // members select
    const memberBuilder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: 'member-1' }, error: null }),
    };

    // team_members select
    const teamMembersBuilder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ data: [{ team_id: 'team-1' }], error: null }),
    };

    // teams select
    const teamsBuilder = {
      select: vi.fn().mockReturnThis(),
      in: vi.fn().mockResolvedValue({ data: [{ id: 'team-1', name: 'Eagles', division: 'Div 1' }], error: null }),
    };

    // fixtures select
    const fixturesBuilder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: [], error: null }),
    };

    // payments select
    const paymentsBuilder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
    };

    let callCount = 0;
    mockFrom.mockImplementation((table: string) => {
      callCount++;
      if (table === 'members') return memberBuilder;
      if (table === 'team_members') return teamMembersBuilder;
      if (table === 'teams') return teamsBuilder;
      if (table === 'fixtures') return fixturesBuilder;
      if (table === 'payments') return paymentsBuilder;
      return memberBuilder;
    });

    const result = await getMemberDashboardData('user-1', 'org-1');

    expect(result.data).toBeTruthy();
    expect(result.data!.teams).toHaveLength(1);
    expect(result.data!.teams[0].name).toBe('Eagles');
    expect(result.error).toBeNull();
  });
});
