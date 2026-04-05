export type {
  ActivityTeam,
  ActivityTeamWithDetails,
  ActivityTeamMember,
  ActivityTeamMemberWithDetails,
  Profile,
  MemberWithProfile,
  Activity,
} from '@/lib/supabase/database.types';

export interface ActivityTeamFilters {
  search?: string;
  isOwnTeam?: boolean;
}

export interface ActivityTeamFormData {
  name: string;
  division?: string;
  ageGroup?: string;
  coachId?: string;
  managerId?: string;
  maxPlayers: number;
  isOwnTeam: boolean;
  poolNumber?: number;
  seedNumber?: number;
}
