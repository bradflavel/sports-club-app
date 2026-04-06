'use client';

import { useEffect, useState } from 'react';
import { Loader2, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getTeamsForActivity } from '@/features/activity-teams/services/activity-team-service';
import type { ActivityTeamWithDetails } from '@/lib/supabase/database.types';

interface CompetitionTeamsMemberProps {
  activityId: string;
}

export function CompetitionTeamsMember({ activityId }: CompetitionTeamsMemberProps) {
  const [teams, setTeams] = useState<ActivityTeamWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await getTeamsForActivity(activityId);
      setTeams(data ?? []);
      setLoading(false);
    }
    load();
  }, [activityId]);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (teams.length === 0) return null;

  // Group teams by division
  const divisions = new Map<string, ActivityTeamWithDetails[]>();
  for (const team of teams) {
    const div = team.division ?? 'General';
    if (!divisions.has(div)) divisions.set(div, []);
    divisions.get(div)!.push(team);
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Users className="h-5 w-5 text-indigo-500" />
          Teams
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {[...divisions.entries()].map(([divName, divTeams]) => (
          <div key={divName} className="space-y-3">
            {divisions.size > 1 && (
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                {divName}
              </h4>
            )}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {divTeams.map((team) => (
                <div
                  key={team.id}
                  className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-accent/50"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">
                    {team.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{team.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {team.member_count !== undefined && (
                        <span className="text-xs text-muted-foreground">
                          {team.member_count} player{team.member_count !== 1 ? 's' : ''}
                        </span>
                      )}
                      {team.age_group && (
                        <Badge variant="outline" className="text-xs py-0">
                          {team.age_group}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
