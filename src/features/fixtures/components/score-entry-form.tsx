'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { scoreEntrySchema } from '@/features/fixtures/schemas/fixture-schemas';
import type { ScoreEntryInput } from '@/features/fixtures/schemas/fixture-schemas';
import type { FixtureWithTeam } from '@/features/fixtures/types/fixture-types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ScoreEntryFormProps {
  fixture: FixtureWithTeam;
  onSubmit: (data: ScoreEntryInput) => Promise<void>;
  loading?: boolean;
}

export function ScoreEntryForm({ fixture, onSubmit, loading = false }: ScoreEntryFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ScoreEntryInput>({
    resolver: zodResolver(scoreEntrySchema),
    defaultValues: {
      homeScore: fixture.home_score ?? 0,
      awayScore: fixture.away_score ?? 0,
    },
  });

  const homeLabel = fixture.is_home ? fixture.team.name : fixture.opponent_name;
  const awayLabel = fixture.is_home ? fixture.opponent_name : fixture.team.name;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Context */}
      <div className="rounded-md bg-muted px-4 py-3 text-sm text-center font-medium">
        {fixture.team.name} vs {fixture.opponent_name}
      </div>

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
