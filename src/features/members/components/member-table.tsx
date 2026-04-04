'use client';

import { type ColumnDef } from '@tanstack/react-table';
import Link from 'next/link';
import { MoreHorizontal, ArrowUpDown } from 'lucide-react';
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
import { formatDate } from '@/lib/format';
import type { MemberWithProfile, MembershipStatus } from '@/features/members/types/member-types';

interface MemberTableProps {
  members: MemberWithProfile[];
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: MembershipStatus) => void;
}

const membershipTypeBadgeVariant: Record<string, 'default' | 'secondary' | 'outline'> = {
  senior: 'default',
  junior: 'secondary',
  social: 'outline',
  life: 'default',
  volunteer: 'secondary',
};

export function exportMembersCsv(members: MemberWithProfile[]): void {
  const headers = [
    'First Name',
    'Last Name',
    'Email',
    'Phone',
    'Membership Type',
    'Status',
    'Joined Date',
  ];

  const rows = members.map((m) => [
    m.profile.first_name,
    m.profile.last_name,
    m.profile.email,
    m.profile.phone ?? '',
    m.membership_type,
    m.membership_status,
    formatDate(m.registration_date),
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map((row) =>
      row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')
    ),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `members-${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function createColumns(
  onDelete: (id: string) => void,
  onStatusChange: (id: string, status: MembershipStatus) => void
): ColumnDef<MemberWithProfile>[] {
  return [
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
      id: 'name',
      accessorFn: (row) => `${row.profile.first_name} ${row.profile.last_name}`,
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3 h-8"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <Link href={`/members/${row.original.id}`} className="hover:underline">
          <AvatarWithName
            firstName={row.original.profile.first_name}
            lastName={row.original.profile.last_name}
            avatarUrl={row.original.profile.avatar_url}
            size="sm"
          />
        </Link>
      ),
      enableSorting: true,
    },
    {
      id: 'email',
      accessorFn: (row) => row.profile.email,
      header: 'Email',
      cell: ({ getValue }) => (
        <span className="text-sm text-muted-foreground">{getValue() as string}</span>
      ),
    },
    {
      id: 'phone',
      accessorFn: (row) => row.profile.phone,
      header: 'Phone',
      cell: ({ getValue }) => (
        <span className="text-sm text-muted-foreground">{(getValue() as string | null) ?? '—'}</span>
      ),
    },
    {
      id: 'membershipType',
      accessorKey: 'membership_type',
      header: 'Type',
      cell: ({ row }) => (
        <Badge variant={membershipTypeBadgeVariant[row.original.membership_type] ?? 'outline'}>
          {row.original.membership_type.charAt(0).toUpperCase() +
            row.original.membership_type.slice(1)}
        </Badge>
      ),
    },
    {
      id: 'status',
      accessorKey: 'membership_status',
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
      cell: ({ row }) => <StatusBadge status={row.original.membership_status} />,
      enableSorting: true,
    },
    {
      id: 'joinedDate',
      accessorKey: 'registration_date',
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3 h-8"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Joined
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {formatDate(row.original.registration_date)}
        </span>
      ),
      enableSorting: true,
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const member = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/members/${member.id}`}>View Profile</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/members/${member.id}/edit`}>Edit</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {member.membership_status !== 'active' && (
                <DropdownMenuItem onClick={() => onStatusChange(member.id, 'active')}>
                  Set Active
                </DropdownMenuItem>
              )}
              {member.membership_status !== 'suspended' && (
                <DropdownMenuItem onClick={() => onStatusChange(member.id, 'suspended')}>
                  Suspend
                </DropdownMenuItem>
              )}
              {member.membership_status !== 'inactive' && (
                <DropdownMenuItem onClick={() => onStatusChange(member.id, 'inactive')}>
                  Deactivate
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => onDelete(member.id)}
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
      enableSorting: false,
    },
  ];
}

export function MemberTable({ members, onDelete, onStatusChange }: MemberTableProps) {
  const columns = createColumns(onDelete, onStatusChange);

  return (
    <DataTable
      columns={columns}
      data={members}
      enableRowSelection
      pageSize={20}
    />
  );
}
