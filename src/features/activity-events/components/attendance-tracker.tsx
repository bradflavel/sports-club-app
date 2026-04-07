'use client';

import { useCallback, useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ATTENDANCE_STATUS_OPTIONS } from '@/lib/constants';
import {
  getAttendanceForEvent,
  markAttendance,
  getTeamMembersForActivityTeams,
} from '@/features/activity-events/services/attendance-service';
import type {
  AttendanceStatus,
  ActivityEventAttendanceWithMember,
  ActivityTeamMemberWithDetails,
} from '@/lib/supabase/database.types';

interface AttendanceTrackerProps {
  eventId: string;
  activityTeamIds: string[];
  orgId: string;
}

const STATUS_BADGE_VARIANTS: Record<
  AttendanceStatus,
  'default' | 'secondary' | 'destructive' | 'outline'
> = {
  attending: 'default',
  not_attending: 'destructive',
  maybe: 'secondary',
  attended: 'default',
  absent: 'destructive',
  late: 'secondary',
};

export function AttendanceTracker({
  eventId,
  activityTeamIds,
  orgId,
}: AttendanceTrackerProps) {
  const [teamMembers, setTeamMembers] = useState<ActivityTeamMemberWithDetails[]>([]);
  const [attendanceMap, setAttendanceMap] = useState<
    Map<string, ActivityEventAttendanceWithMember>
  >(new Map());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const fetchTeamMembers = useCallback(async () => {
    if (activityTeamIds.length === 0) return;
    const { data } = await getTeamMembersForActivityTeams(activityTeamIds);
    setTeamMembers(data ?? []);
  }, [activityTeamIds]);

  const fetchAttendance = useCallback(async () => {
    const { data } = await getAttendanceForEvent(eventId);
    const map = new Map<string, ActivityEventAttendanceWithMember>();
    for (const record of data ?? []) {
      map.set(record.member_id, record);
    }
    setAttendanceMap(map);
  }, [eventId]);

  useEffect(() => {
    Promise.all([fetchTeamMembers(), fetchAttendance()]).finally(() =>
      setLoading(false)
    );
  }, [fetchTeamMembers, fetchAttendance]);

  async function handleStatusChange(memberId: string, status: AttendanceStatus) {
    setSaving(memberId);
    const { data } = await markAttendance(eventId, memberId, status);
    if (data) {
      setAttendanceMap((prev) => {
        const next = new Map(prev);
        next.set(memberId, data);
        return next;
      });
    }
    setSaving(null);
  }

  // Deduplicate members (a member could be in multiple teams)
  const uniqueMembers = Array.from(
    new Map(
      teamMembers.map((tm) => [tm.member_id, tm])
    ).values()
  );

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          Loading attendance...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Attendance</CardTitle>
      </CardHeader>
      <CardContent>
        {uniqueMembers.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            No team members found. Add members to teams to track attendance.
          </p>
        ) : (
          <div className="space-y-3">
            {uniqueMembers.map((tm) => {
              const member = tm.member;
              const profile = member?.profile;
              const attendance = attendanceMap.get(tm.member_id);
              const currentStatus = attendance?.status;
              const displayName = profile
                ? `${profile.first_name} ${profile.last_name}`
                : 'Unknown Member';
              const isSaving = saving === tm.member_id;

              return (
                <div
                  key={tm.member_id}
                  className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{displayName}</p>
                    {attendance?.checked_in_at && (
                      <p className="text-xs text-muted-foreground">
                        Checked in:{' '}
                        {new Date(attendance.checked_in_at).toLocaleTimeString()}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {currentStatus && (
                      <Badge
                        variant={STATUS_BADGE_VARIANTS[currentStatus]}
                        className="hidden sm:inline-flex"
                      >
                        {ATTENDANCE_STATUS_OPTIONS.find(
                          (o) => o.value === currentStatus
                        )?.label ?? currentStatus}
                      </Badge>
                    )}
                    <Select
                      value={currentStatus ?? ''}
                      onValueChange={(value) =>
                        handleStatusChange(
                          tm.member_id,
                          value as AttendanceStatus
                        )
                      }
                      disabled={isSaving}
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Set status" />
                      </SelectTrigger>
                      <SelectContent>
                        {ATTENDANCE_STATUS_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
