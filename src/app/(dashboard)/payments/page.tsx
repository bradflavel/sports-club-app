'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { CreditCard, Plus, CheckCircle } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import { PageSkeleton } from '@/components/shared/loading-skeleton';
import { StatCard } from '@/components/shared/stat-card';
import { Button } from '@/components/ui/button';
import { PaymentTable } from '@/features/payments/components/payment-table';
import { PaymentSummaryCards } from '@/features/payments/components/payment-summary-cards';
import { PaymentFilters } from '@/features/payments/components/payment-filters';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/hooks/use-user';
import { useOrganisation } from '@/hooks/use-organisation';
import { useToast } from '@/components/ui/use-toast';
import { formatCurrency, formatDate } from '@/lib/format';
import { DollarSign, Calendar } from 'lucide-react';
import type { PaymentWithMember, PaymentFilters as PaymentFiltersType } from '@/features/payments/types/payment-types';
import type { PaymentSummaryResult } from '@/features/payments/services/payment-service';
import type { MemberWithProfile } from '@/features/members/types/member-types';
import type { PaymentStatus } from '@/lib/supabase/database.types';

export default function PaymentsPage() {
  const { profile, loading: userLoading } = useUser();
  const { organisation, loading: orgLoading } = useOrganisation();
  const { toast } = useToast();

  const [payments, setPayments] = useState<PaymentWithMember[]>([]);
  const [members, setMembers] = useState<MemberWithProfile[]>([]);
  const [summary, setSummary] = useState<PaymentSummaryResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<PaymentFiltersType>({});
  const [selectedRows, setSelectedRows] = useState<PaymentWithMember[]>([]);
  const [bulkLoading, setBulkLoading] = useState(false);

  const isAdminOrManager = profile?.role === 'admin' || profile?.role === 'manager';
  const [isGuardian, setIsGuardian] = useState(false);
  const [dependentIds, setDependentIds] = useState<string[]>([]);

  const fetchPayments = useCallback(async () => {
    if (!organisation?.id) return;
    setLoading(true);

    const supabase = createClient();

    let query = supabase
      .from('payments')
      .select('*, member:members(*, profile:profiles(*))', { count: 'exact' })
      .eq('organisation_id', organisation.id);

    // If not admin/manager, scope payments
    if (!isAdminOrManager && profile?.id) {
      const { data: memberRecord } = await supabase
        .from('members')
        .select('id')
        .eq('profile_id', profile.id)
        .eq('organisation_id', organisation.id)
        .single();

      if (memberRecord) {
        // Check if user is a guardian (has dependents)
        const { data: guardianLinks } = await supabase
          .from('member_guardians')
          .select('minor_member_id')
          .eq('guardian_member_id', memberRecord.id);

        const minorIds = (guardianLinks ?? []).map((g) => g.minor_member_id);

        if (minorIds.length > 0) {
          setIsGuardian(true);
          setDependentIds(minorIds);
          // Show own payments + dependent payments
          query = query.in('member_id', [memberRecord.id, ...minorIds]);
        } else {
          query = query.eq('member_id', memberRecord.id);
        }
      }
    }

    if (filters.status && filters.status.length > 0) {
      query = query.in('status', filters.status as PaymentStatus[]);
    }

    if (filters.paymentType && filters.paymentType.length > 0) {
      query = query.in('payment_type', filters.paymentType as import('@/lib/supabase/database.types').PaymentType[]);
    }

    if (filters.memberId) {
      query = query.eq('member_id', filters.memberId);
    }

    if (filters.dueDateFrom) {
      query = query.gte('due_date', filters.dueDateFrom);
    }

    if (filters.dueDateTo) {
      query = query.lte('due_date', filters.dueDateTo);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      toast({ title: 'Error loading payments', description: error.message, variant: 'destructive' });
    } else {
      setPayments((data as unknown as PaymentWithMember[]) ?? []);
    }

    setLoading(false);
  }, [organisation?.id, profile?.id, profile?.role, isAdminOrManager, filters, toast]);

  const fetchSummary = useCallback(async () => {
    if (!organisation?.id || !isAdminOrManager) return;

    const supabase = createClient();
    const { data: rows, error } = await supabase
      .from('payments')
      .select('amount_cents, status, due_date, paid_date, member_id')
      .eq('organisation_id', organisation.id);

    if (error || !rows) return;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString()
      .split('T')[0];

    let totalOutstanding = 0;
    let collectedThisMonth = 0;
    let overdueCount = 0;
    const membersWithBalanceSet = new Set<string>();

    for (const p of rows) {
      if (p.status === 'pending' || p.status === 'overdue') {
        totalOutstanding += p.amount_cents;
        membersWithBalanceSet.add(p.member_id);
      }
      if (p.status === 'overdue') overdueCount++;
      if (p.status === 'paid' && p.paid_date && p.paid_date >= startOfMonth) {
        collectedThisMonth += p.amount_cents;
      }
    }

    setSummary({
      totalOutstanding: totalOutstanding / 100,
      collectedThisMonth: collectedThisMonth / 100,
      overdueCount,
      membersWithBalance: membersWithBalanceSet.size,
    });
  }, [organisation?.id, isAdminOrManager]);

  const fetchMembers = useCallback(async () => {
    if (!organisation?.id || !isAdminOrManager) return;

    const supabase = createClient();
    const { data } = await supabase
      .from('members')
      .select('*, profile:profiles(*)')
      .eq('organisation_id', organisation.id)
      .order('created_at', { ascending: false });

    if (data) setMembers(data as unknown as MemberWithProfile[]);
  }, [organisation?.id, isAdminOrManager]);

  useEffect(() => {
    if (!orgLoading && !userLoading && organisation?.id) {
      fetchPayments();
      fetchSummary();
      fetchMembers();
    }
  }, [orgLoading, userLoading, organisation?.id, fetchPayments, fetchSummary, fetchMembers]);

  async function handleMarkPaid(id: string) {
    const supabase = createClient();
    const today = new Date().toISOString().split('T')[0];
    const { error } = await supabase
      .from('payments')
      .update({ status: 'paid', paid_date: today, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      toast({ title: 'Error updating payment', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Payment marked as paid' });
      fetchPayments();
      fetchSummary();
    }
  }

  async function handleMarkRefunded(id: string) {
    const supabase = createClient();
    const { error } = await supabase
      .from('payments')
      .update({ status: 'refunded', updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      toast({ title: 'Error updating payment', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Payment marked as refunded' });
      fetchPayments();
      fetchSummary();
    }
  }

  async function handleDelete(id: string) {
    const supabase = createClient();
    const { error } = await supabase.from('payments').delete().eq('id', id);

    if (error) {
      toast({ title: 'Error deleting payment', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Payment deleted' });
      fetchPayments();
      fetchSummary();
    }
  }

  async function handleBulkMarkPaid() {
    if (selectedRows.length === 0) return;
    setBulkLoading(true);

    const supabase = createClient();
    const today = new Date().toISOString().split('T')[0];
    const ids = selectedRows.map((r) => r.id);

    const { error } = await supabase
      .from('payments')
      .update({ status: 'paid', paid_date: today, updated_at: new Date().toISOString() })
      .in('id', ids);

    if (error) {
      toast({ title: 'Error updating payments', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: `${ids.length} payment${ids.length !== 1 ? 's' : ''} marked as paid` });
      setSelectedRows([]);
      fetchPayments();
      fetchSummary();
    }

    setBulkLoading(false);
  }

  // Member-view summary stats
  const totalOwed = payments
    .filter((p) => p.status === 'pending' || p.status === 'overdue')
    .reduce((sum, p) => sum + p.amount_cents, 0);

  const nextDue = payments
    .filter((p) => p.status === 'pending' || p.status === 'overdue')
    .sort((a, b) => a.due_date.localeCompare(b.due_date))[0];

  if (orgLoading || userLoading) {
    return <PageSkeleton />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payments"
        actions={
          isAdminOrManager ? (
            <Button asChild size="sm" className="gap-2">
              <Link href="/payments/new">
                <Plus className="h-4 w-4" />
                Create Invoice
              </Link>
            </Button>
          ) : undefined
        }
      />

      {/* Summary section */}
      {isAdminOrManager && summary ? (
        <PaymentSummaryCards summary={summary} />
      ) : !isAdminOrManager ? (
        <div className="space-y-4">
          {isGuardian && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
              <p className="text-sm font-medium text-blue-800">
                Showing payments for you and your {dependentIds.length} dependent{dependentIds.length !== 1 ? 's' : ''}
              </p>
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <StatCard
              title="Total Owed"
              value={formatCurrency(totalOwed)}
              subtitle={isGuardian ? 'Combined outstanding balance' : 'Outstanding balance'}
              icon={DollarSign}
            />
            <StatCard
              title="Next Payment Due"
              value={nextDue ? formatDate(nextDue.due_date) : 'None'}
              subtitle={nextDue ? nextDue.description : 'No upcoming payments'}
              icon={Calendar}
            />
          </div>
        </div>
      ) : null}

      {/* Filters (admin/manager only) */}
      {isAdminOrManager && (
        <PaymentFilters filters={filters} onFiltersChange={setFilters} members={members} />
      )}

      {/* Bulk action bar */}
      {isAdminOrManager && selectedRows.length > 0 && (
        <div className="flex items-center justify-between rounded-lg border bg-muted/40 px-4 py-2">
          <span className="text-sm text-muted-foreground">
            {selectedRows.length} row{selectedRows.length !== 1 ? 's' : ''} selected
          </span>
          <Button
            size="sm"
            className="gap-2"
            onClick={handleBulkMarkPaid}
            disabled={bulkLoading}
          >
            <CheckCircle className="h-4 w-4" />
            Mark Selected as Paid
          </Button>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded-md bg-muted" />
          ))}
        </div>
      ) : payments.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="No payments found"
          description={
            Object.values(filters).some(Boolean)
              ? 'Try adjusting your filters.'
              : isAdminOrManager
              ? 'Create your first invoice to get started.'
              : 'You have no payment history yet.'
          }
          actionLabel={isAdminOrManager ? 'Create Invoice' : undefined}
          actionHref={isAdminOrManager ? '/payments/new' : undefined}
        />
      ) : (
        <PaymentTable
          payments={payments}
          onMarkPaid={handleMarkPaid}
          onMarkRefunded={handleMarkRefunded}
          onDelete={handleDelete}
          onRowSelectionChange={isAdminOrManager ? setSelectedRows : undefined}
          role={profile?.role}
        />
      )}
    </div>
  );
}
