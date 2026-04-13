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

// Staff system types
export type StaffStatus = 'active' | 'inactive' | 'on_leave' | 'pending';
export type StaffFieldType = 'text' | 'textarea' | 'url' | 'date' | 'select' | 'boolean' | 'file' | 'email' | 'phone';
export type AccreditationStatus = 'current' | 'expired' | 'pending' | 'revoked';

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
  // Stripe Connect
  stripe_account_id?: string | null;
  stripe_onboarding_complete?: boolean;
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
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface UserOrganisation {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  primary_colour: string | null;
  role: UserRole;
  is_active: boolean;
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
  currency: string;
  description: string | null;
  payment_type: PaymentType;
  payment_status: PaymentStatus;
  due_date: string | null;
  paid_at: string | null;
  receipt_url: string | null;
  stripe_payment_intent_id: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string | null;
  updated_at: string | null;
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

// Staff system interfaces
export interface StaffType {
  id: string;
  organisation_id: string;
  name: string;
  description: string | null;
  icon: string | null;
  requires_wwc: boolean;
  is_publicly_visible: boolean;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface StaffTypeField {
  id: string;
  staff_type_id: string;
  organisation_id: string;
  name: string;
  field_type: StaffFieldType;
  is_required: boolean;
  options: string[] | null;
  placeholder: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface StaffRecord {
  id: string;
  profile_id: string;
  organisation_id: string;
  staff_type_id: string;
  member_id: string | null;
  status: StaffStatus;
  position: string | null;
  start_date: string | null;
  end_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface StaffWithProfile extends StaffRecord {
  profile: Profile;
  staff_type: StaffType;
}

export interface StaffFieldValue {
  id: string;
  staff_id: string;
  staff_type_field_id: string;
  organisation_id: string;
  value: string | null;
  created_at: string;
  updated_at: string;
}

export interface StaffAccreditation {
  id: string;
  staff_id: string;
  organisation_id: string;
  name: string;
  issuing_body: string | null;
  credential_number: string | null;
  issue_date: string | null;
  expiry_date: string | null;
  status: AccreditationStatus;
  document_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface StaffAccreditationTemplate {
  id: string;
  staff_type_id: string;
  organisation_id: string;
  name: string;
  issuing_body: string | null;
  is_required: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface StaffInvite {
  id: string;
  organisation_id: string;
  staff_type_id: string;
  token: string;
  email: string | null;
  created_by: string;
  expires_at: string;
  accepted_at: string | null;
  accepted_by: string | null;
  is_single_use: boolean;
  created_at: string;
}

export interface StaffInviteWithDetails extends StaffInvite {
  staff_type: StaffType;
  creator: Profile;
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

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      activities: {
        Row: {
          activity_type: Database["public"]["Enums"]["activity_type"]
          commitment_level: string | null
          competition_division_id: string | null
          created_at: string | null
          default_duration_minutes: number | null
          default_start_time: string | null
          default_venue: string | null
          description: string | null
          end_date: string | null
          finals_description: string | null
          finals_start_date: string | null
          finals_weeks: number | null
          first_round_date: string | null
          has_byes: boolean | null
          has_finals: boolean | null
          host_name: string | null
          host_type: string | null
          id: string
          is_current: boolean
          is_draft: boolean | null
          name: string
          organisation_id: string
          parent_activity_id: string | null
          participation_mode: Database["public"]["Enums"]["participation_mode"]
          pool_count: number | null
          recurrence_rule: string | null
          registration_closes: string | null
          registration_opens: string | null
          round_dates: Json | null
          schedule_frequency: string | null
          season_fee_amount_cents: number | null
          season_fee_max_cents: number | null
          season_fee_min_cents: number | null
          season_fee_type: string | null
          skill_level: string | null
          slug: string
          start_date: string | null
          total_rounds: number | null
          training_details: string | null
          training_required: boolean | null
          trial_date: string | null
          trial_fee_amount_cents: number | null
          trial_fee_type: string | null
          trials_required: boolean | null
          updated_at: string | null
        }
        Insert: {
          activity_type: Database["public"]["Enums"]["activity_type"]
          commitment_level?: string | null
          competition_division_id?: string | null
          created_at?: string | null
          default_duration_minutes?: number | null
          default_start_time?: string | null
          default_venue?: string | null
          description?: string | null
          end_date?: string | null
          finals_description?: string | null
          finals_start_date?: string | null
          finals_weeks?: number | null
          first_round_date?: string | null
          has_byes?: boolean | null
          has_finals?: boolean | null
          host_name?: string | null
          host_type?: string | null
          id?: string
          is_current?: boolean
          is_draft?: boolean | null
          name: string
          organisation_id: string
          parent_activity_id?: string | null
          participation_mode?: Database["public"]["Enums"]["participation_mode"]
          pool_count?: number | null
          recurrence_rule?: string | null
          registration_closes?: string | null
          registration_opens?: string | null
          round_dates?: Json | null
          schedule_frequency?: string | null
          season_fee_amount_cents?: number | null
          season_fee_max_cents?: number | null
          season_fee_min_cents?: number | null
          season_fee_type?: string | null
          skill_level?: string | null
          slug: string
          start_date?: string | null
          total_rounds?: number | null
          training_details?: string | null
          training_required?: boolean | null
          trial_date?: string | null
          trial_fee_amount_cents?: number | null
          trial_fee_type?: string | null
          trials_required?: boolean | null
          updated_at?: string | null
        }
        Update: {
          activity_type?: Database["public"]["Enums"]["activity_type"]
          commitment_level?: string | null
          competition_division_id?: string | null
          created_at?: string | null
          default_duration_minutes?: number | null
          default_start_time?: string | null
          default_venue?: string | null
          description?: string | null
          end_date?: string | null
          finals_description?: string | null
          finals_start_date?: string | null
          finals_weeks?: number | null
          first_round_date?: string | null
          has_byes?: boolean | null
          has_finals?: boolean | null
          host_name?: string | null
          host_type?: string | null
          id?: string
          is_current?: boolean
          is_draft?: boolean | null
          name?: string
          organisation_id?: string
          parent_activity_id?: string | null
          participation_mode?: Database["public"]["Enums"]["participation_mode"]
          pool_count?: number | null
          recurrence_rule?: string | null
          registration_closes?: string | null
          registration_opens?: string | null
          round_dates?: Json | null
          schedule_frequency?: string | null
          season_fee_amount_cents?: number | null
          season_fee_max_cents?: number | null
          season_fee_min_cents?: number | null
          season_fee_type?: string | null
          skill_level?: string | null
          slug?: string
          start_date?: string | null
          total_rounds?: number | null
          training_details?: string | null
          training_required?: boolean | null
          trial_date?: string | null
          trial_fee_amount_cents?: number | null
          trial_fee_type?: string | null
          trials_required?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activities_competition_division_id_fkey"
            columns: ["competition_division_id"]
            isOneToOne: false
            referencedRelation: "competition_divisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_parent_activity_id_fkey"
            columns: ["parent_activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_event_attendance: {
        Row: {
          checked_in_at: string | null
          created_at: string | null
          event_id: string
          id: string
          member_id: string
          notes: string | null
          status: Database["public"]["Enums"]["attendance_status"]
        }
        Insert: {
          checked_in_at?: string | null
          created_at?: string | null
          event_id: string
          id?: string
          member_id: string
          notes?: string | null
          status?: Database["public"]["Enums"]["attendance_status"]
        }
        Update: {
          checked_in_at?: string | null
          created_at?: string | null
          event_id?: string
          id?: string
          member_id?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["attendance_status"]
        }
        Relationships: [
          {
            foreignKeyName: "activity_event_attendance_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "activity_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_event_attendance_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_events: {
        Row: {
          activity_id: string
          away_score: number | null
          away_team_id: string | null
          bracket_position: number | null
          created_at: string | null
          date_time: string
          day_number: number | null
          end_time: string | null
          home_score: number | null
          home_team_id: string | null
          id: string
          is_home: boolean | null
          notes: string | null
          opponent_name: string | null
          organisation_id: string
          pool_number: number | null
          round_number: number | null
          session_number: number | null
          status: Database["public"]["Enums"]["event_status"]
          title: string | null
          tournament_stage:
            | Database["public"]["Enums"]["tournament_stage"]
            | null
          updated_at: string | null
          venue: string | null
        }
        Insert: {
          activity_id: string
          away_score?: number | null
          away_team_id?: string | null
          bracket_position?: number | null
          created_at?: string | null
          date_time: string
          day_number?: number | null
          end_time?: string | null
          home_score?: number | null
          home_team_id?: string | null
          id?: string
          is_home?: boolean | null
          notes?: string | null
          opponent_name?: string | null
          organisation_id: string
          pool_number?: number | null
          round_number?: number | null
          session_number?: number | null
          status?: Database["public"]["Enums"]["event_status"]
          title?: string | null
          tournament_stage?:
            | Database["public"]["Enums"]["tournament_stage"]
            | null
          updated_at?: string | null
          venue?: string | null
        }
        Update: {
          activity_id?: string
          away_score?: number | null
          away_team_id?: string | null
          bracket_position?: number | null
          created_at?: string | null
          date_time?: string
          day_number?: number | null
          end_time?: string | null
          home_score?: number | null
          home_team_id?: string | null
          id?: string
          is_home?: boolean | null
          notes?: string | null
          opponent_name?: string | null
          organisation_id?: string
          pool_number?: number | null
          round_number?: number | null
          session_number?: number | null
          status?: Database["public"]["Enums"]["event_status"]
          title?: string | null
          tournament_stage?:
            | Database["public"]["Enums"]["tournament_stage"]
            | null
          updated_at?: string | null
          venue?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_events_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_events_away_team_id_fkey"
            columns: ["away_team_id"]
            isOneToOne: false
            referencedRelation: "activity_teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_events_home_team_id_fkey"
            columns: ["home_team_id"]
            isOneToOne: false
            referencedRelation: "activity_teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_events_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_standings: {
        Row: {
          activity_id: string
          bonus_points: number
          draws: number
          id: string
          ladder_points: number
          losses: number
          played: number
          points_against: number
          points_for: number
          team_id: string
          updated_at: string | null
          wins: number
        }
        Insert: {
          activity_id: string
          bonus_points?: number
          draws?: number
          id?: string
          ladder_points?: number
          losses?: number
          played?: number
          points_against?: number
          points_for?: number
          team_id: string
          updated_at?: string | null
          wins?: number
        }
        Update: {
          activity_id?: string
          bonus_points?: number
          draws?: number
          id?: string
          ladder_points?: number
          losses?: number
          played?: number
          points_against?: number
          points_for?: number
          team_id?: string
          updated_at?: string | null
          wins?: number
        }
        Relationships: [
          {
            foreignKeyName: "activity_standings_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_standings_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "activity_teams"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_team_members: {
        Row: {
          activity_team_id: string
          id: string
          is_captain: boolean
          jersey_number: number | null
          joined_at: string | null
          member_id: string
          position: string | null
        }
        Insert: {
          activity_team_id: string
          id?: string
          is_captain?: boolean
          jersey_number?: number | null
          joined_at?: string | null
          member_id: string
          position?: string | null
        }
        Update: {
          activity_team_id?: string
          id?: string
          is_captain?: boolean
          jersey_number?: number | null
          joined_at?: string | null
          member_id?: string
          position?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_team_members_activity_team_id_fkey"
            columns: ["activity_team_id"]
            isOneToOne: false
            referencedRelation: "activity_teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_team_members_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_teams: {
        Row: {
          activity_id: string
          age_group: string | null
          coach_id: string | null
          created_at: string | null
          division: string | null
          id: string
          is_own_team: boolean
          manager_id: string | null
          max_players: number
          name: string
          organisation_id: string
          pool_number: number | null
          seed_number: number | null
          source_team_id: string | null
          updated_at: string | null
        }
        Insert: {
          activity_id: string
          age_group?: string | null
          coach_id?: string | null
          created_at?: string | null
          division?: string | null
          id?: string
          is_own_team?: boolean
          manager_id?: string | null
          max_players?: number
          name: string
          organisation_id: string
          pool_number?: number | null
          seed_number?: number | null
          source_team_id?: string | null
          updated_at?: string | null
        }
        Update: {
          activity_id?: string
          age_group?: string | null
          coach_id?: string | null
          created_at?: string | null
          division?: string | null
          id?: string
          is_own_team?: boolean
          manager_id?: string | null
          max_players?: number
          name?: string
          organisation_id?: string
          pool_number?: number | null
          seed_number?: number | null
          source_team_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_teams_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_teams_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_teams_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_teams_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_teams_source_team_id_fkey"
            columns: ["source_team_id"]
            isOneToOne: false
            referencedRelation: "activity_teams"
            referencedColumns: ["id"]
          },
        ]
      }
      announcements: {
        Row: {
          author_id: string
          content: string
          created_at: string | null
          expires_at: string | null
          id: string
          is_pinned: boolean
          organisation_id: string
          published_at: string
          title: string
          updated_at: string | null
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_pinned?: boolean
          organisation_id: string
          published_at?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_pinned?: boolean
          organisation_id?: string
          published_at?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "announcements_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "announcements_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      club_event_registrations: {
        Row: {
          approved_at: string | null
          cancelled_at: string | null
          created_at: string | null
          dietary_requirements: string | null
          event_id: string
          guest_count: number
          guest_names: string | null
          id: string
          member_id: string
          notes: string | null
          registered_at: string
          status: string
          updated_at: string | null
        }
        Insert: {
          approved_at?: string | null
          cancelled_at?: string | null
          created_at?: string | null
          dietary_requirements?: string | null
          event_id: string
          guest_count?: number
          guest_names?: string | null
          id?: string
          member_id: string
          notes?: string | null
          registered_at?: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          approved_at?: string | null
          cancelled_at?: string | null
          created_at?: string | null
          dietary_requirements?: string | null
          event_id?: string
          guest_count?: number
          guest_names?: string | null
          id?: string
          member_id?: string
          notes?: string | null
          registered_at?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "club_event_registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "club_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "club_event_registrations_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      club_event_targets: {
        Row: {
          activity_team_id: string
          created_at: string | null
          event_id: string
          id: string
        }
        Insert: {
          activity_team_id: string
          created_at?: string | null
          event_id: string
          id?: string
        }
        Update: {
          activity_team_id?: string
          created_at?: string | null
          event_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "club_event_targets_activity_team_id_fkey"
            columns: ["activity_team_id"]
            isOneToOne: false
            referencedRelation: "activity_teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "club_event_targets_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "club_events"
            referencedColumns: ["id"]
          },
        ]
      }
      club_events: {
        Row: {
          alcohol_provided: boolean
          allow_guests: boolean
          collect_dietary_requirements: boolean
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          cost_cents: number
          cost_description: string | null
          cover_image_url: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          enable_waitlist: boolean
          end_time: string | null
          event_type: string
          food_provided: boolean
          id: string
          is_adults_only: boolean
          is_members_only: boolean
          max_attendees: number | null
          max_guests_per_member: number
          name: string
          notes: string | null
          organisation_id: string
          registration_closes: string | null
          registration_opens: string | null
          registration_required: boolean
          registration_requires_approval: boolean
          start_time: string
          status: string
          updated_at: string | null
          venue_address: string | null
          venue_id: string | null
          venue_name: string | null
        }
        Insert: {
          alcohol_provided?: boolean
          allow_guests?: boolean
          collect_dietary_requirements?: boolean
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          cost_cents?: number
          cost_description?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          enable_waitlist?: boolean
          end_time?: string | null
          event_type?: string
          food_provided?: boolean
          id?: string
          is_adults_only?: boolean
          is_members_only?: boolean
          max_attendees?: number | null
          max_guests_per_member?: number
          name: string
          notes?: string | null
          organisation_id: string
          registration_closes?: string | null
          registration_opens?: string | null
          registration_required?: boolean
          registration_requires_approval?: boolean
          start_time: string
          status?: string
          updated_at?: string | null
          venue_address?: string | null
          venue_id?: string | null
          venue_name?: string | null
        }
        Update: {
          alcohol_provided?: boolean
          allow_guests?: boolean
          collect_dietary_requirements?: boolean
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          cost_cents?: number
          cost_description?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          enable_waitlist?: boolean
          end_time?: string | null
          event_type?: string
          food_provided?: boolean
          id?: string
          is_adults_only?: boolean
          is_members_only?: boolean
          max_attendees?: number | null
          max_guests_per_member?: number
          name?: string
          notes?: string | null
          organisation_id?: string
          registration_closes?: string | null
          registration_opens?: string | null
          registration_required?: boolean
          registration_requires_approval?: boolean
          start_time?: string
          status?: string
          updated_at?: string | null
          venue_address?: string | null
          venue_id?: string | null
          venue_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "club_events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "club_events_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "club_events_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "club_venues"
            referencedColumns: ["id"]
          },
        ]
      }
      club_venues: {
        Row: {
          address: string | null
          categories: string[]
          created_at: string | null
          id: string
          is_primary: boolean
          name: string
          notes: string | null
          organisation_id: string
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          categories?: string[]
          created_at?: string | null
          id?: string
          is_primary?: boolean
          name: string
          notes?: string | null
          organisation_id: string
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          categories?: string[]
          created_at?: string | null
          id?: string
          is_primary?: boolean
          name?: string
          notes?: string | null
          organisation_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "club_venues_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      competition_divisions: {
        Row: {
          activity_id: string
          age_group: string | null
          created_at: string | null
          display_order: number
          gender: string | null
          id: string
          max_teams: number | null
          name: string
        }
        Insert: {
          activity_id: string
          age_group?: string | null
          created_at?: string | null
          display_order?: number
          gender?: string | null
          id?: string
          max_teams?: number | null
          name: string
        }
        Update: {
          activity_id?: string
          age_group?: string | null
          created_at?: string | null
          display_order?: number
          gender?: string | null
          id?: string
          max_teams?: number | null
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "competition_divisions_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          category: Database["public"]["Enums"]["document_category"]
          created_at: string | null
          description: string | null
          file_name: string
          file_size_bytes: number | null
          file_type: string | null
          file_url: string
          id: string
          is_public: boolean
          organisation_id: string
          title: string
          uploaded_by: string
        }
        Insert: {
          category?: Database["public"]["Enums"]["document_category"]
          created_at?: string | null
          description?: string | null
          file_name: string
          file_size_bytes?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          is_public?: boolean
          organisation_id: string
          title: string
          uploaded_by: string
        }
        Update: {
          category?: Database["public"]["Enums"]["document_category"]
          created_at?: string | null
          description?: string | null
          file_name?: string
          file_size_bytes?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          is_public?: boolean
          organisation_id?: string
          title?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      fixtures: {
        Row: {
          away_score: number | null
          created_at: string | null
          date_time: string
          home_score: number | null
          id: string
          is_home: boolean
          notes: string | null
          opponent_name: string
          organisation_id: string
          round_number: number | null
          season_id: string | null
          status: Database["public"]["Enums"]["fixture_status"]
          team_id: string
          updated_at: string | null
          venue: string | null
        }
        Insert: {
          away_score?: number | null
          created_at?: string | null
          date_time: string
          home_score?: number | null
          id?: string
          is_home?: boolean
          notes?: string | null
          opponent_name: string
          organisation_id: string
          round_number?: number | null
          season_id?: string | null
          status?: Database["public"]["Enums"]["fixture_status"]
          team_id: string
          updated_at?: string | null
          venue?: string | null
        }
        Update: {
          away_score?: number | null
          created_at?: string | null
          date_time?: string
          home_score?: number | null
          id?: string
          is_home?: boolean
          notes?: string | null
          opponent_name?: string
          organisation_id?: string
          round_number?: number | null
          season_id?: string | null
          status?: Database["public"]["Enums"]["fixture_status"]
          team_id?: string
          updated_at?: string | null
          venue?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fixtures_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fixtures_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fixtures_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      member_guardians: {
        Row: {
          consent_date: string | null
          created_at: string | null
          guardian_member_id: string
          id: string
          is_primary: boolean
          minor_member_id: string
          parental_consent_given: boolean
          relationship: Database["public"]["Enums"]["guardian_relationship"]
          updated_at: string | null
        }
        Insert: {
          consent_date?: string | null
          created_at?: string | null
          guardian_member_id: string
          id?: string
          is_primary?: boolean
          minor_member_id: string
          parental_consent_given?: boolean
          relationship?: Database["public"]["Enums"]["guardian_relationship"]
          updated_at?: string | null
        }
        Update: {
          consent_date?: string | null
          created_at?: string | null
          guardian_member_id?: string
          id?: string
          is_primary?: boolean
          minor_member_id?: string
          parental_consent_given?: boolean
          relationship?: Database["public"]["Enums"]["guardian_relationship"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "member_guardians_guardian_member_id_fkey"
            columns: ["guardian_member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_guardians_minor_member_id_fkey"
            columns: ["minor_member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      members: {
        Row: {
          created_at: string | null
          dietary_requirements: string | null
          expiry_date: string | null
          id: string
          medical_conditions: string | null
          membership_status: Database["public"]["Enums"]["membership_status"]
          membership_type: Database["public"]["Enums"]["membership_type"]
          membership_type_id: string | null
          notes: string | null
          organisation_id: string
          profile_id: string
          registration_date: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          dietary_requirements?: string | null
          expiry_date?: string | null
          id?: string
          medical_conditions?: string | null
          membership_status?: Database["public"]["Enums"]["membership_status"]
          membership_type?: Database["public"]["Enums"]["membership_type"]
          membership_type_id?: string | null
          notes?: string | null
          organisation_id: string
          profile_id: string
          registration_date?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          dietary_requirements?: string | null
          expiry_date?: string | null
          id?: string
          medical_conditions?: string | null
          membership_status?: Database["public"]["Enums"]["membership_status"]
          membership_type?: Database["public"]["Enums"]["membership_type"]
          membership_type_id?: string | null
          notes?: string | null
          organisation_id?: string
          profile_id?: string
          registration_date?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "members_membership_type_id_fkey"
            columns: ["membership_type_id"]
            isOneToOne: false
            referencedRelation: "membership_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "members_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "members_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      membership_types: {
        Row: {
          auto_renewal: boolean
          created_at: string | null
          default_duration_months: number | null
          description: string | null
          display_order: number
          fee_cents: number | null
          grace_period_days: number
          has_expiry: boolean
          id: string
          is_active: boolean
          name: string
          organisation_id: string
          updated_at: string | null
        }
        Insert: {
          auto_renewal?: boolean
          created_at?: string | null
          default_duration_months?: number | null
          description?: string | null
          display_order?: number
          fee_cents?: number | null
          grace_period_days?: number
          has_expiry?: boolean
          id?: string
          is_active?: boolean
          name: string
          organisation_id: string
          updated_at?: string | null
        }
        Update: {
          auto_renewal?: boolean
          created_at?: string | null
          default_duration_months?: number | null
          description?: string | null
          display_order?: number
          fee_cents?: number | null
          grace_period_days?: number
          has_expiry?: boolean
          id?: string
          is_active?: boolean
          name?: string
          organisation_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "membership_types_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      organisation_modules: {
        Row: {
          activity_type: Database["public"]["Enums"]["activity_type"]
          created_at: string | null
          display_order: number
          id: string
          is_enabled: boolean
          organisation_id: string
        }
        Insert: {
          activity_type: Database["public"]["Enums"]["activity_type"]
          created_at?: string | null
          display_order?: number
          id?: string
          is_enabled?: boolean
          organisation_id: string
        }
        Update: {
          activity_type?: Database["public"]["Enums"]["activity_type"]
          created_at?: string | null
          display_order?: number
          id?: string
          is_enabled?: boolean
          organisation_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organisation_modules_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      organisations: {
        Row: {
          abn: string | null
          abn_entity_name: string | null
          address: string | null
          affiliated_body: string | null
          affiliation_number: string | null
          bank_account_name: string | null
          bank_account_number: string | null
          bank_bsb: string | null
          bank_name: string | null
          child_safety_policy_url: string | null
          code_of_conduct_url: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string | null
          default_payment_terms_days: number | null
          details_reviewed_at: string | null
          facebook_url: string | null
          id: string
          instagram_url: string | null
          insurance_policy_number: string | null
          insurance_provider: string | null
          is_gst_registered: boolean | null
          late_fee_cents: number | null
          logo_url: string | null
          minimum_age: number | null
          name: string
          primary_colour: string | null
          privacy_policy_url: string | null
          registration_consent_text: string | null
          registration_open: boolean | null
          secondary_colour: string | null
          slug: string
          sport_type: Database["public"]["Enums"]["sport_type"]
          state: string | null
          terms_conditions_url: string | null
          tiktok_url: string | null
          timezone: string | null
          updated_at: string | null
          website: string | null
          youtube_url: string | null
        }
        Insert: {
          abn?: string | null
          abn_entity_name?: string | null
          address?: string | null
          affiliated_body?: string | null
          affiliation_number?: string | null
          bank_account_name?: string | null
          bank_account_number?: string | null
          bank_bsb?: string | null
          bank_name?: string | null
          child_safety_policy_url?: string | null
          code_of_conduct_url?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          default_payment_terms_days?: number | null
          details_reviewed_at?: string | null
          facebook_url?: string | null
          id?: string
          instagram_url?: string | null
          insurance_policy_number?: string | null
          insurance_provider?: string | null
          is_gst_registered?: boolean | null
          late_fee_cents?: number | null
          logo_url?: string | null
          minimum_age?: number | null
          name: string
          primary_colour?: string | null
          privacy_policy_url?: string | null
          registration_consent_text?: string | null
          registration_open?: boolean | null
          secondary_colour?: string | null
          slug: string
          sport_type: Database["public"]["Enums"]["sport_type"]
          state?: string | null
          terms_conditions_url?: string | null
          tiktok_url?: string | null
          timezone?: string | null
          updated_at?: string | null
          website?: string | null
          youtube_url?: string | null
        }
        Update: {
          abn?: string | null
          abn_entity_name?: string | null
          address?: string | null
          affiliated_body?: string | null
          affiliation_number?: string | null
          bank_account_name?: string | null
          bank_account_number?: string | null
          bank_bsb?: string | null
          bank_name?: string | null
          child_safety_policy_url?: string | null
          code_of_conduct_url?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          default_payment_terms_days?: number | null
          details_reviewed_at?: string | null
          facebook_url?: string | null
          id?: string
          instagram_url?: string | null
          insurance_policy_number?: string | null
          insurance_provider?: string | null
          is_gst_registered?: boolean | null
          late_fee_cents?: number | null
          logo_url?: string | null
          minimum_age?: number | null
          name?: string
          primary_colour?: string | null
          privacy_policy_url?: string | null
          registration_consent_text?: string | null
          registration_open?: boolean | null
          secondary_colour?: string | null
          slug?: string
          sport_type?: Database["public"]["Enums"]["sport_type"]
          state?: string | null
          terms_conditions_url?: string | null
          tiktok_url?: string | null
          timezone?: string | null
          updated_at?: string | null
          website?: string | null
          youtube_url?: string | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount_cents: number
          created_at: string | null
          created_by: string | null
          currency: string
          description: string | null
          due_date: string | null
          id: string
          member_id: string
          notes: string | null
          organisation_id: string
          paid_at: string | null
          payment_status: Database["public"]["Enums"]["payment_status"]
          payment_type: Database["public"]["Enums"]["payment_type"]
          receipt_url: string | null
          stripe_payment_intent_id: string | null
          updated_at: string | null
        }
        Insert: {
          amount_cents: number
          created_at?: string | null
          created_by?: string | null
          currency?: string
          description?: string | null
          due_date?: string | null
          id?: string
          member_id: string
          notes?: string | null
          organisation_id: string
          paid_at?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          payment_type: Database["public"]["Enums"]["payment_type"]
          receipt_url?: string | null
          stripe_payment_intent_id?: string | null
          updated_at?: string | null
        }
        Update: {
          amount_cents?: number
          created_at?: string | null
          created_by?: string | null
          currency?: string
          description?: string | null
          due_date?: string | null
          id?: string
          member_id?: string
          notes?: string | null
          organisation_id?: string
          paid_at?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          payment_type?: Database["public"]["Enums"]["payment_type"]
          receipt_url?: string | null
          stripe_payment_intent_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      photo_albums: {
        Row: {
          cover_photo_url: string | null
          created_at: string | null
          created_by: string
          description: string | null
          id: string
          name: string
          organisation_id: string
          photo_count: number
          updated_at: string | null
        }
        Insert: {
          cover_photo_url?: string | null
          created_at?: string | null
          created_by: string
          description?: string | null
          id?: string
          name: string
          organisation_id: string
          photo_count?: number
          updated_at?: string | null
        }
        Update: {
          cover_photo_url?: string | null
          created_at?: string | null
          created_by?: string
          description?: string | null
          id?: string
          name?: string
          organisation_id?: string
          photo_count?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "photo_albums_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "photo_albums_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      photo_items: {
        Row: {
          album_id: string
          caption: string | null
          created_at: string | null
          file_url: string
          height: number | null
          id: string
          thumbnail_url: string | null
          uploaded_by: string
          width: number | null
        }
        Insert: {
          album_id: string
          caption?: string | null
          created_at?: string | null
          file_url: string
          height?: number | null
          id?: string
          thumbnail_url?: string | null
          uploaded_by: string
          width?: number | null
        }
        Update: {
          album_id?: string
          caption?: string | null
          created_at?: string | null
          file_url?: string
          height?: number | null
          id?: string
          thumbnail_url?: string | null
          uploaded_by?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "photo_items_album_id_fkey"
            columns: ["album_id"]
            isOneToOne: false
            referencedRelation: "photo_albums"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "photo_items_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          date_of_birth: string | null
          email: string
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          first_name: string
          gender: string | null
          id: string
          last_name: string
          organisation_id: string | null
          phone: string | null
          preferred_name: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          email: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          first_name: string
          gender?: string | null
          id: string
          last_name: string
          organisation_id?: string | null
          phone?: string | null
          preferred_name?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          email?: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          first_name?: string
          gender?: string | null
          id?: string
          last_name?: string
          organisation_id?: string | null
          phone?: string | null
          preferred_name?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      seasons: {
        Row: {
          created_at: string | null
          end_date: string
          id: string
          is_current: boolean
          name: string
          organisation_id: string
          start_date: string
        }
        Insert: {
          created_at?: string | null
          end_date: string
          id?: string
          is_current?: boolean
          name: string
          organisation_id: string
          start_date: string
        }
        Update: {
          created_at?: string | null
          end_date?: string
          id?: string
          is_current?: boolean
          name?: string
          organisation_id?: string
          start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "seasons_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      staff: {
        Row: {
          created_at: string | null
          end_date: string | null
          id: string
          member_id: string | null
          notes: string | null
          organisation_id: string
          position: string | null
          profile_id: string
          staff_type_id: string
          start_date: string | null
          status: Database["public"]["Enums"]["staff_status"]
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          end_date?: string | null
          id?: string
          member_id?: string | null
          notes?: string | null
          organisation_id: string
          position?: string | null
          profile_id: string
          staff_type_id: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["staff_status"]
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          end_date?: string | null
          id?: string
          member_id?: string | null
          notes?: string | null
          organisation_id?: string
          position?: string | null
          profile_id?: string
          staff_type_id?: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["staff_status"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_staff_type_id_fkey"
            columns: ["staff_type_id"]
            isOneToOne: false
            referencedRelation: "staff_types"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_accreditation_templates: {
        Row: {
          created_at: string | null
          display_order: number
          id: string
          is_required: boolean
          issuing_body: string | null
          name: string
          organisation_id: string
          staff_type_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          display_order?: number
          id?: string
          is_required?: boolean
          issuing_body?: string | null
          name: string
          organisation_id: string
          staff_type_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          display_order?: number
          id?: string
          is_required?: boolean
          issuing_body?: string | null
          name?: string
          organisation_id?: string
          staff_type_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_accreditation_templates_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_accreditation_templates_staff_type_id_fkey"
            columns: ["staff_type_id"]
            isOneToOne: false
            referencedRelation: "staff_types"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_accreditations: {
        Row: {
          created_at: string | null
          credential_number: string | null
          document_url: string | null
          expiry_date: string | null
          id: string
          issue_date: string | null
          issuing_body: string | null
          name: string
          notes: string | null
          organisation_id: string
          staff_id: string
          status: Database["public"]["Enums"]["accreditation_status"]
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          credential_number?: string | null
          document_url?: string | null
          expiry_date?: string | null
          id?: string
          issue_date?: string | null
          issuing_body?: string | null
          name: string
          notes?: string | null
          organisation_id: string
          staff_id: string
          status?: Database["public"]["Enums"]["accreditation_status"]
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          credential_number?: string | null
          document_url?: string | null
          expiry_date?: string | null
          id?: string
          issue_date?: string | null
          issuing_body?: string | null
          name?: string
          notes?: string | null
          organisation_id?: string
          staff_id?: string
          status?: Database["public"]["Enums"]["accreditation_status"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_accreditations_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_accreditations_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_field_values: {
        Row: {
          created_at: string | null
          id: string
          organisation_id: string
          staff_id: string
          staff_type_field_id: string
          updated_at: string | null
          value: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          organisation_id: string
          staff_id: string
          staff_type_field_id: string
          updated_at?: string | null
          value?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          organisation_id?: string
          staff_id?: string
          staff_type_field_id?: string
          updated_at?: string | null
          value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_field_values_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_field_values_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_field_values_staff_type_field_id_fkey"
            columns: ["staff_type_field_id"]
            isOneToOne: false
            referencedRelation: "staff_type_fields"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_invites: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          created_at: string | null
          created_by: string
          email: string | null
          expires_at: string
          id: string
          is_single_use: boolean
          organisation_id: string
          staff_type_id: string
          token: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string | null
          created_by: string
          email?: string | null
          expires_at?: string
          id?: string
          is_single_use?: boolean
          organisation_id: string
          staff_type_id: string
          token: string
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string | null
          created_by?: string
          email?: string | null
          expires_at?: string
          id?: string
          is_single_use?: boolean
          organisation_id?: string
          staff_type_id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_invites_accepted_by_fkey"
            columns: ["accepted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_invites_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_invites_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_invites_staff_type_id_fkey"
            columns: ["staff_type_id"]
            isOneToOne: false
            referencedRelation: "staff_types"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_type_fields: {
        Row: {
          created_at: string | null
          display_order: number
          field_type: Database["public"]["Enums"]["staff_field_type"]
          id: string
          is_required: boolean
          name: string
          options: Json | null
          organisation_id: string
          placeholder: string | null
          staff_type_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          display_order?: number
          field_type?: Database["public"]["Enums"]["staff_field_type"]
          id?: string
          is_required?: boolean
          name: string
          options?: Json | null
          organisation_id: string
          placeholder?: string | null
          staff_type_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          display_order?: number
          field_type?: Database["public"]["Enums"]["staff_field_type"]
          id?: string
          is_required?: boolean
          name?: string
          options?: Json | null
          organisation_id?: string
          placeholder?: string | null
          staff_type_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_type_fields_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_type_fields_staff_type_id_fkey"
            columns: ["staff_type_id"]
            isOneToOne: false
            referencedRelation: "staff_types"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_types: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number
          icon: string | null
          id: string
          is_active: boolean
          is_publicly_visible: boolean
          name: string
          organisation_id: string
          requires_wwc: boolean
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number
          icon?: string | null
          id?: string
          is_active?: boolean
          is_publicly_visible?: boolean
          name: string
          organisation_id: string
          requires_wwc?: boolean
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number
          icon?: string | null
          id?: string
          is_active?: boolean
          is_publicly_visible?: boolean
          name?: string
          organisation_id?: string
          requires_wwc?: boolean
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_types_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          id: string
          is_captain: boolean
          jersey_number: number | null
          joined_at: string | null
          member_id: string
          position: string | null
          team_id: string
        }
        Insert: {
          id?: string
          is_captain?: boolean
          jersey_number?: number | null
          joined_at?: string | null
          member_id: string
          position?: string | null
          team_id: string
        }
        Update: {
          id?: string
          is_captain?: boolean
          jersey_number?: number | null
          joined_at?: string | null
          member_id?: string
          position?: string | null
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          age_group: string | null
          coach_id: string | null
          created_at: string | null
          division: string | null
          id: string
          manager_id: string | null
          max_players: number
          name: string
          organisation_id: string
          season_id: string | null
          updated_at: string | null
        }
        Insert: {
          age_group?: string | null
          coach_id?: string | null
          created_at?: string | null
          division?: string | null
          id?: string
          manager_id?: string | null
          max_players?: number
          name: string
          organisation_id: string
          season_id?: string | null
          updated_at?: string | null
        }
        Update: {
          age_group?: string | null
          coach_id?: string | null
          created_at?: string | null
          division?: string | null
          id?: string
          manager_id?: string | null
          max_players?: number
          name?: string
          organisation_id?: string
          season_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teams_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teams_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teams_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teams_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      trial_event_divisions: {
        Row: {
          created_at: string | null
          division_id: string
          event_id: string
          id: string
        }
        Insert: {
          created_at?: string | null
          division_id: string
          event_id: string
          id?: string
        }
        Update: {
          created_at?: string | null
          division_id?: string
          event_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trial_event_divisions_division_id_fkey"
            columns: ["division_id"]
            isOneToOne: false
            referencedRelation: "competition_divisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trial_event_divisions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "activity_events"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      assign_user_to_organisation: {
        Args: {
          p_org_id: string
          p_role: Database["public"]["Enums"]["user_role"]
          p_user_id: string
        }
        Returns: undefined
      }
      auth_org_id: { Args: never; Returns: string }
      auth_profile: {
        Args: never
        Returns: {
          avatar_url: string | null
          created_at: string | null
          date_of_birth: string | null
          email: string
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          first_name: string
          gender: string | null
          id: string
          last_name: string
          organisation_id: string | null
          phone: string | null
          preferred_name: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          updated_at: string | null
        }
        SetofOptions: {
          from: "*"
          to: "profiles"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      auth_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      get_member_directory: {
        Args: { p_org_id: string }
        Returns: {
          avatar_url: string
          email: string
          first_name: string
          id: string
          last_name: string
          phone: string
          role: Database["public"]["Enums"]["user_role"]
        }[]
      }
      get_user_organisations: {
        Args: never
        Returns: {
          id: string
          name: string
          slug: string
          logo_url: string | null
          primary_colour: string | null
          role: Database["public"]["Enums"]["user_role"]
          is_active: boolean
        }[]
      }
      guardian_minor_ids: { Args: never; Returns: string[] }
      is_admin_or_manager: { Args: { org_id: string }; Returns: boolean }
      is_coach: { Args: { org_id: string }; Returns: boolean }
      is_guardian_of: { Args: { target_member_id: string }; Returns: boolean }
      switch_active_organisation: {
        Args: { p_org_id: string }
        Returns: undefined
      }
    }
    Enums: {
      accreditation_status: "current" | "expired" | "pending" | "revoked"
      activity_type:
        | "competition"
        | "tournament"
        | "training_session"
        | "training_camp"
        | "trials"
      attendance_status:
        | "attending"
        | "not_attending"
        | "maybe"
        | "attended"
        | "absent"
        | "late"
      document_category:
        | "policy"
        | "minutes"
        | "report"
        | "form"
        | "constitution"
        | "other"
      event_status:
        | "scheduled"
        | "in_progress"
        | "completed"
        | "cancelled"
        | "postponed"
        | "bye"
      fixture_status:
        | "scheduled"
        | "in_progress"
        | "completed"
        | "cancelled"
        | "postponed"
        | "bye"
      guardian_relationship:
        | "parent"
        | "grandparent"
        | "legal_guardian"
        | "other"
      membership_status: "active" | "inactive" | "suspended" | "pending"
      membership_type: "senior" | "junior" | "social" | "life" | "volunteer"
      participation_mode: "participant" | "organiser"
      payment_status: "pending" | "paid" | "overdue" | "cancelled" | "refunded"
      payment_type:
        | "membership_fee"
        | "match_fee"
        | "fine"
        | "merchandise"
        | "event"
        | "other"
        | "trial_fee"
      sport_type:
        | "rugby_league"
        | "rugby_union"
        | "cricket"
        | "soccer"
        | "netball"
        | "basketball"
        | "hockey"
        | "afl"
        | "touch_football"
        | "volleyball"
        | "other"
      staff_field_type:
        | "text"
        | "textarea"
        | "url"
        | "date"
        | "select"
        | "boolean"
        | "file"
        | "email"
        | "phone"
      staff_status: "active" | "inactive" | "on_leave" | "pending"
      tournament_stage:
        | "pool"
        | "quarterfinal"
        | "semifinal"
        | "final"
        | "third_place"
        | "round_robin"
      user_role:
        | "admin"
        | "manager"
        | "coach"
        | "player"
        | "member"
        | "guardian"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      accreditation_status: ["current", "expired", "pending", "revoked"],
      activity_type: [
        "competition",
        "tournament",
        "training_session",
        "training_camp",
        "trials",
      ],
      attendance_status: [
        "attending",
        "not_attending",
        "maybe",
        "attended",
        "absent",
        "late",
      ],
      document_category: [
        "policy",
        "minutes",
        "report",
        "form",
        "constitution",
        "other",
      ],
      event_status: [
        "scheduled",
        "in_progress",
        "completed",
        "cancelled",
        "postponed",
        "bye",
      ],
      fixture_status: [
        "scheduled",
        "in_progress",
        "completed",
        "cancelled",
        "postponed",
        "bye",
      ],
      guardian_relationship: [
        "parent",
        "grandparent",
        "legal_guardian",
        "other",
      ],
      membership_status: ["active", "inactive", "suspended", "pending"],
      membership_type: ["senior", "junior", "social", "life", "volunteer"],
      participation_mode: ["participant", "organiser"],
      payment_status: ["pending", "paid", "overdue", "cancelled", "refunded"],
      payment_type: [
        "membership_fee",
        "match_fee",
        "fine",
        "merchandise",
        "event",
        "other",
        "trial_fee",
      ],
      sport_type: [
        "rugby_league",
        "rugby_union",
        "cricket",
        "soccer",
        "netball",
        "basketball",
        "hockey",
        "afl",
        "touch_football",
        "volleyball",
        "other",
      ],
      staff_field_type: [
        "text",
        "textarea",
        "url",
        "date",
        "select",
        "boolean",
        "file",
        "email",
        "phone",
      ],
      staff_status: ["active", "inactive", "on_leave", "pending"],
      tournament_stage: [
        "pool",
        "quarterfinal",
        "semifinal",
        "final",
        "third_place",
        "round_robin",
      ],
      user_role: ["admin", "manager", "coach", "player", "member", "guardian"],
    },
  },
} as const
