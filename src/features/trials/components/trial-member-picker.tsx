'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2, Plus, Search, UserPlus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { createClient } from '@/lib/supabase/client';
import type { MemberWithProfile, CompetitionDivision } from '@/lib/supabase/database.types';

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
    const supabase = createClient();

    let { data: teams } = await supabase
      .from('activity_teams')
      .select('id')
      .eq('activity_id', activityId)
      .limit(1);

    let teamId: string;
    if (!teams || teams.length === 0) {
      const { data: newTeam } = await supabase
        .from('activity_teams')
        .insert({
          activity_id: activityId,
          organisation_id: orgId,
          name: 'Roster',
          division: division?.name ?? null,
          age_group: division?.age_group ?? null,
          coach_id: null,
          manager_id: null,
          max_players: 999,
          is_own_team: true,
          source_team_id: null,
          pool_number: null,
          seed_number: null,
        })
        .select('id')
        .single();
      teamId = (newTeam as { id: string }).id;
    } else {
      teamId = (teams[0] as { id: string }).id;
    }
    setRosterTeamId(teamId);

    const { data: members } = await supabase
      .from('activity_team_members')
      .select('id, member_id, member:members(*, profile:profiles(*))')
      .eq('activity_team_id', teamId);

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
    const supabase = createClient();
    await supabase.from('activity_team_members').delete().eq('id', teamMemberId);
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
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  const fetchMembers = useCallback(async () => {
    setFetching(true);
    const supabase = createClient();
    const { data } = await supabase
      .from('members')
      .select('*, profile:profiles(*)')
      .eq('organisation_id', orgId)
      .eq('membership_status', 'active')
      .order('profile(first_name)');
    setAllMembers((data as unknown as MemberWithProfile[]) ?? []);
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
    const supabase = createClient();
    const inserts = [...selected].map((memberId) => ({
      activity_team_id: teamId,
      member_id: memberId,
      jersey_number: null,
      position: null,
      is_captain: false,
    }));
    await supabase.from('activity_team_members').insert(inserts);
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
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">Email</th>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">Type</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-3 py-6 text-center text-muted-foreground">
                      No available members found
                    </td>
                  </tr>
                ) : (
                  filtered.map((m) => (
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
                      <td className="px-3 py-1.5 text-muted-foreground">{m.profile.email}</td>
                      <td className="px-3 py-1.5 text-muted-foreground capitalize">{m.membership_type}</td>
                    </tr>
                  ))
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
