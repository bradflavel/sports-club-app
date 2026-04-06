'use client';

import { useEffect, useState } from 'react';
import { Loader2, Medal } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getStandings } from '@/features/activity-events/services/standings-service';
import { cn } from '@/lib/utils';
import type { ActivityStandingWithTeam } from '@/lib/supabase/database.types';

interface CompetitionStandingsMemberProps {
  activityId: string;
}

export function CompetitionStandingsMember({ activityId }: CompetitionStandingsMemberProps) {
  const [standings, setStandings] = useState<ActivityStandingWithTeam[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await getStandings(activityId);
      setStandings(data ?? []);
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

  if (standings.length === 0) return null;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Medal className="h-5 w-5 text-amber-500" />
          Ladder
        </CardTitle>
      </CardHeader>
      <CardContent className="px-0 pb-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground w-8">#</th>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Team</th>
                <th className="px-4 py-2.5 text-center font-medium text-muted-foreground">P</th>
                <th className="px-4 py-2.5 text-center font-medium text-muted-foreground">W</th>
                <th className="px-4 py-2.5 text-center font-medium text-muted-foreground">L</th>
                <th className="px-4 py-2.5 text-center font-medium text-muted-foreground">D</th>
                <th className="px-4 py-2.5 text-center font-medium text-muted-foreground">PF</th>
                <th className="px-4 py-2.5 text-center font-medium text-muted-foreground">PA</th>
                <th className="px-4 py-2.5 text-center font-semibold text-foreground">Pts</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((s, idx) => (
                <tr
                  key={s.id}
                  className={cn(
                    'border-b last:border-0 transition-colors',
                    idx < 3 && 'bg-primary/5'
                  )}
                >
                  <td className="px-4 py-2.5 font-semibold text-muted-foreground">
                    {idx + 1}
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        {s.team.name.charAt(0)}
                      </div>
                      <span className="font-medium">{s.team.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-center text-muted-foreground">{s.played}</td>
                  <td className="px-4 py-2.5 text-center text-muted-foreground">{s.wins}</td>
                  <td className="px-4 py-2.5 text-center text-muted-foreground">{s.losses}</td>
                  <td className="px-4 py-2.5 text-center text-muted-foreground">{s.draws}</td>
                  <td className="px-4 py-2.5 text-center text-muted-foreground">{s.points_for}</td>
                  <td className="px-4 py-2.5 text-center text-muted-foreground">{s.points_against}</td>
                  <td className="px-4 py-2.5 text-center font-bold">{s.ladder_points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
