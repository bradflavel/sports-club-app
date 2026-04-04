import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface AvatarWithNameProps {
  firstName: string;
  lastName: string;
  avatarUrl?: string | null;
  subtitle?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-12 w-12',
};

export function AvatarWithName({
  firstName,
  lastName,
  avatarUrl,
  subtitle,
  className,
  size = 'md',
}: AvatarWithNameProps) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <Avatar className={sizeClasses[size]}>
        <AvatarImage src={avatarUrl || undefined} alt={`${firstName} ${lastName}`} />
        <AvatarFallback className="text-xs">{getInitials(firstName, lastName)}</AvatarFallback>
      </Avatar>
      <div>
        <p className="text-sm font-medium leading-none">
          {firstName} {lastName}
        </p>
        {subtitle && <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>}
      </div>
    </div>
  );
}
