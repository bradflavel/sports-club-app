'use client';

import { CreditCard, Calendar } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import type { Payment } from '@/lib/supabase/database.types';

interface MemberStatsWidgetProps {
  payments: Payment[];
  loading?: boolean;
}

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function MemberStatsWidget({ payments, loading = false }: MemberStatsWidgetProps) {
  const totalOwed = payments.reduce((sum, p) => sum + p.amount_cents, 0);

  const nextPayment = payments
    .filter((p) => p.payment_status !== 'paid' && p.payment_status !== 'cancelled')
    .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())[0];

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        {[0, 1].map((i) => (
          <div key={i} className="rounded-lg border bg-card p-5 shadow-sm">
            <Skeleton className="mb-3 h-4 w-1/2" />
            <Skeleton className="h-7 w-2/3" />
            <Skeleton className="mt-2 h-3 w-1/3" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {/* Total owed */}
      <div className="rounded-lg border bg-card p-5 shadow-sm">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <CreditCard className="h-4 w-4" />
          Total Outstanding
        </div>
        <p
          className={`mt-2 text-2xl font-bold ${
            totalOwed > 0 ? 'text-destructive' : 'text-emerald-600'
          }`}
        >
          {formatCurrency(totalOwed)}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {payments.length} payment{payments.length !== 1 ? 's' : ''} outstanding
        </p>
      </div>

      {/* Next due */}
      <div className="rounded-lg border bg-card p-5 shadow-sm">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Calendar className="h-4 w-4" />
          Next Payment Due
        </div>
        {nextPayment ? (
          <>
            <p className="mt-2 text-2xl font-bold">{formatDate(nextPayment.due_date)}</p>
            <p className="mt-1 text-xs text-muted-foreground truncate">
              {nextPayment.description} &mdash; {formatCurrency(nextPayment.amount_cents)}
            </p>
          </>
        ) : (
          <p className="mt-2 text-2xl font-bold text-emerald-600">None</p>
        )}
      </div>
    </div>
  );
}
