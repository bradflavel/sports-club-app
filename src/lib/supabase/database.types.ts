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
  | 'other';
export type PaymentStatus = 'pending' | 'paid' | 'overdue' | 'cancelled' | 'refunded';
export type DocumentCategory = 'policy' | 'minutes' | 'report' | 'form' | 'constitution' | 'other';

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
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface MemberWithProfile extends Member {
  profile: Profile;
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
    };
  };
}
