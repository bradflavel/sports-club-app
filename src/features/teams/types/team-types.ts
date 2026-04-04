export type {
  Team,
  TeamWithDetails,
  TeamMember,
  TeamMemberWithDetails,
  Season,
  Profile,
} from '@/lib/supabase/database.types';

export interface TeamFormData {
  name: string;
  division?: string;
  ageGroup?: string;
  seasonId?: string;
  coachId?: string;
  managerId?: string;
  maxPlayers: number;
}

export interface TeamFilters {
  search?: string;
  seasonId?: string;
  coachId?: string;
}
