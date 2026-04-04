export type {
  Organisation,
  SportType,
} from '@/lib/supabase/database.types';

export interface OrgFormData {
  name: string;
  slug: string;
  sportType: string;
  logoUrl?: string;
  primaryColour: string;
  secondaryColour: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  website?: string;
}

export type OnboardingStep =
  | 'organisation'
  | 'sport'
  | 'branding'
  | 'contact'
  | 'complete';
