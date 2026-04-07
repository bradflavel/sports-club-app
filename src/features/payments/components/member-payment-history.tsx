'use client';

import { type ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/shared/data-table';
import { StatusBadge } from '@/components/shared/status-badge';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate } from '@/lib/format';
import { PAYMENT_TYPE_OPTIONS } from '@/lib/constants';
import type { Payment } from '@/features/payments/types/payment-types';

interface MemberPaymentHistoryProps {
  payments: Payment[];
}

function getPaymentTypeLabel(type: string): string {
  return PAYMENT_TYPE_OPTIONS.find((o) => o.value === type)?.label ?? type;
}

const columns: ColumnDef<Payment>[] = [
  {
    id: 'description',
    accessorKey: 'description',
    header: 'Description',
    cell: ({ getValue }) => (
      <span className="max-w-[200px] truncate text-sm">{getValue() as string}</span>
    ),
  },
  {
    id: 'amount',
    accessorKey: 'amount_cents',
    header: 'Amount',
    cell: ({ row }) => (
      <span className="font-medium">{formatCurrency(row.original.amount_cents)}</span>
    ),
  },
  {
    id: 'paymentType',
    accessorKey: 'payment_type',
    header: 'Type',
    cell: ({ row }) => (
      <Badge variant="outline">{getPaymentTypeLabel(row.original.payment_type)}</Badge>
    ),
  },
  {
    id: 'status',
    accessorKey: 'payment_status',
    header: 'Status',
    cell: ({ row }) => <StatusBadge status={row.original.payment_status} />,
  },
  {
    id: 'dueDate',
    accessorKey: 'due_date',
    header: 'Due Date',
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">{formatDate(row.original.due_date)}</span>
    ),
  },
  {
    id: 'paidDate',
    accessorKey: 'paid_at',
    header: 'Paid Date',
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {row.original.paid_at ? formatDate(row.original.paid_at) : '—'}
      </span>
    ),
  },
];

export function MemberPaymentHistory({ payments }: MemberPaymentHistoryProps) {
  return <DataTable columns={columns} data={payments} pageSize={10} />;
}
