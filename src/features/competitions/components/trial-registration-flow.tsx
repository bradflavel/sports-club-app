'use client';

import { useState } from 'react';
import { Calendar, CheckCircle2, Clock, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import { useUser } from '@/hooks/use-user';
import { useOrganisation } from '@/hooks/use-organisation';
import { formatCurrency, formatDateTime } from '@/lib/format';
import { registerForTrial, type TrialWithDetails } from '@/features/competitions/services/competition-member-service';

interface TrialRegistrationFlowProps {
  trial: TrialWithDetails;
  memberId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRegistered: () => void;
}

type Step = 'select_sessions' | 'confirm' | 'success';

export function TrialRegistrationFlow({
  trial,
  memberId,
  open,
  onOpenChange,
  onRegistered,
}: TrialRegistrationFlowProps) {
  const { user } = useUser();
  const { organisation } = useOrganisation();
  const { toast } = useToast();

  const [step, setStep] = useState<Step>('select_sessions');
  const [selectedEventIds, setSelectedEventIds] = useState<Set<string>>(
    new Set(
      trial.events
        .filter((e) => new Date(e.date_time) > new Date() && e.status !== 'cancelled')
        .map((e) => e.id)
    )
  );
  const [submitting, setSubmitting] = useState(false);

  const availableEvents = trial.events.filter(
    (e) => new Date(e.date_time) > new Date() && e.status !== 'cancelled'
  );

  const feeAmount = trial.trial.trial_fee_amount_cents ?? 0;
  const feeType = trial.trial.trial_fee_type ?? 'one_time';
  const totalFee =
    feeType === 'per_trial'
      ? feeAmount * selectedEventIds.size
      : feeAmount;

  function toggleEvent(eventId: string) {
    setSelectedEventIds((prev) => {
      const next = new Set(prev);
      if (next.has(eventId)) next.delete(eventId);
      else next.add(eventId);
      return next;
    });
  }

  function toggleAll() {
    if (selectedEventIds.size === availableEvents.length) {
      setSelectedEventIds(new Set());
    } else {
      setSelectedEventIds(new Set(availableEvents.map((e) => e.id)));
    }
  }

  async function handleConfirm() {
    if (!user?.id || !organisation?.id) return;

    setSubmitting(true);

    const result = await registerForTrial({
      trialActivityId: trial.trial.id,
      orgId: organisation.id,
      memberId,
      profileId: user.id,
      divisionName: trial.division?.name ?? null,
      ageGroup: trial.division?.age_group ?? null,
      selectedEventIds: [...selectedEventIds],
      feeType,
      feeAmountCents: feeAmount,
      trialEventCount: selectedEventIds.size,
    });

    setSubmitting(false);

    if (result.error) {
      toast({
        title: 'Registration failed',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
      return;
    }

    if (result.alreadyRegistered) {
      toast({
        title: 'Already registered',
        description: "You're already registered for this trial.",
      });
      onOpenChange(false);
      return;
    }

    setStep('success');
    onRegistered();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        {step === 'select_sessions' && (
          <>
            <DialogHeader>
              <DialogTitle>Select Trial Sessions</DialogTitle>
              <p className="text-sm text-muted-foreground">
                Choose which sessions you&apos;d like to attend for{' '}
                <span className="font-medium text-foreground">
                  {trial.division?.name ?? trial.trial.name}
                </span>
              </p>
            </DialogHeader>

            <div className="space-y-3">
              {availableEvents.length > 1 && (
                <div className="flex items-center justify-between">
                  <button
                    className="text-xs font-medium text-primary hover:underline"
                    onClick={toggleAll}
                  >
                    {selectedEventIds.size === availableEvents.length
                      ? 'Deselect all'
                      : 'Select all'}
                  </button>
                  <span className="text-xs text-muted-foreground">
                    {selectedEventIds.size} of {availableEvents.length} selected
                  </span>
                </div>
              )}

              <div className="space-y-2 max-h-64 overflow-y-auto">
                {availableEvents.map((event) => (
                  <label
                    key={event.id}
                    className="flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors hover:bg-accent/50 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5"
                  >
                    <Checkbox
                      checked={selectedEventIds.has(event.id)}
                      onCheckedChange={() => toggleEvent(event.id)}
                      className="mt-0.5"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                        {formatDateTime(event.date_time)}
                      </div>
                      {event.venue && (
                        <p className="text-xs text-muted-foreground mt-0.5 pl-5">
                          {event.venue}
                        </p>
                      )}
                    </div>
                  </label>
                ))}
              </div>

              {availableEvents.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No upcoming sessions scheduled yet.
                </p>
              )}
            </div>

            <div className="flex items-center justify-between pt-2 border-t">
              {totalFee > 0 && (
                <p className="text-sm text-muted-foreground">
                  Fee: <span className="font-semibold text-foreground">{formatCurrency(totalFee)}</span>
                  {feeType === 'per_trial' && (
                    <span className="text-xs"> ({formatCurrency(feeAmount)} x {selectedEventIds.size})</span>
                  )}
                </p>
              )}
              <div className="ml-auto flex gap-2">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => setStep('confirm')}
                  disabled={selectedEventIds.size === 0}
                >
                  Continue
                </Button>
              </div>
            </div>
          </>
        )}

        {step === 'confirm' && (
          <>
            <DialogHeader>
              <DialogTitle>Confirm Registration</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="rounded-lg bg-muted/50 p-4 space-y-3">
                <div>
                  <p className="text-sm font-medium">
                    {trial.division?.name ?? trial.trial.name}
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {trial.division?.age_group && (
                      <Badge variant="outline" className="text-xs">
                        {trial.division.age_group}
                      </Badge>
                    )}
                    {trial.division?.gender && trial.division.gender !== 'open' && (
                      <Badge variant="outline" className="text-xs capitalize">
                        {trial.division.gender}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {selectedEventIds.size} session{selectedEventIds.size !== 1 ? 's' : ''} selected
                  </span>
                </div>

                {totalFee > 0 && (
                  <div className="pt-2 border-t">
                    <p className="text-sm">
                      Total fee:{' '}
                      <span className="font-bold">{formatCurrency(totalFee)}</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Payment can be made later through your payments page.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setStep('select_sessions')}
                  disabled={submitting}
                >
                  Back
                </Button>
                <Button onClick={handleConfirm} disabled={submitting}>
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Confirm Registration
                </Button>
              </div>
            </div>
          </>
        )}

        {step === 'success' && (
          <div className="flex flex-col items-center py-6 space-y-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
              <CheckCircle2 className="h-8 w-8 text-emerald-500" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold">You&apos;re Registered!</h3>
              <p className="text-sm text-muted-foreground max-w-xs">
                You&apos;ve been registered for{' '}
                <span className="font-medium text-foreground">
                  {trial.division?.name ?? trial.trial.name}
                </span>{' '}
                trials.
              </p>
            </div>

            {totalFee > 0 && (
              <div className="rounded-lg border bg-muted/30 p-3 text-center">
                <p className="text-sm text-muted-foreground">
                  Outstanding payment: <span className="font-semibold text-foreground">{formatCurrency(totalFee)}</span>
                </p>
                <a
                  href="/payments"
                  className="text-sm font-medium text-primary hover:underline mt-1 inline-block"
                >
                  Go to Payments
                </a>
              </div>
            )}

            <Button onClick={() => onOpenChange(false)} className="mt-2">
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
