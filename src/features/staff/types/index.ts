import type {
  StaffRecord,
  StaffType,
  StaffTypeField,
  StaffFieldValue,
  StaffAccreditation,
  StaffAccreditationTemplate,
  StaffInvite,
  StaffStatus,
  Profile,
  Member,
} from '@/lib/supabase/database.types';

export type { StaffRecord, StaffType, StaffTypeField, StaffFieldValue, StaffAccreditation, StaffAccreditationTemplate, StaffInvite };

export interface StaffWithDetails extends StaffRecord {
  profile: Profile;
  staff_type: StaffType;
  member: Member | null;
}

export interface StaffTypeWithFields extends StaffType {
  staff_type_fields: StaffTypeField[];
  staff_accreditation_templates: StaffAccreditationTemplate[];
}

export interface StaffInviteWithDetails extends StaffInvite {
  staff_type: StaffType;
  creator: Profile;
}

export interface StaffFilters {
  search?: string;
  staffTypeId?: string;
  status?: StaffStatus;
}

export interface StaffCsvRow {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  staff_type: string;
  position?: string;
  start_date?: string;
}
