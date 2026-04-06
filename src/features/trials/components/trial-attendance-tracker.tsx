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
import { createClient } from '@/lib/supabase/client';
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
    const supabase = createClient();

    // Get members from this trial's own teams
    const { data: teamData } = await supabase
      .from('activity_teams')
      .select('id')
      .eq('activity_id', activityId);

    const teamIds = (teamData ?? []).map((t: { id: string }) => t.id);

    const [membersResult, attendanceResult] = await Promise.all([
      teamIds.length > 0
        ? supabase
            .from('activity_team_members')
            .select('member_id, member:members(*, profile:profiles(*))')
            .in('activity_team_id', teamIds)
        : Promise.resolve({ data: [] }),
      supabase
        .from('activity_event_attendance')
        .select('*')
        .eq('event_id', eventId),
    ]);

    if (membersResult.data) {
      const seen = new Set<string>();
      const unique: MemberWithProfile[] = [];
      for (const tm of membersResult.data as unknown as { member_id: string; member: MemberWithProfile }[]) {
        if (!seen.has(tm.member_id)) {
          seen.add(tm.member_id);
          unique.push(tm.member);
        }
      }
      setMembers(unique);
    }

    if (attendanceResult.data) {
      const map: Record<string, { status: AttendanceStatus; id?: string }> = {};
      for (const row of attendanceResult.data as unknown as ActivityEventAttendance[]) {
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
    const supabase = createClient();
    const existing = attendanceMap[memberId];

    if (existing?.id) {
      await supabase
        .from('activity_event_attendance')
        .update({
          status,
          checked_in_at: status === 'attended' ? new Date().toISOString() : null,
        })
        .eq('id', existing.id);
    } else {
      const { data } = await supabase
        .from('activity_event_attendance')
        .insert({
          event_id: eventId,
          member_id: memberId,
          status,
          checked_in_at: status === 'attended' ? new Date().toISOString() : null,
          notes: null,
        })
        .select('id')
        .single();

      if (data) {
        setAttendanceMap((prev) => ({
          ...prev,
          [memberId]: { status, id: (data as { id: string }).id },
        }));
        setSaving(null);
        return;
      }
    }

    setAttendanceMap((prev) => ({
      ...prev,
      [memberId]: { ...prev[memberId], status },
    }));
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
