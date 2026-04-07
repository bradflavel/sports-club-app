import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }));

import { createClient } from '@/lib/supabase/server';
import {
  createPayment,
  createBulkPayments,
  markAsPaid,
  getPaymentSummary,
} from '@/features/payments/services/payment-service';

// ---------------------------------------------------------------------------
// Chainable builder factory
// ---------------------------------------------------------------------------
function makeSingleBuilder(resolvedValue: unknown) {
  const builder = {
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(resolvedValue),
  };
  return builder;
}

const mockFrom = vi.fn();
const mockSupabase = { from: mockFrom };

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(createClient).mockResolvedValue(mockSupabase as never);
});

// ---------------------------------------------------------------------------
// Shared mock data
// ---------------------------------------------------------------------------
const mockProfile = {
  id: 'profile-1',
  first_name: 'Jane',
  last_name: 'Doe',
  email: 'jane@example.com',
  phone: null,
  date_of_birth: null,
  avatar_url: null,
  organisation_id: 'org-1',
  role: 'member',
  preferred_name: null,
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
  expiry_date: null,
  medical_conditions: null,
  dietary_requirements: null,
  notes: null,
  created_at: '2024-01-15T00:00:00Z',
  updated_at: '2024-01-15T00:00:00Z',
  profile: mockProfile,
};

const mockPayment = {
  id: 'payment-1',
  organisation_id: 'org-1',
  member_id: 'member-1',
  amount_cents: 5000,
  description: 'Annual membership fee',
  payment_type: 'membership_fee',
  status: 'pending',
  due_date: '2024-03-01',
  paid_date: null,
  stripe_payment_id: null,
  created_by: 'admin-1',
  created_at: '2024-01-15T00:00:00Z',
  updated_at: '2024-01-15T00:00:00Z',
  member: mockMember,
};

// ---------------------------------------------------------------------------
// createPayment
// ---------------------------------------------------------------------------
describe('createPayment', () => {
  it('converts dollar amount to cents before storing', async () => {
    let capturedInsertArg: unknown;
    const builder = {
      insert: vi.fn().mockImplementation((arg) => {
        capturedInsertArg = arg;
        return builder;
      }),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockPayment, error: null }),
    };
    mockFrom.mockReturnValue(builder);

    await createPayment({
      organisation_id: 'org-1',
      member_id: 'member-1',
      amount: 50.0,
      description: 'Annual membership fee',
      payment_type: 'membership_fee',
      due_date: '2024-03-01',
      created_by: 'admin-1',
    });

    expect(capturedInsertArg).toMatchObject({ amount_cents: 5000 });
  });

  it('rounds fractional cents correctly', async () => {
    let capturedInsertArg: unknown;
    const builder = {
      insert: vi.fn().mockImplementation((arg) => {
        capturedInsertArg = arg;
        return builder;
      }),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockPayment, error: null }),
    };
    mockFrom.mockReturnValue(builder);

    await createPayment({
      organisation_id: 'org-1',
      member_id: 'member-1',
      amount: 25.5,
      description: 'Match fee',
      payment_type: 'match_fee',
      due_date: '2024-03-01',
      created_by: 'admin-1',
    });

    expect(capturedInsertArg).toMatchObject({ amount_cents: 2550 });
  });

  it('defaults status to pending when not provided', async () => {
    let capturedInsertArg: unknown;
    const builder = {
      insert: vi.fn().mockImplementation((arg) => {
        capturedInsertArg = arg;
        return builder;
      }),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockPayment, error: null }),
    };
    mockFrom.mockReturnValue(builder);

    await createPayment({
      organisation_id: 'org-1',
      member_id: 'member-1',
      amount: 50,
      description: 'Fee',
      payment_type: 'membership_fee',
      due_date: '2024-03-01',
      created_by: 'admin-1',
    });

    expect(capturedInsertArg).toMatchObject({ status: 'pending' });
  });

  it('returns error when insert fails', async () => {
    const dbError = new Error('Insert failed');
    const builder = makeSingleBuilder({ data: null, error: dbError });
    mockFrom.mockReturnValue(builder);

    const result = await createPayment({
      organisation_id: 'org-1',
      member_id: 'member-1',
      amount: 50,
      description: 'Fee',
      payment_type: 'membership_fee',
      due_date: '2024-03-01',
      created_by: 'admin-1',
    });

    expect(result.error).toBe(dbError);
    expect(result.data).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// createBulkPayments
// ---------------------------------------------------------------------------
describe('createBulkPayments', () => {
  it('creates one row per member ID', async () => {
    let capturedInsertArg: unknown[] = [];
    const builder = {
      insert: vi.fn().mockImplementation((arg) => {
        capturedInsertArg = arg;
        return builder;
      }),
      select: vi.fn().mockResolvedValue({
        data: [mockPayment, { ...mockPayment, id: 'payment-2', member_id: 'member-2' }],
        error: null,
      }),
    };
    mockFrom.mockReturnValue(builder);

    await createBulkPayments(['member-1', 'member-2'], {
      organisation_id: 'org-1',
      amount: 50,
      description: 'Bulk fee',
      payment_type: 'membership_fee',
      due_date: '2024-03-01',
      created_by: 'admin-1',
    });

    expect(capturedInsertArg).toHaveLength(2);
    expect((capturedInsertArg as { member_id: string }[])[0].member_id).toBe('member-1');
    expect((capturedInsertArg as { member_id: string }[])[1].member_id).toBe('member-2');
  });

  it('converts dollar amount to cents for bulk inserts', async () => {
    let capturedInsertArg: unknown[] = [];
    const builder = {
      insert: vi.fn().mockImplementation((arg) => {
        capturedInsertArg = arg;
        return builder;
      }),
      select: vi.fn().mockResolvedValue({ data: [mockPayment], error: null }),
    };
    mockFrom.mockReturnValue(builder);

    await createBulkPayments(['member-1'], {
      organisation_id: 'org-1',
      amount: 75.0,
      description: 'Fee',
      payment_type: 'membership_fee',
      due_date: '2024-03-01',
      created_by: 'admin-1',
    });

    expect((capturedInsertArg as { amount_cents: number }[])[0].amount_cents).toBe(7500);
  });

  it('all rows have status pending', async () => {
    let capturedInsertArg: unknown[] = [];
    const builder = {
      insert: vi.fn().mockImplementation((arg) => {
        capturedInsertArg = arg;
        return builder;
      }),
      select: vi.fn().mockResolvedValue({ data: [mockPayment], error: null }),
    };
    mockFrom.mockReturnValue(builder);

    await createBulkPayments(['member-1', 'member-2', 'member-3'], {
      organisation_id: 'org-1',
      amount: 30,
      description: 'Fee',
      payment_type: 'membership_fee',
      due_date: '2024-03-01',
      created_by: 'admin-1',
    });

    (capturedInsertArg as { status: string }[]).forEach((row) => {
      expect(row.status).toBe('pending');
    });
  });
});

// ---------------------------------------------------------------------------
// markAsPaid
// ---------------------------------------------------------------------------
describe('markAsPaid', () => {
  it('sets status to paid and adds paid_date', async () => {
    let capturedUpdateArg: unknown;
    const builder = {
      update: vi.fn().mockImplementation((arg) => {
        capturedUpdateArg = arg;
        return builder;
      }),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { ...mockPayment, status: 'paid', paid_date: '2024-04-04' },
        error: null,
      }),
    };
    mockFrom.mockReturnValue(builder);

    const result = await markAsPaid('payment-1');

    expect(capturedUpdateArg).toMatchObject({ status: 'paid' });
    expect((capturedUpdateArg as { paid_date: string }).paid_date).toBeTruthy();
    expect(result.error).toBeNull();
  });

  it('queries the correct payment by id', async () => {
    let capturedEqArgs: [string, unknown];
    const builder = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockImplementation((col, val) => {
        capturedEqArgs = [col, val];
        return builder;
      }),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockPayment, error: null }),
    };
    mockFrom.mockReturnValue(builder);

    await markAsPaid('payment-99');

    expect(capturedEqArgs![0]).toBe('id');
    expect(capturedEqArgs![1]).toBe('payment-99');
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

    const result = await markAsPaid('payment-1');

    expect(result.error).toBe(dbError);
  });
});

// ---------------------------------------------------------------------------
// getPaymentSummary
// ---------------------------------------------------------------------------
describe('getPaymentSummary', () => {
  it('calculates totalOutstanding correctly from pending and overdue payments', async () => {
    const payments = [
      { amount_cents: 5000, status: 'pending', due_date: '2024-01-01', paid_date: null, member_id: 'member-1' },
      { amount_cents: 3000, status: 'overdue', due_date: '2023-12-01', paid_date: null, member_id: 'member-2' },
      { amount_cents: 2000, status: 'paid', due_date: '2024-01-01', paid_date: '2024-01-10', member_id: 'member-3' },
    ];

    const builder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ data: payments, error: null }),
    };
    mockFrom.mockReturnValue(builder);

    const result = await getPaymentSummary('org-1');

    expect(result.error).toBeNull();
    // 5000 + 3000 cents = $80
    expect(result.data?.totalOutstanding).toBe(80);
  });

  it('calculates overdueCount correctly', async () => {
    const payments = [
      { amount_cents: 3000, status: 'overdue', due_date: '2023-11-01', paid_date: null, member_id: 'member-1' },
      { amount_cents: 4000, status: 'overdue', due_date: '2023-10-01', paid_date: null, member_id: 'member-2' },
      { amount_cents: 2000, status: 'pending', due_date: '2024-03-01', paid_date: null, member_id: 'member-3' },
    ];

    const builder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ data: payments, error: null }),
    };
    mockFrom.mockReturnValue(builder);

    const result = await getPaymentSummary('org-1');

    expect(result.data?.overdueCount).toBe(2);
  });

  it('counts unique members with outstanding balance', async () => {
    const payments = [
      { amount_cents: 5000, status: 'pending', due_date: '2024-01-01', paid_date: null, member_id: 'member-1' },
      { amount_cents: 3000, status: 'overdue', due_date: '2024-01-01', paid_date: null, member_id: 'member-1' },
      { amount_cents: 2000, status: 'pending', due_date: '2024-01-01', paid_date: null, member_id: 'member-2' },
    ];

    const builder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ data: payments, error: null }),
    };
    mockFrom.mockReturnValue(builder);

    const result = await getPaymentSummary('org-1');

    // member-1 appears twice but is counted once
    expect(result.data?.membersWithBalance).toBe(2);
  });

  it('returns error when query fails', async () => {
    const dbError = new Error('Query failed');
    const builder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ data: null, error: dbError }),
    };
    mockFrom.mockReturnValue(builder);

    const result = await getPaymentSummary('org-1');

    expect(result.data).toBeNull();
    expect(result.error).toBe(dbError);
  });

  it('returns zero totals when there are no payments', async () => {
    const builder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ data: [], error: null }),
    };
    mockFrom.mockReturnValue(builder);

    const result = await getPaymentSummary('org-1');

    expect(result.data?.totalOutstanding).toBe(0);
    expect(result.data?.overdueCount).toBe(0);
    expect(result.data?.membersWithBalance).toBe(0);
  });
});
