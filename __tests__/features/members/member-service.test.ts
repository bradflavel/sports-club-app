import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }));

import { createClient } from '@/lib/supabase/server';
import {
  getMembers,
  createMember,
  updateMemberStatus,
  parseCsvData,
} from '@/features/members/services/member-service';

// ---------------------------------------------------------------------------
// Helpers to build a chainable Supabase query builder mock
// ---------------------------------------------------------------------------
function makeQueryBuilder(resolvedValue: unknown) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};

  const methods = [
    'select',
    'eq',
    'in',
    'or',
    'order',
    'range',
    'ilike',
    'gte',
    'lte',
    'limit',
    'single',
    'insert',
    'update',
    'delete',
    'upsert',
  ];

  for (const method of methods) {
    chain[method] = vi.fn().mockReturnThis();
  }

  // Terminal methods that resolve
  chain.single = vi.fn().mockResolvedValue(resolvedValue);
  // Make each method also thenable so `.order()` etc. resolve if awaited
  for (const method of methods) {
    if (method !== 'single') {
      chain[method] = vi.fn().mockImplementation(() => {
        // Return an object that is thenable AND has all chain methods
        return Object.assign(
          Promise.resolve(resolvedValue),
          chain
        );
      });
    }
  }

  return chain;
}

const mockFrom = vi.fn();
const mockSupabase = { from: mockFrom };

beforeEach(() => {
  vi.clearAllMocks();
  (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(mockSupabase);
});

// ---------------------------------------------------------------------------
// Mock member data
// ---------------------------------------------------------------------------
const mockProfile = {
  id: 'profile-1',
  first_name: 'Jane',
  last_name: 'Doe',
  email: 'jane@example.com',
  phone: '+61400000001',
  date_of_birth: '1990-01-15',
  avatar_url: null,
  organisation_id: 'org-1',
  role: 'member',
  emergency_contact_name: null,
  emergency_contact_phone: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

const mockMember = {
  id: 'member-1',
  profile_id: 'profile-1',
  organisation_id: 'org-1',
  membership_type: 'senior',
  membership_status: 'active',
  registration_date: '2024-01-15',
  expiry_date: '2025-01-15',
  medical_conditions: null,
  dietary_requirements: null,
  notes: null,
  created_at: '2024-01-15T00:00:00Z',
  updated_at: '2024-01-15T00:00:00Z',
  profile: mockProfile,
};

// ---------------------------------------------------------------------------
// getMembers
// ---------------------------------------------------------------------------
describe('getMembers', () => {
  it('returns members with profiles', async () => {
    const members = [mockMember];
    const builder = makeQueryBuilder({ data: members, error: null, count: 1 });
    mockFrom.mockReturnValue(builder);

    const result = await getMembers('org-1');

    expect(mockFrom).toHaveBeenCalledWith('members');
    expect(result.error).toBeNull();
  });

  it('returns empty array when no members exist', async () => {
    const builder = makeQueryBuilder({ data: [], error: null, count: 0 });
    mockFrom.mockReturnValue(builder);

    const result = await getMembers('org-1');

    expect(result.error).toBeNull();
  });

  it('returns error when query fails', async () => {
    const dbError = new Error('Database connection failed');
    const builder = makeQueryBuilder({ data: null, error: dbError, count: null });
    mockFrom.mockReturnValue(builder);

    const result = await getMembers('org-1');

    expect(result.error).toBe(dbError);
    expect(result.data).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// createMember
// ---------------------------------------------------------------------------
describe('createMember', () => {
  it('creates a member record and returns MemberWithProfile', async () => {
    const builder = makeQueryBuilder({ data: mockMember, error: null });
    mockFrom.mockReturnValue(builder);

    const result = await createMember({
      profile_id: 'profile-1',
      organisation_id: 'org-1',
      membership_type: 'senior',
      registration_date: '2024-01-15',
    });

    expect(mockFrom).toHaveBeenCalledWith('members');
    expect(result.error).toBeNull();
  });

  it('defaults membership_status to active when not provided', async () => {
    let capturedInsertArg: unknown;
    const builder = {
      insert: vi.fn().mockImplementation((arg) => {
        capturedInsertArg = arg;
        return builder;
      }),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockMember, error: null }),
    };
    mockFrom.mockReturnValue(builder);

    await createMember({
      profile_id: 'profile-1',
      organisation_id: 'org-1',
      membership_type: 'senior',
      registration_date: '2024-01-15',
    });

    expect(capturedInsertArg).toMatchObject({ membership_status: 'active' });
  });

  it('returns error when insert fails', async () => {
    const dbError = new Error('Insert failed');
    const builder = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: dbError }),
    };
    mockFrom.mockReturnValue(builder);

    const result = await createMember({
      profile_id: 'profile-1',
      organisation_id: 'org-1',
      membership_type: 'senior',
      registration_date: '2024-01-15',
    });

    expect(result.error).toBe(dbError);
    expect(result.data).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// updateMemberStatus
// ---------------------------------------------------------------------------
describe('updateMemberStatus', () => {
  it('updates the member status field', async () => {
    const updatedMember = { ...mockMember, membership_status: 'suspended' };
    const builder = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: updatedMember, error: null }),
    };
    mockFrom.mockReturnValue(builder);

    const result = await updateMemberStatus('member-1', 'suspended');

    expect(mockFrom).toHaveBeenCalledWith('members');
    expect(builder.update).toHaveBeenCalledWith(
      expect.objectContaining({ membership_status: 'suspended' })
    );
    expect(builder.eq).toHaveBeenCalledWith('id', 'member-1');
    expect(result.error).toBeNull();
  });

  it('can set status to inactive', async () => {
    const updatedMember = { ...mockMember, membership_status: 'inactive' };
    const builder = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: updatedMember, error: null }),
    };
    mockFrom.mockReturnValue(builder);

    const result = await updateMemberStatus('member-1', 'inactive');

    expect(result.error).toBeNull();
  });

  it('returns error when update fails', async () => {
    const dbError = new Error('Update failed');
    const builder = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: dbError }),
    };
    mockFrom.mockReturnValue(builder);

    const result = await updateMemberStatus('member-1', 'active');

    expect(result.error).toBe(dbError);
    expect(result.data).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// parseCsvData
// ---------------------------------------------------------------------------
describe('parseCsvData', () => {
  it('returns empty result for CSV with only a header row', () => {
    const csv = 'first_name,last_name,email,membership_type';
    const result = parseCsvData(csv);

    expect(result.totalRows).toBe(0);
    expect(result.successCount).toBe(0);
    expect(result.errorCount).toBe(0);
    expect(result.success).toHaveLength(0);
    expect(result.errors).toHaveLength(0);
  });

  it('parses valid CSV rows correctly', () => {
    const csv = [
      'first_name,last_name,email,membership_type',
      'Jane,Doe,jane@example.com,senior',
      'John,Smith,john@example.com,junior',
    ].join('\n');

    const result = parseCsvData(csv);

    expect(result.successCount).toBe(2);
    expect(result.errorCount).toBe(0);
    expect(result.success[0]).toMatchObject({
      first_name: 'Jane',
      last_name: 'Doe',
      email: 'jane@example.com',
      membership_type: 'senior',
    });
    expect(result.success[1]).toMatchObject({
      first_name: 'John',
      last_name: 'Smith',
      email: 'john@example.com',
      membership_type: 'junior',
    });
  });

  it('captures error when required fields are missing', () => {
    const csv = [
      'first_name,last_name,email,membership_type',
      ',Doe,jane@example.com,senior',         // missing first_name
      'Jane,,jane2@example.com,junior',        // missing last_name
      'John,Smith,,senior',                    // missing email
    ].join('\n');

    const result = parseCsvData(csv);

    expect(result.errorCount).toBe(3);
    expect(result.successCount).toBe(0);
  });

  it('catches invalid email addresses', () => {
    const csv = [
      'first_name,last_name,email,membership_type',
      'Jane,Doe,not-an-email,senior',
    ].join('\n');

    const result = parseCsvData(csv);

    expect(result.errorCount).toBe(1);
    expect(result.errors[0].row).toBe(1);
    expect(result.errors[0].errors.length).toBeGreaterThan(0);
  });

  it('catches invalid membership type', () => {
    const csv = [
      'first_name,last_name,email,membership_type',
      'Jane,Doe,jane@example.com,premium',
    ].join('\n');

    const result = parseCsvData(csv);

    expect(result.errorCount).toBe(1);
  });

  it('handles optional fields being absent', () => {
    const csv = [
      'first_name,last_name,email,membership_type',
      'Jane,Doe,jane@example.com,life',
    ].join('\n');

    const result = parseCsvData(csv);

    expect(result.successCount).toBe(1);
    expect(result.success[0].phone).toBeUndefined();
    expect(result.success[0].date_of_birth).toBeUndefined();
  });

  it('returns correct totalRows count', () => {
    const csv = [
      'first_name,last_name,email,membership_type',
      'Jane,Doe,jane@example.com,senior',
      'Bad,Row,not-an-email,unknown',
    ].join('\n');

    const result = parseCsvData(csv);

    expect(result.totalRows).toBe(2);
    expect(result.successCount).toBe(1);
    expect(result.errorCount).toBe(1);
  });

  it('returns empty result for CSV with fewer than 2 lines', () => {
    const result = parseCsvData('');

    expect(result.totalRows).toBe(0);
    expect(result.success).toHaveLength(0);
    expect(result.errors).toHaveLength(0);
  });
});
