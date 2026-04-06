'use client';

import { useEffect, useState } from 'react';
import { ClipboardCheck, Loader2, Lock } from 'lucide-react';
import { TrialRegistrationCard } from './trial-registration-card';
import {
  getEligibleTrials,
  getMemberRecord,
  type TrialWithDetails,
} from '@/features/competitions/services/competition-member-service';
import { useUser } from '@/hooks/use-user';
import { useOrganisation } from '@/hooks/use-organisation';

interface CompetitionTrialsSectionProps {
  competitionId: string;
  onTrialsLoaded?: (hasTrials: boolean, anyOpen: boolean, trials?: TrialWithDetails[]) => void;
}

export function CompetitionTrialsSection({
  competitionId,
  onTrialsLoaded,
}: CompetitionTrialsSectionProps) {
  const { user, profile } = useUser();
  const { organisation } = useOrganisation();
  const [trials, setTrials] = useState<TrialWithDetails[]>([]);
  const [memberId, setMemberId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id || !organisation?.id || !profile) return;

    async function load() {
      const { data: member } = await getMemberRecord(user!.id, organisation!.id);
      const mid = member?.id ?? null;
      setMemberId(mid);

      const eligible = await getEligibleTrials(competitionId, mid, profile);
      setTrials(eligible);
      setLoading(false);

      const hasTrials = eligible.length > 0;
      const anyOpen = eligible.some((t) => t.isOpen);
      onTrialsLoaded?.(hasTrials, anyOpen, eligible);
    }

    load();
  }, [user?.id, organisation?.id, profile, competitionId, onTrialsLoaded]);

  if (loading) {
    return (
      <div id="trials-section" className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (trials.length === 0) return null;

  const anyOpen = trials.some((t) => t.isOpen);
  const allClosed = !anyOpen;

  return (
    <div id="trials-section" className="rounded-2xl bg-muted/40 border border-border/50 p-6 sm:p-8">
      <div className="flex items-center gap-3 mb-1">
        {allClosed ? (
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
            <Lock className="h-5 w-5 text-muted-foreground" />
          </div>
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
            <ClipboardCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
        )}
        <div>
          <h2 className="text-xl font-bold">
            {allClosed ? 'Registration Closed' : 'Register for Trials'}
          </h2>
          <p className="text-sm text-muted-foreground">
            {allClosed
              ? 'Trial registrations have closed. Check back for team selections.'
              : 'Select a division below to register for trial sessions.'}
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mt-5">
        {trials.map((trial) => (
          <TrialRegistrationCard
            key={trial.trial.id}
            trial={trial}
            memberId={memberId}
            onRegistered={() => {
              setTrials((prev) =>
                prev.map((t) =>
                  t.trial.id === trial.trial.id
                    ? { ...t, isRegistered: true }
                    : t
                )
              );
            }}
          />
        ))}
      </div>
    </div>
  );
}
