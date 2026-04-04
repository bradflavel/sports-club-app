'use client';

import Link from 'next/link';
import { Mail, Phone, Calendar, Pencil } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/shared/status-badge';
import { Card, CardContent } from '@/components/ui/card';
import { formatDate } from '@/lib/format';
import { getInitials } from '@/lib/utils';
import type { MemberWithProfile } from '@/features/members/types/member-types';

interface MemberProfileCardProps {
  member: MemberWithProfile;
  showEdit?: boolean;
}

const membershipTypeLabel: Record<string, string> = {
  senior: 'Senior',
  junior: 'Junior',
  social: 'Social',
  life: 'Life',
  volunteer: 'Volunteer',
};

export function MemberProfileCard({ member, showEdit = false }: MemberProfileCardProps) {
  const { profile } = member;
  const fullName = `${profile.first_name} ${profile.last_name}`;

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
                <h2 className="text-xl font-semibold">{fullName}</h2>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">
                    {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
                  </Badge>
                  <Badge variant="outline">
                    {membershipTypeLabel[member.membership_type] ?? member.membership_type}
                  </Badge>
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
