'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { teamSchema } from '@/features/teams/schemas/team-schemas';
import type { TeamInput } from '@/features/teams/schemas/team-schemas';
import type { Season, Profile } from '@/features/teams/types/team-types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface TeamFormProps {
  defaultValues?: Partial<TeamInput>;
  onSubmit: (data: TeamInput) => Promise<void>;
  loading?: boolean;
  seasons: Season[];
  profiles: Profile[];
}

const NONE_VALUE = '__none__';

export function TeamForm({
  defaultValues,
  onSubmit,
  loading = false,
  seasons,
  profiles,
}: TeamFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TeamInput>({
    resolver: zodResolver(teamSchema),
    defaultValues: {
      name: '',
      division: '',
      ageGroup: '',
      maxPlayers: 25,
      ...defaultValues,
    },
  });

  const seasonId = watch('seasonId');
  const coachId = watch('coachId');
  const managerId = watch('managerId');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Name */}
      <div className="space-y-1.5">
        <Label htmlFor="name">
          Team Name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="name"
          {...register('name')}
          placeholder="e.g. First Grade Men's"
          aria-invalid={!!errors.name}
        />
        {errors.name && (
          <p className="text-xs text-destructive">{errors.name.message}</p>
        )}
      </div>

      {/* Division */}
      <div className="space-y-1.5">
        <Label htmlFor="division">Division</Label>
        <Input
          id="division"
          {...register('division')}
          placeholder="e.g. Premier League"
        />
      </div>

      {/* Age Group */}
      <div className="space-y-1.5">
        <Label htmlFor="ageGroup">Age Group</Label>
        <Input
          id="ageGroup"
          {...register('ageGroup')}
          placeholder="e.g. Under 18, Open Age"
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

      {/* Coach */}
      <div className="space-y-1.5">
        <Label htmlFor="coachId">Coach</Label>
        <Select
          value={coachId ?? NONE_VALUE}
          onValueChange={(val) =>
            setValue('coachId', val === NONE_VALUE ? undefined : val, {
              shouldValidate: true,
            })
          }
        >
          <SelectTrigger id="coachId">
            <SelectValue placeholder="Select coach" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE_VALUE}>No coach</SelectItem>
            {profiles.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.first_name} {p.last_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Manager */}
      <div className="space-y-1.5">
        <Label htmlFor="managerId">Manager</Label>
        <Select
          value={managerId ?? NONE_VALUE}
          onValueChange={(val) =>
            setValue('managerId', val === NONE_VALUE ? undefined : val, {
              shouldValidate: true,
            })
          }
        >
          <SelectTrigger id="managerId">
            <SelectValue placeholder="Select manager" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE_VALUE}>No manager</SelectItem>
            {profiles.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.first_name} {p.last_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Max Players */}
      <div className="space-y-1.5">
        <Label htmlFor="maxPlayers">Max Players</Label>
        <Input
          id="maxPlayers"
          type="number"
          min={1}
          {...register('maxPlayers', { valueAsNumber: true })}
          aria-invalid={!!errors.maxPlayers}
        />
        {errors.maxPlayers && (
          <p className="text-xs text-destructive">{errors.maxPlayers.message}</p>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {defaultValues?.name ? 'Save Changes' : 'Create Team'}
        </Button>
      </div>
    </form>
  );
}
