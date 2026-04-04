export type {
  Fixture,
  FixtureWithTeam,
  FixtureStatus,
} from '@/lib/supabase/database.types';

export interface FixtureFormData {
  teamId: string;
  opponentName: string;
  venue?: string;
  dateTime: string;
  isHome: boolean;
  roundNumber?: number;
  notes?: string;
  seasonId?: string;
}

export interface FixtureFilters {
  search?: string;
  teamId?: string;
  status?: string[];
  seasonId?: string;
  isHome?: boolean;
}

export interface ScoreEntryData {
  homeScore: number;
  awayScore: number;
}
