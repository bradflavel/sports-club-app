import { createClient } from '@/lib/supabase/server';
import type {
  Payment,
  PaymentWithMember,
  PaymentStatus,
  PaymentType,
} from '@/lib/supabase/database.types';
import type { PaymentFilters } from '@/features/payments/types/payment-types';

export async function getPayments(
  orgId: string,
  filters?: PaymentFilters & { page?: number; pageSize?: number }
) {
  const supabase = await createClient();

  let query = supabase
    .from('payments')
    .select('*, member:members(*, profile:profiles(*))', { count: 'exact' })
    .eq('organisation_id', orgId);

  if (filters?.search) {
    query = query.or(
      `description.ilike.%${filters.search}%`
    );
  }

  if (filters?.paymentType && filters.paymentType.length > 0) {
    query = query.in('payment_type', filters.paymentType as PaymentType[]);
  }

  if (filters?.status && filters.status.length > 0) {
    query = query.in('payment_status', filters.status as PaymentStatus[]);
  }

  if (filters?.memberId) {
    query = query.eq('member_id', filters.memberId);
  }

  if (filters?.dueDateFrom) {
    query = query.gte('due_date', filters.dueDateFrom);
  }

  if (filters?.dueDateTo) {
    query = query.lte('due_date', filters.dueDateTo);
  }

  const page = filters?.page ?? 1;
  const pageSize = filters?.pageSize ?? 20;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  query = query.range(from, to).order('created_at', { ascending: false });

  const { data, error, count } = await query;

  return { data: data as PaymentWithMember[] | null, count, error };
}

export async function getPaymentById(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('payments')
    .select('*, member:members(*, profile:profiles(*))')
    .eq('id', id)
    .single();

  return { data: data as PaymentWithMember | null, error };
}

export async function createPayment(paymentData: {
  organisation_id: string;
  member_id: string;
  /** Amount in dollars — will be converted to cents internally */
  amount: number;
  description: string;
  payment_type: PaymentType;
  payment_status?: PaymentStatus;
  due_date: string;
  created_by: string;
  stripe_payment_intent_id?: string | null;
}) {
  const supabase = await createClient();

  const { amount, ...rest } = paymentData;

  const { data, error } = await supabase
    .from('payments')
    .insert({
      ...rest,
      amount_cents: Math.round(amount * 100),
      payment_status: rest.payment_status ?? 'pending',
      paid_at: null,
      stripe_payment_intent_id: rest.stripe_payment_intent_id ?? null,
    })
    .select('*, member:members(*, profile:profiles(*))')
    .single();

  return { data: data as PaymentWithMember | null, error };
}

export async function createBulkPayments(
  memberIds: string[],
  paymentData: {
    organisation_id: string;
    /** Amount in dollars — will be converted to cents internally */
    amount: number;
    description: string;
    payment_type: PaymentType;
    due_date: string;
    created_by: string;
  }
) {
  const supabase = await createClient();

  const { amount, ...rest } = paymentData;
  const amount_cents = Math.round(amount * 100);

  const rows = memberIds.map((member_id) => ({
    ...rest,
    member_id,
    amount_cents,
    payment_status: 'pending' as PaymentStatus,
    paid_at: null,
    stripe_payment_intent_id: null,
  }));

  const { data, error } = await supabase
    .from('payments')
    .insert(rows)
    .select('*, member:members(*, profile:profiles(*))');

  return { data: data as PaymentWithMember[] | null, error };
}

export async function updatePayment(
  id: string,
  paymentData: Partial<
    Pick<
      Payment,
      | 'description'
      | 'payment_type'
      | 'payment_status'
      | 'due_date'
      | 'paid_at'
      | 'stripe_payment_intent_id'
    >
  > & { amount?: number }
) {
  const supabase = await createClient();

  const { amount, ...rest } = paymentData;
  const updatePayload: Record<string, unknown> = {
    ...rest,
    updated_at: new Date().toISOString(),
  };

  if (amount !== undefined) {
    updatePayload.amount_cents = Math.round(amount * 100);
  }

  const { data, error } = await supabase
    .from('payments')
    .update(updatePayload)
    .eq('id', id)
    .select('*, member:members(*, profile:profiles(*))')
    .single();

  return { data: data as PaymentWithMember | null, error };
}

export async function markAsPaid(id: string) {
  const supabase = await createClient();

  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('payments')
    .update({
      payment_status: 'paid',
      paid_at: today,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('*, member:members(*, profile:profiles(*))')
    .single();

  return { data: data as PaymentWithMember | null, error };
}

export async function markAsRefunded(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('payments')
    .update({
      payment_status: 'refunded',
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('*, member:members(*, profile:profiles(*))')
    .single();

  return { data: data as PaymentWithMember | null, error };
}

export async function deletePayment(id: string) {
  const supabase = await createClient();

  const { error } = await supabase.from('payments').delete().eq('id', id);

  return { data: null, error };
}

export interface PaymentSummaryResult {
  totalOutstanding: number;
  collectedThisMonth: number;
  overdueCount: number;
  membersWithBalance: number;
}

export async function getPaymentSummary(
  orgId: string
): Promise<{ data: PaymentSummaryResult | null; error: unknown }> {
  const supabase = await createClient();

  const { data: payments, error } = await supabase
    .from('payments')
    .select('amount_cents, payment_status, due_date, paid_at, member_id')
    .eq('organisation_id', orgId);

  if (error) return { data: null, error };
  if (!payments) return { data: null, error: new Error('No data returned') };

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split('T')[0];

  let totalOutstanding = 0;
  let collectedThisMonth = 0;
  let overdueCount = 0;
  const membersWithBalanceSet = new Set<string>();

  for (const p of payments) {
    if (p.payment_status === 'pending' || p.payment_status === 'overdue') {
      totalOutstanding += p.amount_cents;
      membersWithBalanceSet.add(p.member_id);
    }

    if (p.payment_status === 'overdue') {
      overdueCount++;
    }

    if (
      p.payment_status === 'paid' &&
      p.paid_at &&
      p.paid_at >= startOfMonth
    ) {
      collectedThisMonth += p.amount_cents;
    }
  }

  return {
    data: {
      totalOutstanding: totalOutstanding / 100,
      collectedThisMonth: collectedThisMonth / 100,
      overdueCount,
      membersWithBalance: membersWithBalanceSet.size,
    },
    error: null,
  };
}

export async function getMemberPayments(memberId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('member_id', memberId)
    .order('created_at', { ascending: false });

  return { data: data as Payment[] | null, error };
}
