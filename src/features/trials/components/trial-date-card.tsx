'use client';

import { Calendar, MapPin, Pencil, Trash2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ActivityEvent } from '@/lib/supabase/database.types';

interface TrialDateCardProps {
  event: ActivityEvent;
  onDelete?: (eventId: string) => void;
  onEdit?: (eventId: string) => void;
  onViewAttendance?: (eventId: string) => void;
  attendanceCount?: number;
}

function formatLocalDateTime(dateStr: string): string {
  if (!dateStr) return '';
  const clean = dateStr.replace(/Z$/, '').replace(/[+-]\d{2}:\d{2}$/, '');
  const [datePart, timePart] = clean.split('T');
  if (!datePart) return dateStr;
  const [year, month, day] = datePart.split('-').map(Number);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const d = new Date(year, month - 1, day, 12);
  const dow = days[d.getDay()];
  let timeStr = '';
  if (timePart) {
    const [h, m] = timePart.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    timeStr = `, ${h12}:${String(m).padStart(2, '0')} ${ampm}`;
  }
  return `${dow} ${day} ${months[month - 1]} ${year}${timeStr}`;
}

function formatLocalTime(dateStr: string): string {
  if (!dateStr) return '';
  const clean = dateStr.replace(/Z$/, '').replace(/[+-]\d{2}:\d{2}$/, '');
  const timePart = clean.split('T')[1];
  if (!timePart) return '';
  const [h, m] = timePart.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

function calcDuration(start: string, end: string): string {
  if (!start || !end) return '';
  const cleanStart = start.replace(/Z$/, '').replace(/[+-]\d{2}:\d{2}$/, '');
  const cleanEnd = end.replace(/Z$/, '').replace(/[+-]\d{2}:\d{2}$/, '');
  const s = new Date(cleanStart);
  const e = new Date(cleanEnd);
  const diffMs = e.getTime() - s.getTime();
  if (diffMs <= 0) return '';
  const totalMins = Math.round(diffMs / 60000);
  const hrs = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  if (hrs === 0) return `${mins}min`;
  if (mins === 0) return `${hrs}hr`;
  return `${hrs}hr ${mins}min`;
}

export function TrialDateCard({ event, onDelete, onEdit, onViewAttendance, attendanceCount }: TrialDateCardProps) {
  const duration = event.end_time ? calcDuration(event.date_time, event.end_time) : '';

  return (
    <div className="flex items-center gap-3 rounded-md border px-3 py-2">
      <Calendar className="h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-1.5 text-sm">
          <span>{formatLocalDateTime(event.date_time)}</span>
          {event.end_time && (
            <span className="text-muted-foreground">— {formatLocalTime(event.end_time)}</span>
          )}
          {duration && (
            <span className="text-xs text-muted-foreground">({duration})</span>
          )}
        </div>
        {event.venue && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            {event.venue}
          </div>
        )}
      </div>
      <div className="flex items-center gap-0.5 shrink-0">
        {onViewAttendance && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => onViewAttendance(event.id)}
          >
            <Users className="h-3.5 w-3.5" />
            {attendanceCount !== undefined ? attendanceCount : 'Attendance'}
          </Button>
        )}
        {onEdit && (
          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => onEdit(event.id)}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        )}
        {onDelete && (
          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => onDelete(event.id)}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}
