export type {
  Member,
  MemberWithProfile,
  MembershipType,
  MembershipStatus,
  Profile,
  MemberGuardian,
  MemberGuardianWithDetails,
  GuardianRelationship,
} from '@/lib/supabase/database.types';

export interface MemberFilters {
  search?: string;
  membershipType?: string[];
  membershipStatus?: string[];
  teamId?: string;
  ageGroup?: 'all' | 'adult' | 'child';
  gender?: string;
}

export interface MemberFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  membershipType: string;
  registrationDate: string;
  expiryDate?: string;
  medicalConditions?: string;
  dietaryRequirements?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  notes?: string;
  guardians?: Array<{
    memberId: string;
    relationship: string;
    consentGiven: boolean;
  }>;
}

export interface CsvImportRow {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  date_of_birth?: string;
  membership_type: string;
}

export interface CsvImportResult {
  success: CsvImportRow[];
  errors: Array<{ row: number; data: Record<string, string>; errors: string[] }>;
  totalRows: number;
  successCount: number;
  errorCount: number;
}
