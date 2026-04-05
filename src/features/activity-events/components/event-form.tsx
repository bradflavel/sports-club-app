'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { eventSchema } from '@/features/activity-events/schemas/event-schemas';
import type { EventInput } from '@/features/activity-events/schemas/event-schemas';
import type { ActivityType, ParticipationMode, ActivityTeam } from '@/lib/supabase/database.types';
import { TOURNAMENT_STAGE_OPTIONS } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const NONE_VALUE = '__none__';

interface EventFormProps {
  activityType: ActivityType;
  participationMode: ParticipationMode;
  teams: ActivityTeam[];
  defaultValues?: Partial<EventInput>;
  onSubmit: (data: EventInput) => Promise<void>;
  loading?: boolean;
}

export function EventForm({
  activityType,
  participationMode,
  teams,
  defaultValues,
  onSubmit,
  loading = false,
}: EventFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<EventInput>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      dateTime: '',
      venue: '',
      notes: '',
      homeTeamId: undefined,
      awayTeamId: undefined,
      opponentName: '',
      isHome: true,
      roundNumber: undefined,
      tournamentStage: undefined,
      poolNumber: undefined,
      title: '',
      endTime: '',
      dayNumber: undefined,
      sessionNumber: undefined,
      ...defaultValues,
    },
  });

  const isHome = watch('isHome');
  const homeTeamId = watch('homeTeamId');
  const awayTeamId = watch('awayTeamId');
  const tournamentStage = watch('tournamentStage');

  const isCompetition = activityType === 'competition';
  const isTournament = activityType === 'tournament';
  const isTrainingSession = activityType === 'training_session';
  const isTrainingCamp = activityType === 'training_camp';
  const isMatchType = isCompetition || isTournament;
  const isTrainingType = isTrainingSession || isTrainingCamp;
  const isOrganiser = participationMode === 'organiser';

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Match-type fields */}
      {isMatchType && isOrganiser && (
        <>
          {/* Home Team */}
          <div className="space-y-1.5">
            <Label htmlFor="homeTeamId">Home Team</Label>
            <Select
              value={homeTeamId ?? NONE_VALUE}
              onValueChange={(val) =>
                setValue('homeTeamId', val === NONE_VALUE ? undefined : val, {
                  shouldValidate: true,
                })
              }
            >
              <SelectTrigger id="homeTeamId">
                <SelectValue placeholder="Select home team" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE_VALUE}>None</SelectItem>
                {teams.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Away Team */}
          <div className="space-y-1.5">
            <Label htmlFor="awayTeamId">Away Team</Label>
            <Select
              value={awayTeamId ?? NONE_VALUE}
              onValueChange={(val) =>
                setValue('awayTeamId', val === NONE_VALUE ? undefined : val, {
                  shouldValidate: true,
                })
              }
            >
              <SelectTrigger id="awayTeamId">
                <SelectValue placeholder="Select away team" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE_VALUE}>None</SelectItem>
                {teams.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </>
      )}

      {isMatchType && !isOrganiser && (
        <>
          {/* Opponent Name */}
          <div className="space-y-1.5">
            <Label htmlFor="opponentName">Opponent</Label>
            <Input
              id="opponentName"
              {...register('opponentName')}
              placeholder="e.g. Riverside FC"
            />
          </div>

          {/* Home/Away Toggle */}
          <div className="flex items-center justify-between rounded-md border px-4 py-3">
            <div>
              <p className="text-sm font-medium">Home Game</p>
              <p className="text-xs text-muted-foreground">
                {isHome ? 'Playing at home venue' : 'Playing away'}
              </p>
            </div>
            <Switch
              checked={isHome ?? true}
              onCheckedChange={(val) => setValue('isHome', val, { shouldValidate: true })}
            />
          </div>
        </>
      )}

      {/* Training-type: Title */}
      {isTrainingType && (
        <div className="space-y-1.5">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            {...register('title')}
            placeholder="e.g. Skills Session, Team Run"
          />
        </div>
      )}

      {/* Date & Time */}
      <div className="space-y-1.5">
        <Label htmlFor="dateTime">
          Date &amp; Time <span className="text-destructive">*</span>
        </Label>
        <Input
          id="dateTime"
          type="datetime-local"
          {...register('dateTime')}
          aria-invalid={!!errors.dateTime}
        />
        {errors.dateTime && (
          <p className="text-xs text-destructive">{errors.dateTime.message}</p>
        )}
      </div>

      {/* End Time (training types) */}
      {isTrainingType && (
        <div className="space-y-1.5">
          <Label htmlFor="endTime">End Time</Label>
          <Input
            id="endTime"
            type="datetime-local"
            {...register('endTime')}
          />
        </div>
      )}

      {/* Venue */}
      <div className="space-y-1.5">
        <Label htmlFor="venue">Venue</Label>
        <Input
          id="venue"
          {...register('venue')}
          placeholder="e.g. Home Ground, Stadium Name"
        />
      </div>

      {/* Round Number (competition) */}
      {isCompetition && (
        <div className="space-y-1.5">
          <Label htmlFor="roundNumber">Round Number</Label>
          <Input
            id="roundNumber"
            type="number"
            min={1}
            {...register('roundNumber', { valueAsNumber: true })}
            placeholder="e.g. 5"
          />
        </div>
      )}

      {/* Tournament fields */}
      {isTournament && (
        <>
          <div className="space-y-1.5">
            <Label htmlFor="tournamentStage">Stage</Label>
            <Select
              value={tournamentStage ?? NONE_VALUE}
              onValueChange={(val) =>
                setValue(
                  'tournamentStage',
                  val === NONE_VALUE ? undefined : (val as EventInput['tournamentStage']),
                  { shouldValidate: true }
                )
              }
            >
              <SelectTrigger id="tournamentStage">
                <SelectValue placeholder="Select stage" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE_VALUE}>None</SelectItem>
                {TOURNAMENT_STAGE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="poolNumber">Pool Number</Label>
            <Input
              id="poolNumber"
              type="number"
              min={1}
              {...register('poolNumber', { valueAsNumber: true })}
              placeholder="e.g. 1"
            />
          </div>
        </>
      )}

      {/* Training Camp fields */}
      {isTrainingCamp && (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="dayNumber">Day Number</Label>
            <Input
              id="dayNumber"
              type="number"
              min={1}
              {...register('dayNumber', { valueAsNumber: true })}
              placeholder="e.g. 1"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sessionNumber">Session Number</Label>
            <Input
              id="sessionNumber"
              type="number"
              min={1}
              {...register('sessionNumber', { valueAsNumber: true })}
              placeholder="e.g. 1"
            />
          </div>
        </div>
      )}

      {/* Notes */}
      <div className="space-y-1.5">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          {...register('notes')}
          placeholder="Any additional notes..."
          rows={3}
        />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {defaultValues?.dateTime ? 'Save Changes' : 'Create Event'}
        </Button>
      </div>
    </form>
  );
}
