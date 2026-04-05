'use client';

import { useState } from 'react';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { Shield, Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { AvatarWithName } from '@/components/shared/avatar-with-name';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatDate } from '@/lib/format';
import { SPORT_CONFIGS } from '@/lib/constants';
import type { SportType } from '@/lib/constants';
import type { ActivityTeamMemberWithDetails } from '@/features/activity-teams/types/activity-team-types';

interface EditMemberData {
  jerseyNumber?: number;
  position?: string;
  isCaptain: boolean;
}

interface ActivityRosterTableProps {
  members: ActivityTeamMemberWithDetails[];
  onEdit: (teamMemberId: string, data: EditMemberData) => Promise<void>;
  onRemove: (teamMemberId: string) => Promise<void>;
  sportType?: string;
}

const columnHelper = createColumnHelper<ActivityTeamMemberWithDetails>();

export function ActivityRosterTable({
  members,
  onEdit,
  onRemove,
  sportType,
}: ActivityRosterTableProps) {
  const [editTarget, setEditTarget] = useState<ActivityTeamMemberWithDetails | null>(null);
  const [editData, setEditData] = useState<EditMemberData>({
    jerseyNumber: undefined,
    position: '',
    isCaptain: false,
  });
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);

  const positions =
    sportType && sportType in SPORT_CONFIGS
      ? SPORT_CONFIGS[sportType as SportType].positionLabels
      : [];

  function openEdit(row: ActivityTeamMemberWithDetails) {
    setEditTarget(row);
    setEditData({
      jerseyNumber: row.jersey_number ?? undefined,
      position: row.position ?? '',
      isCaptain: row.is_captain,
    });
  }

  async function handleSaveEdit() {
    if (!editTarget) return;
    setSaving(true);
    try {
      await onEdit(editTarget.id, editData);
      setEditTarget(null);
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove(id: string) {
    setRemoving(id);
    try {
      await onRemove(id);
    } finally {
      setRemoving(null);
    }
  }

  const columns = [
    columnHelper.accessor('member', {
      header: 'Player',
      cell: (info) => {
        const member = info.getValue();
        const profile = member.profile;
        return (
          <Link href={`/members/${member.id}`} className="hover:underline">
            <AvatarWithName
              firstName={profile.first_name}
              lastName={profile.last_name}
              avatarUrl={profile.avatar_url}
              size="sm"
            />
          </Link>
        );
      },
    }),
    columnHelper.accessor('jersey_number', {
      header: 'Jersey #',
      cell: (info) => info.getValue() ?? '\u2014',
    }),
    columnHelper.accessor('position', {
      header: 'Position',
      cell: (info) => info.getValue() ?? '\u2014',
    }),
    columnHelper.accessor('is_captain', {
      header: 'Captain',
      cell: (info) =>
        info.getValue() ? (
          <span className="inline-flex items-center gap-1 text-amber-600">
            <Shield className="h-3.5 w-3.5 fill-amber-600" />
            Captain
          </span>
        ) : null,
    }),
    columnHelper.accessor('joined_at', {
      header: 'Date Added',
      cell: (info) => formatDate(info.getValue()),
    }),
    columnHelper.display({
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openEdit(row.original)}
            className="h-8 w-8 p-0"
          >
            <Pencil className="h-3.5 w-3.5" />
            <span className="sr-only">Edit</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleRemove(row.original.id)}
            disabled={removing === row.original.id}
            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span className="sr-only">Remove</span>
          </Button>
        </div>
      ),
    }),
  ];

  const table = useReactTable({
    data: members,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <>
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b bg-muted/50">
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-3 text-left font-medium text-muted-foreground"
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  No players in this team yet.
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="border-b last:border-0 hover:bg-muted/30">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editTarget} onOpenChange={(open) => !open && setEditTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Player</DialogTitle>
          </DialogHeader>
          {editTarget && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="edit-jersey">Jersey Number</Label>
                <Input
                  id="edit-jersey"
                  type="number"
                  min={0}
                  value={editData.jerseyNumber ?? ''}
                  onChange={(e) =>
                    setEditData((prev) => ({
                      ...prev,
                      jerseyNumber: e.target.value ? Number(e.target.value) : undefined,
                    }))
                  }
                  placeholder="e.g. 7"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-position">Position</Label>
                {positions.length > 0 ? (
                  <Select
                    value={editData.position ?? ''}
                    onValueChange={(val) =>
                      setEditData((prev) => ({ ...prev, position: val }))
                    }
                  >
                    <SelectTrigger id="edit-position">
                      <SelectValue placeholder="Select position" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No position</SelectItem>
                      {positions.map((pos) => (
                        <SelectItem key={pos} value={pos}>
                          {pos}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    id="edit-position"
                    value={editData.position ?? ''}
                    onChange={(e) =>
                      setEditData((prev) => ({ ...prev, position: e.target.value }))
                    }
                    placeholder="e.g. Forward"
                  />
                )}
              </div>
              <div className="flex items-center gap-3">
                <Checkbox
                  id="edit-captain"
                  checked={editData.isCaptain}
                  onCheckedChange={(checked) =>
                    setEditData((prev) => ({ ...prev, isCaptain: checked === true }))
                  }
                />
                <Label htmlFor="edit-captain">Team Captain</Label>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={() => setEditTarget(null)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveEdit} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
