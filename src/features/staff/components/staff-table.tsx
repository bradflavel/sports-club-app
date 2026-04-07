'use client';

import { useRouter } from 'next/navigation';
import { MoreHorizontal, Pencil, Trash2, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getInitials } from '@/lib/utils';
import type { StaffWithDetails } from '../types';

interface StaffTableProps {
  staff: StaffWithDetails[];
  isAdmin: boolean;
  onDelete?: (id: string) => void;
}

type BadgeVariant = 'default' | 'secondary' | 'outline' | 'destructive';

const statusVariant: Record<string, BadgeVariant> = {
  active: 'default',
  inactive: 'secondary',
  on_leave: 'outline',
  pending: 'secondary',
};

const statusLabel: Record<string, string> = {
  active: 'Active',
  inactive: 'Inactive',
  on_leave: 'On Leave',
  pending: 'Pending',
};

export function StaffTable({ staff, isAdmin, onDelete }: StaffTableProps) {
  const router = useRouter();

  if (staff.length === 0) {
    return (
      <div className="rounded-md border p-8 text-center text-muted-foreground">
        No staff members found.
      </div>
    );
  }

  // Group staff by profile_id to show multi-role people together
  const grouped = new Map<string, StaffWithDetails[]>();
  for (const s of staff) {
    const existing = grouped.get(s.profile_id) ?? [];
    existing.push(s);
    grouped.set(s.profile_id, existing);
  }

  return (
    <div className="rounded-md border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="px-4 py-3 text-left font-medium">Name</th>
            <th className="px-4 py-3 text-left font-medium hidden sm:table-cell">Type</th>
            <th className="px-4 py-3 text-left font-medium hidden md:table-cell">Position</th>
            <th className="px-4 py-3 text-left font-medium hidden lg:table-cell">Email</th>
            <th className="px-4 py-3 text-left font-medium">Status</th>
            <th className="px-4 py-3 text-right font-medium w-12"></th>
          </tr>
        </thead>
        <tbody>
          {Array.from(grouped.entries()).map(([profileId, records]) => {
            const primary = records[0];
            const profile = primary.profile;
            const fullName = `${profile.first_name} ${profile.last_name}`;

            return records.map((record, idx) => (
              <tr
                key={record.id}
                className="border-b hover:bg-muted/30 cursor-pointer"
                onClick={() => router.push(`/staff/${record.id}`)}
              >
                <td className="px-4 py-3">
                  {idx === 0 ? (
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={profile.avatar_url ?? undefined} />
                        <AvatarFallback className="text-xs">{getInitials(profile.first_name, profile.last_name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{fullName}</p>
                        <p className="text-xs text-muted-foreground sm:hidden">{record.staff_type.name}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="pl-11 text-muted-foreground text-xs">(same person)</div>
                  )}
                </td>
                <td className="px-4 py-3 hidden sm:table-cell">
                  <Badge variant="outline">{record.staff_type.name}</Badge>
                </td>
                <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">
                  {record.position || '\u2014'}
                </td>
                <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground">
                  {idx === 0 ? profile.email : ''}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={statusVariant[record.status] ?? 'secondary'}>
                    {statusLabel[record.status] ?? record.status}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                  {isAdmin && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => router.push(`/staff/${record.id}`)}>
                          <Eye className="mr-2 h-4 w-4" /> View
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push(`/staff/${record.id}/edit`)}>
                          <Pencil className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => onDelete?.(record.id)}>
                          <Trash2 className="mr-2 h-4 w-4" /> Remove
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </td>
              </tr>
            ));
          })}
        </tbody>
      </table>
    </div>
  );
}
