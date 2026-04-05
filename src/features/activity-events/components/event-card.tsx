'use client';

import Link from 'next/link';
import { MapPin, Calendar, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDateTime } from '@/lib/format';
import { SPORT_CONFIGS, type SportType } from '@/lib/constants';
import type { ActivityEventWithTeams } from '@/features/activity-events/types/event-types';

interface EventCardProps {
  event: ActivityEventWithTeams;
  sportType?: string;
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

function getMatchLabel(sportType?: string): string {
  if (!sportType) return 'Match';
  const config = SPORT_CONFIGS[sportType as SportType];
  return config?.matchLabel ?? 'Match';
}

export function EventCard({ event, sportType }: EventCardProps) {
  const isMatch = event.home_team || event.away_team || event.opponent_name;
  const isCompleted = event.status === 'completed';
  const scoreDisplay =
    isCompleted && event.home_score !== null && event.away_score !== null
      ? `${event.home_score} - ${event.away_score}`
      : null;

  const activityId = event.activity_id;
  const matchLabel = getMatchLabel(sportType);

  const homeTeamName = event.home_team?.name ?? 'TBD';
  const awayTeamName = event.away_team?.name ?? event.opponent_name ?? 'TBD';

  return (
    <Link href={`/activities/${activityId}/events/${event.id}`}>
      <Card className="cursor-pointer transition-shadow hover:shadow-md">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* Content */}
            <div className="min-w-0 flex-1">
              {isMatch ? (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold">{homeTeamName}</span>
                  <span className="text-muted-foreground">vs</span>
                  <span className="font-semibold">{awayTeamName}</span>
                  {scoreDisplay && (
                    <span className="ml-1 rounded bg-muted px-2 py-0.5 text-sm font-bold">
                      {scoreDisplay}
                    </span>
                  )}
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold">{event.title ?? 'Session'}</span>
                  {event.end_time && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      until {formatDateTime(event.end_time)}
                    </span>
                  )}
                </div>
              )}

              <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {formatDateTime(event.date_time)}
                </span>
                {event.venue && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {event.venue}
                  </span>
                )}
                {event.round_number !== null && (
                  <span>Round {event.round_number}</span>
                )}
                {event.tournament_stage && (
                  <span className="capitalize">
                    {event.tournament_stage.replace(/_/g, ' ')}
                  </span>
                )}
                {event.day_number !== null && (
                  <span>Day {event.day_number}</span>
                )}
                {event.session_number !== null && (
                  <span>Session {event.session_number}</span>
                )}
              </div>
            </div>

            {/* Badges */}
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              {isMatch && event.is_home !== null && (
                <Badge variant={event.is_home ? 'default' : 'outline'} className="text-xs">
                  {event.is_home ? 'Home' : 'Away'}
                </Badge>
              )}
              {isMatch && (
                <Badge variant="outline" className="text-xs">
                  {matchLabel}
                </Badge>
              )}
              <Badge
                variant={STATUS_VARIANTS[event.status] ?? 'secondary'}
                className="text-xs"
              >
                {STATUS_LABELS[event.status] ?? event.status}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
