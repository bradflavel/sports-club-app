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
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatCard
        title="Total Outstanding"
        value={formatCurrency(summary.totalOutstanding * 100)}
        subtitle="Pending and overdue"
        icon={DollarSign}
        color="rose"
      />
      <StatCard
        title="Collected This Month"
        value={formatCurrency(summary.collectedThisMonth * 100)}
        subtitle="Received this month"
        icon={TrendingUp}
        color="emerald"
      />
      <StatCard
        title="Overdue"
        value={summary.overdueCount}
        subtitle="Past due date"
        icon={AlertTriangle}
        color="amber"
      />
      <StatCard
        title="Members with Balance"
        value={summary.membersWithBalance}
        subtitle="Outstanding amounts"
        icon={Users}
        color="blue"
      />
    </div>
  );
}
