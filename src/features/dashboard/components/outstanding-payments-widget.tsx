'use client';

import Link from 'next/link';
import { ArrowRight, AlertCircle, Clock } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import type { PaymentWithMember } from '@/lib/supabase/database.types';

interface OutstandingPaymentsWidgetProps {
  payments: PaymentWithMember[];
  loading?: boolean;
}

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

function daysOverdue(dueDateStr: string): number {
  const due = new Date(dueDateStr);
  const now = new Date();
  const diff = Math.floor((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, diff);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function OutstandingPaymentsWidget({
  payments,
  loading = false,
}: OutstandingPaymentsWidgetProps) {
  return (
    <div className="rounded-xl border bg-card shadow-sm">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h3 className="font-semibold">Outstanding Payments</h3>
        <Link
          href="/payments"
          className="flex items-center gap-1 text-xs text-primary hover:underline"
        >
          View all <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="divide-y">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between gap-4 p-4">
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
              <div className="space-y-1.5 text-right">
                <Skeleton className="h-4 w-16 ml-auto" />
                <Skeleton className="h-3 w-14 ml-auto" />
              </div>
            </div>
          ))
        ) : payments.length === 0 ? (
          <div className="flex flex-col items-center gap-2 p-6 text-center text-muted-foreground">
            <Clock className="h-8 w-8 opacity-40" />
            <p className="text-sm">No outstanding payments.</p>
          </div>
        ) : (
          payments.slice(0, 5).map((payment) => {
            const overdue = daysOverdue(payment.due_date ?? '');
            const memberName = `${payment.member.profile.first_name} ${payment.member.profile.last_name}`;
            return (
              <div key={payment.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{memberName}</p>
                  <p className="text-xs text-muted-foreground">
                    Due {payment.due_date ? formatDate(payment.due_date) : '—'}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-mono font-semibold">
                    {formatCurrency(payment.amount_cents)}
                  </p>
                  {overdue > 0 ? (
                    <span className="flex items-center justify-end gap-1 text-xs text-destructive">
                      <AlertCircle className="h-3 w-3" />
                      {overdue}d overdue
                    </span>
                  ) : (
                    <span className="text-xs text-amber-600">Due today</span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
