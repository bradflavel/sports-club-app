import { format, formatDistanceToNow, isBefore, differenceInDays, differenceInYears } from 'date-fns';

export function formatCurrency(amountCents: number): string {
  const dollars = amountCents / 100;
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
  }).format(dollars);
}

export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}

export function centsToDollars(cents: number): number {
  return cents / 100;
}

export function formatDate(date: string | Date): string {
  return format(new Date(date), 'dd MMM yyyy');
}

export function formatDateTime(date: string | Date): string {
  return format(new Date(date), 'dd MMM yyyy, h:mm a');
}

export function formatRelativeDate(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function isOverdue(dueDate: string | Date): boolean {
  return isBefore(new Date(dueDate), new Date());
}

export function daysUntil(date: string | Date): number {
  return differenceInDays(new Date(date), new Date());
}

export function daysOverdue(dueDate: string | Date): number {
  if (!isOverdue(dueDate)) return 0;
  return differenceInDays(new Date(), new Date(dueDate));
}

export function calculateAge(dateOfBirth: string | Date): number {
  return differenceInYears(new Date(), new Date(dateOfBirth));
}

export function isMinor(dateOfBirth: string | Date): boolean {
  return calculateAge(dateOfBirth) < 18;
}

export function formatAge(dateOfBirth: string | Date): string {
  const age = calculateAge(dateOfBirth);
  return `${age} yr${age !== 1 ? 's' : ''}`;
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
