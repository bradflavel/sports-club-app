'use client';

import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ActivityStandingWithTeam } from '@/lib/supabase/database.types';

interface StandingsTableProps {
  standings: ActivityStandingWithTeam[];
  onRecalculate?: () => void;
  loading?: boolean;
}

export function StandingsTable({
  standings,
  onRecalculate,
  loading,
}: StandingsTableProps) {
  // Sort by ladder_points desc, then points diff desc
  const sorted = [...standings].sort((a, b) => {
    if (b.ladder_points !== a.ladder_points) return b.ladder_points - a.ladder_points;
    const diffA = a.points_for - a.points_against;
    const diffB = b.points_for - b.points_against;
    return diffB - diffA;
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-base">Ladder</CardTitle>
        {onRecalculate && (
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={onRecalculate}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Recalculate
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {sorted.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No standings data yet. Enter match results and recalculate to see the ladder.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs font-medium text-muted-foreground">
                  <th className="pb-2 pr-2">#</th>
                  <th className="pb-2 pr-4">Team</th>
                  <th className="pb-2 pr-2 text-center">P</th>
                  <th className="pb-2 pr-2 text-center">W</th>
                  <th className="pb-2 pr-2 text-center">L</th>
                  <th className="pb-2 pr-2 text-center">D</th>
                  <th className="pb-2 pr-2 text-center">PF</th>
                  <th className="pb-2 pr-2 text-center">PA</th>
                  <th className="pb-2 pr-2 text-center">PD</th>
                  <th className="pb-2 text-center font-semibold">Pts</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((standing, index) => {
                  const diff = standing.points_for - standing.points_against;
                  const isOwnTeam = standing.team?.is_own_team;
                  return (
                    <tr
                      key={standing.id}
                      className={`border-b last:border-0 ${isOwnTeam ? 'bg-primary/5 font-medium' : ''}`}
                    >
                      <td className="py-2 pr-2 text-muted-foreground">
                        {index + 1}
                      </td>
                      <td className="py-2 pr-4">
                        {standing.team?.name ?? 'Unknown'}
                      </td>
                      <td className="py-2 pr-2 text-center">{standing.played}</td>
                      <td className="py-2 pr-2 text-center">{standing.wins}</td>
                      <td className="py-2 pr-2 text-center">{standing.losses}</td>
                      <td className="py-2 pr-2 text-center">{standing.draws}</td>
                      <td className="py-2 pr-2 text-center">{standing.points_for}</td>
                      <td className="py-2 pr-2 text-center">{standing.points_against}</td>
                      <td className="py-2 pr-2 text-center">
                        {diff > 0 ? `+${diff}` : diff}
                      </td>
                      <td className="py-2 text-center font-semibold">
                        {standing.ladder_points}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
