'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { activityTeamSchema } from '@/features/activity-teams/schemas/activity-team-schemas';
import type { ActivityTeamInput } from '@/features/activity-teams/schemas/activity-team-schemas';
import type { Profile } from '@/features/activity-teams/types/activity-team-types';
import type { CompetitionDivision } from '@/lib/supabase/database.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ActivityTeamFormProps {
  defaultValues?: Partial<ActivityTeamInput>;
  onSubmit: (data: ActivityTeamInput) => Promise<void>;
  loading?: boolean;
  profiles?: Profile[];
  showOwnTeamToggle?: boolean;
  divisions?: CompetitionDivision[];
}

const NONE_VALUE = '__none__';

export function ActivityTeamForm({
  defaultValues,
  onSubmit,
  loading = false,
  profiles = [],
  showOwnTeamToggle = false,
  divisions = [],
}: ActivityTeamFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ActivityTeamInput>({
    resolver: zodResolver(activityTeamSchema),
    defaultValues: {
      name: '',
      division: '',
      ageGroup: '',
      maxPlayers: 30,
      isOwnTeam: true,
      ...defaultValues,
    },
  });

  const coachId = watch('coachId');
  const managerId = watch('managerId');
  const isOwnTeam = watch('isOwnTeam');
  const currentDivision = watch('division');

  const hasDivisions = divisions.length > 0;
  const selectedDiv = hasDivisions
    ? divisions.find((d) => d.name === currentDivision)
    : null;

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
          placeholder="e.g. First Grade"
          aria-invalid={!!errors.name}
        />
        {errors.name && (
          <p className="text-xs text-destructive">{errors.name.message}</p>
        )}
      </div>

      {/* Division */}
      <div className="space-y-1.5">
        <Label htmlFor="division">Division</Label>
        {hasDivisions ? (
          <Select
            value={currentDivision ?? ''}
            onValueChange={(val) => {
              const divName = val === NONE_VALUE ? '' : val;
              setValue('division', divName, { shouldValidate: true });
              // Auto-populate age group from division
              const div = divisions.find((d) => d.name === divName);
              if (div?.age_group) {
                setValue('ageGroup', div.age_group, { shouldValidate: true });
              } else {
                setValue('ageGroup', '', { shouldValidate: true });
              }
            }}
          >
            <SelectTrigger id="division">
              <SelectValue placeholder="Select division" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE_VALUE}>No division</SelectItem>
              {divisions.map((d) => (
                <SelectItem key={d.id} value={d.name}>
                  {d.name}
                  {d.age_group ? ` (${d.age_group})` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Input
            id="division"
            {...register('division')}
            placeholder="e.g. Premier League"
          />
        )}
      </div>

      {/* Age Group */}
      <div className="space-y-1.5">
        <Label htmlFor="ageGroup">Age Group</Label>
        <Input
          id="ageGroup"
          {...register('ageGroup')}
          placeholder="e.g. Under 18, Open Age"
          readOnly={!!(hasDivisions && currentDivision)}
          className={hasDivisions && currentDivision ? 'bg-muted' : ''}
        />
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

      {/* Own Team Toggle */}
      {showOwnTeamToggle && (
        <div className="flex items-center justify-between rounded-md border px-4 py-3">
          <div>
            <p className="text-sm font-medium">Own Team</p>
            <p className="text-xs text-muted-foreground">
              Is this your club&apos;s team? Uncheck for external/opponent teams.
            </p>
          </div>
          <Switch
            checked={isOwnTeam}
            onCheckedChange={(checked) => setValue('isOwnTeam', checked)}
          />
        </div>
      )}

      <div className="flex justify-end gap-3 pt-2">
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {defaultValues?.name ? 'Save Changes' : 'Create Team'}
        </Button>
      </div>
    </form>
  );
}
