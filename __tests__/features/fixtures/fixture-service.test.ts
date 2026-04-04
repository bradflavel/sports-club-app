import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }));

import { createClient } from '@/lib/supabase/server';
import {
  createFixture,
  recordResult,
  updateFixture,
  getTeamStats,
} from '@/features/fixtures/services/fixture-service';

// ---------------------------------------------------------------------------
// Supabase mock setup
// ---------------------------------------------------------------------------
const mockFrom = vi.fn();
const mockSupabase = { from: mockFrom };

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(createClient).mockResolvedValue(mockSupabase as never);
});

// ---------------------------------------------------------------------------
// Shared test data
// ---------------------------------------------------------------------------
const mockTeam = {
  id: 'team-1',
  organisation_id: 'org-1',
  name: 'Eagles',
  division: 'Division 1',
  age_group: 'Senior',
  season_id: null,
  coach_id: null,
  manager_id: null,
  max_players: 20,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

const mockFixture = {
  id: 'fixture-1',
  organisation_id: 'org-1',
  season_id: null,
  team_id: 'team-1',
  opponent_name: 'Sharks FC',
  venue: 'Main Oval',
  date_time: '2024-04-10T14:00:00Z',
  is_home: true,
  status: 'scheduled',
  home_score: null,
  away_score: null,
  round_number: 5,
  notes: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  team: mockTeam,
};

// ---------------------------------------------------------------------------
// createFixture
// ---------------------------------------------------------------------------
describe('createFixture', () => {
  it('inserts a fixture with the provided data', async () => {
    let capturedInsertArg: unknown;
    const builder = {
      insert: vi.fn().mockImplementation((arg) => {
        capturedInsertArg = arg;
        return builder;
      }),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockFixture, error: null }),
    };
    mockFrom.mockReturnValue(builder);

    const result = await createFixture({
      organisation_id: 'org-1',
      team_id: 'team-1',
      opponent_name: 'Sharks FC',
      venue: 'Main Oval',
      date_time: '2024-04-10T14:00:00Z',
      is_home: true,
      round_number: 5,
    });

    expect(mockFrom).toHaveBeenCalledWith('fixtures');
    expect(capturedInsertArg).toMatchObject({
      organisation_id: 'org-1',
      team_id: 'team-1',
      opponent_name: 'Sharks FC',
      is_home: true,
    });
    expect(result.error).toBeNull();
  });

  it('defaults status to scheduled when not provided', async () => {
    let capturedInsertArg: unknown;
    const builder = {
      insert: vi.fn().mockImplementation((arg) => {
        capturedInsertArg = arg;
        return builder;
      }),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockFixture, error: null }),
    };
    mockFrom.mockReturnValue(builder);

    await createFixture({
      organisation_id: 'org-1',
      team_id: 'team-1',
      opponent_name: 'Sharks FC',
      date_time: '2024-04-10T14:00:00Z',
      is_home: true,
    });

    expect(capturedInsertArg).toMatchObject({ status: 'scheduled' });
  });

  it('initialises home_score and away_score as null', async () => {
    let capturedInsertArg: unknown;
    const builder = {
      insert: vi.fn().mockImplementation((arg) => {
        capturedInsertArg = arg;
        return builder;
      }),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockFixture, error: null }),
    };
    mockFrom.mockReturnValue(builder);

    await createFixture({
      organisation_id: 'org-1',
      team_id: 'team-1',
      opponent_name: 'Rivals',
      date_time: '2024-04-10T14:00:00Z',
      is_home: false,
    });

    expect(capturedInsertArg).toMatchObject({ home_score: null, away_score: null });
  });

  it('returns error when insert fails', async () => {
    const dbError = new Error('Insert failed');
    const builder = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: dbError }),
    };
    mockFrom.mockReturnValue(builder);

    const result = await createFixture({
      organisation_id: 'org-1',
      team_id: 'team-1',
      opponent_name: 'Rivals',
      date_time: '2024-04-10T14:00:00Z',
      is_home: true,
    });

    expect(result.data).toBeNull();
    expect(result.error).toBe(dbError);
  });
});

// ---------------------------------------------------------------------------
// recordResult
// ---------------------------------------------------------------------------
describe('recordResult', () => {
  it('sets home_score, away_score, and status to completed', async () => {
    let capturedUpdateArg: unknown;
    const builder = {
      update: vi.fn().mockImplementation((arg) => {
        capturedUpdateArg = arg;
        return builder;
      }),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { ...mockFixture, home_score: 3, away_score: 1, status: 'completed' },
        error: null,
      }),
    };
    mockFrom.mockReturnValue(builder);

    const result = await recordResult('fixture-1', 3, 1);

    expect(capturedUpdateArg).toMatchObject({
      home_score: 3,
      away_score: 1,
      status: 'completed',
    });
    expect(result.error).toBeNull();
  });

  it('transitions fixture status to completed', async () => {
    let capturedUpdateArg: unknown;
    const builder = {
      update: vi.fn().mockImplementation((arg) => {
        capturedUpdateArg = arg;
        return builder;
      }),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { ...mockFixture, status: 'completed' },
        error: null,
      }),
    };
    mockFrom.mockReturnValue(builder);

    await recordResult('fixture-1', 0, 0);

    expect((capturedUpdateArg as { status: string }).status).toBe('completed');
  });

  it('handles zero-zero draws', async () => {
    let capturedUpdateArg: unknown;
    const builder = {
      update: vi.fn().mockImplementation((arg) => {
        capturedUpdateArg = arg;
        return builder;
      }),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockFixture, error: null }),
    };
    mockFrom.mockReturnValue(builder);

    await recordResult('fixture-1', 0, 0);

    expect(capturedUpdateArg).toMatchObject({ home_score: 0, away_score: 0 });
  });

  it('returns error when update fails', async () => {
    const dbError = new Error('Fixture not found');
    const builder = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: dbError }),
    };
    mockFrom.mockReturnValue(builder);

    const result = await recordResult('non-existent', 2, 1);

    expect(result.error).toBe(dbError);
  });
});

// ---------------------------------------------------------------------------
// fixture status transitions
// ---------------------------------------------------------------------------
describe('fixture status transitions via updateFixture', () => {
  it('can update status to cancelled', async () => {
    let capturedUpdateArg: unknown;
    const builder = {
      update: vi.fn().mockImplementation((arg) => {
        capturedUpdateArg = arg;
        return builder;
      }),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { ...mockFixture, status: 'cancelled' },
        error: null,
      }),
    };
    mockFrom.mockReturnValue(builder);

    const result = await updateFixture('fixture-1', { status: 'cancelled' });

    expect(capturedUpdateArg).toMatchObject({ status: 'cancelled' });
    expect(result.error).toBeNull();
  });

  it('can update status to postponed', async () => {
    let capturedUpdateArg: unknown;
    const builder = {
      update: vi.fn().mockImplementation((arg) => {
        capturedUpdateArg = arg;
        return builder;
      }),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { ...mockFixture, status: 'postponed' },
        error: null,
      }),
    };
    mockFrom.mockReturnValue(builder);

    const result = await updateFixture('fixture-1', { status: 'postponed' });

    expect(capturedUpdateArg).toMatchObject({ status: 'postponed' });
    expect(result.error).toBeNull();
  });

  it('can update status to in_progress', async () => {
    let capturedUpdateArg: unknown;
    const builder = {
      update: vi.fn().mockImplementation((arg) => {
        capturedUpdateArg = arg;
        return builder;
      }),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { ...mockFixture, status: 'in_progress' },
        error: null,
      }),
    };
    mockFrom.mockReturnValue(builder);

    const result = await updateFixture('fixture-1', { status: 'in_progress' });

    expect(capturedUpdateArg).toMatchObject({ status: 'in_progress' });
    expect(result.error).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// getTeamStats
// ---------------------------------------------------------------------------
describe('getTeamStats', () => {
  // Helper: build a chainable builder where two .eq() calls are supported.
  // getTeamStats does: .select('*').eq('team_id', id).eq('status', 'completed')
  function makeStatsBuilder(resolvedValue: unknown) {
    const innerChain = {
      // The second eq() returns the final promise
      eq: vi.fn().mockResolvedValue(resolvedValue),
    };
    return {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnValue(innerChain),
    };
  }

  it('returns zero stats when team has no completed fixtures', async () => {
    mockFrom.mockReturnValue(makeStatsBuilder({ data: [], error: null }));

    const result = await getTeamStats('team-1');

    expect(result.error).toBeNull();
    expect(result.data).toEqual({
      teamId: 'team-1',
      played: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      pointsFor: 0,
      pointsAgainst: 0,
      pointsDifference: 0,
    });
  });

  it('calculates wins, losses, and draws for home games', async () => {
    // Home team wins: 3-1, loses: 0-2, draws: 1-1
    const fixtures = [
      { id: 'f1', team_id: 'team-1', is_home: true, home_score: 3, away_score: 1, status: 'completed' },
      { id: 'f2', team_id: 'team-1', is_home: true, home_score: 0, away_score: 2, status: 'completed' },
      { id: 'f3', team_id: 'team-1', is_home: true, home_score: 1, away_score: 1, status: 'completed' },
    ];

    mockFrom.mockReturnValue(makeStatsBuilder({ data: fixtures, error: null }));

    const result = await getTeamStats('team-1');

    expect(result.data?.played).toBe(3);
    expect(result.data?.wins).toBe(1);
    expect(result.data?.losses).toBe(1);
    expect(result.data?.draws).toBe(1);
  });

  it('calculates wins, losses, and draws for away games', async () => {
    // Away team: wins (away 2 > home 1), loses (away 0 < home 3), draws (1-1)
    const fixtures = [
      { id: 'f1', team_id: 'team-1', is_home: false, home_score: 1, away_score: 2, status: 'completed' },
      { id: 'f2', team_id: 'team-1', is_home: false, home_score: 3, away_score: 0, status: 'completed' },
      { id: 'f3', team_id: 'team-1', is_home: false, home_score: 1, away_score: 1, status: 'completed' },
    ];

    mockFrom.mockReturnValue(makeStatsBuilder({ data: fixtures, error: null }));

    const result = await getTeamStats('team-1');

    expect(result.data?.wins).toBe(1);
    expect(result.data?.losses).toBe(1);
    expect(result.data?.draws).toBe(1);
  });

  it('calculates correct pointsFor and pointsAgainst for home games', async () => {
    const fixtures = [
      { id: 'f1', team_id: 'team-1', is_home: true, home_score: 3, away_score: 1, status: 'completed' },
      { id: 'f2', team_id: 'team-1', is_home: true, home_score: 2, away_score: 2, status: 'completed' },
    ];

    mockFrom.mockReturnValue(makeStatsBuilder({ data: fixtures, error: null }));

    const result = await getTeamStats('team-1');

    expect(result.data?.pointsFor).toBe(5);       // 3 + 2
    expect(result.data?.pointsAgainst).toBe(3);   // 1 + 2
    expect(result.data?.pointsDifference).toBe(2);
  });

  it('calculates correct pointsFor and pointsAgainst for away games', async () => {
    const fixtures = [
      { id: 'f1', team_id: 'team-1', is_home: false, home_score: 1, away_score: 4, status: 'completed' },
    ];

    mockFrom.mockReturnValue(makeStatsBuilder({ data: fixtures, error: null }));

    const result = await getTeamStats('team-1');

    expect(result.data?.pointsFor).toBe(4);
    expect(result.data?.pointsAgainst).toBe(1);
  });

  it('returns error when query fails', async () => {
    const dbError = new Error('Database error');
    mockFrom.mockReturnValue(makeStatsBuilder({ data: null, error: dbError }));

    const result = await getTeamStats('team-1');

    expect(result.data).toBeNull();
    expect(result.error).toBe(dbError);
  });
});
