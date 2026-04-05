export type {
  ActivityEvent,
  ActivityEventWithTeams,
  ActivityTeam,
  Activity,
  ActivityType,
  ParticipationMode,
  EventStatus,
  TournamentStage,
} from '@/lib/supabase/database.types';

export interface EventFilters {
  search?: string;
  status?: string[];
  teamId?: string;
  roundNumber?: number;
}

export interface EventFormData {
  homeTeamId?: string;
  awayTeamId?: string;
  opponentName?: string;
  isHome?: boolean;
  title?: string;
  venue?: string;
  dateTime: string;
  endTime?: string;
  roundNumber?: number;
  tournamentStage?: string;
  poolNumber?: number;
  notes?: string;
  dayNumber?: number;
  sessionNumber?: number;
}
