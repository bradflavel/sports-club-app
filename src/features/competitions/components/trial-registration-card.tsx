'use client';

import { useState } from 'react';
import { Calendar, CheckCircle2, Clock, DollarSign, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDate, formatDateTime, formatCurrency } from '@/lib/format';
import { TrialRegistrationFlow } from './trial-registration-flow';
import type { TrialWithDetails } from '@/features/competitions/services/competition-member-service';

interface TrialRegistrationCardProps {
  trial: TrialWithDetails;
  memberId: string | null;
  onRegistered: () => void;
}

export function TrialRegistrationCard({
  trial,
  memberId,
  onRegistered,
}: TrialRegistrationCardProps) {
  const [registrationOpen, setRegistrationOpen] = useState(false);
  const { division, events, isOpen, isRegistered } = trial;

  const upcomingEvents = events.filter(
    (e) => new Date(e.date_time) > new Date() && e.status !== 'cancelled'
  );
  const feeAmount = trial.trial.trial_fee_amount_cents ?? 0;

  return (
    <>
      <Card className="relative overflow-hidden border-l-4 border-l-primary transition-shadow hover:shadow-md">
        {/* Registered overlay badge */}
        {isRegistered && (
          <div className="absolute top-3 right-3">
            <Badge className="bg-emerald-500/90 text-white border-emerald-400 gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Registered
            </Badge>
          </div>
        )}

        <CardContent className="p-5 space-y-4">
          {/* Division info */}
          <div>
            <h3 className="text-base font-bold">
              {division?.name ?? trial.trial.name}
            </h3>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {division?.age_group && (
                <Badge variant="outline" className="text-xs">
                  {division.age_group === 'open' || division.age_group === 'Open'
                    ? 'All Ages'
                    : division.age_group}
                </Badge>
              )}
              {division?.gender && division.gender !== 'open' && (
                <Badge variant="outline" className="text-xs capitalize">
                  {division.gender}
                </Badge>
              )}
              {!isOpen && (
                <Badge variant="secondary" className="text-xs">
                  Closed
                </Badge>
              )}
            </div>
          </div>

          {/* Session dates */}
          {upcomingEvents.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                <Calendar className="h-3 w-3" />
                Upcoming sessions
              </div>
              <div className="space-y-1">
                {upcomingEvents.slice(0, 3).map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center gap-2 text-sm text-muted-foreground"
                  >
                    <Clock className="h-3 w-3 shrink-0" />
                    <span>{formatDateTime(event.date_time)}</span>
                    {event.venue && (
                      <span className="text-xs">· {event.venue}</span>
                    )}
                  </div>
                ))}
                {upcomingEvents.length > 3 && (
                  <p className="text-xs text-muted-foreground pl-5">
                    +{upcomingEvents.length - 3} more session{upcomingEvents.length - 3 !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Session count + Fee info */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" />
              <span>
                {events.length} session{events.length !== 1 ? 's' : ''} total
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <DollarSign className="h-3.5 w-3.5" />
              <span>
                {feeAmount > 0
                  ? `${formatCurrency(feeAmount)}${trial.trial.trial_fee_type === 'per_trial' ? ' per session' : ''}`
                  : 'Free / TBD'}
              </span>
            </div>
          </div>

          {/* Action */}
          {isOpen && !isRegistered && memberId && (
            <Button
              className="font-semibold"
              onClick={() => setRegistrationOpen(true)}
            >
              Register for Trials
            </Button>
          )}

          {!isOpen && !isRegistered && (
            <p className="text-sm text-muted-foreground text-center py-1">
              Registration has closed
            </p>
          )}
        </CardContent>
      </Card>

      {registrationOpen && memberId && (
        <TrialRegistrationFlow
          trial={trial}
          memberId={memberId}
          open={registrationOpen}
          onOpenChange={setRegistrationOpen}
          onRegistered={onRegistered}
        />
      )}
    </>
  );
}
