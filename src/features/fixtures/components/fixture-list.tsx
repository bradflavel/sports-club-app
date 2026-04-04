'use client';

import { FixtureCard } from './fixture-card';
import type { FixtureWithTeam } from '@/features/fixtures/types/fixture-types';

interface FixtureListProps {
  fixtures: FixtureWithTeam[];
}

export function FixtureList({ fixtures }: FixtureListProps) {
  const sorted = [...fixtures].sort(
    (a, b) => new Date(a.date_time).getTime() - new Date(b.date_time).getTime()
  );

  if (sorted.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No fixtures found.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {sorted.map((fixture) => (
        <FixtureCard key={fixture.id} fixture={fixture} />
      ))}
    </div>
  );
}
