'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { VenueSelect } from '@/components/shared/venue-select';
import type { ClubVenue } from '@/lib/supabase/database.types';

interface TrialDateFormProps {
  venues: ClubVenue[];
  onSubmit: (data: {
    dateTime: string;
    endTime: string;
    venue: string;
  }) => Promise<void>;
  loading?: boolean;
  defaultValues?: {
    dateTime?: string;
    endTime?: string;
    venue?: string;
  };
  submitLabel?: string;
}

export function TrialDateForm({
  venues,
  onSubmit,
  loading = false,
  defaultValues,
  submitLabel,
}: TrialDateFormProps) {
  const [dateTime, setDateTime] = useState(defaultValues?.dateTime ?? '');
  const [endTime, setEndTime] = useState(defaultValues?.endTime ?? '');
  const [venue, setVenue] = useState(defaultValues?.venue ?? '');

  const canSubmit = dateTime !== '';
  const isEdit = !!defaultValues?.dateTime;

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (!canSubmit) return;
        await onSubmit({ dateTime, endTime, venue });
      }}
      className="space-y-4"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="trialDateTime">
            Date &amp; time <span className="text-destructive">*</span>
          </Label>
          <Input
            id="trialDateTime"
            type="datetime-local"
            value={dateTime}
            onChange={(e) => setDateTime(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="trialEndTime">End time</Label>
          <Input
            id="trialEndTime"
            type="datetime-local"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Venue</Label>
        <VenueSelect venues={venues} value={venue} onChange={setVenue} />
      </div>

      <div className="flex justify-end pt-2">
        <Button type="submit" disabled={!canSubmit || loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {submitLabel ?? (isEdit ? 'Save Changes' : 'Add Trial Date')}
        </Button>
      </div>
    </form>
  );
}
