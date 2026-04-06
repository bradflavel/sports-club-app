'use client';

import type { ClubVenue } from '@/lib/supabase/database.types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface VenueSelectProps {
  venues: ClubVenue[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const NONE_VALUE = '__none__';

export function VenueSelect({
  venues,
  value,
  onChange,
  placeholder = 'Select venue',
}: VenueSelectProps) {
  return (
    <Select
      value={value || NONE_VALUE}
      onValueChange={(val) => onChange(val === NONE_VALUE ? '' : val)}
    >
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={NONE_VALUE}>No venue</SelectItem>
        {venues.map((v) => (
          <SelectItem key={v.id} value={v.name}>
            {v.name}
            {v.address && (
              <span className="text-muted-foreground"> — {v.address}</span>
            )}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
