'use client';

import { useState } from 'react';
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  format,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  isSameMonth,
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { EventCard } from './event-card';
import type { ActivityEventWithTeams } from '@/features/activity-events/types/event-types';

interface EventCalendarProps {
  events: ActivityEventWithTeams[];
  sportType?: string;
}

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function EventCalendar({ events, sportType }: EventCalendarProps) {
  const [month, setMonth] = useState(() => new Date());
  const [openDay, setOpenDay] = useState<Date | null>(null);

  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  const calStart = startOfWeek(monthStart);
  const calEnd = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  function eventsForDay(day: Date): ActivityEventWithTeams[] {
    return events.filter((e) => isSameDay(new Date(e.date_time), day));
  }

  return (
    <div className="space-y-4">
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setMonth(subMonths(month, 1))}
          className="gap-1"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="sr-only">Previous month</span>
        </Button>
        <h2 className="text-base font-semibold">{format(month, 'MMMM yyyy')}</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setMonth(addMonths(month, 1))}
          className="gap-1"
        >
          <ChevronRight className="h-4 w-4" />
          <span className="sr-only">Next month</span>
        </Button>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 text-center">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label} className="py-2 text-xs font-medium text-muted-foreground">
            {label}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-px rounded-lg border bg-border">
        {days.map((day) => {
          const dayEvents = eventsForDay(day);
          const isCurrentMonth = isSameMonth(day, month);
          const isToday = isSameDay(day, new Date());

          return (
            <div
              key={day.toISOString()}
              className={`min-h-[56px] bg-background p-1.5 first:rounded-tl-lg last:rounded-br-lg ${
                !isCurrentMonth ? 'opacity-40' : ''
              }`}
            >
              {dayEvents.length > 0 ? (
                <Popover
                  open={openDay !== null && isSameDay(openDay, day)}
                  onOpenChange={(open) => setOpenDay(open ? day : null)}
                >
                  <PopoverTrigger asChild>
                    <button className="flex w-full flex-col items-center gap-1 rounded p-0.5 hover:bg-muted">
                      <span
                        className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                          isToday
                            ? 'bg-primary text-primary-foreground'
                            : 'text-foreground'
                        }`}
                      >
                        {format(day, 'd')}
                      </span>
                      <span className="flex flex-wrap justify-center gap-0.5">
                        {dayEvents.slice(0, 3).map((e) => (
                          <span
                            key={e.id}
                            className="h-1.5 w-1.5 rounded-full bg-primary"
                          />
                        ))}
                        {dayEvents.length > 3 && (
                          <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                        )}
                      </span>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-3" align="start">
                    <p className="mb-2 text-xs font-semibold text-muted-foreground">
                      {format(day, 'EEEE, dd MMMM yyyy')}
                    </p>
                    <div className="space-y-2">
                      {dayEvents.map((e) => (
                        <EventCard key={e.id} event={e} sportType={sportType} />
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              ) : (
                <div className="flex flex-col items-center p-0.5">
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                      isToday
                        ? 'bg-primary font-medium text-primary-foreground'
                        : 'text-foreground'
                    }`}
                  >
                    {format(day, 'd')}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
