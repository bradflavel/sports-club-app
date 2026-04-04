'use client';

import * as React from 'react';
import {
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  format,
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';

export interface CalendarProps {
  selected?: Date;
  onSelect?: (date: Date | undefined) => void;
  month?: Date;
  onMonthChange?: (month: Date) => void;
  className?: string;
  disabled?: (date: Date) => boolean;
}

function Calendar({
  selected,
  onSelect,
  month: controlledMonth,
  onMonthChange,
  className,
  disabled,
}: CalendarProps) {
  const [internalMonth, setInternalMonth] = React.useState<Date>(
    controlledMonth ?? selected ?? new Date()
  );

  const currentMonth = controlledMonth ?? internalMonth;

  const handleMonthChange = (newMonth: Date) => {
    if (onMonthChange) {
      onMonthChange(newMonth);
    } else {
      setInternalMonth(newMonth);
    }
  };

  const days = React.useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [currentMonth]);

  const handleDayClick = (day: Date) => {
    if (disabled?.(day)) return;
    if (onSelect) {
      if (selected && isSameDay(day, selected)) {
        onSelect(undefined);
      } else {
        onSelect(day);
      }
    }
  };

  const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  return (
    <div className={cn('p-3', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          aria-label="Previous month"
          onClick={() => handleMonthChange(subMonths(currentMonth, 1))}
          className={cn(
            buttonVariants({ variant: 'outline' }),
            'h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100'
          )}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="text-sm font-medium">{format(currentMonth, 'MMMM yyyy')}</div>
        <button
          type="button"
          aria-label="Next month"
          onClick={() => handleMonthChange(addMonths(currentMonth, 1))}
          className={cn(
            buttonVariants({ variant: 'outline' }),
            'h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100'
          )}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Day-of-week labels */}
      <div className="grid grid-cols-7 mb-1">
        {weekDays.map((day) => (
          <div
            key={day}
            className="text-muted-foreground text-[0.8rem] font-normal text-center py-1"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-y-1">
        {days.map((day) => {
          const isSelected = selected ? isSameDay(day, selected) : false;
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isTodayDate = isToday(day);
          const isDisabled = disabled?.(day) ?? false;

          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => handleDayClick(day)}
              disabled={isDisabled}
              className={cn(
                buttonVariants({ variant: 'ghost' }),
                'h-8 w-8 p-0 font-normal text-sm mx-auto',
                !isCurrentMonth && 'text-muted-foreground opacity-50',
                isSelected &&
                  'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground',
                !isSelected && isTodayDate && 'bg-accent text-accent-foreground',
                isDisabled && 'text-muted-foreground opacity-50 cursor-not-allowed'
              )}
            >
              {format(day, 'd')}
            </button>
          );
        })}
      </div>
    </div>
  );
}
Calendar.displayName = 'Calendar';

export { Calendar };
