'use client';

import Link from 'next/link';
import { Users, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { ActivityTeamWithDetails } from '@/features/activity-teams/types/activity-team-types';

interface TeamCardProps {
  team: ActivityTeamWithDetails;
  activityId: string;
}

export function ActivityTeamCard({ team, activityId }: TeamCardProps) {
  const coachName = team.coach
    ? `${team.coach.first_name} ${team.coach.last_name}`
    : null;

  const managerName = team.manager
    ? `${team.manager.first_name} ${team.manager.last_name}`
    : null;

  const playerCount = team.member_count ?? 0;

  return (
    <Link href={`/activities/${activityId}/teams/${team.id}`}>
      <Card className="h-full cursor-pointer transition-shadow hover:shadow-md">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold leading-tight">{team.name}</h3>
            <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {team.division && (
              <Badge variant="secondary" className="text-xs">
                {team.division}
              </Badge>
            )}
            {team.age_group && (
              <Badge variant="outline" className="text-xs">
                {team.age_group}
              </Badge>
            )}
            {!team.is_own_team && (
              <Badge variant="destructive" className="text-xs">
                External
              </Badge>
            )}
            {team.pool_number != null && (
              <Badge variant="outline" className="text-xs">
                Pool {team.pool_number}
              </Badge>
            )}
            {team.seed_number != null && (
              <Badge variant="outline" className="text-xs">
                Seed {team.seed_number}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-2 pt-0 text-sm text-muted-foreground">
          {coachName && (
            <p>
              <span className="font-medium text-foreground">Coach:</span> {coachName}
            </p>
          )}
          {managerName && (
            <p>
              <span className="font-medium text-foreground">Manager:</span> {managerName}
            </p>
          )}
          <div className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" />
            <span>
              {playerCount}/{team.max_players} players
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
