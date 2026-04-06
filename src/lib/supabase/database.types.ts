export type SportType =
  | 'rugby_league'
  | 'rugby_union'
  | 'cricket'
  | 'soccer'
  | 'netball'
  | 'basketball'
  | 'hockey'
  | 'afl'
  | 'touch_football'
  | 'volleyball'
  | 'other';

export type UserRole = 'admin' | 'manager' | 'coach' | 'player' | 'member' | 'guardian';
export type MembershipType = 'senior' | 'junior' | 'social' | 'life' | 'volunteer';
export type MembershipStatus = 'active' | 'inactive' | 'suspended' | 'pending';
export type FixtureStatus =
  | 'scheduled'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'postponed'
  | 'bye';
export type PaymentType =
  | 'membership_fee'
  | 'match_fee'
  | 'fine'
  | 'merchandise'
  | 'event'
  | 'trial_fee'
  | 'other';
export type PaymentStatus = 'pending' | 'paid' | 'overdue' | 'cancelled' | 'refunded';
export type DocumentCategory = 'policy' | 'minutes' | 'report' | 'form' | 'constitution' | 'other';
export type GuardianRelationship = 'parent' | 'grandparent' | 'legal_guardian' | 'other';

// Activity system types
export type ActivityType = 'competition' | 'tournament' | 'training_session' | 'training_camp' | 'trials';
export type ParticipationMode = 'participant' | 'organiser';
export type EventStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'postponed' | 'bye';
export type AttendanceStatus = 'attending' | 'not_attending' | 'maybe' | 'attended' | 'absent' | 'late';
export type TournamentStage = 'pool' | 'quarterfinal' | 'semifinal' | 'final' | 'third_place' | 'round_robin';

export interface Organisation {
  id: string;
  name: string;
  slug: string;
  sport_type: SportType;
  logo_url: string | null;
  primary_colour: string;
  secondary_colour: string;
  contact_email: string | null;
  contact_phone: string | null;
  address: string | null;
  website: string | null;
  // Business (added in migration 00014 - all have DB defaults so optional on insert)
  abn?: string | null;
  abn_entity_name?: string | null;
  timezone?: string;
  // Affiliations
  affiliated_body?: string | null;
  affiliation_number?: string | null;
  insurance_provider?: string | null;
  insurance_policy_number?: string | null;
  // Financials
  default_payment_terms_days?: number;
  late_fee_cents?: number | null;
  bank_name?: string | null;
  bank_bsb?: string | null;
  bank_account_number?: string | null;
  bank_account_name?: string | null;
  is_gst_registered?: boolean;
  // Membership
  minimum_age?: number | null;
  registration_open?: boolean;
  // Legal
  privacy_policy_url?: string | null;
  terms_conditions_url?: string | null;
  code_of_conduct_url?: string | null;
  child_safety_policy_url?: string | null;
  registration_consent_text?: string | null;
  // Social
  facebook_url?: string | null;
  instagram_url?: string | null;
  youtube_url?: string | null;
  tiktok_url?: string | null;
  // State/Jurisdiction
  state?: string | null;
  // Review
  details_reviewed_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClubVenue {
  id: string;
  organisation_id: string;
  name: string;
  address: string | null;
  is_primary: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface MembershipFeeSchedule {
  id: string;
  organisation_id: string;
  membership_type: MembershipType;
  amount_cents: number;
  label: string | null;
  created_at: string;
  updated_at: string;
}

export interface MembershipTypeRecord {
  id: string;
  organisation_id: string;
  name: string;
  description: string | null;
  fee_cents: number | null;
  has_expiry: boolean;
  default_duration_months: number | null;
  auto_renewal: boolean;
  grace_period_days: number;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  date_of_birth: string | null;
  avatar_url: string | null;
  organisation_id: string | null;
  role: UserRole;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  created_at: string;
  updated_at: string;
}

export interface Member {
  id: string;
  profile_id: string;
  organisation_id: string;
  membership_type: MembershipType;
  membership_status: MembershipStatus;
  registration_date: string;
  expiry_date: string | null;
  medical_conditions: string | null;
  dietary_requirements: string | null;
  membership_type_id?: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface MemberWithProfile extends Member {
  profile: Profile;
}

export interface MemberWithProfileAndType extends MemberWithProfile {
  membership_type_record: MembershipTypeRecord | null;
}

export interface Team {
  id: string;
  organisation_id: string;
  name: string;
  division: string | null;
  age_group: string | null;
  season_id: string | null;
  coach_id: string | null;
  manager_id: string | null;
  max_players: number;
  created_at: string;
  updated_at: string;
}

export interface TeamWithDetails extends Team {
  coach: Profile | null;
  manager: Profile | null;
  season: Season | null;
  member_count?: number;
}

export interface TeamMember {
  id: string;
  team_id: string;
  member_id: string;
  jersey_number: number | null;
  position: string | null;
  is_captain: boolean;
  joined_at: string;
}

export interface TeamMemberWithDetails extends TeamMember {
  member: MemberWithProfile;
}

export interface Season {
  id: string;
  organisation_id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  created_at: string;
}

export interface Fixture {
  id: string;
  organisation_id: string;
  season_id: string | null;
  team_id: string;
  opponent_name: string;
  venue: string | null;
  date_time: string;
  is_home: boolean;
  status: FixtureStatus;
  home_score: number | null;
  away_score: number | null;
  round_number: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface FixtureWithTeam extends Fixture {
  team: Team;
}

export interface Payment {
  id: string;
  organisation_id: string;
  member_id: string;
  amount_cents: number;
  description: string;
  payment_type: PaymentType;
  status: PaymentStatus;
  due_date: string;
  paid_date: string | null;
  stripe_payment_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentWithMember extends Payment {
  member: MemberWithProfile;
}

export interface Document {
  id: string;
  organisation_id: string;
  title: string;
  description: string | null;
  file_url: string;
  file_name: string;
  file_size_bytes: number | null;
  file_type: string | null;
  uploaded_by: string;
  category: DocumentCategory;
  is_public: boolean;
  created_at: string;
}

export interface PhotoAlbum {
  id: string;
  organisation_id: string;
  name: string;
  description: string | null;
  cover_photo_url: string | null;
  created_by: string;
  photo_count: number;
  created_at: string;
  updated_at: string;
}

export interface PhotoItem {
  id: string;
  album_id: string;
  file_url: string;
  thumbnail_url: string | null;
  caption: string | null;
  uploaded_by: string;
  width: number | null;
  height: number | null;
  created_at: string;
}

export interface Announcement {
  id: string;
  organisation_id: string;
  title: string;
  content: string;
  author_id: string;
  is_pinned: boolean;
  published_at: string;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AnnouncementWithAuthor extends Announcement {
  author: Profile;
}

export interface MemberGuardian {
  id: string;
  guardian_member_id: string;
  minor_member_id: string;
  relationship: GuardianRelationship;
  is_primary: boolean;
  parental_consent_given: boolean;
  consent_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface MemberGuardianWithDetails extends MemberGuardian {
  guardian: MemberWithProfile;
  minor: MemberWithProfile;
}

export interface CompetitionDivision {
  id: string;
  activity_id: string;
  name: string;
  max_teams: number | null;
  age_group: string | null;
  gender: string | null;
  display_order: number;
  created_at: string;
}

export interface TrialEventDivision {
  id: string;
  event_id: string;
  division_id: string;
  created_at: string;
}

// Activity system interfaces
export interface OrganisationModule {
  id: string;
  organisation_id: string;
  activity_type: ActivityType;
  is_enabled: boolean;
  display_order: number;
  created_at: string;
}

export interface Activity {
  id: string;
  organisation_id: string;
  activity_type: ActivityType;
  participation_mode: ParticipationMode;
  name: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  is_current: boolean;
  total_rounds: number | null;
  has_finals: boolean | null;
  pool_count: number | null;
  recurrence_rule: string | null;
  default_venue: string | null;
  default_start_time: string | null;
  default_duration_minutes: number | null;
  parent_activity_id: string | null;
  // Competition-specific (migration 00016)
  host_name?: string | null;
  host_type?: string | null;
  registration_opens?: string | null;
  registration_closes?: string | null;
  first_round_date?: string | null;
  finals_start_date?: string | null;
  schedule_frequency?: string | null;
  has_byes?: boolean | null;
  finals_description?: string | null;
  finals_weeks?: number | null;
  trials_required?: boolean | null;
  trial_date?: string | null;
  training_required?: boolean | null;
  training_details?: string | null;
  round_dates?: string[] | null;
  // Trials fee config (migration 00017)
  trial_fee_type?: string | null;
  trial_fee_amount_cents?: number | null;
  // Per-division trials link (migration 00018)
  competition_division_id?: string | null;
  // URL slug (migration 00019)
  slug: string;
  created_at: string;
  updated_at: string;
}

export interface ActivityWithDetails extends Activity {
  teams?: ActivityTeam[];
  event_count?: number;
  parent_activity?: Activity | null;
}

export interface ActivityTeam {
  id: string;
  activity_id: string;
  organisation_id: string;
  name: string;
  division: string | null;
  age_group: string | null;
  coach_id: string | null;
  manager_id: string | null;
  max_players: number;
  is_own_team: boolean;
  source_team_id: string | null;
  pool_number: number | null;
  seed_number: number | null;
  created_at: string;
  updated_at: string;
}

export interface ActivityTeamWithDetails extends ActivityTeam {
  coach: Profile | null;
  manager: Profile | null;
  activity: Activity | null;
  member_count?: number;
}

export interface ActivityTeamMember {
  id: string;
  activity_team_id: string;
  member_id: string;
  jersey_number: number | null;
  position: string | null;
  is_captain: boolean;
  joined_at: string;
}

export interface ActivityTeamMemberWithDetails extends ActivityTeamMember {
  member: MemberWithProfile;
}

export interface ActivityEvent {
  id: string;
  activity_id: string;
  organisation_id: string;
  home_team_id: string | null;
  away_team_id: string | null;
  opponent_name: string | null;
  is_home: boolean | null;
  home_score: number | null;
  away_score: number | null;
  round_number: number | null;
  tournament_stage: TournamentStage | null;
  pool_number: number | null;
  bracket_position: number | null;
  title: string | null;
  venue: string | null;
  date_time: string;
  end_time: string | null;
  status: EventStatus;
  notes: string | null;
  day_number: number | null;
  session_number: number | null;
  created_at: string;
  updated_at: string;
}

export interface ActivityEventWithTeams extends ActivityEvent {
  home_team: ActivityTeam | null;
  away_team: ActivityTeam | null;
  activity: Activity | null;
}

export interface ActivityEventAttendance {
  id: string;
  event_id: string;
  member_id: string;
  status: AttendanceStatus;
  checked_in_at: string | null;
  notes: string | null;
  created_at: string;
}

export interface ActivityEventAttendanceWithMember extends ActivityEventAttendance {
  member: MemberWithProfile;
}

export interface ActivityStanding {
  id: string;
  activity_id: string;
  team_id: string;
  played: number;
  wins: number;
  losses: number;
  draws: number;
  points_for: number;
  points_against: number;
  bonus_points: number;
  ladder_points: number;
  updated_at: string;
}

export interface ActivityStandingWithTeam extends ActivityStanding {
  team: ActivityTeam;
}

export interface Database {
  public: {
    Tables: {
      organisations: {
        Row: Organisation & Record<string, unknown>;
        Insert: Omit<Organisation, 'id' | 'created_at' | 'updated_at'> & Record<string, unknown>;
        Update: Partial<Omit<Organisation, 'id' | 'created_at'>> & Record<string, unknown>;
        Relationships: [];
      };
      profiles: {
        Row: Profile & Record<string, unknown>;
        Insert: Omit<Profile, 'created_at' | 'updated_at'> & Record<string, unknown>;
        Update: Partial<Omit<Profile, 'id' | 'created_at'>> & Record<string, unknown>;
        Relationships: [];
      };
      members: {
        Row: Member & Record<string, unknown>;
        Insert: Omit<Member, 'id' | 'created_at' | 'updated_at'> & Record<string, unknown>;
        Update: Partial<Omit<Member, 'id' | 'created_at'>> & Record<string, unknown>;
        Relationships: [];
      };
      teams: {
        Row: Team & Record<string, unknown>;
        Insert: Omit<Team, 'id' | 'created_at' | 'updated_at'> & Record<string, unknown>;
        Update: Partial<Omit<Team, 'id' | 'created_at'>> & Record<string, unknown>;
        Relationships: [];
      };
      team_members: {
        Row: TeamMember & Record<string, unknown>;
        Insert: Omit<TeamMember, 'id' | 'joined_at'> & Record<string, unknown>;
        Update: Partial<Omit<TeamMember, 'id'>> & Record<string, unknown>;
        Relationships: [];
      };
      seasons: {
        Row: Season & Record<string, unknown>;
        Insert: Omit<Season, 'id' | 'created_at'> & Record<string, unknown>;
        Update: Partial<Omit<Season, 'id' | 'created_at'>> & Record<string, unknown>;
        Relationships: [];
      };
      fixtures: {
        Row: Fixture & Record<string, unknown>;
        Insert: Omit<Fixture, 'id' | 'created_at' | 'updated_at'> & Record<string, unknown>;
        Update: Partial<Omit<Fixture, 'id' | 'created_at'>> & Record<string, unknown>;
        Relationships: [];
      };
      payments: {
        Row: Payment & Record<string, unknown>;
        Insert: Omit<Payment, 'id' | 'created_at' | 'updated_at'> & Record<string, unknown>;
        Update: Partial<Omit<Payment, 'id' | 'created_at'>> & Record<string, unknown>;
        Relationships: [];
      };
      documents: {
        Row: Document & Record<string, unknown>;
        Insert: Omit<Document, 'id' | 'created_at'> & Record<string, unknown>;
        Update: Partial<Omit<Document, 'id' | 'created_at'>> & Record<string, unknown>;
        Relationships: [];
      };
      photo_albums: {
        Row: PhotoAlbum & Record<string, unknown>;
        Insert: Omit<PhotoAlbum, 'id' | 'created_at' | 'updated_at' | 'photo_count'> & Record<string, unknown>;
        Update: Partial<Omit<PhotoAlbum, 'id' | 'created_at'>> & Record<string, unknown>;
        Relationships: [];
      };
      photo_items: {
        Row: PhotoItem & Record<string, unknown>;
        Insert: Omit<PhotoItem, 'id' | 'created_at'> & Record<string, unknown>;
        Update: Partial<Omit<PhotoItem, 'id' | 'created_at'>> & Record<string, unknown>;
        Relationships: [];
      };
      announcements: {
        Row: Announcement & Record<string, unknown>;
        Insert: Omit<Announcement, 'id' | 'created_at' | 'updated_at'> & Record<string, unknown>;
        Update: Partial<Omit<Announcement, 'id' | 'created_at'>> & Record<string, unknown>;
        Relationships: [];
      };
      member_guardians: {
        Row: MemberGuardian & Record<string, unknown>;
        Insert: Omit<MemberGuardian, 'id' | 'created_at' | 'updated_at'> & Record<string, unknown>;
        Update: Partial<Omit<MemberGuardian, 'id' | 'created_at'>> & Record<string, unknown>;
        Relationships: [];
      };
      organisation_modules: {
        Row: OrganisationModule & Record<string, unknown>;
        Insert: Omit<OrganisationModule, 'id' | 'created_at'> & Record<string, unknown>;
        Update: Partial<Omit<OrganisationModule, 'id' | 'created_at'>> & Record<string, unknown>;
        Relationships: [];
      };
      activities: {
        Row: Activity & Record<string, unknown>;
        Insert: Omit<Activity, 'id' | 'created_at' | 'updated_at'> & Record<string, unknown>;
        Update: Partial<Omit<Activity, 'id' | 'created_at'>> & Record<string, unknown>;
        Relationships: [];
      };
      activity_teams: {
        Row: ActivityTeam & Record<string, unknown>;
        Insert: Omit<ActivityTeam, 'id' | 'created_at' | 'updated_at'> & Record<string, unknown>;
        Update: Partial<Omit<ActivityTeam, 'id' | 'created_at'>> & Record<string, unknown>;
        Relationships: [];
      };
      activity_team_members: {
        Row: ActivityTeamMember & Record<string, unknown>;
        Insert: Omit<ActivityTeamMember, 'id' | 'joined_at'> & Record<string, unknown>;
        Update: Partial<Omit<ActivityTeamMember, 'id'>> & Record<string, unknown>;
        Relationships: [];
      };
      activity_events: {
        Row: ActivityEvent & Record<string, unknown>;
        Insert: Omit<ActivityEvent, 'id' | 'created_at' | 'updated_at'> & Record<string, unknown>;
        Update: Partial<Omit<ActivityEvent, 'id' | 'created_at'>> & Record<string, unknown>;
        Relationships: [];
      };
      activity_event_attendance: {
        Row: ActivityEventAttendance & Record<string, unknown>;
        Insert: Omit<ActivityEventAttendance, 'id' | 'created_at'> & Record<string, unknown>;
        Update: Partial<Omit<ActivityEventAttendance, 'id' | 'created_at'>> & Record<string, unknown>;
        Relationships: [];
      };
      activity_standings: {
        Row: ActivityStanding & Record<string, unknown>;
        Insert: Omit<ActivityStanding, 'id'> & Record<string, unknown>;
        Update: Partial<Omit<ActivityStanding, 'id'>> & Record<string, unknown>;
        Relationships: [];
      };
      competition_divisions: {
        Row: CompetitionDivision & Record<string, unknown>;
        Insert: Omit<CompetitionDivision, 'id' | 'created_at'> & Record<string, unknown>;
        Update: Partial<Omit<CompetitionDivision, 'id' | 'created_at'>> & Record<string, unknown>;
        Relationships: [];
      };
      trial_event_divisions: {
        Row: TrialEventDivision & Record<string, unknown>;
        Insert: Omit<TrialEventDivision, 'id' | 'created_at'> & Record<string, unknown>;
        Update: Partial<Omit<TrialEventDivision, 'id' | 'created_at'>> & Record<string, unknown>;
        Relationships: [];
      };
      membership_types: {
        Row: MembershipTypeRecord & Record<string, unknown>;
        Insert: Omit<MembershipTypeRecord, 'id' | 'created_at' | 'updated_at'> & Record<string, unknown>;
        Update: Partial<Omit<MembershipTypeRecord, 'id' | 'created_at'>> & Record<string, unknown>;
        Relationships: [];
      };
      club_venues: {
        Row: ClubVenue & Record<string, unknown>;
        Insert: Omit<ClubVenue, 'id' | 'created_at' | 'updated_at'> & Record<string, unknown>;
        Update: Partial<Omit<ClubVenue, 'id' | 'created_at'>> & Record<string, unknown>;
        Relationships: [];
      };
      membership_fee_schedule: {
        Row: MembershipFeeSchedule & Record<string, unknown>;
        Insert: Omit<MembershipFeeSchedule, 'id' | 'created_at' | 'updated_at'> & Record<string, unknown>;
        Update: Partial<Omit<MembershipFeeSchedule, 'id' | 'created_at'>> & Record<string, unknown>;
        Relationships: [];
      };
    };
    Views: Record<string, { Row: Record<string, unknown>; Relationships: [] }>;
    Functions: Record<string, { Args: Record<string, unknown>; Returns: unknown }>;
    Enums: {
      sport_type: SportType;
      user_role: UserRole;
      membership_type: MembershipType;
      membership_status: MembershipStatus;
      fixture_status: FixtureStatus;
      payment_type: PaymentType;
      payment_status: PaymentStatus;
      document_category: DocumentCategory;
      guardian_relationship: GuardianRelationship;
      activity_type: ActivityType;
      participation_mode: ParticipationMode;
      event_status: EventStatus;
      attendance_status: AttendanceStatus;
      tournament_stage: TournamentStage;
    };
  };
}
