'use client';

import { differenceInMonths } from 'date-fns';
import { Info } from 'lucide-react';
import Link from 'next/link';
import type { Organisation } from '@/lib/supabase/database.types';

interface ClubReviewReminderProps {
  organisation: Organisation;
}

export function ClubReviewReminder({ organisation }: ClubReviewReminderProps) {
  const reviewedAt = organisation.details_reviewed_at;
  const createdAt = organisation.created_at;

  // Don't nag if the org was created less than 6 months ago and never reviewed
  // (they just set it up - give them time)
  if (!reviewedAt) {
    const monthsSinceCreation = differenceInMonths(new Date(), new Date(createdAt));
    if (monthsSinceCreation < 6) return null;
  }

  const isStale =
    !reviewedAt || differenceInMonths(new Date(), new Date(reviewedAt)) >= 6;

  if (!isStale) return null;

  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950">
      <div className="flex items-start gap-3">
        <Info className="mt-0.5 h-5 w-5 text-blue-600 dark:text-blue-400" />
        <div className="flex-1">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            It&apos;s been a while since your club details were reviewed. Take a moment to
            check everything is up to date.
          </p>
          <Link
            href="/club?edit=true"
            className="mt-2 inline-block text-sm font-medium text-blue-700 hover:text-blue-900 hover:underline dark:text-blue-300 dark:hover:text-blue-100"
          >
            Review Now
          </Link>
        </div>
      </div>
    </div>
  );
}
