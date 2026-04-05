'use client';

import Link from 'next/link';
import { Mail, Phone, Calendar, Pencil, Users } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/shared/status-badge';
import { Card, CardContent } from '@/components/ui/card';
import { formatDate, calculateAge, isMinor } from '@/lib/format';
import { getInitials } from '@/lib/utils';
import type { MemberWithProfile, MemberGuardian } from '@/features/members/types/member-types';

interface GuardianInfo {
  name: string;
  relationship: string;
}

interface MemberProfileCardProps {
  member: MemberWithProfile;
  showEdit?: boolean;
  guardians?: GuardianInfo[];
}

const relationshipLabel: Record<string, string> = {
  parent: 'Parent',
  grandparent: 'Grandparent',
  legal_guardian: 'Legal Guardian',
  other: 'Guardian',
};

export function MemberProfileCard({ member, showEdit = false, guardians }: MemberProfileCardProps) {
  const { profile } = member;
  const fullName = `${profile.first_name} ${profile.last_name}`;
  const age = profile.date_of_birth ? calculateAge(profile.date_of_birth) : null;
  const isMemberMinor = profile.date_of_birth ? isMinor(profile.date_of_birth) : false;

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <Avatar className="h-20 w-20 shrink-0">
              <AvatarImage src={profile.avatar_url ?? undefined} alt={fullName} />
              <AvatarFallback className="text-lg">
                {getInitials(profile.first_name, profile.last_name)}
              </AvatarFallback>
            </Avatar>

            <div className="space-y-2">
              <div>
                <h2 className="text-xl font-semibold">
                  {fullName}
                  {age !== null && (
                    <span className="ml-2 text-sm font-normal text-muted-foreground">
                      ({age} yr{age !== 1 ? 's' : ''})
                    </span>
                  )}
                </h2>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">
                    {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
                  </Badge>
                  <Badge variant="outline">
                    {member.membership_type.charAt(0).toUpperCase() + member.membership_type.slice(1)}
                  </Badge>
                  {isMemberMinor && (
                    <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-700">
                      Minor
                    </Badge>
                  )}
                  <StatusBadge status={member.membership_status} />
                </div>
              </div>

              <div className="flex flex-col gap-1.5 text-sm text-muted-foreground sm:flex-row sm:flex-wrap sm:gap-4">
                <span className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 shrink-0" />
                  {profile.email}
                </span>
                {profile.phone && (
                  <span className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 shrink-0" />
                    {profile.phone}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 shrink-0" />
                  Member since {formatDate(member.registration_date)}
                </span>
              </div>

              {/* Guardian info for minors */}
              {guardians && guardians.length > 0 && (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Users className="h-3.5 w-3.5 shrink-0" />
                  <span>
                    Guardian{guardians.length > 1 ? 's' : ''}:{' '}
                    {guardians
                      .map(
                        (g) =>
                          `${g.name} (${relationshipLabel[g.relationship] ?? g.relationship})`
                      )
                      .join(', ')}
                  </span>
                </div>
              )}
            </div>
          </div>

          {showEdit && (
            <div className="shrink-0">
              <Button variant="outline" size="sm" asChild>
                <Link href={`/members/${member.id}/edit`}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </Link>
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
