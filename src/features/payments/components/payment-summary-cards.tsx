'use client';

import { DollarSign, TrendingUp, AlertTriangle, Users } from 'lucide-react';
import { StatCard } from '@/components/shared/stat-card';
import { formatCurrency } from '@/lib/format';
import type { PaymentSummaryResult } from '@/features/payments/services/payment-service';

interface PaymentSummaryCardsProps {
  summary: PaymentSummaryResult;
}

export function PaymentSummaryCards({ summary }: PaymentSummaryCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total Outstanding"
        value={formatCurrency(summary.totalOutstanding * 100)}
        subtitle="Pending and overdue balances"
        icon={DollarSign}
      />
      <StatCard
        title="Collected This Month"
        value={formatCurrency(summary.collectedThisMonth * 100)}
        subtitle="Payments received this month"
        icon={TrendingUp}
      />
      <StatCard
        title="Overdue Payments"
        value={summary.overdueCount}
        subtitle="Payments past their due date"
        icon={AlertTriangle}
      />
      <StatCard
        title="Members with Balance"
        value={summary.membersWithBalance}
        subtitle="Members with outstanding amounts"
        icon={Users}
      />
    </div>
  );
}
