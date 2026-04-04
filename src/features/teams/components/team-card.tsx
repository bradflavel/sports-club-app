'use client';

import Link from 'next/link';
import { Users, Calendar, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/format';
import type { TeamWithDetails } from '@/features/teams/types/team-types';

interface TeamCardProps {
  team: TeamWithDetails;
}

export function TeamCard({ team }: TeamCardProps) {
  const coachName = team.coach
    ? `${team.coach.first_name} ${team.coach.last_name}`
    : null;

  const playerCount = team.member_count ?? 0;

  const nextFixture = null; // fixtures fetched separately where needed

  return (
    <Link href={`/teams/${team.id}`}>
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
          </div>
        </CardHeader>
        <CardContent className="space-y-2 pt-0 text-sm text-muted-foreground">
          {team.season && (
            <p className="text-xs font-medium text-foreground">{team.season.name}</p>
          )}
          {coachName && (
            <p>
              <span className="font-medium text-foreground">Coach:</span> {coachName}
            </p>
          )}
          <div className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" />
            <span>
              {playerCount}/{team.max_players} players
            </span>
          </div>
          {nextFixture && (
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              <span>Next: {formatDate(nextFixture)}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
