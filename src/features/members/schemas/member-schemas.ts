import { z } from 'zod/v4';

export const memberSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.email('Please enter a valid email'),
  phone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  membershipType: z.enum(['senior', 'junior', 'social', 'life', 'volunteer'], {
    error: 'Please select a membership type',
  }),
  registrationDate: z.string().min(1, 'Registration date is required'),
  expiryDate: z.string().optional(),
  medicalConditions: z.string().optional(),
  dietaryRequirements: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  notes: z.string().optional(),
});

export const csvImportRowSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.email('Please enter a valid email'),
  phone: z.string().optional(),
  date_of_birth: z.string().optional(),
  membership_type: z.enum(['senior', 'junior', 'social', 'life', 'volunteer'], {
    error: 'Please enter a valid membership type',
  }),
});

export type MemberInput = z.infer<typeof memberSchema>;
export type CsvImportRowInput = z.infer<typeof csvImportRowSchema>;
