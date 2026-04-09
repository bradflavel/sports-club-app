import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

export type StatCardColor = 'blue' | 'emerald' | 'violet' | 'amber' | 'rose';

const colorConfig: Record<
  StatCardColor,
  { accent: string; iconBg: string; iconColor: string }
> = {
  blue:    { accent: 'bg-blue-500',    iconBg: 'bg-blue-50',    iconColor: 'text-blue-600' },
  emerald: { accent: 'bg-emerald-500', iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600' },
  violet:  { accent: 'bg-violet-500',  iconBg: 'bg-violet-50',  iconColor: 'text-violet-600' },
  amber:   { accent: 'bg-amber-500',   iconBg: 'bg-amber-50',   iconColor: 'text-amber-600' },
  rose:    { accent: 'bg-rose-500',    iconBg: 'bg-rose-50',    iconColor: 'text-rose-600' },
};

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: string;
  color?: StatCardColor;
  className?: string;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = 'blue',
  className,
}: StatCardProps) {
  const { accent, iconBg, iconColor } = colorConfig[color];

  return (
    <div className={cn('relative overflow-hidden rounded-xl border bg-card shadow-sm', className)}>
      <div className={cn('h-1 w-full', accent)} />
      <div className="p-3 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm font-medium text-muted-foreground leading-tight">{title}</p>
          <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', iconBg)}>
            <Icon className={cn('h-5 w-5', iconColor)} />
          </div>
        </div>
        <div className="mt-3">
          <p className="text-xl font-bold tracking-tight sm:text-3xl">{value}</p>
          {(subtitle || trend) && (
            <p className="mt-1 text-xs text-muted-foreground">
              {trend && <span className="text-emerald-600">{trend}</span>}
              {trend && subtitle && ' '}
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
