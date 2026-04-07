import { createClient } from '@/lib/supabase/client';
import type {
  AttendanceStatus,
  ActivityEventAttendanceWithMember,
} from '@/lib/supabase/database.types';

const ATTENDANCE_SELECT =
  '*, member:members(*, profile:profiles(*))';

export async function getAttendanceForEvent(eventId: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('activity_event_attendance')
    .select(ATTENDANCE_SELECT)
    .eq('event_id', eventId)
    .order('created_at', { ascending: true });

  return {
    data: data as unknown as ActivityEventAttendanceWithMember[] | null,
    error,
  };
}

export async function markAttendance(
  eventId: string,
  memberId: string,
  status: AttendanceStatus
) {
  const supabase = createClient();

  const record: {
    event_id: string;
    member_id: string;
    status: AttendanceStatus;
    checked_in_at: string | null;
    notes: string | null;
  } = {
    event_id: eventId,
    member_id: memberId,
    status,
    checked_in_at: status === 'attended' ? new Date().toISOString() : null,
    notes: null,
  };

  const { data, error } = await supabase
    .from('activity_event_attendance')
    .upsert(record, { onConflict: 'event_id,member_id' })
    .select(ATTENDANCE_SELECT)
    .single();

  return {
    data: data as unknown as ActivityEventAttendanceWithMember | null,
    error,
  };
}

export async function bulkMarkAttendance(
  eventId: string,
  entries: Array<{ member_id: string; status: AttendanceStatus }>
) {
  const supabase = createClient();

  const rows = entries.map((entry) => ({
    event_id: eventId,
    member_id: entry.member_id,
    status: entry.status,
    checked_in_at:
      entry.status === 'attended' ? new Date().toISOString() : null,
    notes: null as string | null,
  }));

  const { data, error } = await supabase
    .from('activity_event_attendance')
    .upsert(rows, { onConflict: 'event_id,member_id' })
    .select(ATTENDANCE_SELECT);

  return {
    data: data as unknown as ActivityEventAttendanceWithMember[] | null,
    error,
  };
}

export async function getTeamMembersForActivityTeams(activityTeamIds: string[]) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('activity_team_members')
    .select('*, member:members(*, profile:profiles(*))')
    .in('activity_team_id', activityTeamIds)
    .order('joined_at', { ascending: true });

  return {
    data: data as unknown as import('@/lib/supabase/database.types').ActivityTeamMemberWithDetails[] | null,
    error,
  };
}

export async function getAttendanceSummaryForActivity(activityId: string) {
  const supabase = createClient();

  // Get all events for this activity
  const { data: events, error: eventsError } = await supabase
    .from('activity_events')
    .select('id')
    .eq('activity_id', activityId);

  if (eventsError || !events || events.length === 0) {
    return { data: null, error: eventsError };
  }

  const eventIds = events.map((e) => e.id);

  // Fetch all attendance records for those events
  const { data: attendance, error: attendanceError } = await supabase
    .from('activity_event_attendance')
    .select('member_id, status')
    .in('event_id', eventIds);

  if (attendanceError) return { data: null, error: attendanceError };

  // Group by member_id
  const summary = new Map<
    string,
    { attended: number; absent: number; late: number; total: number }
  >();

  for (const record of attendance ?? []) {
    const entry = summary.get(record.member_id) ?? {
      attended: 0,
      absent: 0,
      late: 0,
      total: 0,
    };
    entry.total += 1;
    if (record.status === 'attended') entry.attended += 1;
    if (record.status === 'absent') entry.absent += 1;
    if (record.status === 'late') entry.late += 1;
    summary.set(record.member_id, entry);
  }

  return {
    data: Object.fromEntries(summary) as Record<
      string,
      { attended: number; absent: number; late: number; total: number }
    >,
    error: null,
  };
}
