import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }));

import { createClient } from '@/lib/supabase/server';
import {
  getOrganisation,
  getOrganisationBySlug,
  createOrganisation,
  updateOrganisation,
  deleteOrganisation,
} from '@/features/organisations/services/org-service';

const mockFrom = vi.fn();
const mockSupabase = { from: mockFrom };

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(createClient).mockResolvedValue(mockSupabase as never);
});

const mockOrg = {
  id: 'org-1',
  name: 'Riverside FC',
  slug: 'riverside-fc-a1b2',
  sport_type: 'football',
  logo_url: null,
  primary_colour: '#003366',
  secondary_colour: '#FFFFFF',
  contact_email: 'info@riverside.com',
  contact_phone: null,
  address: null,
  website: null,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
};

describe('getOrganisation', () => {
  it('returns an organisation by id', async () => {
    const builder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockOrg, error: null }),
    };
    mockFrom.mockReturnValue(builder);

    const result = await getOrganisation('org-1');

    expect(mockFrom).toHaveBeenCalledWith('organisations');
    expect(result.data).toEqual(mockOrg);
    expect(result.error).toBeNull();
  });

  it('returns error when not found', async () => {
    const dbError = new Error('Not found');
    const builder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: dbError }),
    };
    mockFrom.mockReturnValue(builder);

    const result = await getOrganisation('non-existent');

    expect(result.data).toBeNull();
    expect(result.error).toBe(dbError);
  });
});

describe('getOrganisationBySlug', () => {
  it('returns an organisation by slug', async () => {
    const builder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockOrg, error: null }),
    };
    mockFrom.mockReturnValue(builder);

    const result = await getOrganisationBySlug('riverside-fc-a1b2');

    expect(result.data).toEqual(mockOrg);
    expect(result.error).toBeNull();
  });
});

describe('createOrganisation', () => {
  it('creates org and sets user as admin', async () => {
    // First call: organisations insert
    const orgBuilder = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockOrg, error: null }),
    };

    // Second call: profiles update
    const profileBuilder = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null }),
    };

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return orgBuilder;
      return profileBuilder;
    });

    const result = await createOrganisation(
      {
        name: 'Riverside FC',
        slug: 'riverside-fc-a1b2',
        sport_type: 'football' as never,
        primary_colour: '#003366',
        secondary_colour: '#FFFFFF',
      },
      'user-1'
    );

    expect(result.data).toEqual(mockOrg);
    expect(result.error).toBeNull();
  });

  it('returns error when org insert fails', async () => {
    const dbError = new Error('Duplicate slug');
    const orgBuilder = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: dbError }),
    };
    mockFrom.mockReturnValue(orgBuilder);

    const result = await createOrganisation(
      {
        name: 'Test',
        slug: 'test',
        sport_type: 'football' as never,
        primary_colour: '#000',
        secondary_colour: '#FFF',
      },
      'user-1'
    );

    expect(result.data).toBeNull();
    expect(result.error).toBe(dbError);
  });

  it('returns error when profile update fails', async () => {
    const profileError = new Error('Profile update failed');

    const orgBuilder = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockOrg, error: null }),
    };
    const profileBuilder = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: profileError }),
    };

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return orgBuilder;
      return profileBuilder;
    });

    const result = await createOrganisation(
      {
        name: 'Test',
        slug: 'test',
        sport_type: 'football' as never,
        primary_colour: '#000',
        secondary_colour: '#FFF',
      },
      'user-1'
    );

    expect(result.data).toBeNull();
    expect(result.error).toBe(profileError);
  });

  it('defaults optional fields to null', async () => {
    let capturedInsert: Record<string, unknown> = {};
    const orgBuilder = {
      insert: vi.fn().mockImplementation((arg) => { capturedInsert = arg; return orgBuilder; }),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockOrg, error: null }),
    };
    const profileBuilder = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null }),
    };

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return orgBuilder;
      return profileBuilder;
    });

    await createOrganisation(
      {
        name: 'Test',
        slug: 'test',
        sport_type: 'football' as never,
        primary_colour: '#000',
        secondary_colour: '#FFF',
      },
      'user-1'
    );

    expect(capturedInsert.logo_url).toBeNull();
    expect(capturedInsert.contact_email).toBeNull();
    expect(capturedInsert.contact_phone).toBeNull();
    expect(capturedInsert.address).toBeNull();
    expect(capturedInsert.website).toBeNull();
  });
});

describe('updateOrganisation', () => {
  it('updates organisation fields and sets updated_at', async () => {
    let capturedUpdate: Record<string, unknown> = {};
    const builder = {
      update: vi.fn().mockImplementation((arg) => { capturedUpdate = arg; return builder; }),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { ...mockOrg, name: 'New Name' }, error: null }),
    };
    mockFrom.mockReturnValue(builder);

    const result = await updateOrganisation('org-1', { name: 'New Name' });

    expect(capturedUpdate.name).toBe('New Name');
    expect(capturedUpdate.updated_at).toBeDefined();
    expect(result.data?.name).toBe('New Name');
    expect(result.error).toBeNull();
  });
});

describe('deleteOrganisation', () => {
  it('deletes the organisation', async () => {
    const builder = {
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null }),
    };
    mockFrom.mockReturnValue(builder);

    const result = await deleteOrganisation('org-1');

    expect(mockFrom).toHaveBeenCalledWith('organisations');
    expect(result.error).toBeNull();
  });

  it('returns error when delete fails', async () => {
    const dbError = new Error('Cannot delete');
    const builder = {
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: dbError }),
    };
    mockFrom.mockReturnValue(builder);

    const result = await deleteOrganisation('org-1');

    expect(result.error).toBe(dbError);
  });
});
