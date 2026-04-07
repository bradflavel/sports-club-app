import { cn } from '@/lib/utils';

type StatusVariant = 'success' | 'warning' | 'error' | 'info' | 'default';

const statusColorMap: Record<string, StatusVariant> = {
  active: 'success',
  paid: 'success',
  completed: 'success',
  pending: 'warning',
  scheduled: 'info',
  in_progress: 'info',
  suspended: 'error',
  overdue: 'error',
  cancelled: 'error',
  inactive: 'default',
  refunded: 'default',
  postponed: 'warning',
  bye: 'default',
};

const variantStyles: Record<StatusVariant, string> = {
  success: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  warning: 'bg-amber-100 text-amber-800 border-amber-200',
  error: 'bg-red-100 text-red-800 border-red-200',
  info: 'bg-blue-100 text-blue-800 border-blue-200',
  default: 'bg-gray-100 text-gray-800 border-gray-200',
};

interface StatusBadgeProps {
  status: string;
  label?: string;
  className?: string;
}

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const safeStatus = status || '';
  const variant = statusColorMap[safeStatus] || 'default';
  const displayLabel = label || safeStatus.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()) || 'Unknown';

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold',
        variantStyles[variant],
        className
      )}
    >
      {displayLabel}
    </span>
  );
}
