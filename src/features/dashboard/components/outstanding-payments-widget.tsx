'use client';

import Link from 'next/link';
import { ArrowRight, AlertCircle } from 'lucide-react';
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
    <div className="rounded-lg border bg-card shadow-sm">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h3 className="font-semibold">Outstanding Payments</h3>
        <Link
          href="/payments"
          className="flex items-center gap-1 text-xs text-primary hover:underline"
        >
          View all <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3 p-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between gap-4">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      ) : payments.length === 0 ? (
        <p className="p-6 text-center text-sm text-muted-foreground">No outstanding payments.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-xs text-muted-foreground">
                <th className="px-4 py-2 text-left font-medium">Member</th>
                <th className="px-4 py-2 text-right font-medium">Amount</th>
                <th className="px-4 py-2 text-left font-medium">Due Date</th>
                <th className="px-4 py-2 text-left font-medium">Overdue</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {payments.slice(0, 5).map((payment) => {
                const overdue = daysOverdue(payment.due_date);
                const memberName = `${payment.member.profile.first_name} ${payment.member.profile.last_name}`;
                return (
                  <tr key={payment.id} className="hover:bg-muted/20">
                    <td className="px-4 py-3 font-medium">{memberName}</td>
                    <td className="px-4 py-3 text-right font-mono">
                      {formatCurrency(payment.amount_cents)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(payment.due_date)}
                    </td>
                    <td className="px-4 py-3">
                      {overdue > 0 ? (
                        <span className="flex items-center gap-1 text-destructive">
                          <AlertCircle className="h-3 w-3" />
                          {overdue}d
                        </span>
                      ) : (
                        <span className="text-amber-600">Today</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
