'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { fixtureSchema } from '@/features/fixtures/schemas/fixture-schemas';
import type { FixtureInput } from '@/features/fixtures/schemas/fixture-schemas';
import type { Season } from '@/features/teams/types/team-types';
import type { Team } from '@/lib/supabase/database.types';
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

interface FixtureFormProps {
  defaultValues?: Partial<FixtureInput>;
  onSubmit: (data: FixtureInput) => Promise<void>;
  loading?: boolean;
  teams: Team[];
  seasons: Season[];
}

export function FixtureForm({
  defaultValues,
  onSubmit,
  loading = false,
  teams,
  seasons,
}: FixtureFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FixtureInput>({
    resolver: zodResolver(fixtureSchema),
    defaultValues: {
      teamId: '',
      opponentName: '',
      venue: '',
      dateTime: '',
      isHome: true,
      roundNumber: undefined,
      notes: '',
      seasonId: undefined,
      ...defaultValues,
    },
  });

  const teamId = watch('teamId');
  const seasonId = watch('seasonId');
  const isHome = watch('isHome');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Team */}
      <div className="space-y-1.5">
        <Label htmlFor="teamId">
          Team <span className="text-destructive">*</span>
        </Label>
        <Select
          value={teamId}
          onValueChange={(val) => setValue('teamId', val, { shouldValidate: true })}
        >
          <SelectTrigger id="teamId" aria-invalid={!!errors.teamId}>
            <SelectValue placeholder="Select team" />
          </SelectTrigger>
          <SelectContent>
            {teams.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.teamId && (
          <p className="text-xs text-destructive">{errors.teamId.message}</p>
        )}
      </div>

      {/* Opponent */}
      <div className="space-y-1.5">
        <Label htmlFor="opponentName">
          Opponent <span className="text-destructive">*</span>
        </Label>
        <Input
          id="opponentName"
          {...register('opponentName')}
          placeholder="e.g. Riverside FC"
          aria-invalid={!!errors.opponentName}
        />
        {errors.opponentName && (
          <p className="text-xs text-destructive">{errors.opponentName.message}</p>
        )}
      </div>

      {/* Date/Time */}
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

      {/* Venue */}
      <div className="space-y-1.5">
        <Label htmlFor="venue">Venue</Label>
        <Input
          id="venue"
          {...register('venue')}
          placeholder="e.g. Home Ground, Stadium Name"
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
          checked={isHome}
          onCheckedChange={(val) => setValue('isHome', val, { shouldValidate: true })}
        />
      </div>

      {/* Season */}
      <div className="space-y-1.5">
        <Label htmlFor="seasonId">Season</Label>
        <Select
          value={seasonId ?? NONE_VALUE}
          onValueChange={(val) =>
            setValue('seasonId', val === NONE_VALUE ? undefined : val, {
              shouldValidate: true,
            })
          }
        >
          <SelectTrigger id="seasonId">
            <SelectValue placeholder="Select season" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE_VALUE}>No season</SelectItem>
            {seasons.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
                {s.is_current ? ' (Current)' : ''}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Round Number */}
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
          {defaultValues?.opponentName ? 'Save Changes' : 'Create Fixture'}
        </Button>
      </div>
    </form>
  );
}
