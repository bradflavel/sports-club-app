'use client';

import {
  Calendar,
  CalendarClock,
  DollarSign,
  Flame,
  Gauge,
  MapPin,
  Repeat,
  Trophy,
  Users,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatDate, formatCurrency } from '@/lib/format';
import type { CompetitionStatus } from '@/features/competitions/services/competition-member-service';
import type { Activity } from '@/lib/supabase/database.types';

interface CompetitionHeroBannerProps {
  activity: Activity;
  status: CompetitionStatus;
  primaryColour: string;
  secondaryColour: string;
  divisionCount: number;
  trialFeeInfo: { amount: number; type: string } | null;
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
    className: 'bg-white/20 text-white border-white/30',
  },
  in_progress: {
    label: 'In Progress',
    className: 'bg-amber-500/90 text-white border-amber-400',
  },
  completed: {
    label: 'Completed',
    className: 'bg-white/20 text-white border-white/30',
  },
};

export function CompetitionHeroBanner({
  activity,
  status,
  primaryColour,
  secondaryColour,
  divisionCount,
  trialFeeInfo,
}: CompetitionHeroBannerProps) {
  const statusConfig = STATUS_CONFIG[status];
  const details = buildDetails(activity, divisionCount, trialFeeInfo);

  return (
    <div
      className="relative overflow-hidden rounded-2xl"
      style={{
        background: `linear-gradient(135deg, ${primaryColour} 0%, ${secondaryColour} 100%)`,
      }}
    >
      {/* Decorative circles */}
      <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-white/5 -translate-y-1/3 translate-x-1/4" />
      <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-white/5 translate-y-1/3 -translate-x-1/4" />
      <div className="absolute top-1/3 right-1/3 w-24 h-24 rounded-full bg-white/5" />

      <div className="relative z-10">
        {/* Main content */}
        <div className="px-6 pt-8 pb-6 sm:px-10 sm:pt-12 sm:pb-8">
          <Badge className={`border ${statusConfig.className} text-sm px-3 py-1 mb-4`}>
            {statusConfig.pulse && (
              <span className="relative mr-1.5 flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
              </span>
            )}
            {statusConfig.label}
          </Badge>

          <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-2">
            {activity.name}
          </h1>

          {activity.host_name && (
            <p className="text-white/60 text-sm mb-4">
              Hosted by {activity.host_name}
            </p>
          )}

          {/* Date + venue inline */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-white/80 mb-6">
            {(activity.start_date || activity.first_round_date) && (
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                <span className="text-sm font-medium">
                  {activity.start_date
                    ? formatDate(activity.start_date)
                    : formatDate(activity.first_round_date!)}
                  {activity.end_date ? ` – ${formatDate(activity.end_date)}` : ''}
                </span>
              </div>
            )}
            {activity.default_venue && (
              <div className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4" />
                <span className="text-sm font-medium">{activity.default_venue}</span>
              </div>
            )}
          </div>

          {activity.description && (
            <p className="text-white/70 text-sm leading-relaxed max-w-3xl">
              {activity.description}
            </p>
          )}
        </div>

        {/* Key details bar — integrated into the banner */}
        {details.length > 0 && (
          <div className="border-t border-white/10 bg-black/10 backdrop-blur-sm px-6 py-4 sm:px-10">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              {details.map((d) => (
                <div key={d.label} className="flex items-center gap-2 text-white/80">
                  {d.icon}
                  <span className="text-xs uppercase tracking-wider font-medium text-white/50">
                    {d.label}
                  </span>
                  <span className="text-sm font-semibold text-white">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function buildDetails(
  activity: Activity,
  divisionCount: number,
  trialFeeInfo: { amount: number; type: string } | null
) {
  const items: { icon: React.ReactNode; label: string; value: string }[] = [];

  if (activity.total_rounds) {
    let format = `${activity.total_rounds} rounds`;
    if (activity.has_finals) format += ' + finals';
    items.push({
      icon: <Repeat className="h-3.5 w-3.5" />,
      label: 'Format',
      value: format,
    });
  }

  if (divisionCount > 0) {
    items.push({
      icon: <Users className="h-3.5 w-3.5" />,
      label: 'Divisions',
      value: String(divisionCount),
    });
  }

  if (activity.schedule_frequency) {
    items.push({
      icon: <CalendarClock className="h-3.5 w-3.5" />,
      label: 'Schedule',
      value: activity.schedule_frequency.charAt(0).toUpperCase() + activity.schedule_frequency.slice(1),
    });
  }

  // Season cost
  const feeType = activity.season_fee_type ?? 'tbd';
  if (feeType === 'free') {
    items.push({ icon: <DollarSign className="h-3.5 w-3.5" />, label: 'Cost', value: 'Free' });
  } else if (feeType === 'fixed' && (activity.season_fee_amount_cents ?? 0) > 0) {
    items.push({ icon: <DollarSign className="h-3.5 w-3.5" />, label: 'Cost', value: `${formatCurrency(activity.season_fee_amount_cents!)} pp` });
  } else if (feeType === 'range' && (activity.season_fee_min_cents ?? 0) > 0) {
    items.push({ icon: <DollarSign className="h-3.5 w-3.5" />, label: 'Cost', value: `${formatCurrency(activity.season_fee_min_cents!)} – ${formatCurrency(activity.season_fee_max_cents ?? 0)}` });
  } else {
    items.push({ icon: <DollarSign className="h-3.5 w-3.5" />, label: 'Cost', value: 'TBD' });
  }

  if (trialFeeInfo && trialFeeInfo.amount > 0) {
    items.push({
      icon: <Trophy className="h-3.5 w-3.5" />,
      label: 'Trial Fee',
      value: trialFeeInfo.type === 'per_trial'
        ? `${formatCurrency(trialFeeInfo.amount)} / session`
        : formatCurrency(trialFeeInfo.amount),
    });
  }

  // Skill level
  const skillLabels: Record<string, string> = {
    all_levels: 'All Levels',
    beginner: 'Beginner',
    intermediate: 'Intermediate',
    advanced: 'Advanced',
    elite: 'Elite',
  };
  if (activity.skill_level && skillLabels[activity.skill_level]) {
    items.push({
      icon: <Gauge className="h-3.5 w-3.5" />,
      label: 'Skill',
      value: skillLabels[activity.skill_level],
    });
  }

  // Commitment level
  const commitLabels: Record<string, string> = {
    casual: 'Casual',
    regular: 'Regular',
    committed: 'Committed',
    competitive: 'Competitive',
  };
  if (activity.commitment_level && commitLabels[activity.commitment_level]) {
    items.push({
      icon: <Flame className="h-3.5 w-3.5" />,
      label: 'Commitment',
      value: commitLabels[activity.commitment_level],
    });
  }

  return items;
}
