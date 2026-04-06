import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateSlug(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  // Append 4 random hex chars for uniqueness
  const suffix = Math.random().toString(16).slice(2, 6);
  return `${base}-${suffix}`;
}

export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$/.test(slug);
}

/**
 * Build the URL path for an activity based on its type and slug.
 * e.g. getActivityPath('competition', 'winter-comp-2026') => '/competitions/winter-comp-2026'
 */
export function getActivityPath(activityType: string, slug: string): string {
  const routeMap: Record<string, string> = {
    competition: 'competitions',
    tournament: 'tournaments',
    training_session: 'training',
    training_camp: 'camps',
    trials: 'trials',
  };
  return `/${routeMap[activityType] ?? 'activities'}/${slug}`;
}

/**
 * Build the list URL for an activity type, optionally filtered by parent.
 */
export function getActivityListPath(activityType: string, parentId?: string): string {
  const routeMap: Record<string, string> = {
    competition: 'competitions',
    tournament: 'tournaments',
    training_session: 'training',
    training_camp: 'camps',
    trials: 'trials',
  };
  const base = `/${routeMap[activityType] ?? 'activities'}`;
  return parentId ? `${base}?parent=${parentId}` : base;
}

export function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}
