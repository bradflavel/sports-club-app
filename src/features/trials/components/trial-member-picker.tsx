'use client';

import { useCallback, useEffect, useState } from 'react';
import { Filter, Loader2, Plus, Search, UserPlus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  getOrCreateRosterTeam,
  getRosterMembers,
  removeRosterMember,
  addRosterMembers,
  getActiveMembersForOrg,
} from '@/features/trials/services/trial-service';
import type { MemberWithProfile, CompetitionDivision } from '@/lib/supabase/database.types';

function calcAge(dob: string): number {
  const birth = new Date(dob + 'T00:00:00');
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const monthDiff = now.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) age--;
  return age;
}

function formatDob(dob: string): string {
  const [y, m, d] = dob.split('-');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${parseInt(d)} ${months[parseInt(m) - 1]} ${y}`;
}

/** Parse an age group string like "U18" or "Under 16" into a max age number */
function parseAgeLimit(ageGroup: string): number | null {
  const match = ageGroup.match(/(?:u|under\s*)(\d+)/i);
  return match ? parseInt(match[1]) : null;
}

interface TrialMemberPickerProps {
  activityId: string;
  orgId: string;
  division?: CompetitionDivision | null;
}

interface TrialRosterMember {
  teamMemberId: string;
  member: MemberWithProfile;
}

export function TrialMemberPicker({ activityId, orgId, division }: TrialMemberPickerProps) {
  const [rosterMembers, setRosterMembers] = useState<TrialRosterMember[]>([]);
  const [rosterTeamId, setRosterTeamId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);

  const fetchRoster = useCallback(async () => {
    const { teamId } = await getOrCreateRosterTeam(activityId, orgId, division);
    if (!teamId) {
      setLoading(false);
      return;
    }
    setRosterTeamId(teamId);

    const { data: members } = await getRosterMembers(teamId);
    const roster: TrialRosterMember[] = (members ?? []).map((m: unknown) => {
      const row = m as { id: string; member: MemberWithProfile };
      return { teamMemberId: row.id, member: row.member };
    });
    setRosterMembers(roster);
    setLoading(false);
  }, [activityId, orgId, division]);

  useEffect(() => {
    fetchRoster();
  }, [fetchRoster]);

  async function handleRemove(teamMemberId: string) {
    await removeRosterMember(teamMemberId);
    setRosterMembers((prev) => prev.filter((m) => m.teamMemberId !== teamMemberId));
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading...
      </div>
    );
  }

  if (rosterMembers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed py-8">
        <UserPlus className="h-8 w-8 text-muted-foreground/50 mb-2" />
        <p className="text-sm font-medium">No members added yet</p>
        <p className="text-xs text-muted-foreground mb-3">Add members from your club to this trial</p>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus className="mr-1.5 h-4 w-4" />
          Add Members
        </Button>
        {rosterTeamId && (
          <AddMembersDialog
            open={addOpen}
            onOpenChange={setAddOpen}
            orgId={orgId}
            teamId={rosterTeamId}
            existingMemberIds={[]}
            division={division}
            onMembersAdded={fetchRoster}
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{rosterMembers.length} member{rosterMembers.length !== 1 ? 's' : ''}</p>
        <Button size="sm" className="h-7 text-xs gap-1" onClick={() => setAddOpen(true)}>
          <Plus className="h-3.5 w-3.5" /> Add
        </Button>
      </div>
      <div className="rounded-md border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-3 py-1.5 text-left font-medium text-muted-foreground">Name</th>
              <th className="px-3 py-1.5 text-left font-medium text-muted-foreground">Email</th>
              <th className="px-3 py-1.5 w-10" />
            </tr>
          </thead>
          <tbody>
            {rosterMembers.map((rm) => (
              <tr key={rm.teamMemberId} className="border-b last:border-0">
                <td className="px-3 py-1.5">{rm.member.profile.first_name} {rm.member.profile.last_name}</td>
                <td className="px-3 py-1.5 text-muted-foreground">{rm.member.profile.email}</td>
                <td className="px-3 py-1.5 text-right">
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => handleRemove(rm.teamMemberId)}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rosterTeamId && (
        <AddMembersDialog
          open={addOpen}
          onOpenChange={setAddOpen}
          orgId={orgId}
          teamId={rosterTeamId}
          existingMemberIds={rosterMembers.map((m) => m.member.id)}
          division={division}
          onMembersAdded={fetchRoster}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------

interface AddMembersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId: string;
  teamId: string;
  existingMemberIds: string[];
  division?: CompetitionDivision | null;
  onMembersAdded: () => void;
}

function AddMembersDialog({
  open,
  onOpenChange,
  orgId,
  teamId,
  existingMemberIds,
  division,
  onMembersAdded,
}: AddMembersDialogProps) {
  const [allMembers, setAllMembers] = useState<MemberWithProfile[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [filterByConstraints, setFilterByConstraints] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  const hasConstraints = !!(division && (
    (division.gender && division.gender !== 'open') || division.age_group
  ));

  const fetchMembers = useCallback(async () => {
    setFetching(true);
    const { data } = await getActiveMembersForOrg(orgId);
    setAllMembers(data ?? []);
    setFetching(false);
  }, [orgId]);

  useEffect(() => {
    if (open) {
      fetchMembers();
      setSelected(new Set());
      setSearch('');
    }
  }, [open, fetchMembers]);

  const filtered = allMembers.filter((m) => {
    if (existingMemberIds.includes(m.id)) return false;
    const name = `${m.profile.first_name} ${m.profile.last_name}`.toLowerCase();
    if (search && !name.includes(search.toLowerCase())) return false;

    if (filterByConstraints && division) {
      // Gender filter
      if (division.gender && division.gender !== 'open' && division.gender !== 'mixed') {
        if (m.profile.gender && m.profile.gender !== division.gender) return false;
      }
      // Age filter (e.g. "U18" means must be under 18)
      if (division.age_group) {
        const ageLimit = parseAgeLimit(division.age_group);
        if (ageLimit && m.profile.date_of_birth) {
          const age = calcAge(m.profile.date_of_birth);
          if (age >= ageLimit) return false;
        }
      }
    }

    return true;
  });

  function toggleMember(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((m) => m.id)));
    }
  }

  async function handleAdd() {
    if (selected.size === 0) return;
    setLoading(true);
    await addRosterMembers(teamId, [...selected]);
    setLoading(false);
    onOpenChange(false);
    onMembersAdded();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Add Members to Trial</DialogTitle>
          {division && (
            <p className="text-sm text-muted-foreground">
              {division.name}{division.age_group ? ` \u00B7 ${division.age_group}` : ''}{division.gender && division.gender !== 'open' ? ` \u00B7 ${division.gender}` : ''}
            </p>
          )}
        </DialogHeader>

        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search members..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          {hasConstraints && (
            <Button
              size="sm"
              variant={filterByConstraints ? 'default' : 'outline'}
              className="h-9 gap-1.5 text-xs shrink-0"
              onClick={() => setFilterByConstraints(!filterByConstraints)}
            >
              <Filter className="h-3.5 w-3.5" />
              {filterByConstraints ? 'Filtered' : 'Filter by division'}
            </Button>
          )}
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {selected.size} selected
          </span>
        </div>

        {fetching ? (
          <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading members...
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto rounded-md border min-h-0">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-muted/80 backdrop-blur-sm">
                <tr className="border-b">
                  <th className="px-3 py-2 w-10">
                    <Checkbox
                      checked={selected.size === filtered.length && filtered.length > 0}
                      onCheckedChange={toggleAll}
                    />
                  </th>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">Name</th>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">Gender</th>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">Date of Birth</th>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">Type</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">
                      No available members found
                    </td>
                  </tr>
                ) : (
                  filtered.map((m) => {
                    const dob = m.profile.date_of_birth;
                    const age = dob ? calcAge(dob) : null;
                    return (
                      <tr
                        key={m.id}
                        className="border-b last:border-0 hover:bg-muted/50 cursor-pointer"
                        onClick={() => toggleMember(m.id)}
                      >
                        <td className="px-3 py-1.5">
                          <Checkbox checked={selected.has(m.id)} />
                        </td>
                        <td className="px-3 py-1.5 font-medium">
                          {m.profile.first_name} {m.profile.last_name}
                        </td>
                        <td className="px-3 py-1.5 text-muted-foreground capitalize">
                          {m.profile.gender ?? '—'}
                        </td>
                        <td className="px-3 py-1.5 text-muted-foreground">
                          {dob ? (
                            <>
                              {formatDob(dob)}{' '}
                              <span className="text-xs">({age})</span>
                            </>
                          ) : '—'}
                        </td>
                        <td className="px-3 py-1.5 text-muted-foreground capitalize">{m.membership_type}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t">
          <p className="text-xs text-muted-foreground">{filtered.length} available</p>
          <Button size="sm" onClick={handleAdd} disabled={selected.size === 0 || loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Add {selected.size > 0 ? `${selected.size} Member${selected.size > 1 ? 's' : ''}` : 'Members'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
