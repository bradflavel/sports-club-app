'use client';

import { Shield } from 'lucide-react';
import type { TeamMemberWithDetails } from '@/features/teams/types/team-types';

interface TeamLineupViewProps {
  members: TeamMemberWithDetails[];
}

export function TeamLineupView({ members }: TeamLineupViewProps) {
  // Group by position
  const grouped: Record<string, TeamMemberWithDetails[]> = {};
  const unpositioned: TeamMemberWithDetails[] = [];

  for (const member of members) {
    if (member.position) {
      if (!grouped[member.position]) {
        grouped[member.position] = [];
      }
      grouped[member.position].push(member);
    } else {
      unpositioned.push(member);
    }
  }

  const positionGroups = Object.entries(grouped);
  if (unpositioned.length > 0) {
    positionGroups.push(['Unassigned', unpositioned]);
  }

  if (members.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No players in this team yet.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {positionGroups.map(([position, positionMembers]) => (
        <div key={position}>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {position}
          </h3>
          <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
            {positionMembers.map((tm) => {
              const profile = tm.member.profile;
              const name = `${profile.first_name} ${profile.last_name}`;
              return (
                <div
                  key={tm.id}
                  className="flex items-center gap-3 rounded-md border bg-card px-4 py-3 text-sm"
                >
                  {tm.jersey_number !== null && (
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {tm.jersey_number}
                    </span>
                  )}
                  <span className="flex-1 font-medium">{name}</span>
                  {tm.is_captain && (
                    <Shield className="h-4 w-4 shrink-0 fill-amber-500 text-amber-500" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
