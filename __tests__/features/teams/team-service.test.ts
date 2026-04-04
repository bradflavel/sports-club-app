import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }));

import { createClient } from '@/lib/supabase/server';
import {
  createTeam,
  addTeamMember,
  updateTeamMember,
} from '@/features/teams/services/team-service';

// ---------------------------------------------------------------------------
// Mock Supabase setup
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
const mockProfile = {
  id: 'profile-coach',
  first_name: 'Coach',
  last_name: 'Miller',
  email: 'coach@example.com',
  phone: null,
  date_of_birth: null,
  avatar_url: null,
  organisation_id: 'org-1',
  role: 'coach',
  emergency_contact_name: null,
  emergency_contact_phone: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

const mockTeam = {
  id: 'team-1',
  organisation_id: 'org-1',
  name: 'Eagles U18',
  division: 'Division 1',
  age_group: 'U18',
  season_id: 'season-1',
  coach_id: 'profile-coach',
  manager_id: null,
  max_players: 20,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  coach: mockProfile,
  manager: null,
  season: null,
};

const mockMemberWithProfile = {
  id: 'member-1',
  profile_id: 'profile-1',
  organisation_id: 'org-1',
  membership_type: 'junior',
  membership_status: 'active',
  registration_date: '2024-01-15',
  expiry_date: null,
  medical_conditions: null,
  dietary_requirements: null,
  notes: null,
  created_at: '2024-01-15T00:00:00Z',
  updated_at: '2024-01-15T00:00:00Z',
  profile: {
    id: 'profile-1',
    first_name: 'Alice',
    last_name: 'Johnson',
    email: 'alice@example.com',
    phone: null,
    date_of_birth: null,
    avatar_url: null,
    organisation_id: 'org-1',
    role: 'member',
    emergency_contact_name: null,
    emergency_contact_phone: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
};

const mockTeamMember = {
  id: 'team-member-1',
  team_id: 'team-1',
  member_id: 'member-1',
  jersey_number: 7,
  position: 'Forward',
  is_captain: false,
  joined_at: '2024-01-15T00:00:00Z',
  member: mockMemberWithProfile,
};

// ---------------------------------------------------------------------------
// createTeam
// ---------------------------------------------------------------------------
describe('createTeam', () => {
  it('inserts a team record with the provided data', async () => {
    let capturedInsertArg: unknown;
    const builder = {
      insert: vi.fn().mockImplementation((arg) => {
        capturedInsertArg = arg;
        return builder;
      }),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockTeam, error: null }),
    };
    mockFrom.mockReturnValue(builder);

    const result = await createTeam({
      organisation_id: 'org-1',
      name: 'Eagles U18',
      division: 'Division 1',
      age_group: 'U18',
      max_players: 20,
    });

    expect(mockFrom).toHaveBeenCalledWith('teams');
    expect(capturedInsertArg).toMatchObject({
      organisation_id: 'org-1',
      name: 'Eagles U18',
      max_players: 20,
    });
    expect(result.error).toBeNull();
  });

  it('returns the created team with coach and season relations', async () => {
    const builder = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockTeam, error: null }),
    };
    mockFrom.mockReturnValue(builder);

    const result = await createTeam({
      organisation_id: 'org-1',
      name: 'Eagles U18',
      max_players: 20,
    });

    expect(result.data).toEqual(mockTeam);
    expect(result.error).toBeNull();
  });

  it('defaults optional fields to null', async () => {
    let capturedInsertArg: unknown;
    const builder = {
      insert: vi.fn().mockImplementation((arg) => {
        capturedInsertArg = arg;
        return builder;
      }),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockTeam, error: null }),
    };
    mockFrom.mockReturnValue(builder);

    await createTeam({
      organisation_id: 'org-1',
      name: 'New Team',
      max_players: 15,
    });

    expect(capturedInsertArg).toMatchObject({
      division: null,
      age_group: null,
      season_id: null,
      coach_id: null,
      manager_id: null,
    });
  });

  it('returns error when insert fails', async () => {
    const dbError = new Error('Duplicate team name');
    const builder = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: dbError }),
    };
    mockFrom.mockReturnValue(builder);

    const result = await createTeam({
      organisation_id: 'org-1',
      name: 'Eagles U18',
      max_players: 20,
    });

    expect(result.data).toBeNull();
    expect(result.error).toBe(dbError);
  });
});

// ---------------------------------------------------------------------------
// addTeamMember — captain assignment
// ---------------------------------------------------------------------------
describe('addTeamMember – captain assignment', () => {
  function setupAddMemberMocks(opts: { count: number; maxPlayers: number; insertResult: unknown }) {
    // first call: teams.select().eq().single()
    const teamBuilder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { max_players: opts.maxPlayers }, error: null }),
    };

    // second call: team_members.select('*', { count }).eq()
    const countBuilder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ count: opts.count, error: null }),
    };

    // third call: team_members.insert().select().single()
    const insertBuilder = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue(opts.insertResult),
    };

    let callCount = 0;
    mockFrom.mockImplementation((table: string) => {
      if (table === 'teams') return teamBuilder;
      callCount++;
      if (callCount === 1) return countBuilder;
      return insertBuilder;
    });

    return { teamBuilder, countBuilder, insertBuilder };
  }

  it('assigns captain when is_captain is true', async () => {
    let capturedInsertArg: unknown;
    const teamBuilder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { max_players: 20 }, error: null }),
    };
    const countBuilder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ count: 5, error: null }),
    };
    const insertBuilder = {
      insert: vi.fn().mockImplementation((arg) => {
        capturedInsertArg = arg;
        return insertBuilder;
      }),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { ...mockTeamMember, is_captain: true },
        error: null,
      }),
    };

    let teamMemberCallCount = 0;
    mockFrom.mockImplementation((table: string) => {
      if (table === 'teams') return teamBuilder;
      teamMemberCallCount++;
      if (teamMemberCallCount === 1) return countBuilder;
      return insertBuilder;
    });

    const result = await addTeamMember('team-1', 'member-1', {
      jersey_number: 10,
      position: 'Midfielder',
      is_captain: true,
    });

    expect(capturedInsertArg).toMatchObject({ is_captain: true });
    expect(result.error).toBeNull();
  });

  it('defaults is_captain to false when not provided', async () => {
    let capturedInsertArg: unknown;
    const teamBuilder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { max_players: 20 }, error: null }),
    };
    const countBuilder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ count: 3, error: null }),
    };
    const insertBuilder = {
      insert: vi.fn().mockImplementation((arg) => {
        capturedInsertArg = arg;
        return insertBuilder;
      }),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockTeamMember, error: null }),
    };

    let teamMemberCallCount = 0;
    mockFrom.mockImplementation((table: string) => {
      if (table === 'teams') return teamBuilder;
      teamMemberCallCount++;
      if (teamMemberCallCount === 1) return countBuilder;
      return insertBuilder;
    });

    await addTeamMember('team-1', 'member-1', {});

    expect(capturedInsertArg).toMatchObject({ is_captain: false });
  });
});

// ---------------------------------------------------------------------------
// addTeamMember — max player enforcement
// ---------------------------------------------------------------------------
describe('addTeamMember – max player enforcement', () => {
  it('rejects when team is already at max capacity', async () => {
    const teamBuilder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { max_players: 5 }, error: null }),
    };
    const countBuilder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ count: 5, error: null }),
    };

    let teamMemberCallCount = 0;
    mockFrom.mockImplementation((table: string) => {
      if (table === 'teams') return teamBuilder;
      teamMemberCallCount++;
      return countBuilder;
    });

    const result = await addTeamMember('team-1', 'member-new', {});

    expect(result.data).toBeNull();
    expect(result.error).toBeTruthy();
    expect((result.error as Error).message).toMatch(/maximum/i);
  });

  it('allows adding when count is below max', async () => {
    const teamBuilder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { max_players: 20 }, error: null }),
    };
    const countBuilder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ count: 10, error: null }),
    };
    const insertBuilder = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockTeamMember, error: null }),
    };

    let teamMemberCallCount = 0;
    mockFrom.mockImplementation((table: string) => {
      if (table === 'teams') return teamBuilder;
      teamMemberCallCount++;
      if (teamMemberCallCount === 1) return countBuilder;
      return insertBuilder;
    });

    const result = await addTeamMember('team-1', 'member-1', { jersey_number: 7 });

    expect(result.error).toBeNull();
    expect(result.data).toBeTruthy();
  });

  it('returns error when team fetch fails', async () => {
    const fetchError = new Error('Team not found');
    const teamBuilder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: fetchError }),
    };
    mockFrom.mockReturnValue(teamBuilder);

    const result = await addTeamMember('non-existent', 'member-1', {});

    expect(result.data).toBeNull();
    expect(result.error).toBe(fetchError);
  });
});

// ---------------------------------------------------------------------------
// updateTeamMember — captain update
// ---------------------------------------------------------------------------
describe('updateTeamMember', () => {
  it('updates is_captain field', async () => {
    let capturedUpdateArg: unknown;
    const builder = {
      update: vi.fn().mockImplementation((arg) => {
        capturedUpdateArg = arg;
        return builder;
      }),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { ...mockTeamMember, is_captain: true },
        error: null,
      }),
    };
    mockFrom.mockReturnValue(builder);

    const result = await updateTeamMember('team-member-1', { is_captain: true });

    expect(capturedUpdateArg).toMatchObject({ is_captain: true });
    expect(result.error).toBeNull();
  });

  it('updates jersey number and position', async () => {
    let capturedUpdateArg: unknown;
    const builder = {
      update: vi.fn().mockImplementation((arg) => {
        capturedUpdateArg = arg;
        return builder;
      }),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockTeamMember, error: null }),
    };
    mockFrom.mockReturnValue(builder);

    await updateTeamMember('team-member-1', { jersey_number: 99, position: 'Goalkeeper' });

    expect(capturedUpdateArg).toMatchObject({ jersey_number: 99, position: 'Goalkeeper' });
  });
});
