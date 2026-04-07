'use client';

import { type ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, ArrowUpDown, CheckCircle, RefreshCw, Pencil, Trash2 } from 'lucide-react';
import { DataTable } from '@/components/shared/data-table';
import { AvatarWithName } from '@/components/shared/avatar-with-name';
import { StatusBadge } from '@/components/shared/status-badge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { formatCurrency, formatDate } from '@/lib/format';
import { PAYMENT_TYPE_OPTIONS } from '@/lib/constants';
import type { PaymentWithMember } from '@/features/payments/types/payment-types';
import type { UserRole } from '@/lib/supabase/database.types';

interface PaymentTableProps {
  payments: PaymentWithMember[];
  onMarkPaid: (id: string) => void;
  onMarkRefunded: (id: string) => void;
  onDelete: (id: string) => void;
  onRowSelectionChange?: (rows: PaymentWithMember[]) => void;
  role?: UserRole;
}

function getPaymentTypeLabel(type: string): string {
  return PAYMENT_TYPE_OPTIONS.find((o) => o.value === type)?.label ?? type;
}

function createColumns(
  onMarkPaid: (id: string) => void,
  onMarkRefunded: (id: string) => void,
  onDelete: (id: string) => void,
  role?: UserRole
): ColumnDef<PaymentWithMember>[] {
  const isAdminOrManager = role === 'admin' || role === 'manager';

  const cols: ColumnDef<PaymentWithMember>[] = [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && 'indeterminate')
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      id: 'member',
      accessorFn: (row) =>
        `${row.member.profile.first_name} ${row.member.profile.last_name}`,
      header: 'Member',
      cell: ({ row }) => (
        <AvatarWithName
          firstName={row.original.member.profile.first_name}
          lastName={row.original.member.profile.last_name}
          avatarUrl={row.original.member.profile.avatar_url}
          size="sm"
        />
      ),
    },
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
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3 h-8"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Amount
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <span className="font-medium">{formatCurrency(row.original.amount_cents)}</span>
      ),
      enableSorting: true,
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
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3 h-8"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Status
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <StatusBadge status={row.original.payment_status} />,
      enableSorting: true,
    },
    {
      id: 'dueDate',
      accessorKey: 'due_date',
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3 h-8"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Due Date
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.due_date ? formatDate(row.original.due_date) : '—'}
        </span>
      ),
      enableSorting: true,
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

  if (isAdminOrManager) {
    cols.push({
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const payment = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {payment.payment_status !== 'paid' && (
                <DropdownMenuItem
                  className="gap-2"
                  onClick={() => onMarkPaid(payment.id)}
                >
                  <CheckCircle className="h-4 w-4 text-emerald-600" />
                  Mark as Paid
                </DropdownMenuItem>
              )}
              {payment.payment_status === 'paid' && (
                <DropdownMenuItem
                  className="gap-2"
                  onClick={() => onMarkRefunded(payment.id)}
                >
                  <RefreshCw className="h-4 w-4 text-amber-600" />
                  Mark as Refunded
                </DropdownMenuItem>
              )}
              <DropdownMenuItem className="gap-2" asChild>
                <a href={`/payments/${payment.id}/edit`}>
                  <Pencil className="h-4 w-4" />
                  Edit
                </a>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="gap-2 text-destructive focus:text-destructive"
                onClick={() => onDelete(payment.id)}
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
      enableSorting: false,
    });
  }

  return cols;
}

export function PaymentTable({
  payments,
  onMarkPaid,
  onMarkRefunded,
  onDelete,
  onRowSelectionChange,
  role,
}: PaymentTableProps) {
  const columns = createColumns(onMarkPaid, onMarkRefunded, onDelete, role);

  return (
    <DataTable
      columns={columns}
      data={payments}
      enableRowSelection
      onRowSelectionChange={onRowSelectionChange}
      pageSize={20}
    />
  );
}
