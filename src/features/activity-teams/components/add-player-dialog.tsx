'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { createClient } from '@/lib/supabase/client';
import { SPORT_CONFIGS } from '@/lib/constants';
import type { SportType } from '@/lib/constants';
import type { MemberWithProfile } from '@/lib/supabase/database.types';
import { addTeamMember } from '@/features/activity-teams/services/activity-team-service';

interface AddPlayerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamId: string;
  existingMemberIds: string[];
  orgId: string;
  sportType?: string;
  onPlayerAdded: () => void;
}

export function ActivityAddPlayerDialog({
  open,
  onOpenChange,
  teamId,
  existingMemberIds,
  orgId,
  sportType,
  onPlayerAdded,
}: AddPlayerDialogProps) {
  const [availableMembers, setAvailableMembers] = useState<MemberWithProfile[]>([]);
  const [memberId, setMemberId] = useState('');
  const [jerseyNumber, setJerseyNumber] = useState('');
  const [position, setPosition] = useState('');
  const [isCaptain, setIsCaptain] = useState(false);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingMembers, setFetchingMembers] = useState(false);
  const [error, setError] = useState('');

  const positions =
    sportType && sportType in SPORT_CONFIGS
      ? SPORT_CONFIGS[sportType as SportType].positionLabels
      : [];

  const fetchAvailableMembers = useCallback(async () => {
    if (!orgId) return;
    setFetchingMembers(true);

    const supabase = createClient();

    let query = supabase
      .from('members')
      .select('*, profile:profiles(*)')
      .eq('organisation_id', orgId)
      .eq('membership_status', 'active');

    if (existingMemberIds.length > 0) {
      query = query.not('id', 'in', `(${existingMemberIds.join(',')})`);
    }

    const { data } = await query.order('profile(first_name)');
    setAvailableMembers((data as unknown as MemberWithProfile[]) ?? []);
    setFetchingMembers(false);
  }, [orgId, existingMemberIds]);

  useEffect(() => {
    if (open) {
      fetchAvailableMembers();
    }
  }, [open, fetchAvailableMembers]);

  const filteredMembers = availableMembers.filter((m) => {
    const name = `${m.profile.first_name} ${m.profile.last_name}`.toLowerCase();
    return name.includes(search.toLowerCase());
  });

  function reset() {
    setMemberId('');
    setJerseyNumber('');
    setPosition('');
    setIsCaptain(false);
    setSearch('');
    setError('');
  }

  async function handleSubmit() {
    if (!memberId) {
      setError('Please select a player.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const { error: addError } = await addTeamMember(teamId, {
        member_id: memberId,
        jersey_number: jerseyNumber ? Number(jerseyNumber) : null,
        position: position || null,
        is_captain: isCaptain,
      });

      if (addError) {
        throw addError;
      }

      reset();
      onOpenChange(false);
      onPlayerAdded();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add player.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) reset();
        onOpenChange(o);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Player to Team</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Member search + select */}
          <div className="space-y-1.5">
            <Label>
              Player <span className="text-destructive">*</span>
            </Label>
            <Input
              placeholder="Search members..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="mb-1"
            />
            {fetchingMembers ? (
              <div className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading members...
              </div>
            ) : (
              <Select value={memberId} onValueChange={setMemberId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select member" />
                </SelectTrigger>
                <SelectContent>
                  {filteredMembers.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-muted-foreground">
                      No members found
                    </div>
                  ) : (
                    filteredMembers.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.profile.first_name} {m.profile.last_name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Jersey Number */}
          <div className="space-y-1.5">
            <Label htmlFor="add-jersey">Jersey Number</Label>
            <Input
              id="add-jersey"
              type="number"
              min={0}
              value={jerseyNumber}
              onChange={(e) => setJerseyNumber(e.target.value)}
              placeholder="e.g. 7"
            />
          </div>

          {/* Position */}
          <div className="space-y-1.5">
            <Label htmlFor="add-position">Position</Label>
            {positions.length > 0 ? (
              <Select value={position} onValueChange={setPosition}>
                <SelectTrigger id="add-position">
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
                id="add-position"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                placeholder="e.g. Forward"
              />
            )}
          </div>

          {/* Captain toggle */}
          <div className="flex items-center justify-between rounded-md border px-4 py-3">
            <div>
              <p className="text-sm font-medium">Team Captain</p>
              <p className="text-xs text-muted-foreground">
                Designate this player as captain
              </p>
            </div>
            <Switch checked={isCaptain} onCheckedChange={setIsCaptain} />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => {
                reset();
                onOpenChange(false);
              }}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Player
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
