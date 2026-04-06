'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { PageSkeleton } from '@/components/shared/loading-skeleton';
import { Button } from '@/components/ui/button';
import { CompetitionHeroBanner } from './competition-hero-banner';
import { CompetitionTrialsSection } from './competition-trials-section';
import { CompetitionStandingsMember } from './competition-standings-member';
import { CompetitionScheduleMember } from './competition-schedule-member';
import { CompetitionTeamsMember } from './competition-teams-member';
import {
  getCompetitionStatus,
  getDivisionCount,
  type CompetitionStatus,
  type TrialWithDetails,
} from '@/features/competitions/services/competition-member-service';
import { useOrganisation } from '@/hooks/use-organisation';
import type { Activity } from '@/lib/supabase/database.types';

interface CompetitionDetailMemberProps {
  activity: Activity;
}

export function CompetitionDetailMember({ activity }: CompetitionDetailMemberProps) {
  const router = useRouter();
  const { organisation } = useOrganisation();

  const [status, setStatus] = useState<CompetitionStatus>('upcoming');
  const [hasTrials, setHasTrials] = useState(false);
  const [trialsOpen, setTrialsOpen] = useState(false);
  const [divisionCount, setDivisionCount] = useState(0);
  const [trialFeeInfo, setTrialFeeInfo] = useState<{ amount: number; type: string } | null>(null);

  useEffect(() => {
    getCompetitionStatus(activity).then(setStatus);
    getDivisionCount(activity.id).then(setDivisionCount);
  }, [activity]);

  const handleTrialsLoaded = useCallback(
    (has: boolean, anyOpen: boolean, trials?: TrialWithDetails[]) => {
      setHasTrials(has);
      setTrialsOpen(anyOpen);

      if (trials && trials.length > 0) {
        const trialWithFee = trials.find(
          (t) => (t.trial.trial_fee_amount_cents ?? 0) > 0
        );
        if (trialWithFee) {
          setTrialFeeInfo({
            amount: trialWithFee.trial.trial_fee_amount_cents ?? 0,
            type: trialWithFee.trial.trial_fee_type ?? 'one_time',
          });
        }
      }
    },
    []
  );

  const primaryColour = organisation?.primary_colour;
  const secondaryColour = organisation?.secondary_colour;

  if (!primaryColour || !secondaryColour) {
    return <div className="p-4 sm:p-6"><PageSkeleton /></div>;
  }

  return (
    <div className="space-y-0">
      {/* Back nav — overlaps the top of the hero area */}
      <div className="px-4 pt-4 pb-2 sm:px-6">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 -ml-2 text-muted-foreground hover:text-foreground"
          onClick={() => router.push('/competitions')}
        >
          <ArrowLeft className="h-4 w-4" />
          Competitions
        </Button>
      </div>

      {/* Hero — full width with details integrated */}
      <div className="px-4 sm:px-6">
        <CompetitionHeroBanner
          activity={activity}
          status={status}
          primaryColour={primaryColour}
          secondaryColour={secondaryColour}
          divisionCount={divisionCount}
          trialFeeInfo={trialFeeInfo}
        />
      </div>

      {/* Trials — the main CTA section */}
      {activity.trials_required && (
        <div className="px-4 pt-8 sm:px-6">
          <CompetitionTrialsSection
            competitionId={activity.id}
            onTrialsLoaded={handleTrialsLoaded}
          />
        </div>
      )}

      {/* Standings + Schedule */}
      <div className="px-4 pt-8 sm:px-6">
        <div className="grid gap-5 lg:grid-cols-2">
          <CompetitionStandingsMember activityId={activity.id} />
          <CompetitionScheduleMember activityId={activity.id} />
        </div>
      </div>

      {/* Teams */}
      <div className="px-4 pt-8 pb-8 sm:px-6">
        <CompetitionTeamsMember activityId={activity.id} />
      </div>
    </div>
  );
}
