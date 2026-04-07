'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { registrationSchema } from '@/features/club-events/schemas/club-event-schemas';
import type { RegistrationInput } from '@/features/club-events/schemas/club-event-schemas';
import type { ClubEventWithVenue } from '@/features/club-events/types/club-event-types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

interface RegistrationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: ClubEventWithVenue;
  onSubmit: (data: RegistrationInput) => Promise<void>;
}

export function RegistrationDialog({
  open,
  onOpenChange,
  event,
  onSubmit,
}: RegistrationDialogProps) {
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
  } = useForm<RegistrationInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(registrationSchema) as any,
    defaultValues: {
      guestCount: 0,
      guestNames: '',
      dietaryRequirements: '',
      notes: '',
    },
  });

  const guestCount = watch('guestCount') ?? 0;

  async function handleFormSubmit(data: RegistrationInput) {
    setLoading(true);
    try {
      await onSubmit(data);
      reset();
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Register for {event.name}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          {event.allow_guests && (
            <div className="space-y-2">
              <Label htmlFor="guestCount">
                Number of Guests{' '}
                {event.max_guests_per_member > 0 && (
                  <span className="text-xs text-muted-foreground">
                    (max {event.max_guests_per_member})
                  </span>
                )}
              </Label>
              <Input
                id="guestCount"
                type="number"
                min={0}
                max={event.max_guests_per_member > 0 ? event.max_guests_per_member : undefined}
                {...register('guestCount')}
                aria-invalid={!!errors.guestCount}
              />
              {errors.guestCount && (
                <p className="text-xs text-destructive">{errors.guestCount.message}</p>
              )}
            </div>
          )}

          {event.allow_guests && Number(guestCount) > 0 && (
            <div className="space-y-2">
              <Label htmlFor="guestNames">Guest Names</Label>
              <Textarea
                id="guestNames"
                {...register('guestNames')}
                placeholder="List guest names, one per line"
                rows={3}
              />
            </div>
          )}

          {event.collect_dietary_requirements && (
            <div className="space-y-2">
              <Label htmlFor="dietaryRequirements">Dietary Requirements</Label>
              <Textarea
                id="dietaryRequirements"
                {...register('dietaryRequirements')}
                placeholder="e.g. Vegetarian, Gluten free, Nut allergy..."
                rows={2}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              {...register('notes')}
              placeholder="Any additional notes..."
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Register
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
