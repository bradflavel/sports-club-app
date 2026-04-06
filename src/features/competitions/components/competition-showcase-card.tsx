'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Calendar, ChevronRight, Trophy, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/format';
import { getActivityPath } from '@/lib/utils';
import {
  getCompetitionStatus,
  getDivisionCount,
  type CompetitionStatus,
} from '@/features/competitions/services/competition-member-service';
import type { Activity } from '@/lib/supabase/database.types';

interface CompetitionShowcaseCardProps {
  activity: Activity;
  primaryColour: string;
  secondaryColour: string;
}

const STATUS_CONFIG: Record<
  CompetitionStatus,
  { label: string; className: string; pulse?: boolean }
> = {
  trials_open: {
    label: 'Trials Open',
    className: 'bg-emerald-500/90 text-white border-emerald-400',
    pulse: true,
  },
  upcoming: {
    label: 'Upcoming',
    className: 'bg-blue-500/90 text-white border-blue-400',
  },
  in_progress: {
    label: 'In Progress',
    className: 'bg-amber-500/90 text-white border-amber-400',
  },
  completed: {
    label: 'Completed',
    className: 'bg-zinc-500/90 text-white border-zinc-400',
  },
};

export function CompetitionShowcaseCard({
  activity,
  primaryColour,
  secondaryColour,
}: CompetitionShowcaseCardProps) {
  const [status, setStatus] = useState<CompetitionStatus>('upcoming');
  const [divisionCount, setDivisionCount] = useState(0);

  useEffect(() => {
    getCompetitionStatus(activity).then(setStatus);
    getDivisionCount(activity.id).then(setDivisionCount);
  }, [activity]);

  const statusConfig = STATUS_CONFIG[status];

  return (
    <Link href={getActivityPath(activity.activity_type, activity.slug)}>
      <div className="group relative overflow-hidden rounded-2xl border border-border/50 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
        {/* Gradient header */}
        <div
          className="relative px-6 pt-6 pb-8"
          style={{
            background: `linear-gradient(135deg, ${primaryColour} 0%, ${secondaryColour} 100%)`,
          }}
        >
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/10 -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-20 h-20 rounded-full bg-white/5 translate-y-1/2 -translate-x-1/2" />

          <div className="relative z-10">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                  <Trophy className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white leading-tight">
                    {activity.name}
                  </h3>
                  {activity.host_name && (
                    <p className="text-sm text-white/70 mt-0.5">
                      Hosted by {activity.host_name}
                    </p>
                  )}
                </div>
              </div>
              <Badge
                className={`shrink-0 border ${statusConfig.className} font-medium text-xs`}
              >
                {statusConfig.pulse && (
                  <span className="relative mr-1.5 flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
                  </span>
                )}
                {statusConfig.label}
              </Badge>
            </div>
          </div>
        </div>

        {/* Content area */}
        <div className="bg-card px-6 py-4 space-y-3">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              <span>
                {activity.start_date
                  ? formatDate(activity.start_date)
                  : activity.first_round_date
                    ? formatDate(activity.first_round_date)
                    : 'Date TBC'}
                {activity.end_date ? ` – ${formatDate(activity.end_date)}` : ''}
              </span>
            </div>
            {divisionCount > 0 && (
              <div className="flex items-center gap-1.5">
                <Users className="h-4 w-4" />
                <span>
                  {divisionCount} division{divisionCount !== 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>

          {activity.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {activity.description}
            </p>
          )}

          <div className="flex items-center justify-end text-sm font-medium text-primary group-hover:gap-2 transition-all">
            <span>View details</span>
            <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </div>
        </div>
      </div>
    </Link>
  );
}
