'use client';

import Link from 'next/link';
import { MapPin, Calendar } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDateTime } from '@/lib/format';
import type { FixtureWithTeam } from '@/features/fixtures/types/fixture-types';

interface FixtureCardProps {
  fixture: FixtureWithTeam;
}

const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  scheduled: 'secondary',
  in_progress: 'default',
  completed: 'outline',
  cancelled: 'destructive',
  postponed: 'destructive',
  bye: 'outline',
};

const STATUS_LABELS: Record<string, string> = {
  scheduled: 'Scheduled',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
  postponed: 'Postponed',
  bye: 'Bye',
};

export function FixtureCard({ fixture }: FixtureCardProps) {
  const isCompleted = fixture.status === 'completed';
  const scoreDisplay =
    isCompleted && fixture.home_score !== null && fixture.away_score !== null
      ? `${fixture.home_score} – ${fixture.away_score}`
      : null;

  return (
    <Link href={`/fixtures/${fixture.id}`}>
      <Card className="cursor-pointer transition-shadow hover:shadow-md">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* Teams */}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold">{fixture.team.name}</span>
                <span className="text-muted-foreground">vs</span>
                <span className="font-semibold">{fixture.opponent_name}</span>
                {scoreDisplay && (
                  <span className="ml-1 rounded bg-muted px-2 py-0.5 text-sm font-bold">
                    {scoreDisplay}
                  </span>
                )}
              </div>

              <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {formatDateTime(fixture.date_time)}
                </span>
                {fixture.venue && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {fixture.venue}
                  </span>
                )}
                {fixture.round_number !== null && (
                  <span>Round {fixture.round_number}</span>
                )}
              </div>
            </div>

            {/* Badges */}
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <Badge variant={fixture.is_home ? 'default' : 'outline'} className="text-xs">
                {fixture.is_home ? 'Home' : 'Away'}
              </Badge>
              <Badge
                variant={STATUS_VARIANTS[fixture.status] ?? 'secondary'}
                className="text-xs"
              >
                {STATUS_LABELS[fixture.status] ?? fixture.status}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
