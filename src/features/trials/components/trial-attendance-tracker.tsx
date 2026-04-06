'use client';

import { useCallback, useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ATTENDANCE_STATUS_OPTIONS } from '@/lib/constants';
import {
  getTrialTeamIds,
  getTrialRosterMembersForTeams,
  getAttendanceForEventClient,
  upsertTrialAttendance,
} from '@/features/trials/services/trial-service';
import type {
  AttendanceStatus,
  MemberWithProfile,
  ActivityEventAttendance,
} from '@/lib/supabase/database.types';
interface TrialAttendanceTrackerProps {
  eventId: string;
  activityId: string;
}

const STATUS_BADGE_VARIANTS: Record<
  AttendanceStatus,
  'default' | 'destructive' | 'secondary' | 'outline'
> = {
  attending: 'default',
  not_attending: 'destructive',
  maybe: 'secondary',
  attended: 'default',
  absent: 'destructive',
  late: 'secondary',
};

export function TrialAttendanceTracker({
  eventId,
  activityId,
}: TrialAttendanceTrackerProps) {
  const [members, setMembers] = useState<MemberWithProfile[]>([]);
  const [attendanceMap, setAttendanceMap] = useState<
    Record<string, { status: AttendanceStatus; id?: string }>
  >({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);

    const { data: teamIds } = await getTrialTeamIds(activityId);
    const [{ data: uniqueMembers }, { data: attendanceRows }] = await Promise.all([
      getTrialRosterMembersForTeams(teamIds ?? []),
      getAttendanceForEventClient(eventId),
    ]);

    if (uniqueMembers) setMembers(uniqueMembers);

    if (attendanceRows) {
      const map: Record<string, { status: AttendanceStatus; id?: string }> = {};
      for (const row of attendanceRows as ActivityEventAttendance[]) {
        map[row.member_id] = { status: row.status, id: row.id };
      }
      setAttendanceMap(map);
    }

    setLoading(false);
  }, [eventId, activityId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleStatusChange(memberId: string, status: AttendanceStatus) {
    setSaving(memberId);
    const existing = attendanceMap[memberId];
    const { id: newId } = await upsertTrialAttendance(eventId, memberId, status, existing?.id);

    if (!existing?.id && newId) {
      setAttendanceMap((prev) => ({
        ...prev,
        [memberId]: { status, id: newId },
      }));
    } else {
      setAttendanceMap((prev) => ({
        ...prev,
        [memberId]: { ...prev[memberId], status },
      }));
    }
    setSaving(null);
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground py-4">Loading members...</p>;
  }

  if (members.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4">
        No members found. Add teams and members to the parent competition first.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {members.map((member) => {
        const attendance = attendanceMap[member.profile_id ?? member.id];
        const currentStatus = attendance?.status;

        return (
          <div
            key={member.id}
            className="flex items-center justify-between gap-3 rounded-md border px-3 py-2"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-sm font-medium truncate">
                {member.profile.first_name} {member.profile.last_name}
              </span>
              {currentStatus && (
                <Badge
                  variant={STATUS_BADGE_VARIANTS[currentStatus]}
                  className="text-xs shrink-0"
                >
                  {ATTENDANCE_STATUS_OPTIONS.find((o) => o.value === currentStatus)?.label ??
                    currentStatus}
                </Badge>
              )}
            </div>

            <Select
              value={currentStatus ?? ''}
              onValueChange={(val) =>
                handleStatusChange(
                  member.profile_id ?? member.id,
                  val as AttendanceStatus
                )
              }
              disabled={saving === (member.profile_id ?? member.id)}
            >
              <SelectTrigger className="w-[140px] h-8 text-xs">
                <SelectValue placeholder="Set status" />
              </SelectTrigger>
              <SelectContent>
                {ATTENDANCE_STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );
      })}
    </div>
  );
}
