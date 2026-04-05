'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { activitySchema, type ActivityInput } from '@/features/activities/schemas/activity-schemas';
import { ACTIVITY_TYPE_OPTIONS, PARTICIPATION_MODE_OPTIONS } from '@/lib/constants';
import type { Activity } from '@/lib/supabase/database.types';

interface ActivityFormProps {
  defaultValues?: Partial<ActivityInput>;
  onSubmit: (data: ActivityInput) => Promise<void>;
  loading?: boolean;
  activities?: Activity[];
}

export function ActivityForm({
  defaultValues,
  onSubmit,
  loading = false,
  activities = [],
}: ActivityFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ActivityInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(activitySchema) as any,
    defaultValues: {
      name: '',
      activityType: 'competition',
      participationMode: 'participant',
      startDate: '',
      endDate: '',
      description: '',
      totalRounds: undefined,
      hasFinals: false,
      poolCount: undefined,
      recurrenceRule: '',
      defaultVenue: '',
      defaultStartTime: '',
      defaultDurationMinutes: undefined,
      parentActivityId: '',
      ...defaultValues,
    },
  });

  const activityType = watch('activityType');
  const hasFinals = watch('hasFinals');

  const isCompetition = activityType === 'competition';
  const isTournament = activityType === 'tournament';
  const isTrainingSession = activityType === 'training_session';
  const isTrainingCamp = activityType === 'training_camp';
  const isTrainingType = isTrainingSession || isTrainingCamp;

  // Filter activities for parent linking (competitions and tournaments only)
  const linkableActivities = activities.filter(
    (a) => a.activity_type === 'competition' || a.activity_type === 'tournament'
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Basic Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Basic Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" {...register('name')} placeholder="e.g. 2026 Winter Competition" />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Activity Type</Label>
              <Select
                value={activityType}
                onValueChange={(value) =>
                  setValue('activityType', value as ActivityInput['activityType'], {
                    shouldValidate: true,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {ACTIVITY_TYPE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.activityType && (
                <p className="text-sm text-destructive">{errors.activityType.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Participation Mode</Label>
              <Select
                value={watch('participationMode')}
                onValueChange={(value) =>
                  setValue('participationMode', value as ActivityInput['participationMode'], {
                    shouldValidate: true,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select mode" />
                </SelectTrigger>
                <SelectContent>
                  {PARTICIPATION_MODE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.participationMode && (
                <p className="text-sm text-destructive">{errors.participationMode.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Optional description..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Dates */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input id="startDate" type="date" {...register('startDate')} />
              {errors.startDate && (
                <p className="text-sm text-destructive">{errors.startDate.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input id="endDate" type="date" {...register('endDate')} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Type-specific settings */}
      {isCompetition && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Competition Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="totalRounds">Total Rounds</Label>
              <Input
                id="totalRounds"
                type="number"
                min={1}
                {...register('totalRounds')}
                placeholder="e.g. 18"
              />
            </div>
            <div className="flex items-center gap-3">
              <Switch
                id="hasFinals"
                checked={hasFinals ?? false}
                onCheckedChange={(checked) => setValue('hasFinals', checked)}
              />
              <Label htmlFor="hasFinals">Has Finals Series</Label>
            </div>
          </CardContent>
        </Card>
      )}

      {isTournament && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tournament Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="poolCount">Number of Pools</Label>
              <Input
                id="poolCount"
                type="number"
                min={1}
                {...register('poolCount')}
                placeholder="e.g. 4"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {isTrainingSession && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Training Session Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="defaultVenue">Default Venue</Label>
              <Input
                id="defaultVenue"
                {...register('defaultVenue')}
                placeholder="e.g. Main Oval"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="defaultStartTime">Default Start Time</Label>
                <Input
                  id="defaultStartTime"
                  type="time"
                  {...register('defaultStartTime')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="defaultDurationMinutes">Duration (minutes)</Label>
                <Input
                  id="defaultDurationMinutes"
                  type="number"
                  min={1}
                  {...register('defaultDurationMinutes')}
                  placeholder="e.g. 90"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="recurrenceRule">Recurrence</Label>
              <Input
                id="recurrenceRule"
                {...register('recurrenceRule')}
                placeholder="e.g. Every Tuesday and Thursday"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {isTrainingCamp && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Training Camp Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="defaultVenue">Venue</Label>
              <Input
                id="defaultVenue"
                {...register('defaultVenue')}
                placeholder="e.g. Sports Academy Campus"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Link to Activity */}
      {isTrainingType && linkableActivities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Link to Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label>Parent Activity</Label>
              <Select
                value={watch('parentActivityId') ?? ''}
                onValueChange={(value) =>
                  setValue('parentActivityId', value === '__none__' ? '' : value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a competition or tournament..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {linkableActivities.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Link this training to a competition or tournament.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end">
        <Button type="submit" disabled={loading} className="gap-2">
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {defaultValues ? 'Update Activity' : 'Create Activity'}
        </Button>
      </div>
    </form>
  );
}
