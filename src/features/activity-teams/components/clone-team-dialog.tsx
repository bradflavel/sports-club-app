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
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { cloneTeam } from '@/features/activity-teams/services/activity-team-service';
import type { Activity, ActivityTeam } from '@/lib/supabase/database.types';

interface CloneTeamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetActivityId: string;
  orgId: string;
  onTeamCloned: () => void;
}

export function CloneTeamDialog({
  open,
  onOpenChange,
  targetActivityId,
  orgId,
  onTeamCloned,
}: CloneTeamDialogProps) {
  const { toast } = useToast();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [teams, setTeams] = useState<ActivityTeam[]>([]);
  const [selectedActivityId, setSelectedActivityId] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [cloning, setCloning] = useState(false);

  const fetchActivities = useCallback(async () => {
    if (!orgId) return;
    setLoadingActivities(true);
    const supabase = createClient();

    const { data } = await supabase
      .from('activities')
      .select('*')
      .eq('organisation_id', orgId)
      .order('start_date', { ascending: false });

    setActivities((data as unknown as Activity[]) ?? []);
    setLoadingActivities(false);
  }, [orgId]);

  const fetchTeams = useCallback(async () => {
    if (!selectedActivityId) {
      setTeams([]);
      return;
    }
    setLoadingTeams(true);
    const supabase = createClient();

    const { data } = await supabase
      .from('activity_teams')
      .select('*')
      .eq('activity_id', selectedActivityId)
      .eq('is_own_team', true)
      .order('name');

    setTeams((data as unknown as ActivityTeam[]) ?? []);
    setLoadingTeams(false);
  }, [selectedActivityId]);

  useEffect(() => {
    if (open) {
      fetchActivities();
    }
  }, [open, fetchActivities]);

  useEffect(() => {
    fetchTeams();
    setSelectedTeamId('');
  }, [selectedActivityId, fetchTeams]);

  function reset() {
    setSelectedActivityId('');
    setSelectedTeamId('');
    setTeams([]);
  }

  async function handleClone() {
    if (!selectedTeamId) return;
    setCloning(true);
    try {
      const { error } = await cloneTeam(selectedTeamId, targetActivityId, orgId);
      if (error) {
        toast({
          title: 'Error cloning team',
          description: error instanceof Error ? error.message : 'An error occurred',
          variant: 'destructive',
        });
      } else {
        toast({ title: 'Team cloned successfully' });
        reset();
        onOpenChange(false);
        onTeamCloned();
      }
    } finally {
      setCloning(false);
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
          <DialogTitle>Clone Team from Another Activity</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Activity select */}
          <div className="space-y-1.5">
            <Label>Source Activity</Label>
            {loadingActivities ? (
              <div className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading activities...
              </div>
            ) : (
              <Select value={selectedActivityId} onValueChange={setSelectedActivityId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select activity" />
                </SelectTrigger>
                <SelectContent>
                  {activities.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Team select */}
          <div className="space-y-1.5">
            <Label>Team to Clone</Label>
            {loadingTeams ? (
              <div className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading teams...
              </div>
            ) : (
              <Select
                value={selectedTeamId}
                onValueChange={setSelectedTeamId}
                disabled={!selectedActivityId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select team" />
                </SelectTrigger>
                <SelectContent>
                  {teams.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-muted-foreground">
                      No teams found
                    </div>
                  ) : (
                    teams.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                        {t.division ? ` - ${t.division}` : ''}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => {
                reset();
                onOpenChange(false);
              }}
              disabled={cloning}
            >
              Cancel
            </Button>
            <Button onClick={handleClone} disabled={cloning || !selectedTeamId}>
              {cloning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Clone Team
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
