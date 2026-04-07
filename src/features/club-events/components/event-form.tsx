'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { clubEventSchema } from '@/features/club-events/schemas/club-event-schemas';
import type { ClubEventInput } from '@/features/club-events/schemas/club-event-schemas';
import type { ClubVenue } from '@/features/club-events/types/club-event-types';
import { CLUB_EVENT_TYPE_OPTIONS, CLUB_EVENT_STATUS_OPTIONS } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const NONE_VALUE = '__none__';

interface EventFormProps {
  defaultValues?: Partial<ClubEventInput>;
  onSubmit: (data: ClubEventInput) => Promise<void>;
  loading: boolean;
  venues: ClubVenue[];
}

export function EventForm({ defaultValues, onSubmit, loading, venues }: EventFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ClubEventInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(clubEventSchema) as any,
    defaultValues: {
      name: '',
      description: '',
      eventType: 'social',
      status: 'draft',
      startTime: '',
      endTime: '',
      venueId: undefined,
      venueName: '',
      venueAddress: '',
      maxAttendees: undefined,
      enableWaitlist: false,
      costCents: 0,
      costDescription: '',
      registrationRequired: false,
      registrationOpens: '',
      registrationCloses: '',
      registrationRequiresApproval: false,
      allowGuests: false,
      maxGuestsPerMember: undefined,
      collectDietaryRequirements: false,
      foodProvided: false,
      alcoholProvided: false,
      isAdultsOnly: false,
      contactName: '',
      contactEmail: '',
      contactPhone: '',
      isMembersOnly: false,
      notes: '',
      ...defaultValues,
    },
  });

  const venueId = watch('venueId');
  const allowGuests = watch('allowGuests');
  const eventType = watch('eventType');
  const status = watch('status');

  const isCustomVenue = venueId === NONE_VALUE || !venueId;

  return (
    <form onSubmit={handleSubmit(onSubmit as never)} className="space-y-6">
      {/* Event Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Event Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="name">
              Event Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="e.g. Annual Presentation Night"
              aria-invalid={!!errors.name}
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="eventType">Event Type</Label>
            <Select
              value={eventType}
              onValueChange={(val) =>
                setValue('eventType', val as ClubEventInput['eventType'], { shouldValidate: true })
              }
            >
              <SelectTrigger id="eventType">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {CLUB_EVENT_TYPE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Event description..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Date & Time */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Date &amp; Time</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="startTime">
              Start Time <span className="text-destructive">*</span>
            </Label>
            <Input
              id="startTime"
              type="datetime-local"
              {...register('startTime')}
              aria-invalid={!!errors.startTime}
            />
            {errors.startTime && (
              <p className="text-xs text-destructive">{errors.startTime.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="endTime">End Time</Label>
            <Input id="endTime" type="datetime-local" {...register('endTime')} />
          </div>
        </CardContent>
      </Card>

      {/* Location */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Location</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="venueId">Venue</Label>
            <Select
              value={venueId ?? NONE_VALUE}
              onValueChange={(val) => {
                setValue('venueId', val === NONE_VALUE ? undefined : val, { shouldValidate: true });
              }}
            >
              <SelectTrigger id="venueId">
                <SelectValue placeholder="Select venue" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE_VALUE}>Other / custom</SelectItem>
                {venues.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isCustomVenue && (
            <>
              <div className="space-y-2">
                <Label htmlFor="venueName">Venue Name</Label>
                <Input
                  id="venueName"
                  {...register('venueName')}
                  placeholder="e.g. Club Rooms"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="venueAddress">Venue Address</Label>
                <Input
                  id="venueAddress"
                  {...register('venueAddress')}
                  placeholder="e.g. 123 Main St"
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Capacity & Cost */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Capacity &amp; Cost</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="maxAttendees">Max Attendees</Label>
            <Input
              id="maxAttendees"
              type="number"
              min={1}
              {...register('maxAttendees')}
              placeholder="Leave blank for unlimited"
            />
          </div>

          <div className="flex items-center justify-between rounded-md border px-4 py-3">
            <div>
              <p className="text-sm font-medium">Enable Waitlist</p>
              <p className="text-xs text-muted-foreground">Allow members to join a waitlist when full</p>
            </div>
            <Switch
              checked={watch('enableWaitlist') ?? false}
              onCheckedChange={(val) => setValue('enableWaitlist', val, { shouldValidate: true })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="costCents">Cost ($)</Label>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground">
                $
              </span>
              <Input
                id="costCents"
                type="number"
                step="0.01"
                min={0}
                {...register('costCents')}
                className="pl-7"
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="costDescription">Cost Description</Label>
            <Input
              id="costDescription"
              {...register('costDescription')}
              placeholder="e.g. Includes 2-course meal"
            />
          </div>
        </CardContent>
      </Card>

      {/* Registration Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Registration Settings</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="flex items-center justify-between rounded-md border px-4 py-3 sm:col-span-2">
            <div>
              <p className="text-sm font-medium">Registration Required</p>
              <p className="text-xs text-muted-foreground">Members must register to attend</p>
            </div>
            <Switch
              checked={watch('registrationRequired') ?? false}
              onCheckedChange={(val) =>
                setValue('registrationRequired', val, { shouldValidate: true })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="registrationOpens">Registration Opens</Label>
            <Input
              id="registrationOpens"
              type="datetime-local"
              {...register('registrationOpens')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="registrationCloses">Registration Closes</Label>
            <Input
              id="registrationCloses"
              type="datetime-local"
              {...register('registrationCloses')}
            />
          </div>

          <div className="flex items-center justify-between rounded-md border px-4 py-3">
            <div>
              <p className="text-sm font-medium">Requires Approval</p>
              <p className="text-xs text-muted-foreground">Admin must approve each registration</p>
            </div>
            <Switch
              checked={watch('registrationRequiresApproval') ?? false}
              onCheckedChange={(val) =>
                setValue('registrationRequiresApproval', val, { shouldValidate: true })
              }
            />
          </div>

          <div className="flex items-center justify-between rounded-md border px-4 py-3">
            <div>
              <p className="text-sm font-medium">Allow Guests</p>
              <p className="text-xs text-muted-foreground">Members can bring guests</p>
            </div>
            <Switch
              checked={allowGuests ?? false}
              onCheckedChange={(val) => setValue('allowGuests', val, { shouldValidate: true })}
            />
          </div>

          {allowGuests && (
            <div className="space-y-2">
              <Label htmlFor="maxGuestsPerMember">Max Guests per Member</Label>
              <Input
                id="maxGuestsPerMember"
                type="number"
                min={1}
                {...register('maxGuestsPerMember')}
                placeholder="e.g. 2"
              />
            </div>
          )}

          <div className="flex items-center justify-between rounded-md border px-4 py-3">
            <div>
              <p className="text-sm font-medium">Collect Dietary Requirements</p>
              <p className="text-xs text-muted-foreground">Ask attendees about dietary needs</p>
            </div>
            <Switch
              checked={watch('collectDietaryRequirements') ?? false}
              onCheckedChange={(val) =>
                setValue('collectDietaryRequirements', val, { shouldValidate: true })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Food & Venue Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Food &amp; Venue Info</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="flex items-center justify-between rounded-md border px-4 py-3">
            <div>
              <p className="text-sm font-medium">Food Provided</p>
              <p className="text-xs text-muted-foreground">Food will be served at this event</p>
            </div>
            <Switch
              checked={watch('foodProvided') ?? false}
              onCheckedChange={(val) => setValue('foodProvided', val, { shouldValidate: true })}
            />
          </div>

          <div className="flex items-center justify-between rounded-md border px-4 py-3">
            <div>
              <p className="text-sm font-medium">Licensed Venue</p>
              <p className="text-xs text-muted-foreground">Alcohol will be available</p>
            </div>
            <Switch
              checked={watch('alcoholProvided') ?? false}
              onCheckedChange={(val) => setValue('alcoholProvided', val, { shouldValidate: true })}
            />
          </div>

          <div className="flex items-center justify-between rounded-md border px-4 py-3">
            <div>
              <p className="text-sm font-medium">18+ Only</p>
              <p className="text-xs text-muted-foreground">This event is for adults only</p>
            </div>
            <Switch
              checked={watch('isAdultsOnly') ?? false}
              onCheckedChange={(val) => setValue('isAdultsOnly', val, { shouldValidate: true })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Contact & Visibility */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Contact &amp; Visibility</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="contactName">Contact Name</Label>
            <Input id="contactName" {...register('contactName')} placeholder="e.g. Jane Smith" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactEmail">Contact Email</Label>
            <Input
              id="contactEmail"
              type="email"
              {...register('contactEmail')}
              placeholder="e.g. jane@club.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactPhone">Contact Phone</Label>
            <Input
              id="contactPhone"
              {...register('contactPhone')}
              placeholder="e.g. 0400 000 000"
            />
          </div>

          <div className="flex items-center justify-between rounded-md border px-4 py-3">
            <div>
              <p className="text-sm font-medium">Members Only</p>
              <p className="text-xs text-muted-foreground">Only visible to club members</p>
            </div>
            <Switch
              checked={watch('isMembersOnly') ?? false}
              onCheckedChange={(val) => setValue('isMembersOnly', val, { shouldValidate: true })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Admin Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Admin Notes</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="notes">Internal Notes</Label>
            <Textarea
              id="notes"
              {...register('notes')}
              placeholder="Notes visible to admins only..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={status ?? 'draft'}
              onValueChange={(val) =>
                setValue('status', val as ClubEventInput['status'], { shouldValidate: true })
              }
            >
              <SelectTrigger id="status">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {CLUB_EVENT_STATUS_OPTIONS.filter(
                  (opt) => opt.value === 'draft' || opt.value === 'published'
                ).map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {defaultValues?.name ? 'Save Changes' : 'Create Event'}
        </Button>
      </div>
    </form>
  );
}
