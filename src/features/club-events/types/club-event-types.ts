export type {
  ClubEvent,
  ClubEventWithVenue,
  ClubEventRegistration,
  ClubEventRegistrationWithMember,
  ClubEventType,
  ClubEventStatus,
  ClubEventRegistrationStatus,
  ClubVenue,
} from '@/lib/supabase/database.types';

export interface ClubEventFilters {
  search?: string;
  eventType?: string[];
  status?: string[];
  dateFrom?: string;
  dateTo?: string;
}
