'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { scoreEntrySchema } from '@/features/activity-events/schemas/event-schemas';
import type { ScoreEntryInput } from '@/features/activity-events/schemas/event-schemas';
import type { ActivityEventWithTeams } from '@/features/activity-events/types/event-types';
import { SPORT_CONFIGS, type SportType } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ScoreEntryFormProps {
  event: ActivityEventWithTeams;
  onSubmit: (homeScore: number, awayScore: number) => Promise<void>;
  loading?: boolean;
  sportType?: string;
}

export function ScoreEntryForm({
  event,
  onSubmit,
  loading = false,
  sportType,
}: ScoreEntryFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ScoreEntryInput>({
    resolver: zodResolver(scoreEntrySchema),
    defaultValues: {
      homeScore: event.home_score ?? 0,
      awayScore: event.away_score ?? 0,
    },
  });

  const scoreLabel = sportType
    ? (SPORT_CONFIGS[sportType as SportType]?.scoreLabel ?? 'Score')
    : 'Score';

  const homeLabel = event.home_team?.name ?? 'Home';
  const awayLabel = event.away_team?.name ?? event.opponent_name ?? 'Away';

  async function handleFormSubmit(data: ScoreEntryInput) {
    await onSubmit(data.homeScore, data.awayScore);
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
      {/* Context */}
      <div className="rounded-md bg-muted px-4 py-3 text-center text-sm font-medium">
        {homeLabel} vs {awayLabel}
      </div>

      <p className="text-center text-xs text-muted-foreground">{scoreLabel}</p>

      <div className="grid grid-cols-2 gap-4">
        {/* Home Score */}
        <div className="space-y-1.5">
          <Label htmlFor="homeScore">{homeLabel} (Home)</Label>
          <Input
            id="homeScore"
            type="number"
            min={0}
            {...register('homeScore', { valueAsNumber: true })}
            aria-invalid={!!errors.homeScore}
            className="text-center text-lg font-bold"
          />
          {errors.homeScore && (
            <p className="text-xs text-destructive">{errors.homeScore.message}</p>
          )}
        </div>

        {/* Away Score */}
        <div className="space-y-1.5">
          <Label htmlFor="awayScore">{awayLabel} (Away)</Label>
          <Input
            id="awayScore"
            type="number"
            min={0}
            {...register('awayScore', { valueAsNumber: true })}
            aria-invalid={!!errors.awayScore}
            className="text-center text-lg font-bold"
          />
          {errors.awayScore && (
            <p className="text-xs text-destructive">{errors.awayScore.message}</p>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Result
        </Button>
      </div>
    </form>
  );
}
