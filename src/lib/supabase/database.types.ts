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

// Shop types
export type ShopOrderStatus = 'pending' | 'paid' | 'ready_for_pickup' | 'collected' | 'cancelled' | 'refunded';
export type ProductType = 'physical' | 'digital';
export type DiscountType = 'percentage' | 'fixed_amount';

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
  categories: string[];
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
  preferred_name: string | null;
  gender?: string | null;
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

// Club Events
export type ClubEventType = 'social' | 'fundraiser' | 'agm' | 'presentation' | 'meeting' | 'other';
export type ClubEventStatus = 'draft' | 'published' | 'cancelled' | 'completed';
export type ClubEventRegistrationStatus = 'registered' | 'waitlisted' | 'cancelled' | 'approved' | 'attended';

export interface ClubEvent {
  id: string;
  organisation_id: string;
  name: string;
  description: string | null;
  event_type: ClubEventType;
  status: ClubEventStatus;
  start_time: string;
  end_time: string | null;
  venue_id: string | null;
  venue_name: string | null;
  venue_address: string | null;
  max_attendees: number | null;
  enable_waitlist: boolean;
  cost_cents: number;
  cost_description: string | null;
  registration_required: boolean;
  registration_opens: string | null;
  registration_closes: string | null;
  registration_requires_approval: boolean;
  allow_guests: boolean;
  max_guests_per_member: number;
  collect_dietary_requirements: boolean;
  food_provided: boolean;
  alcohol_provided: boolean;
  is_adults_only: boolean;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  is_members_only: boolean;
  cover_image_url: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClubEventWithVenue extends ClubEvent {
  venue: ClubVenue | null;
  registration_count?: number;
}

export interface ClubEventRegistration {
  id: string;
  event_id: string;
  member_id: string;
  status: ClubEventRegistrationStatus;
  guest_count: number;
  guest_names: string | null;
  dietary_requirements: string | null;
  notes: string | null;
  registered_at: string;
  approved_at: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClubEventRegistrationWithMember extends ClubEventRegistration {
  member: MemberWithProfile;
}

export const VENUE_CATEGORY_OPTIONS = [
  { value: 'game', label: 'Game Venue' },
  { value: 'training', label: 'Training Venue' },
  { value: 'meeting', label: 'Meeting Space' },
  { value: 'event', label: 'Event Space' },
  { value: 'function', label: 'Function Centre' },
  { value: 'other', label: 'Other' },
] as const;

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
  // Season cost (migration 00021)
  season_fee_type?: 'free' | 'fixed' | 'range' | 'tbd';
  season_fee_amount_cents?: number;
  season_fee_min_cents?: number;
  season_fee_max_cents?: number;
  // Draft, skill, commitment (migration 00022)
  is_draft?: boolean;
  skill_level?: 'beginner' | 'intermediate' | 'advanced' | 'elite' | 'all_levels' | null;
  commitment_level?: 'casual' | 'regular' | 'committed' | 'competitive' | null;
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

// Shop interfaces
export interface ProductCategory {
  id: string;
  organisation_id: string;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  organisation_id: string;
  category_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  product_type: ProductType;
  price_cents: number;
  compare_at_price_cents: number | null;
  image_urls: string[];
  digital_file_urls: string[] | null;
  is_active: boolean;
  is_restricted: boolean;
  is_preorder: boolean;
  preorder_available_date: string | null;
  low_stock_threshold: number;
  sort_order: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProductWithCategory extends Product {
  category: ProductCategory | null;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  size: string | null;
  colour: string | null;
  sku: string | null;
  stock_quantity: number;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ProductWithVariants extends ProductWithCategory {
  variants: ProductVariant[];
}

export interface ProductAccessRule {
  id: string;
  product_id: string;
  allowed_role: UserRole | null;
  allowed_team_id: string | null;
  created_at: string;
}

export interface CartItem {
  id: string;
  profile_id: string;
  organisation_id: string;
  product_id: string;
  variant_id: string;
  quantity: number;
  created_at: string;
  updated_at: string;
}

export interface CartItemWithDetails extends CartItem {
  product: Product;
  variant: ProductVariant;
}

export interface DiscountCode {
  id: string;
  organisation_id: string;
  code: string;
  description: string | null;
  discount_type: DiscountType;
  discount_value: number;
  min_order_cents: number | null;
  max_discount_cents: number | null;
  applies_to_product_id: string | null;
  applies_to_category_id: string | null;
  max_uses: number | null;
  max_uses_per_user: number | null;
  times_used: number;
  starts_at: string | null;
  expires_at: string | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ShopOrder {
  id: string;
  organisation_id: string;
  profile_id: string;
  order_number: string;
  status: ShopOrderStatus;
  subtotal_cents: number;
  discount_cents: number;
  total_cents: number;
  discount_code_id: string | null;
  stripe_checkout_session_id: string | null;
  stripe_payment_intent_id: string | null;
  collection_qr_token: string;
  notes: string | null;
  collected_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  variant_id: string | null;
  product_name: string;
  variant_label: string | null;
  product_type: ProductType;
  quantity: number;
  unit_price_cents: number;
  created_at: string;
}

export interface ShopOrderWithItems extends ShopOrder {
  items: OrderItem[];
  discount_code: DiscountCode | null;
}

export interface DigitalDownload {
  id: string;
  order_item_id: string;
  profile_id: string;
  product_id: string;
  download_count: number;
  max_downloads: number;
  expires_at: string | null;
  created_at: string;
}

export interface DigitalDownloadWithProduct extends DigitalDownload {
  product: Product;
  order_item: OrderItem;
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
      club_events: {
        Row: ClubEvent & Record<string, unknown>;
        Insert: Omit<ClubEvent, 'id' | 'created_at' | 'updated_at'> & Record<string, unknown>;
        Update: Partial<Omit<ClubEvent, 'id' | 'created_at'>> & Record<string, unknown>;
        Relationships: [];
      };
      club_event_registrations: {
        Row: ClubEventRegistration & Record<string, unknown>;
        Insert: Omit<ClubEventRegistration, 'id' | 'registered_at' | 'approved_at' | 'cancelled_at' | 'created_at' | 'updated_at'> & { registered_at?: string; approved_at?: string | null; cancelled_at?: string | null } & Record<string, unknown>;
        Update: Partial<Omit<ClubEventRegistration, 'id' | 'created_at'>> & Record<string, unknown>;
        Relationships: [];
      };
      product_categories: {
        Row: ProductCategory & Record<string, unknown>;
        Insert: Omit<ProductCategory, 'id' | 'created_at' | 'updated_at'> & Record<string, unknown>;
        Update: Partial<Omit<ProductCategory, 'id' | 'created_at'>> & Record<string, unknown>;
        Relationships: [];
      };
      products: {
        Row: Product & Record<string, unknown>;
        Insert: Omit<Product, 'id' | 'created_at' | 'updated_at'> & Record<string, unknown>;
        Update: Partial<Omit<Product, 'id' | 'created_at'>> & Record<string, unknown>;
        Relationships: [];
      };
      product_variants: {
        Row: ProductVariant & Record<string, unknown>;
        Insert: Omit<ProductVariant, 'id' | 'created_at' | 'updated_at'> & Record<string, unknown>;
        Update: Partial<Omit<ProductVariant, 'id' | 'created_at'>> & Record<string, unknown>;
        Relationships: [];
      };
      product_access_rules: {
        Row: ProductAccessRule & Record<string, unknown>;
        Insert: Omit<ProductAccessRule, 'id' | 'created_at'> & Record<string, unknown>;
        Update: Partial<Omit<ProductAccessRule, 'id' | 'created_at'>> & Record<string, unknown>;
        Relationships: [];
      };
      cart_items: {
        Row: CartItem & Record<string, unknown>;
        Insert: Omit<CartItem, 'id' | 'created_at' | 'updated_at'> & Record<string, unknown>;
        Update: Partial<Omit<CartItem, 'id' | 'created_at'>> & Record<string, unknown>;
        Relationships: [];
      };
      discount_codes: {
        Row: DiscountCode & Record<string, unknown>;
        Insert: Omit<DiscountCode, 'id' | 'created_at' | 'updated_at' | 'times_used'> & Record<string, unknown>;
        Update: Partial<Omit<DiscountCode, 'id' | 'created_at'>> & Record<string, unknown>;
        Relationships: [];
      };
      shop_orders: {
        Row: ShopOrder & Record<string, unknown>;
        Insert: Omit<ShopOrder, 'id' | 'created_at' | 'updated_at' | 'collection_qr_token'> & { collection_qr_token?: string } & Record<string, unknown>;
        Update: Partial<Omit<ShopOrder, 'id' | 'created_at'>> & Record<string, unknown>;
        Relationships: [];
      };
      order_items: {
        Row: OrderItem & Record<string, unknown>;
        Insert: Omit<OrderItem, 'id' | 'created_at'> & Record<string, unknown>;
        Update: Partial<Omit<OrderItem, 'id' | 'created_at'>> & Record<string, unknown>;
        Relationships: [];
      };
      digital_downloads: {
        Row: DigitalDownload & Record<string, unknown>;
        Insert: Omit<DigitalDownload, 'id' | 'created_at' | 'download_count'> & Record<string, unknown>;
        Update: Partial<Omit<DigitalDownload, 'id' | 'created_at'>> & Record<string, unknown>;
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
      shop_order_status: ShopOrderStatus;
      product_type: ProductType;
      discount_type: DiscountType;
    };
  };
}
